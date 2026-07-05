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
import { Ionicons } from '@expo/vector-icons';
import * as H from '../utils/haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
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
import EventRow from '../components/EventRow';
import EmptyState from '../components/EmptyState';
import BottomSheet from '../components/BottomSheet';
import QuickAddEventSheet from '../components/QuickAddEventSheet';
import AnimatedMountView, { useEnterAnimation } from '../components/AnimatedMountView';
import { duration } from '../utils/motion';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  // Whether the Home tab is the one currently shown. MainScreen keeps all
  // tabs mounted (toggling display:none) rather than unmounting them, but
  // RN's Modal renders as a native overlay independent of that display:none —
  // so without this, the quick-add sheet could keep floating over another
  // tab if the user switched away while it was open.
  isActive: boolean;
};


export default function HomeScreen({ navigation, isActive }: Props) {
  const t = useTheme();
  const { events, loading, refresh, createEvent } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const closeSheet = () => setSheetVisible(false);

  useEffect(() => {
    if (!isActive) setSheetVisible(false);
  }, [isActive]);
  const contentEnterStyle = useEnterAnimation({
    duration: duration.enter,
    fromTranslateY: 10,
  });
  // Recompute on tab focus, and every minute while mounted so the
  // progress/countdown doesn't go stale if the app is left open across midnight.
  useEffect(() => {
    const id = setInterval(() => setFocusKey(k => k + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const yp = useMemo(() => getYearProgress(), [focusKey]);
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
            config={{ duration: duration.standard, fromScale: 0.96 }}
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
            config={{ duration: duration.standard, fromScale: 0.96 }}
          >
            <EmptyState
              t={t}
              title="Nothing on the horizon"
              actionLabel="+ Add an event"
              wholeCardPressable
              onAction={() => setSheetVisible(true)}
            />
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
              duration: duration.standard,
              delay: 60,
              fromTranslateY: 10,
            }}
          >
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.sectionTitle, { color: t.text }]}>More coming up</Text>
              {rest.map((ev, i) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  t={t}
                  subtitle={dateIsoToShort(nextOccurrenceIso(ev))}
                  rightLabel={formatDays(Math.max(0, effectiveDaysUntil(ev)))}
                  isLast={i === rest.length - 1}
                  showChevron={false}
                  onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                />
              ))}
            </View>
          </AnimatedMountView>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* FAB — add event */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.accentStrong }]}
        onPress={() => {
          H.impactAsync(H.ImpactFeedbackStyle.Light);
          setSheetVisible(true);
        }}
        activeOpacity={0.85}
        accessibilityLabel="Add event"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={t.onAccent} />
      </TouchableOpacity>

      <BottomSheet visible={sheetVisible && isActive} onClose={closeSheet} t={t}>
        <QuickAddEventSheet t={t} onClose={closeSheet} createEvent={createEvent} />
      </BottomSheet>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 102,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
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
  card: { borderRadius: 24, padding: 20, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardLarge: { gap: 14 },
  yearCard: { gap: 16 },
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
  bottomPad: { height: 8 },
});
