import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useEventRepository } from '../hooks/useEventRepository';
import { RootStackParamList, MicaEvent } from '../types';
import { getYearProgress, daysUntilIso, dateIsoToDisplay } from '../utils/yearProgress';
import { cancelEventNotifications } from '../services/NotificationService';
import LifeCalendarGrid from '../components/LifeCalendarGrid';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'EventDetail'>;
  route: RouteProp<RootStackParamList, 'EventDetail'>;
};

export default function EventDetailScreen({ navigation, route }: Props) {
  const t = useTheme();
  const repo = useEventRepository();
  const yp = getYearProgress();

  const [event, setEvent] = useState<MicaEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repo
      .getById(route.params.eventId)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [route.params.eventId]);

  function handleDelete() {
    if (!event) return;
    Alert.alert('Delete event', `Delete "${event.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await repo.delete(event.id);
          await cancelEventNotifications(event.notificationIds);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator color={t.accentStrong} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={[styles.notFoundText, { color: t.textMuted }]}>Event not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={[styles.backLink, { color: t.accentStrong }]}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysLeft = Math.max(0, daysUntilIso(event.dateIso));
  const DETAILS = [
    { label: 'Type', value: event.type },
    { label: 'Date', value: dateIsoToDisplay(event.dateIso) },
    { label: 'Repeats', value: event.repeats },
    { label: 'Reminder', value: event.reminder },
  ];

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: event.color }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={[styles.backChevron, { color: t.accentStrong }]}>‹</Text>
          <Text style={[styles.backText, { color: t.accentStrong }]}>Events</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleRow}>
          <View style={[styles.titleBar, { backgroundColor: event.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titleText, { color: t.text }]}>{event.title}</Text>
            <Text style={[styles.titleDate, { color: t.textMuted }]}>
              {dateIsoToDisplay(event.dateIso)}
            </Text>
          </View>
        </View>

        {/* Life Calendar Grid */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>
            YOUR YEAR · {yp.percentComplete}% COMPLETE
          </Text>
          <LifeCalendarGrid
            t={t}
            yp={yp}
            eventDayOfYear={event.dayOfYear}
            eventColor={event.color}
          />
        </View>

        {/* Countdown */}
        <View style={[styles.countdownCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.countdownBloom, { backgroundColor: event.color }]} />
          <View>
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>COUNTDOWN</Text>
            <Text style={[styles.countdownSub, { color: t.textMuted }]}>days remaining</Text>
          </View>
          <Text style={[styles.countdownNum, { color: event.color }]}>{daysLeft}</Text>
        </View>

        {/* Details */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Details</Text>
          {DETAILS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                { borderBottomColor: t.border },
                i < DETAILS.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={[styles.detailLabel, { color: t.textMuted }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: t.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        {event.note.trim().length > 0 && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Note</Text>
            <Text style={[styles.noteText, { color: t.textMuted }]}>{event.note}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => navigation.navigate('AddEvent', { eventId: event.id })}
          >
            <Text style={[styles.actionBtnText, { color: t.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: t.danger + '18', borderColor: t.danger + '30' }]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionBtnText, { color: t.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16 },
  backLink: { fontSize: 15, fontWeight: '500' },
  bloom: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -80, right: -100, opacity: 0.09 },
  scroll: { flex: 1 },
  content: { padding: 22, paddingTop: 56, gap: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backChevron: { fontSize: 24, fontWeight: '400', lineHeight: 24 },
  backText: { fontSize: 15, fontWeight: '500' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  titleBar: { width: 12, height: 52, borderRadius: 999, flexShrink: 0 },
  titleText: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 34 },
  titleDate: { fontSize: 14, marginTop: 3 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', gap: 12 },
  cardBloom: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, opacity: 0.35 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.2 },
  countdownCard: {
    borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  countdownBloom: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -60, right: -50, opacity: 0.1 },
  countdownSub: { fontSize: 14, marginTop: 4 },
  countdownNum: { fontSize: 64, fontWeight: '800', letterSpacing: -2, lineHeight: 64 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  noteText: { fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  bottomPad: { height: 24 },
});
