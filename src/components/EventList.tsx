import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {formatDaysLabel, formatShortDate} from '../lib/format';
import {sortEventsByUpcoming, getDaysUntil} from '../lib/calendar';
import {useMicaStore} from '../store/useMicaStore';
import {useTheme} from '../theme/ThemeProvider';

export function EventList(): JSX.Element {
  const {theme} = useTheme();
  const events = useMicaStore(state => sortEventsByUpcoming(state.events));

  return (
    <View style={styles.list}>
      {events.map(event => {
        const daysLeft = getDaysUntil(event.date);

        return (
          <View
            key={event.id}
            style={[
              styles.row,
              {
                borderBottomColor: theme.border,
              },
            ]}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: event.color,
                  },
                ]}
              />
              <View style={styles.copy}>
                <Text style={[styles.title, {color: theme.text}]}>
                  {event.title}
                </Text>
                <Text style={[styles.meta, {color: theme.textMuted}]}>
                  {formatShortDate(event.date)}
                </Text>
              </View>
            </View>
            <Text style={[styles.days, {color: theme.text}]}>
              {formatDaysLabel(daysLeft)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  swatch: {
    width: 12,
    height: 40,
    borderRadius: 999,
  },
  copy: {
    gap: 2,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
  },
  days: {
    fontSize: 13,
    fontWeight: '700',
  },
});
