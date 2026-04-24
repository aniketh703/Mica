import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {YearProgressViewModel} from '../../types/yearProgress';
import {useTheme} from '../../theme/ThemeProvider';

interface YearProgressSummaryProps {
  model: YearProgressViewModel;
}

function getRemainingCopy(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'The year closes tonight';
  }

  if (daysRemaining === 1) {
    return 'One day is still yours';
  }

  return `${daysRemaining} quiet days remain`;
}

export function YearProgressSummary({
  model,
}: YearProgressSummaryProps): JSX.Element {
  const {theme} = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.year, {color: theme.textMuted}]}>{model.year}</Text>
      <View style={styles.copy}>
        <Text style={[styles.kicker, {color: theme.textMuted}]}>YEAR IN MOTION</Text>
        <Text style={[styles.title, {color: theme.text}]}>
          {getRemainingCopy(model.daysRemaining)}
        </Text>
        <Text style={[styles.subtitle, {color: theme.textMuted}]}>
          Day {model.dayOfYear} of {model.daysInYear} / {model.percentComplete}% complete
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  copy: {
    gap: 6,
  },
  kicker: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  title: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  year: {
    fontSize: 64,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -2,
    opacity: 0.18,
  },
});
