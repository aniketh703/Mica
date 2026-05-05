import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEvent'>;
  t: Theme;
};

const EVENT_TYPES = ['Birthday', 'Anniversary', 'Deadline', 'Vacation', 'Milestone', 'Custom'];
const COLOR_SWATCHES = ['#C86B5A', '#9F7A45', '#547A76', '#D6B98C', '#6B7FA4', '#8A6BA4'];
const WHEN_ROWS = [
  { label: 'Date',     value: 'June 14, 2026' },
  { label: 'Repeats',  value: 'Never' },
  { label: 'Reminder', value: '1 day before' },
];

export default function AddEventScreen({ navigation, t }: Props) {
  const [selectedType, setSelectedType] = useState('Milestone');
  const [selectedColor, setSelectedColor] = useState(2);
  const [eventName, setEventName] = useState("Dad's retirement party");

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav bar */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.navCancel, { color: t.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: t.text }]}>New Event</Text>
          <TouchableOpacity>
            <Text style={[styles.navSave, { color: t.accentStrong }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Name field */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>EVENT NAME</Text>
          <View style={[styles.inputRow, { borderColor: t.accentStrong, backgroundColor: t.surfaceMuted }]}>
            <TextInput
              style={[styles.input, { color: t.text }]}
              value={eventName}
              onChangeText={setEventName}
              placeholderTextColor={t.textMuted}
            />
            <View style={[styles.cursor, { backgroundColor: t.accentStrong }]} />
          </View>
        </View>

        {/* Event type */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Type</Text>
          <View style={styles.chipsWrap}>
            {EVENT_TYPES.map(type => {
              const isSelected = type === selectedType;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surfaceMuted, borderWidth: 1, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF7EC' : t.textMuted }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* When */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>When</Text>
          {WHEN_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={[
                styles.whenRow,
                { borderBottomColor: t.border },
                i < WHEN_ROWS.length - 1 && styles.whenRowBorder,
              ]}
            >
              <Text style={[styles.whenLabel, { color: t.textMuted }]}>{row.label}</Text>
              <View style={styles.whenRight}>
                <Text style={[styles.whenValue, { color: t.text }]}>{row.value}</Text>
                <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colour picker */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Colour</Text>
          <View style={styles.swatchRow}>
            {COLOR_SWATCHES.map((c, i) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(i)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  selectedColor === i
                    ? { borderWidth: 2.5, borderColor: t.accentStrong }
                    : { borderWidth: 2.5, borderColor: 'transparent' },
                ]}
              >
                {selectedColor === i && (
                  <View style={styles.swatchCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Note</Text>
          <Text style={[styles.notePlaceholder, { color: t.textMuted }]}>Add a note…</Text>
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
    top: -40,
    right: -90,
    opacity: 0.55,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingTop: 56,
    gap: 18,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navCancel: {
    fontSize: 15,
    fontWeight: '500',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  navSave: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    gap: 14,
  },
  cardBloom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -70,
    right: -50,
    opacity: 0.38,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  inputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  cursor: {
    width: 2,
    height: 18,
    borderRadius: 1,
    marginLeft: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: -4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  whenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  whenRowBorder: {
    borderBottomWidth: 1,
  },
  whenLabel: {
    fontSize: 14,
  },
  whenRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  whenValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 18,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  notePlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  bottomPad: {
    height: 24,
  },
});
