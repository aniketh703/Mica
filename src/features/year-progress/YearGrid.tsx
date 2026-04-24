import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {YearDayCell} from '../../types/yearProgress';
import {YearGridCell} from './YearGridCell';

interface YearGridProps {
  cells: YearDayCell[];
  fillColor: string;
  futureColor: string;
  todayRingColor: string;
  todayCoreColor: string;
}

function YearGridComponent({
  cells,
  fillColor,
  futureColor,
  todayRingColor,
  todayCoreColor,
}: YearGridProps): JSX.Element {
  const renderedCells = useMemo(
    () =>
      cells.map(cell => (
        <YearGridCell
          key={cell.dayOfYear}
          state={cell.state}
          fillColor={fillColor}
          futureColor={futureColor}
          todayRingColor={todayRingColor}
          todayCoreColor={todayCoreColor}
        />
      )),
    [cells, fillColor, futureColor, todayRingColor, todayCoreColor],
  );

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.grid}>{renderedCells}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    alignSelf: 'stretch',
  },
});

export const YearGrid = React.memo(YearGridComponent);
