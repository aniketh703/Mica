import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  Animated,
  DimensionValue,
} from 'react-native';
import * as H from '../utils/haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RootStackParamList } from '../types';
import { useEvents } from '../hooks/useEvents';
import {
  getYearProgress,
  getRemainingCopy,
  dateIsoToShort,
  formatDays,
  nextOccurrenceIso,
  effectiveDaysUntil,
  isExpired,
} from '../utils/yearProgress';
import YearGrid from '../components/YearGrid';
import { MOTION_DURATION, motionEasing } from '../utils/motion';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
};

type EnterConfig = {
  duration: number;
  delay?: number;
  fromTranslateY?: number;
  fromScale?: number;
};

function useEnterAnimation(reduceMotion: boolean, config: EnterConfig) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay ?? 0,
      easing: motionEasing,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [config.delay, config.duration, progress, reduceMotion]);

  const transforms = [];
  if (config.fromTranslateY !== undefined) {
    transforms.push({
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [config.fromTranslateY, 0],
      }),
    });
  }
  if (config.fromScale !== undefined) {
    transforms.push({
      scale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [config.fromScale, 1],
      }),
    });
  }

  return {
    opacity: progress,
    transform: transforms,
  };
}

function AnimatedMountView({
  children,
  config,
}: {
  children: React.ReactNode;
  config: EnterConfig;
}) {
  const reduceMotion = useReducedMotion();
  const enterStyle = useEnterAnimation(reduceMotion, config);

  return <Animated.View style={enterStyle}>{children}</Animated.View>;
}

export default function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const { events, loading, refresh } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const contentEnterStyle = useEnterAnimation(reduceMotion, {
    duration: MOTION_DURATION.content,
    fromTranslateY: 10,
  });
  const yp = useMemo(() => getYearProgress(), []);
  const { width: screenWidth } = useWindowDimensions();
  // card width = screenWidth - 44px page padding - 40px card padding - 2px border
  const gridWidth = screenWidth - 86;

  // Refresh event list every time this screen comes back into focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      refresh();
      setFocusKey(k => k + 1);
    });
    return unsub;
  }, [navigation, refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator color={t.accentStrong} size="large" />
      </View>
    );
  }

  // Split upcoming (future + today, including all repeating events) from expired
  // one-time events. Expired events are intentionally excluded from the home
  // screen spotlight — they clutter the view and their countdown is meaningless.
  const upcoming = events.filter(ev => !isExpired(ev));
  const next = upcoming[0] ?? null;
  const rest = upcoming.slice(1);
  const nextProgressWidth = next
    ? (`${Math.min(100, Math.max(0, 100 - (Math.max(0, effectiveDaysUntil(next)) / 365) * 100))}%` as DimensionValue)
    : '0%';

  return (
    <Animated.View style={[styles.root, { backgroundColor: t.background }, contentEnterStyle]}>
      {/* Bloom circle */}
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={t.accentStrong}
            colors={[t.accentStrong]}
          />
        }
      >
        {/* Date header */}
        <View style={styles.dateHeader}>
          <Text style={[styles.dayName, { color: t.textMuted }]}>{dayName.toUpperCase()}</Text>
          <Text style={[styles.dateStr, { color: t.text }]}>{dateStr}</Text>
        </View>

        {/* Next Up — spotlight card */}
        {next ? (
          <AnimatedMountView
            key={`next-${next.id}`}
            config={{ duration: MOTION_DURATION.card, fromScale: 0.96 }}
          >
            <TouchableOpacity
              style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => {
                H.impactAsync(H.ImpactFeedbackStyle.Light);
                navigation.navigate('EventDetail', { eventId: next.id });
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.cardBloom, { backgroundColor: next.color }]} />
              <Text style={[styles.eyebrow, { color: t.textMuted }]}>NEXT UP</Text>
              <View style={styles.nextUpRow}>
                <View style={styles.nextUpLeft}>
                  <View style={styles.nextUpTitleRow}>
                    <View style={[styles.colorBar, { backgroundColor: next.color, height: 36 }]} />
                    <Text style={[styles.nextUpTitle, { color: t.text }]}>{next.title}</Text>
                  </View>
                  <Text style={[styles.nextUpDate, { color: t.textMuted }]}>
                    {dateIsoToShort(nextOccurrenceIso(next))}
                  </Text>
                </View>
                <AnimatedMountView
                  key={focusKey}
                  config={{ duration: 200, fromTranslateY: -6 }}
                >
                  <View style={styles.countdownBlock}>
                    <Text style={[styles.countdownNum, { color: next.color }]}>
                      {Math.max(0, effectiveDaysUntil(next))}
                    </Text>
                    <Text style={[styles.countdownLabel, { color: t.textMuted }]}>days</Text>
                  </View>
                </AnimatedMountView>
              </View>
              {/* Progress strip */}
              <View style={[styles.progressBg, { backgroundColor: t.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: next.color,
                      width: nextProgressWidth,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </AnimatedMountView>
        ) : (
          /* Empty state */
          <AnimatedMountView
            key="empty"
            config={{ duration: MOTION_DURATION.card, fromScale: 0.96 }}
          >
            <TouchableOpacity
              style={[styles.card, styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => navigation.navigate('AddEvent', {})}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={[styles.emptyTitle, { color: t.textMuted }]}>Nothing on the horizon</Text>
              <Text style={[styles.emptyAction, { color: t.accentStrong }]}>+ Add an event</Text>
            </TouchableOpacity>
          </AnimatedMountView>
        )}

        {/* Year Progress card */}
        <View style={[styles.card, styles.yearCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft, opacity: 0.38 }]} />
          {/* Header row */}
          <View style={styles.yearHeaderRow}>
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>YEAR IN MOTION</Text>
            <Text style={[styles.yearWatermark, { color: t.textMuted }]}>{yp.year}</Text>
          </View>
          {/* Stats row */}
          <View style={styles.yearStatsRow}>
            <View>
              <Text style={[styles.yearPercent, { color: t.text }]}>{yp.percentComplete}%</Text>
              <Text style={[styles.yearTitle, { color: t.text }]}>
                {getRemainingCopy(yp.daysRemaining)}
              </Text>
            </View>
            <View style={styles.yearMetaCol}>
              <Text style={[styles.yearMetaNum, { color: t.accentStrong }]}>{yp.dayOfYear}</Text>
              <Text style={[styles.yearMetaLabel, { color: t.textMuted }]}>of {yp.totalDays}</Text>
            </View>
          </View>
          {/* Grid — fills card width */}
          <YearGrid t={t} yp={yp} events={events} gridWidth={gridWidth} />
        </View>

        {/* More coming up */}
        {rest.length > 0 && (
          <AnimatedMountView
            key="more-coming-up"
            config={{
              duration: MOTION_DURATION.section,
              delay: 60,
              fromTranslateY: 10,
            }}
          >
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.sectionTitle, { color: t.text }]}>More coming up</Text>
              {rest.map((ev, i) => (
                <TouchableOpacity
                  key={ev.id}
                  style={[
                    styles.eventRow,
                    { borderBottomColor: t.border },
                    i < rest.length - 1 && styles.eventRowBorder,
                  ]}
                  onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorBar, { backgroundColor: ev.color, height: 34 }]} />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                    <Text style={[styles.eventDate, { color: t.textMuted }]}>
                      {dateIsoToShort(nextOccurrenceIso(ev))}
                    </Text>
                  </View>
                  <Text style={[styles.daysLeft, { color: t.textMuted }]}>
                    {formatDays(Math.max(0, effectiveDaysUntil(ev)))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedMountView>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bloom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -30,
    right: -90,
    opacity: 0.55,
  },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 16 },
  dateHeader: { paddingTop: 8, gap: 2 },
  dayName: { fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  dateStr: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, lineHeight: 32 },
  card: { borderRadius: 28, padding: 20, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardLarge: { gap: 14 },
  yearCard: { gap: 16 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8, borderStyle: 'dashed' },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '500' },
  emptyAction: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  cardBloom: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
    opacity: 0.12,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  nextUpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  nextUpLeft: { flex: 1, gap: 6 },
  nextUpTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorBar: { width: 10, borderRadius: 999, flexShrink: 0 },
  nextUpTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  nextUpDate: { fontSize: 15, paddingLeft: 20 },
  countdownBlock: { alignItems: 'flex-end' },
  countdownNum: { fontSize: 52, fontWeight: '800', letterSpacing: -2, lineHeight: 52 },
  countdownLabel: { fontSize: 13, fontWeight: '600' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, opacity: 0.6 },
  yearHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yearWatermark: { fontSize: 13, fontWeight: '600', letterSpacing: 1.5, opacity: 0.35 },
  yearStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  yearPercent: { fontSize: 42, fontWeight: '800', letterSpacing: -2, lineHeight: 42 },
  yearTitle: { fontSize: 14, fontWeight: '500', marginTop: 2, opacity: 0.7 },
  yearMetaCol: { alignItems: 'flex-end', paddingBottom: 4 },
  yearMetaNum: { fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 28 },
  yearMetaLabel: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 44 },
  eventRowBorder: { borderBottomWidth: 1 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 13 },
  daysLeft: { fontSize: 14, fontWeight: '700' },
  bottomPad: { height: 8 },
});
