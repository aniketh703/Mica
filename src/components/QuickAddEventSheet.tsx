// Quick-add form rendered inside BottomSheet from the Home FAB. Deliberately
// trimmed to the fields that matter for a fast capture (name, type, date,
// color) — repeats/reminder/note stay at their defaults and can be set later
// from the full edit screen (EventDetail → Edit), reached from the event this
// creates.
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Theme } from '../theme/palette';
import { MicaEvent, EventTypeOption } from '../types';
import { EVENT_COLORS } from '../theme/eventColors';
import { EVENT_TYPES, EVENT_TYPE_ICONS } from '../constants/eventTypes';
import ColorSwatchPicker from './ColorSwatchPicker';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { dateIsoToDisplay, dateToIso } from '../utils/yearProgress';
import * as H from '../utils/haptics';

function defaultDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return dateToIso(d);
}

type CreateEventInput = Omit<MicaEvent, 'id' | 'notificationIds' | 'appwriteId' | 'createdAt' | 'updatedAt'>;

type QuickAddEventSheetProps = {
  t: Theme;
  onClose: () => void;
  createEvent: (data: CreateEventInput) => Promise<MicaEvent>;
};

export default function QuickAddEventSheet({ t, onClose, createEvent }: QuickAddEventSheetProps) {
  const reduceMotion = useReducedMotion();

  const [title, setTitle] = useState('');
  const [titleFocused, setTitleFocused] = useState(false);
  const [type, setType] = useState<EventTypeOption>('Birthday');
  const [dateIso, setDateIso] = useState(defaultDateIso());
  const [color, setColor] = useState<string>(EVENT_COLORS[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = title.trim().length > 0 && !saving;
  const pickerDate = (() => {
    const [y, m, d] = dateIso.split('-').map(Number);
    return new Date(y, m - 1, d);
  })();

  function onDateValueChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (date) setDateIso(dateToIso(date));
    if (Platform.OS !== 'ios') setShowDatePicker(false);
  }

  async function handleSave() {
    if (!title.trim() || saving) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await createEvent({
        title: title.trim(),
        dateIso,
        type,
        repeats: 'None',
        reminder: 'None',
        color,
        note: '',
        dayOfYear: 0, // repo recomputes from dateIso
      });
      H.notificationAsync(H.NotificationFeedbackType.Success);
      onClose();
    } catch {
      H.notificationAsync(H.NotificationFeedbackType.Error);
      setErrorMessage('Could not save event. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: t.text }]}>New event</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={t.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Scrollable so nothing gets clipped when the keyboard or the
          expanded iOS date picker eats into the available height. Save
          stays docked below, outside the scroll, so it's always reachable. */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
      >
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: t.danger + '18', borderColor: t.danger }]}>
            <Text style={[styles.errorBannerText, { color: t.danger }]}>{errorMessage}</Text>
          </View>
        )}

        <TextInput
          style={[styles.nameInput, { color: t.text, borderBottomColor: titleFocused ? t.accentStrong : t.border }]}
          value={title}
          onChangeText={setTitle}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          placeholder="What's the occasion?"
          placeholderTextColor={t.textMuted}
          autoFocus
          returnKeyType="done"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chipsRow}>
            {EVENT_TYPES.map(tp => {
              const isSelected = tp === type;
              const chipColor = isSelected ? t.onAccent : t.textMuted;
              return (
                <TouchableOpacity
                  key={tp}
                  onPress={() => {
                    H.selectionAsync();
                    setType(tp);
                  }}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surfaceMuted },
                  ]}
                >
                  <Ionicons name={EVENT_TYPE_ICONS[tp]} size={14} color={chipColor} />
                  <Text style={[styles.chipText, { color: chipColor }]}>{tp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.dateRow, { backgroundColor: t.surfaceMuted }]}
          onPress={() => setShowDatePicker(v => !v)}
        >
          <Text style={[styles.dateLabel, { color: t.textMuted }]}>Date</Text>
          <View style={styles.dateRight}>
            <Text style={[styles.dateValue, { color: t.text }]}>{dateIsoToDisplay(dateIso)}</Text>
            <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
          </View>
        </TouchableOpacity>

        {showDatePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onValueChange={onDateValueChange}
            minimumDate={new Date()}
          />
        )}
        {showDatePicker && Platform.OS !== 'ios' && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="spinner"
            onValueChange={onDateValueChange}
            onDismiss={() => setShowDatePicker(false)}
            minimumDate={new Date()}
          />
        )}

        <ColorSwatchPicker
          colors={EVENT_COLORS}
          selectedColor={color}
          onSelect={c => {
            H.selectionAsync();
            setColor(c);
          }}
          reduceMotion={reduceMotion}
          t={t}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: t.accentStrong, opacity: canSave ? 1 : 0.4 }]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.85}
      >
        <Text style={[styles.saveBtnText, { color: t.onAccent }]}>{saving ? 'Saving…' : 'Add event'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 22, paddingBottom: 32, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // flexShrink (not flex:1) — lets the ScrollView shrink to fit under the
  // sheet's maxHeight cap instead of always claiming its full content size,
  // which is what actually makes internal scrolling kick in when needed.
  scroll: { flexShrink: 1 },
  body: { gap: 16, paddingBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  errorBanner: { borderRadius: 14, padding: 14, borderWidth: 1 },
  errorBannerText: { fontSize: 14, fontWeight: '600' },
  nameInput: { fontSize: 18, fontWeight: '600', paddingVertical: 10, borderBottomWidth: 2 },
  chipsScroll: { flexGrow: 0 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, minHeight: 48 },
  dateLabel: { fontSize: 15 },
  dateRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 15, fontWeight: '600' },
  saveBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
