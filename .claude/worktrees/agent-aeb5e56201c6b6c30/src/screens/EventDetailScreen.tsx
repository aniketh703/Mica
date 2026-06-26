import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';
import { getYearProgress } from '../utils/yearProgress';
import LifeCalendarGrid from '../components/LifeCalendarGrid';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'EventDetail'>;
  route: RouteProp<RootStackParamList, 'EventDetail'>;
  t: Theme;
};

const DETAILS = [
  { label: 'Type',     value: 'Birthday' },
  { label: 'Date',     value: 'May 3, 2026' },
  { label: 'Repeats',  value: 'Every year' },
  { label: 'Reminder', value: '1 week before' },
];

export default function EventDetailScreen({ navigation, route, t }: Props) {
  const yp = getYearProgress();
  const ev = route.params.event;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Bloom */}
      <View style={[styles.bloom, { backgroundColor: ev.color }]} />

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
          <View style={[styles.titleBar, { backgroundColor: ev.color }]} />
          <View>
            <Text style={[styles.titleText, { color: t.text }]}>{ev.title}</Text>
            <Text style={[styles.titleDate, { color: t.textMuted }]}>
              {ev.date}, {yp.year}
            </Text>
          </View>
        </View>

        {/* Life Calendar Grid card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>
            YOUR YEAR · {yp.percentComplete}% COMPLETE
          </Text>
          <LifeCalendarGrid
            t={t}
            yp={yp}
            eventDayOfYear={ev.dayOfYear ?? 123}
            eventColor={ev.color}
          />
        </View>

        {/* Countdown card */}
        <View style={[styles.countdownCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.countdownBloom, { backgroundColor: ev.color }]} />
          <View>
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>COUNTDOWN</Text>
            <Text style={[styles.countdownSub, { color: t.textMuted }]}>days remaining</Text>
          </View>
          <Text style={[styles.countdownNum, { color: ev.color }]}>{ev.daysLeft}</Text>
        </View>

        {/* Details card */}
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

        {/* Note card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Note</Text>
          <Text style={[styles.noteText, { color: t.textMuted }]}>
            Don't forget to order the flowers early this year. She loves peonies.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <Text style={[styles.actionBtnText, { color: t.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: t.danger + '18', borderColor: t.danger + '30' },
            ]}
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
  root: {
    flex: 1,
  },
  bloom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -100,
    opacity: 0.09,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingTop: 56,
    gap: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backChevron: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 24,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  titleBar: {
    width: 12,
    height: 52,
    borderRadius: 999,
    flexShrink: 0,
  },
  titleText: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  titleDate: {
    fontSize: 14,
    marginTop: 3,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    gap: 12,
  },
  cardBloom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -70,
    right: -50,
    opacity: 0.35,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  countdownCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownBloom: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -50,
    opacity: 0.1,
  },
  countdownSub: {
    fontSize: 14,
    marginTop: 4,
  },
  countdownNum: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 64,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPad: {
    height: 24,
  },
});
