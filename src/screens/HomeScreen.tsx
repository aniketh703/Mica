import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList, MicaEvent } from '../types';
import { getYearProgress, getRemainingCopy, formatDays } from '../utils/yearProgress';
import YearGrid from '../components/YearGrid';

const EVENTS: MicaEvent[] = [
  { id: 1, title: "Mum's birthday",   date: 'May 3',   daysLeft: 8,   color: '#C86B5A', type: 'Birthday',    dayOfYear: 123 },
  { id: 2, title: 'Project deadline', date: 'May 12',  daysLeft: 17,  color: '#9F7A45', type: 'Deadline' },
  { id: 3, title: 'Summer trip',      date: 'Jun 14',  daysLeft: 50,  color: '#547A76', type: 'Vacation' },
  { id: 4, title: 'Work anniversary', date: 'Jul 1',   daysLeft: 67,  color: '#D6B98C', type: 'Milestone' },
];

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  t: Theme;
};

export default function HomeScreen({ navigation, t }: Props) {
  const yp = getYearProgress();
  const next = EVENTS[0];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Bloom circle */}
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header */}
        <View style={styles.dateHeader}>
          <Text style={[styles.dayName, { color: t.textMuted }]}>{dayName.toUpperCase()}</Text>
          <Text style={[styles.dateStr, { color: t.text }]}>{dateStr}</Text>
        </View>

        {/* Next Up — spotlight card */}
        <TouchableOpacity
          style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => navigation.navigate('EventDetail', { event: next })}
          activeOpacity={0.85}
        >
          <View style={[styles.cardBloom, { backgroundColor: next.color }]} />
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>NEXT UP</Text>
          <View style={styles.nextUpRow}>
            <View style={styles.nextUpLeft}>
              <View style={styles.nextUpTitleRow}>
                <View style={[styles.colorBar, { backgroundColor: next.color, height: 36 }]} />
                <Text style={[styles.nextUpTitle, { color: t.text }]}>{next.title}</Text>
              </View>
              <Text style={[styles.nextUpDate, { color: t.textMuted }]}>{next.date}</Text>
            </View>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNum, { color: next.color }]}>{next.daysLeft}</Text>
              <Text style={[styles.countdownLabel, { color: t.textMuted }]}>days</Text>
            </View>
          </View>
          {/* Progress strip */}
          <View style={[styles.progressBg, { backgroundColor: t.surfaceMuted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: next.color,
                  width: `${100 - (next.daysLeft / 365) * 100}%` as any,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Year Progress card */}
        <View style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft, opacity: 0.38 }]} />
          <View style={styles.yearHeaderRow}>
            <View>
              <Text style={[styles.eyebrow, { color: t.textMuted }]}>YEAR IN MOTION</Text>
              <Text style={[styles.yearTitle, { color: t.text }]}>
                {getRemainingCopy(yp.daysRemaining)}
              </Text>
              <Text style={[styles.yearSubtitle, { color: t.textMuted }]}>
                Day {yp.dayOfYear} of {yp.totalDays} · {yp.percentComplete}%
              </Text>
            </View>
            <Text style={[styles.yearWatermark, { color: t.textMuted }]}>{yp.year}</Text>
          </View>
          <YearGrid t={t} yp={yp} />
          <View style={styles.legendRow}>
            <View style={[styles.legendLine, { backgroundColor: t.accentStrong }]} />
            <Text style={[styles.legendText, { color: t.textMuted }]}>The bright ring marks today.</Text>
          </View>
        </View>

        {/* More coming up */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>More coming up</Text>
          {EVENTS.slice(1).map((ev, i, arr) => (
            <TouchableOpacity
              key={ev.id}
              style={[
                styles.eventRow,
                { borderBottomColor: t.border },
                i < arr.length - 1 && styles.eventRowBorder,
              ]}
              onPress={() => navigation.navigate('EventDetail', { event: ev })}
              activeOpacity={0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: ev.color, height: 34 }]} />
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                <Text style={[styles.eventDate, { color: t.textMuted }]}>{ev.date}</Text>
              </View>
              <Text style={[styles.daysLeft, { color: t.textMuted }]}>{formatDays(ev.daysLeft)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  bloom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -30,
    right: -90,
    opacity: 0.55,
  },
  scroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 82,
  },
  content: {
    padding: 22,
    paddingTop: 56,
    gap: 16,
  },
  dateHeader: {
    paddingTop: 8,
    gap: 2,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  dateStr: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardLarge: {
    gap: 14,
  },
  cardBloom: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
    opacity: 0.12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  nextUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nextUpLeft: {
    flex: 1,
    gap: 6,
  },
  nextUpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorBar: {
    width: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  nextUpTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  nextUpDate: {
    fontSize: 14,
    paddingLeft: 20,
  },
  countdownBlock: {
    alignItems: 'flex-end',
  },
  countdownNum: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 52,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.6,
  },
  yearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  yearTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 26,
    marginTop: 4,
  },
  yearSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  yearWatermark: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 44,
    opacity: 0.18,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  legendLine: {
    width: 20,
    height: 2,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 12,
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomPad: {
    height: 8,
  },
});
