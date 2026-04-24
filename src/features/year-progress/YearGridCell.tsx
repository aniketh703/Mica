import React from 'react';
import {StyleSheet, View} from 'react-native';
import {YearProgressState} from '../../types/yearProgress';

interface YearGridCellProps {
  state: YearProgressState;
  fillColor: string;
  futureColor: string;
  todayRingColor: string;
  todayCoreColor: string;
}

function YearGridCellComponent({
  state,
  fillColor,
  futureColor,
  todayRingColor,
  todayCoreColor,
}: YearGridCellProps): JSX.Element {
  const isPast = state === 'past';
  const isToday = state === 'today';

  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: isToday
            ? todayCoreColor
            : isPast
            ? fillColor
            : futureColor,
          borderColor: isToday ? todayRingColor : 'transparent',
          opacity: isPast || isToday ? 1 : 0.7,
          transform: [{scale: isToday ? 1.28 : 1}],
          shadowOpacity: isToday ? 0.22 : 0,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});

export const YearGridCell = React.memo(YearGridCellComponent);
