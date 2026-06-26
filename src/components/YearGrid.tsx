// src/components/YearGrid.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Theme } from '../theme/palette';
import { YearProgress, buildCellData, buildEventDaysMap } from '../utils/yearProgress';
import { MicaEvent } from '../types';

const COLS = 26;
const GAP = 2.5;

interface YearGridProps {
  t: Theme;
  yp: YearProgress;
  events?: MicaEvent[];
  gridWidth: number;
}

export default function YearGrid({ t, yp, events = [], gridWidth }: YearGridProps) {
  const eventDays = buildEventDaysMap(events, yp.year);
  const cells = buildCellData(yp, eventDays);

  // Fill card width exactly: cellSize = (gridWidth - gaps) / COLS
  const cellSize = Math.max(6, (gridWidth - (COLS - 1) * GAP) / COLS);

  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const [containerOpacity] = useState(() => new Animated.Value(0));
  const [containerTranslateY] = useState(() => new Animated.Value(6));

  useEffect(() => {
    if (hasAnimated.current) return;

    if (reduceMotion) {
      containerOpacity.setValue(1);
      containerTranslateY.setValue(0);
      return;
    }

    hasAnimated.current = true;
    containerOpacity.setValue(0);
    containerTranslateY.setValue(6);

    const anim = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    anim.start();
    return () => anim.stop();
  }, [reduceMotion, containerOpacity, containerTranslateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: gridWidth, gap: GAP },
        { opacity: containerOpacity, transform: [{ translateY: containerTranslateY }] },
      ]}
    >
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
              {
                width: cellSize,
                height: cellSize,
                borderRadius: cellSize * 0.2,
                backgroundColor: bg,
              },
              border && { borderWidth: border.borderWidth, borderColor: border.borderColor },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
