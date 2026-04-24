import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {useYearProgress} from './useYearProgress';
import {YearGrid} from './YearGrid';
import {YearProgressSummary} from './YearProgressSummary';

interface YearProgressCardProps {
  onPress?: () => void;
}

export function YearProgressCard({
  onPress,
}: YearProgressCardProps): JSX.Element {
  const {theme} = useTheme();
  const model = useYearProgress();

  const content = (
    <View
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={model.accessibilityLabel}
      style={[
        styles.content,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View
        pointerEvents="none"
        style={[
          styles.atmosphere,
          {
            backgroundColor: theme.accentSoft,
          },
        ]}
      />
      <YearProgressSummary model={model} />
      <YearGrid
        cells={model.cells}
        fillColor={theme.accent}
        futureColor={theme.surfaceMuted}
        todayRingColor={theme.accentStrong}
        todayCoreColor={theme.surface}
      />
      <View style={styles.footer}>
        <Text style={[styles.caption, {color: theme.text}]}>
          Today holds its place. Everything after it is still untouched.
        </Text>
        <View style={styles.legend}>
          <View
            style={[
              styles.legendLine,
              {
                backgroundColor: theme.accentStrong,
              },
            ]}
          />
          <Text style={[styles.legendText, {color: theme.textMuted}]}>
            The bright ring marks this exact day.
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 32,
  },
  content: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 32,
    padding: 22,
    gap: 22,
    minHeight: 420,
  },
  atmosphere: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    top: -90,
    right: -70,
    opacity: 0.38,
  },
  footer: {
    gap: 10,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendLine: {
    width: 26,
    height: 2,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
