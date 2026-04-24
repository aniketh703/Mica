import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Screen} from '../components/Screen';
import {YearProgressCard} from '../features/year-progress';
import {useTheme} from '../theme/ThemeProvider';

export function HomeScreen(): JSX.Element {
  const {theme} = useTheme();

  return (
    <Screen>
      <View
        pointerEvents="none"
        style={[
          styles.backgroundBloom,
          {
            backgroundColor: theme.surfaceStrong,
          },
        ]}
      />
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, {color: theme.textMuted}]}>MICA</Text>
        <Text style={[styles.title, {color: theme.text}]}>Make time visible.</Text>
        <Text style={[styles.subtitle, {color: theme.textMuted}]}>
          A calm measure of what has already slipped away and what still remains.
        </Text>
      </View>
      <YearProgressCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 6,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    maxWidth: 280,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 320,
  },
  backgroundBloom: {
    position: 'absolute',
    width: 320,
    height: 320,
    right: -110,
    top: -20,
    borderRadius: 999,
    opacity: 0.55,
  },
});
