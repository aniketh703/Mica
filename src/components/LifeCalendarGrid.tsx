// src/components/LifeCalendarGrid.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';
import { YearProgress, buildLifeCells } from '../utils/yearProgress';

interface LifeCalendarGridProps {
  t: Theme;
  yp: YearProgress;
  eventDayOfYear: number;
  eventColor: string;
}

export default function LifeCalendarGrid({ t, yp, eventDayOfYear, eventColor }: LifeCalendarGridProps) {
  const cells = buildLifeCells(yp, eventDayOfYear);

  // Group cells by week (1-52)
  const weeks: (typeof cells[0])[][] = [];
  for (const cell of cells) {
    const wi = cell.week - 1;
    if (!weeks[wi]) weeks[wi] = [];
    weeks[wi].push(cell);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((cell) => {
              let bg: string;
              let borderStyle: object | null = null;
              let opacity = 1;

              if (cell.state === 'event') {
                bg = eventColor;
              } else if (cell.state === 'past') {
                bg = t.accent;
              } else if (cell.state === 'today') {
                bg = t.surface;
                borderStyle = { borderWidth: 1.5, borderColor: t.accentStrong };
              } else if (cell.state === 'countdown') {
                bg = 'transparent';
                borderStyle = { borderWidth: 1, borderColor: eventColor };
                opacity = 0.7;
              } else {
                bg = t.surfaceMuted;
              }

              return (
                <View
                  key={cell.doy}
                  style={[
                    styles.cell,
                    { backgroundColor: bg, opacity },
                    borderStyle,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 1.8,
  },
  weekCol: {
    flexDirection: 'column',
    gap: 1.8,
  },
  cell: {
    width: 5,
    height: 5,
    borderRadius: 1.2,
  },
});
