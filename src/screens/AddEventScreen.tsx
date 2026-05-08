import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useEventRepository } from '../hooks/useEventRepository';
import { RootStackParamList, EventTypeOption, RepeatOption, ReminderOption } from '../types';
import { dateIsoToDisplay } from '../utils/yearProgress';
import {
  scheduleEventNotifications,
  cancelEventNotifications,
} from '../services/NotificationService';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEvent'>;
  route: RouteProp<RootStackParamList, 'AddEvent'>;
};

const EVENT_TYPES: EventTypeOption[] = ['Birthday', 'Deadline', 'Vacation', 'Milestone', 'Other'];
const COLOR_SWATCHES = ['#C86B5A', '#9F7A45', '#547A76', '#D6B98C', '#6B7FA4', '#8A6BA4'];
const REPEAT_OPTIONS: RepeatOption[] = ['None', 'Yearly', 'Monthly'];
const REMINDER_OPTIONS: ReminderOption[] = [
  'None',
  'On the day',
  '1 day before',
  '3 days before',
  '1 week before',
];

function defaultDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function AddEventScreen({ navigation, route }: Props) {
  const t = useTheme();
  const repo = useEventRepository();

  const editId = route.params?.eventId ?? null;
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventTypeOption>('Birthday');
  const [dateIso, setDateIso] = useState(defaultDateIso());
  const [repeats, setRepeats] = useState<RepeatOption>('None');
  const [reminder, setReminder] = useState<ReminderOption>('None');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingNotifIds, setExistingNotifIds] = useState<string[]>([]);

  useEffect(() => {
    if (editId) {
      repo.getById(editId).then(ev => {
        if (ev) {
          setTitle(ev.title);
          setType(ev.type);
          setDateIso(ev.dateIso);
          setRepeats(ev.repeats);
          setReminder(ev.reminder);
          setColor(ev.color);
          setNote(ev.note);
          setExistingNotifIds(ev.notificationIds);
        }
      });
    }
  }, [editId]);

  function cycleRepeats() {
    const idx = REPEAT_OPTIONS.indexOf(repeats);
    setRepeats(REPEAT_OPTIONS[(idx + 1) % REPEAT_OPTIONS.length]);
  }

  function cycleReminder() {
    const idx = REMINDER_OPTIONS.indexOf(reminder);
    setReminder(REMINDER_OPTIONS[(idx + 1) % REMINDER_OPTIONS.length]);
  }

  function onDateChange(_event: DateTimePickerEvent, date?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setDateIso(dateToIso(date));
  }

  async function handleSave() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      if (isEdit && editId) {
        const updated = await repo.update(editId, {
          title: title.trim(),
          dateIso,
          type,
          repeats,
          reminder,
          color,
          note,
        });
        await cancelEventNotifications(existingNotifIds);
        const ids = await scheduleEventNotifications(updated);
        if (ids.length > 0) await repo.update(editId, { notificationIds: ids });
      } else {
        const ev = await repo.create({
          title: title.trim(),
          dateIso,
          type,
          repeats,
          reminder,
          color,
          note,
          dayOfYear: 0, // repo recomputes from dateIso
          notificationIds: [],
        });
        const ids = await scheduleEventNotifications(ev);
        if (ids.length > 0) await repo.update(ev.id, { notificationIds: ids });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save event. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = title.trim().length > 0 && !saving;
  const pickerDate = (() => {
    const [y, m, d] = dateIso.split('-').map(Number);
    return new Date(y, m - 1, d);
  })();

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      {/* Header */}
      <View style={[styles.navRow, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.navCancel, { color: t.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>{isEdit ? 'Edit Event' : 'New Event'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.navSave, { color: t.accentStrong, opacity: canSave ? 1 : 0.4 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name field */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>EVENT NAME</Text>
          <TextInput
            style={[styles.nameInput, { color: t.text, borderBottomColor: t.accentStrong }]}
            value={title}
            onChangeText={setTitle}
            placeholder="What's the occasion?"
            placeholderTextColor={t.textMuted}
            autoFocus={!isEdit}
            returnKeyType="done"
          />
        </View>

        {/* Type chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {EVENT_TYPES.map(tp => {
              const isSelected = tp === type;
              return (
                <TouchableOpacity
                  key={tp}
                  onPress={() => setType(tp)}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFF7EC' : t.textMuted }]}>
                    {tp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* When card */}
        <View style={[styles.whenCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          {/* Date row */}
          <TouchableOpacity
            style={[styles.whenRow, styles.whenRowBorder, { borderBottomColor: t.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.whenLabel, { color: t.textMuted }]}>Date</Text>
            <View style={styles.whenRight}>
              <Text style={[styles.whenValue, { color: t.text }]}>{dateIsoToDisplay(dateIso)}</Text>
              <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Repeats row */}
          <TouchableOpacity
            style={[styles.whenRow, styles.whenRowBorder, { borderBottomColor: t.border }]}
            onPress={cycleRepeats}
          >
            <Text style={[styles.whenLabel, { color: t.textMuted }]}>Repeats</Text>
            <View style={styles.whenRight}>
              <Text style={[styles.whenValue, { color: t.text }]}>{repeats}</Text>
              <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Reminder row */}
          <TouchableOpacity style={styles.whenRow} onPress={cycleReminder}>
            <Text style={[styles.whenLabel, { color: t.textMuted }]}>Reminder</Text>
            <View style={styles.whenRight}>
              <Text style={[styles.whenValue, { color: t.text }]}>{reminder}</Text>
              <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Date picker */}
        {showDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'android' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Color card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>COLOR</Text>
          <View style={styles.swatchRow}>
            {COLOR_SWATCHES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatchOuter,
                  color === c
                    ? { borderColor: t.accentStrong, borderWidth: 2.5 }
                    : { borderColor: 'transparent', borderWidth: 2.5 },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: c }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>NOTE</Text>
          <TextInput
            style={[styles.noteInput, { color: t.text }]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note…"
            placeholderTextColor={t.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bloom: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -40, right: -90, opacity: 0.55 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  navCancel: { fontSize: 15, fontWeight: '500' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  navSave: { fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 22, gap: 16 },
  card: { borderRadius: 20, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', gap: 12 },
  cardBloom: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, opacity: 0.38 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  nameInput: { fontSize: 18, fontWeight: '600', paddingVertical: 8, borderBottomWidth: 2 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, height: 36, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },
  whenCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  whenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  whenRowBorder: { borderBottomWidth: 1 },
  whenLabel: { fontSize: 14 },
  whenRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whenValue: { fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 18, lineHeight: 18 },
  swatchRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  swatchOuter: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  noteInput: { fontSize: 14, minHeight: 80, fontStyle: 'italic' },
  bottomPad: { height: 24 },
});
