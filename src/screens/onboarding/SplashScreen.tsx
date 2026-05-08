// src/screens/onboarding/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
};

// Dot pattern for the 3×3 mini grid:
// Row 0: past, past, past
// Row 1: past, today, future
// Row 2: future, future, future
type DotState = 'past' | 'today' | 'future';
const DOT_GRID: DotState[][] = [
  ['past', 'past', 'past'],
  ['past', 'today', 'future'],
  ['future', 'future', 'future'],
];

export default function SplashScreen({ navigation }: Props) {
  const t = useTheme();
  const db = useSQLiteContext();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();

    // Check onboarding flag and navigate accordingly after splash duration
    const MIN_SPLASH_MS = 1500;
    const startedAt = Date.now();

    async function checkAndNavigate() {
      let onboardingComplete = false;
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM settings WHERE key = 'onboardingComplete' LIMIT 1`,
        );
        onboardingComplete = row?.value === 'true';
      } catch {
        // settings table may not exist yet on first launch — treat as new user
        onboardingComplete = false;
      }

      // Ensure we always show the splash for at least MIN_SPLASH_MS
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      setTimeout(() => {
        navigation.replace(onboardingComplete ? 'Main' : 'Pitch');
      }, remaining);
    }

    checkAndNavigate();
  }, [navigation, spinValue, db]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  function dotColor(state: DotState): string {
    switch (state) {
      case 'past':
        return t.accent;
      case 'today':
        return t.accentStrong;
      case 'future':
        return t.surfaceMuted;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <StatusBar hidden />

      {/* Bloom: top-right */}
      <View
        style={[
          styles.bloomTopRight,
          { backgroundColor: t.surfaceStrong },
        ]}
      />

      {/* Bloom: bottom-left */}
      <View
        style={[
          styles.bloomBottomLeft,
          { backgroundColor: t.accentSoft },
        ]}
      />

      {/* Center content */}
      <View style={styles.center}>
        {/* App icon */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          {/* 3×3 dot grid */}
          <View style={styles.dotGrid}>
            {DOT_GRID.map((row, ri) =>
              row.map((state, ci) => (
                <View
                  key={`${ri}-${ci}`}
                  style={[
                    styles.dot,
                    { backgroundColor: dotColor(state) },
                  ]}
                />
              )),
            )}
          </View>
        </View>

        {/* App name */}
        <Text style={[styles.appName, { color: t.text }]}>Mica</Text>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: t.textMuted }]}>
          A calm measure of time.
        </Text>

        {/* Spinner */}
        <Animated.View
          style={[
            styles.spinner,
            {
              borderColor: t.border,
              borderTopColor: t.accentStrong,
            },
            { transform: [{ rotate: spin }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bloomTopRight: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -120,
    right: -120,
    opacity: 0.55,
  },
  bloomBottomLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -80,
    left: -80,
    opacity: 0.4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 3 * 10 + 2 * 6, // 3 dots + 2 gaps
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 20,
  },
  tagline: {
    fontSize: 14,
    marginTop: 6,
  },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    marginTop: 60,
    opacity: 0.6,
  },
});
