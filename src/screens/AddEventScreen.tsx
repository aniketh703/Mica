import React, { useState, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as H from '../utils/haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { EVENT_COLORS } from '../theme/eventColors';
import ColorSwatchPicker from '../components/ColorSwatchPicker';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useEventRepository } from '../hooks/useEventRepository';
import { RootStackParamList, EventTypeOption, RepeatOption, ReminderOption } from '../types';
import { EVENT_TYPES, EVENT_TYPE_ICONS } from '../constants/eventTypes';
import { dateIsoToDisplay, dateToIso } from '../utils/yearProgress';
import { duration, easeEnter } from '../utils/motion';
import {
  scheduleEventNotifications,
  cancelEventNotifications,
} from '../services/NotificationService';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEvent'>;
  route: RouteProp<RootStackParamList, 'AddEvent'>;
};

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
  return dateToIso(d);
}

export default function AddEventScreen({ navigation, route }: Props) {
  const t = useTheme();
  const repo = useEventRepository();
  const reduceMotion = useReducedMotion();
  const [pickerOpacity] = useState(() => new Animated.Value(1));

  const editId = route.params?.eventId ?? null;
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventTypeOption>('Birthday');
  const [dateIso, setDateIso] = useState(defaultDateIso());
  const [repeats, setRepeats] = useState<RepeatOption>('None');
  const [reminder, setReminder] = useState<ReminderOption>('None');
  const [color, setColor] = useState<string>(EVENT_COLORS[0]);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
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
  }, [editId, repo]);

  function cycleRepeats() {
    const idx = REPEAT_OPTIONS.indexOf(repeats);
    setRepeats(REPEAT_OPTIONS[(idx + 1) % REPEAT_OPTIONS.length]);
  }

  function cycleReminder() {
    const idx = REMINDER_OPTIONS.indexOf(reminder);
    setReminder(REMINDER_OPTIONS[(idx + 1) % REMINDER_OPTIONS.length]);
  }

  function onDateValueChange(_event: DateTimePickerChangeEvent, date: Date) {
    if (date) setDateIso(dateToIso(date));
    if (Platform.OS !== 'ios') setShowDatePicker(false);
  }

  function onDateDismiss() {
    setShowDatePicker(false);
  }

  function showPicker() {
    if (showDatePicker) return;

    if (Platform.OS === 'ios' && !reduceMotion) {
      LayoutAnimation.configureNext({
        duration: duration.standard,
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
      });
    }

    setShowDatePicker(true);
  }

  useEffect(() => {
    if (!showDatePicker || Platform.OS !== 'ios') return;

    if (reduceMotion) {
      pickerOpacity.stopAnimation();
      pickerOpacity.setValue(1);
      return;
    }

    pickerOpacity.setValue(0);
    const animation = Animated.timing(pickerOpacity, {
      toValue: 1,
      duration: duration.standard,
      easing: easeEnter,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pickerOpacity, reduceMotion, showDatePicker]);

  async function handleSave() {
    if (!title.trim() || saving) return;
    setErrorMessage(null);
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
      H.notificationAsync(H.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      H.notificationAsync(H.NotificationFeedbackType.Error);
      setErrorMessage('Could not save event. Please try again.');
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
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: t.danger + '18', borderColor: t.danger }]}>
            <Text style={[styles.errorBannerText, { color: t.danger }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Name field */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>EVENT NAME</Text>
          <TextInput
            style={[styles.nameInput, { color: t.text, borderBottomColor: titleFocused ? t.accentStrong : t.border }]}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
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
                      : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
                  ]}
                >
                  <Ionicons name={EVENT_TYPE_ICONS[tp]} size={15} color={chipColor} />
                  <Text style={[styles.chipText, { color: chipColor }]}>{tp}</Text>
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
            onPress={showPicker}
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
        {showDatePicker && Platform.OS === 'ios' && (
          <Animated.View style={{ opacity: pickerOpacity }}>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              onValueChange={onDateValueChange}
              minimumDate={new Date()}
            />
          </Animated.View>
        )}
        {showDatePicker && Platform.OS !== 'ios' && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="spinner"
            onValueChange={onDateValueChange}
            onDismiss={onDateDismiss}
            minimumDate={new Date()}
          />
        )}

        {/* Color card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>COLOR</Text>
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
        </View>

        {/* Note card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: noteFocused ? t.accentStrong : t.border }]}>
          <Text style={[styles.fieldLabel, { color: t.textMuted }]}>NOTE</Text>
          <TextInput
            style={[styles.noteInput, { color: t.text }]}
            value={note}
            onChangeText={setNote}
            onFocus={() => setNoteFocused(true)}
            onBlur={() => setNoteFocused(false)}
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
  errorBanner: { borderRadius: 14, padding: 14, borderWidth: 1 },
  errorBannerText: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', gap: 12 },
  cardBloom: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, opacity: 0.38 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  nameInput: { fontSize: 18, fontWeight: '600', paddingVertical: 10, borderBottomWidth: 2 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 14, fontWeight: '600' },
  whenCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  whenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, minHeight: 52 },
  whenRowBorder: { borderBottomWidth: 1 },
  whenLabel: { fontSize: 16 },
  whenRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whenValue: { fontSize: 16, fontWeight: '600' },
  chevron: { fontSize: 18, lineHeight: 18 },
  noteInput: { fontSize: 15, minHeight: 80, fontStyle: 'italic' },
  bottomPad: { height: 24 },
});
