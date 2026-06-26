import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';
import { YearProgress } from '../utils/yearProgress';

interface LifeCalendarGridProps {
  t: Theme;
  yp: YearProgress;
  eventDayOfYear: number;
  eventColor: string;
}

const TOTAL_COLS = 52;
const TOTAL_ROWS = 7;
const CELL_SIZE = 5;
const GAP = 1.8;

export default function LifeCalendarGrid({ t, yp, eventDayOfYear, eventColor }: LifeCalendarGridProps) {
  return (
    <View>
      {/* Axis labels */}
      <View style={styles.axisRow}>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>WEEK 1</Text>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>WEEK OF THE YEAR ——</Text>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>52</Text>
      </View>

      {/* Grid — 7 rows × 52 cols */}
      <View style={{ gap: GAP }}>
        {Array.from({ length: TOTAL_ROWS }).map((_, row) => (
          <View key={row} style={[styles.gridRow, { gap: GAP }]}>
            {Array.from({ length: TOTAL_COLS }).map((_, col) => {
              const doy = col * 7 + row + 1;
              if (doy > yp.totalDays) {
                return <View key={col} style={[styles.cell, { opacity: 0 }]} />;
              }

              let bg = t.surfaceMuted;
              let border: string | undefined;
              let opacity = 1;

              if (doy < yp.dayOfYear) {
                bg = t.accent;
              } else if (doy === yp.dayOfYear) {
                bg = t.surface;
                border = t.accentStrong;
              } else if (doy > yp.dayOfYear && doy < eventDayOfYear) {
                bg = 'transparent';
                border = eventColor;
                opacity = 0.7;
              } else if (doy === eventDayOfYear) {
                bg = eventColor;
              } else {
                opacity = 0.5;
              }

              return (
                <View
                  key={col}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: bg,
                      opacity,
                      borderWidth: border ? 1 : 0,
                      borderColor: border ?? undefined,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: t.accent, border: undefined, label: 'Past days' },
          { color: t.surface, border: t.accentStrong, label: 'Today' },
          { color: 'transparent', border: eventColor, label: 'Countdown' },
          { color: eventColor, border: undefined, label: 'Event day' },
        ].map(({ color, border, label }) => (
          <View key={label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: color,
                  borderWidth: border ? 1.5 : 0,
                  borderColor: border ?? undefined,
                },
              ]}
            />
            <Text style={[styles.legendLabel, { color: t.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  axisLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
