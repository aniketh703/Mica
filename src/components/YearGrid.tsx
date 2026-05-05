import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';
import { YearProgress } from '../utils/yearProgress';

interface YearGridProps {
  t: Theme;
  yp: YearProgress;
}

export default function YearGrid({ t, yp }: YearGridProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: yp.totalDays }, (_, i) => {
        const day = i + 1;
        const isPast = day < yp.dayOfYear;
        const isToday = day === yp.dayOfYear;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              {
                backgroundColor: isPast
                  ? t.accent
                  : isToday
                  ? t.surface
                  : t.surfaceMuted,
                borderWidth: isToday ? 1.5 : 0,
                borderColor: isToday ? t.accentStrong : undefined,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: 5,
    height: 5,
    borderRadius: 1.2,
  },
});
