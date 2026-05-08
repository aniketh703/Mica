import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../types';
import { useEvents } from '../hooks/useEvents';
import { daysUntilIso, dateIsoToShort, formatDays } from '../utils/yearProgress';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
};

const FILTER_CHIPS = ['All', 'Soon', 'Birthday', 'Work', 'Travel'];

export default function EventsScreen({ navigation }: Props) {
  const t = useTheme();
  const { events, loading } = useEvents();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = events.filter(ev => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Soon') return daysUntilIso(ev.dateIso) <= 30;
    if (activeFilter === 'Birthday') return ev.type === 'Birthday';
    if (activeFilter === 'Work') return ev.type === 'Deadline' || ev.type === 'Milestone';
    if (activeFilter === 'Travel') return ev.type === 'Vacation';
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: t.text }]}>{'Upcoming\nmoments'}</Text>
            <Text style={[styles.heroSubtitle, { color: t.textMuted }]}>
              Countdowns for the dates that deserve your attention.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: t.accentStrong }]}
            onPress={() => navigation.navigate('AddEvent', {})}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {FILTER_CHIPS.map(chip => {
              const isActive = chip === activeFilter;
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setActiveFilter(chip)}
                  style={[
                    styles.chip,
                    isActive
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isActive ? '#FFF7EC' : t.textMuted }]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={t.accentStrong} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={[styles.emptyTitle, { color: t.textMuted }]}>
              {events.length === 0 ? 'No events yet' : 'Nothing in this category'}
            </Text>
            {events.length === 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('AddEvent', {})}>
                <Text style={[styles.emptyAction, { color: t.accentStrong }]}>+ Add your first event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.cardTitle, { color: t.text }]}>Your events</Text>
            {filtered.map((ev, i) => (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.eventRow,
                  { borderBottomColor: t.border },
                  i < filtered.length - 1 && styles.eventRowBorder,
                ]}
                onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.colorBar, { backgroundColor: ev.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                  <Text style={[styles.eventDate, { color: t.textMuted }]}>
                    {dateIsoToShort(ev.dateIso)}
                  </Text>
                </View>
                <View style={styles.eventRight}>
                  <Text style={[styles.daysLeft, { color: t.text }]}>
                    {formatDays(Math.max(0, daysUntilIso(ev.dateIso)))}
                  </Text>
                  <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  bloom: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -30, right: -100, opacity: 0.55 },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 18 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8 },
  heroText: { gap: 6, flex: 1 },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7, lineHeight: 34 },
  heroSubtitle: { fontSize: 15, lineHeight: 22, maxWidth: 240 },
  addBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  addBtnText: { fontSize: 22, color: '#FFF7EC', fontWeight: '300', lineHeight: 26 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, flexShrink: 0 },
  chipText: { fontSize: 13, fontWeight: '600' },
  loader: { marginTop: 40 },
  emptyCard: { borderRadius: 24, padding: 32, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '500' },
  emptyAction: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  eventRowBorder: { borderBottomWidth: 1 },
  colorBar: { width: 12, height: 40, borderRadius: 999, flexShrink: 0 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 13 },
  eventRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  daysLeft: { fontSize: 13, fontWeight: '700' },
  chevron: { fontSize: 18, fontWeight: '400', lineHeight: 18 },
  bottomPad: { height: 8 },
});
