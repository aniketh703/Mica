import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../types';
import { useEvents } from '../hooks/useEvents';
import { dateIsoToShort, formatDays, nextOccurrenceIso, effectiveDaysUntil, isExpired } from '../utils/yearProgress';
import CalendarView from '../components/CalendarView';
import * as H from '../utils/haptics';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
};

type ViewMode = 'list' | 'calendar';

const FILTER_CHIPS = ['All', 'Soon', 'Birthday', 'Work', 'Travel'];

// ─── Shared list row ─────────────────────────────────────────────────────────
import { MicaEvent } from '../types';
import { Theme } from '../theme/palette';

function EventRow({
  ev, isLast, isPast, t, onPress,
}: {
  ev: MicaEvent;
  isLast: boolean;
  isPast: boolean;
  t: Theme;
  onPress: () => void;
}) {
  const daysLeft = effectiveDaysUntil(ev);
  // Past events show elapsed time; upcoming show countdown
  const rightLabel = isPast
    ? `${Math.abs(daysLeft)}d ago`
    : formatDays(Math.max(0, daysLeft));
  const dateLabel = dateIsoToShort(nextOccurrenceIso(ev));

  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        { borderBottomColor: t.border },
        !isLast && rowStyles.rowBorder,
        isPast && { opacity: 0.55 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${ev.title}, ${rightLabel}`}
    >
      <View style={[rowStyles.colorBar, { backgroundColor: ev.color }]} />
      <View style={rowStyles.info}>
        <Text style={[rowStyles.title, { color: t.text }]}>{ev.title}</Text>
        <Text style={[rowStyles.date, { color: t.textMuted }]}>{dateLabel}</Text>
      </View>
      <View style={rowStyles.right}>
        <Text style={[rowStyles.daysLeft, { color: t.textMuted }]}>{rightLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, minHeight: 52 },
  rowBorder:{ borderBottomWidth: 1 },
  colorBar: { width: 10, height: 36, borderRadius: 999, flexShrink: 0 },
  info:     { flex: 1, gap: 3 },
  title:    { fontSize: 15, fontWeight: '600' },
  date:     { fontSize: 14 },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  daysLeft: { fontSize: 14, fontWeight: '700' },
});

export default function EventsScreen({ navigation }: Props) {
  const t = useTheme();
  const { events, loading, refresh } = useEvents();
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode]         = useState<ViewMode>('list');
  const [refreshing, setRefreshing]     = useState(false);

  // Refresh every time this tab comes back into focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { refresh(); });
    return unsub;
  }, [navigation, refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function switchView(mode: ViewMode) {
    if (mode === viewMode) return; // already active — no-op
    H.selectionAsync();
    setViewMode(mode);
  }

  const filtered = events.filter(ev => {
    if (activeFilter === 'All')      return true;
    if (activeFilter === 'Soon')     return effectiveDaysUntil(ev) <= 30 && !isExpired(ev);
    if (activeFilter === 'Birthday') return ev.type === 'Birthday';
    if (activeFilter === 'Work')     return ev.type === 'Deadline' || ev.type === 'Milestone';
    if (activeFilter === 'Travel')   return ev.type === 'Vacation';
    return true;
  });

  // Upcoming = future + today (all repeating events always land here).
  // Past     = expired one-time events only.
  const upcomingEvents = filtered.filter(ev => !isExpired(ev));
  const pastEvents     = filtered.filter(ev => isExpired(ev));

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={t.accentStrong}
            colors={[t.accentStrong]}
          />
        }
      >
        {/* ── Hero row ───────────────────────────────────────────── */}
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            {/* flexShrink prevents the title from pushing the action buttons off-screen
                on narrow devices (e.g. 320 px width) */}
            <Text style={[styles.heroTitle, { color: t.text }]} numberOfLines={2}>
              {'Upcoming\nmoments'}
            </Text>
            <Text style={[styles.heroSubtitle, { color: t.textMuted }]}>
              Countdowns for the dates that deserve your attention.
            </Text>
          </View>

          <View style={styles.heroActions}>
            {/* List / Calendar segmented toggle
                accessibilityRole="radio" conveys that options are mutually exclusive */}
            <View style={[styles.viewToggle, { backgroundColor: t.surface, borderColor: t.border }]}>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: t.accentStrong }]}
                onPress={() => switchView('list')}
                accessibilityLabel="List view"
                accessibilityRole="radio"
                accessibilityState={{ checked: viewMode === 'list' }}
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={viewMode === 'list' ? '#FFF7EC' : t.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'calendar' && { backgroundColor: t.accentStrong }]}
                onPress={() => switchView('calendar')}
                accessibilityLabel="Calendar view"
                accessibilityRole="radio"
                accessibilityState={{ checked: viewMode === 'calendar' }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={viewMode === 'calendar' ? '#FFF7EC' : t.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Add button */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: t.accentStrong }]}
              onPress={() => navigation.navigate('AddEvent', {})}
              accessibilityLabel="Add event"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={22} color="#FFF7EC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Filter chips (list mode only) ──────────────────────── */}
        {viewMode === 'list' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsRow}>
              {FILTER_CHIPS.map(chip => {
                const isActive = chip === activeFilter;
                return (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => {
                      H.selectionAsync();
                      setActiveFilter(chip);
                    }}
                    style={[
                      styles.chip,
                      isActive
                        ? { backgroundColor: t.accentStrong }
                        : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.chipText, { color: isActive ? '#FFF7EC' : t.textMuted }]}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ── Content ────────────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator color={t.accentStrong} style={styles.loader} />
        ) : viewMode === 'calendar' ? (
          /* Calendar view — shows all events (unfiltered) */
          <CalendarView
            events={events}
            t={t}
            onEventPress={id => navigation.navigate('EventDetail', { eventId: id })}
            onAddPress={() => navigation.navigate('AddEvent', {})}
          />
        ) : filtered.length === 0 ? (
          /* Empty state */
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
          /* List view — upcoming + collapsible past section */
          <>
            {upcomingEvents.length > 0 && (
              <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.cardEyebrow, { color: t.textMuted }]}>
                  {activeFilter === 'All' ? 'UPCOMING' : activeFilter.toUpperCase()}
                </Text>
                {upcomingEvents.map((ev, i) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    isLast={i === upcomingEvents.length - 1}
                    isPast={false}
                    t={t}
                    onPress={() => {
                      H.impactAsync(H.ImpactFeedbackStyle.Light);
                      navigation.navigate('EventDetail', { eventId: ev.id });
                    }}
                  />
                ))}
              </View>
            )}

            {pastEvents.length > 0 && (
              <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.cardEyebrow, { color: t.textMuted }]}>PAST</Text>
                {pastEvents.map((ev, i) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    isLast={i === pastEvents.length - 1}
                    isPast={true}
                    t={t}
                    onPress={() => {
                      H.impactAsync(H.ImpactFeedbackStyle.Light);
                      navigation.navigate('EventDetail', { eventId: ev.id });
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  bloom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -30,
    right: -100,
    opacity: 0.55,
  },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 18 },

  // ── Hero ─────────────────────────────────────────────────────────
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  // flex:1 + flexShrink:1 prevents the title overflowing into the action buttons
  // on narrow screens (320 px width devices)
  heroText: { flex: 1, flexShrink: 1, gap: 6, paddingRight: 12 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 34,
    flexShrink: 1,
  },
  heroSubtitle: { fontSize: 15, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 4 },

  // ── View mode toggle ──────────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 44,
  },
  viewToggleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Add button ────────────────────────────────────────────────────
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filter chips ──────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexShrink: 0,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  loader: { marginTop: 40 },

  // ── Empty state ───────────────────────────────────────────────────
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '500' },
  emptyAction: { fontSize: 15, fontWeight: '700', marginTop: 4 },

  // ── Event list card ───────────────────────────────────────────────
  card: { borderRadius: 24, padding: 18, borderWidth: 1, gap: 4 },
  // Eyebrow pattern — consistent with CalendarView's day-events header
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    minHeight: 52,
  },
  eventRowBorder: { borderBottomWidth: 1 },
  // width:10 matches CalendarView's colorBar for cross-screen consistency
  colorBar: { width: 10, height: 36, borderRadius: 999, flexShrink: 0 },
  eventInfo: { flex: 1, gap: 3 },
  // 15px matches CalendarView's eventTitle
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 14 },
  eventRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // textMuted matches CalendarView — countdown is supporting info, not primary
  daysLeft: { fontSize: 14, fontWeight: '700' },

  bottomPad: { height: 8 },
});
