// Shared event-list row: color bar + title/subtitle + trailing countdown label.
// Previously implemented independently in HomeScreen, EventsScreen, and
// CalendarView with near-identical markup — consolidated here so all three
// stay in sync instead of drifting.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/palette';
import { MicaEvent } from '../types';

type EventRowProps = {
  event: MicaEvent;
  t: Theme;
  subtitle: string;
  rightLabel: string;
  isLast: boolean;
  dimmed?: boolean;
  showChevron?: boolean;
  onPress: () => void;
};

export default function EventRow({
  event, t, subtitle, rightLabel, isLast, dimmed = false, showChevron = true, onPress,
}: EventRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: t.border },
        !isLast && styles.rowBorder,
        dimmed && { opacity: 0.55 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${rightLabel}`}
    >
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <View style={styles.info}>
        <Text style={[styles.title, { color: t.text }]}>{event.title}</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>{subtitle}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.rightLabel, { color: t.textMuted }]}>{rightLabel}</Text>
        {showChevron && <Ionicons name="chevron-forward" size={16} color={t.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, minHeight: 52 },
  rowBorder: { borderBottomWidth: 1 },
  colorBar:  { width: 10, height: 36, borderRadius: 999, flexShrink: 0 },
  info:      { flex: 1, gap: 3 },
  title:     { fontSize: 15, fontWeight: '600' },
  subtitle:  { fontSize: 14 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightLabel:{ fontSize: 14, fontWeight: '700' },
});
