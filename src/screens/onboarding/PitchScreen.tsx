// src/screens/onboarding/PitchScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Pitch'>;
};

// ─── Visuals ────────────────────────────────────────────────────────────────

function YearGridPreview() {
  const t = useTheme();
  const COLS = 26;
  const ROWS = 14;
  const DOT = 5;
  const GAP = 3;
  const total = COLS * ROWS;
  // Simulate ~40% past for visual interest
  const pastCount = Math.floor(total * 0.4);
  const todayIndex = pastCount;

  return (
    <View style={yearGridStyles.container}>
      <View style={yearGridStyles.grid}>
        {Array.from({ length: total }).map((_, i) => {
          let bg: string;
          if (i < pastCount) {
            bg = t.accent;
          } else if (i === todayIndex) {
            bg = t.accentStrong;
          } else {
            bg = t.surfaceMuted;
          }
          return (
            <View
              key={i}
              style={[
                yearGridStyles.dot,
                { width: DOT, height: DOT, backgroundColor: bg, margin: GAP / 2 },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const yearGridStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 26 * (5 + 3), // cols * (dot + gap)
  },
  dot: {
    borderRadius: 1,
  },
});

function EventListPreview() {
  const t = useTheme();
  const events = [
    { label: "Mum's birthday", color: '#C86B5A', days: '3 days' },
    { label: 'Project deadline', color: '#9F7A45', days: '11 days' },
    { label: 'Summer trip', color: '#547A76', days: '43 days' },
  ];

  return (
    <View style={eventListStyles.container}>
      {events.map((ev, i) => (
        <View
          key={i}
          style={[
            eventListStyles.row,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          <View style={[eventListStyles.colorBar, { backgroundColor: ev.color }]} />
          <Text style={[eventListStyles.label, { color: t.text }]}>{ev.label}</Text>
          <Text style={[eventListStyles.days, { color: t.textMuted }]}>{ev.days}</Text>
        </View>
      ))}
    </View>
  );
}

const eventListStyles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 16,
    gap: 10,
    width: '100%',
    maxWidth: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  colorBar: {
    width: 8,
    height: 32,
    borderRadius: 999,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  days: {
    fontSize: 13,
    fontWeight: '500',
  },
});

function PrivacyPreview() {
  const t = useTheme();
  const bullets = [
    'No account required',
    'Data stays on your device',
    'No tracking or analytics',
  ];

  return (
    <View style={privacyStyles.container}>
      <Text style={privacyStyles.shield}>🛡</Text>
      <View style={privacyStyles.bullets}>
        {bullets.map((b, i) => (
          <View key={i} style={privacyStyles.bulletRow}>
            <View style={[privacyStyles.bullet, { backgroundColor: t.accentStrong }]} />
            <Text style={[privacyStyles.bulletText, { color: t.textMuted }]}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const privacyStyles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
    gap: 20,
  },
  shield: {
    fontSize: 64,
  },
  bullets: {
    gap: 10,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 15,
  },
});

// ─── Pane data ───────────────────────────────────────────────────────────────

type PaneVisual = 'YearGridPreview' | 'EventListPreview' | 'PrivacyPreview';

const PANES: {
  eyebrow: string;
  title: string;
  body: string;
  visual: PaneVisual;
}[] = [
  {
    eyebrow: '01 · YOUR YEAR',
    title: 'The year, made visible.',
    body: 'Every day of the year mapped into a single grid. Watch the past fill in, and the future waiting.',
    visual: 'YearGridPreview',
  },
  {
    eyebrow: '02 · WHAT MATTERS',
    title: 'Count down the moments.',
    body: 'Add birthdays, deadlines, trips. Mica keeps them in view — quietly counting down.',
    visual: 'EventListPreview',
  },
  {
    eyebrow: '03 · PRIVATE',
    title: 'Yours, on your device.',
    body: 'No tracking. No cloud required. Your events stay exactly where you put them.',
    visual: 'PrivacyPreview',
  },
];

function PaneVisualComponent({ visual }: { visual: PaneVisual }) {
  switch (visual) {
    case 'YearGridPreview':
      return <YearGridPreview />;
    case 'EventListPreview':
      return <EventListPreview />;
    case 'PrivacyPreview':
      return <PrivacyPreview />;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PitchScreen({ navigation }: Props) {
  const t = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  }

  function handleNext() {
    if (currentPage < PANES.length - 1) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
      setCurrentPage(nextPage);
    } else {
      navigation.replace('AuthChoice');
    }
  }

  const isLastPane = currentPage === PANES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Skip link */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('AuthChoice')}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: t.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Panes */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {PANES.map((pane, index) => (
          <View key={index} style={[styles.pane, { width: SCREEN_WIDTH }]}>
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>{pane.eyebrow}</Text>
            <Text style={[styles.title, { color: t.text }]}>{pane.title}</Text>
            <Text style={[styles.body, { color: t.textMuted }]}>{pane.body}</Text>
            <View style={styles.visualContainer}>
              <PaneVisualComponent visual={pane.visual} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Page dots */}
        <View style={styles.dotsRow}>
          {PANES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentPage
                  ? [styles.dotActive, { backgroundColor: t.accentStrong }]
                  : [styles.dotInactive, { backgroundColor: t.surfaceMuted }],
              ]}
            />
          ))}
        </View>

        {/* Next / Get started button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: t.accentStrong }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLastPane ? 'Get started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 52,
    right: 28,
    zIndex: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  pane: {
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 300,
  },
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 999,
  },
  dotActive: {
    width: 8,
    height: 8,
  },
  dotInactive: {
    width: 6,
    height: 6,
  },
  ctaButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF7EC',
    letterSpacing: -0.2,
  },
});
