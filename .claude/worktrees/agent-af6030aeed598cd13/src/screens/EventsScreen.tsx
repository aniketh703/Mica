import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList, MicaEvent } from '../types';
import { formatDays } from '../utils/yearProgress';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  t: Theme;
};

const ALL_EVENTS: MicaEvent[] = [
  { id: 1, title: "Mum's birthday",   date: 'May 3',   daysLeft: 8,   color: '#C86B5A', type: 'Birthday',  dayOfYear: 123 },
  { id: 2, title: 'Project deadline', date: 'May 12',  daysLeft: 17,  color: '#9F7A45', type: 'Deadline' },
  { id: 3, title: 'Summer trip',      date: 'Jun 14',  daysLeft: 50,  color: '#547A76', type: 'Vacation' },
  { id: 4, title: 'Work anniversary', date: 'Jul 1',   daysLeft: 67,  color: '#D6B98C', type: 'Milestone' },
  { id: 5, title: 'Annual review',    date: 'Aug 3',   daysLeft: 100, color: '#6B7FA4', type: 'Work' },
  { id: 6, title: 'Holiday flight',   date: 'Dec 20',  daysLeft: 239, color: '#8A6BA4', type: 'Travel' },
];

const FILTER_CHIPS = ['All', 'Soon', 'Birthday', 'Work', 'Travel'];

export default function EventsScreen({ navigation, t }: Props) {
  const [activeFilter, setActiveFilter] = useState('All');

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
            onPress={() => navigation.navigate('AddEvent')}
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

        {/* Events list card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Your events</Text>
          {ALL_EVENTS.map((ev, i) => (
            <TouchableOpacity
              key={ev.id}
              style={[
                styles.eventRow,
                { borderBottomColor: t.border },
                i < ALL_EVENTS.length - 1 && styles.eventRowBorder,
              ]}
              onPress={() => navigation.navigate('EventDetail', { event: ev })}
              activeOpacity={0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: ev.color }]} />
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                <Text style={[styles.eventDate, { color: t.textMuted }]}>{ev.date}</Text>
              </View>
              <View style={styles.eventRight}>
                <Text style={[styles.daysLeft, { color: t.text }]}>{formatDays(ev.daysLeft)}</Text>
                <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
              </View>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -30,
    right: -100,
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
    gap: 18,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  heroText: {
    gap: 6,
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 240,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  addBtnText: {
    fontSize: 22,
    color: '#FFF7EC',
    fontWeight: '300',
    lineHeight: 26,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
  },
  colorBar: {
    width: 12,
    height: 40,
    borderRadius: 999,
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 13,
  },
  eventRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 18,
  },
  bottomPad: {
    height: 8,
  },
});
