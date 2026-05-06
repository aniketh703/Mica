// src/components/YearGrid.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';
import { YearProgress, buildCellData, buildEventDaysMap } from '../utils/yearProgress';
import { MicaEvent } from '../types';

interface YearGridProps {
  t: Theme;
  yp: YearProgress;
  events?: MicaEvent[];
}

export default function YearGrid({ t, yp, events = [] }: YearGridProps) {
  const eventDays = buildEventDaysMap(events, yp.year);
  const cells = buildCellData(yp, eventDays);

  return (
    <View style={styles.container}>
      {cells.map((cell) => {
        let bg: string;
        let border: { borderWidth: number; borderColor: string } | null = null;

        if (cell.state === 'event') {
          bg = cell.eventColor;
        } else if (cell.state === 'past') {
          bg = t.accent;
        } else if (cell.state === 'today') {
          bg = t.surface;
          border = { borderWidth: 1.5, borderColor: t.accentStrong };
        } else {
          bg = t.surfaceMuted;
        }

        return (
          <View
            key={cell.doy}
            style={[
              styles.cell,
              { backgroundColor: bg },
              border && { borderWidth: border.borderWidth, borderColor: border.borderColor },
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
