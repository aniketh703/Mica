// src/screens/onboarding/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useThemeMode } from '../../theme/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { RootStackParamList, InterestCategory } from '../../types';
import { ThemeMode } from '../../theme/ThemeContext';
import { requestNotificationPermission } from '../../services/NotificationService';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
  route: RouteProp<RootStackParamList, 'Onboarding'>;
};

// ─── Interest pill data ───────────────────────────────────────────────────────
const INTERESTS: { label: InterestCategory; color: string }[] = [
  { label: 'Birthdays',     color: '#C86B5A' },
  { label: 'Anniversaries', color: '#C86B5A' },
  { label: 'Deadlines',     color: '#9F7A45' },
  { label: 'Travel',        color: '#547A76' },
  { label: 'Goals',         color: '#6B7FA4' },
  { label: 'Holidays',      color: '#8A6BA4' },
  { label: 'Habits',        color: '#9F7A45' },
  { label: 'Memorials',     color: '#6F675F' },
];

// ─── Theme mode option data ───────────────────────────────────────────────────
const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  sub: string;
  swatches: string[];
}[] = [
  {
    mode: 'system',
    label: 'System',
    sub: 'Follows device',
    swatches: ['#F5F1EA', '#9F7A45', '#2E2A26'],
  },
  {
    mode: 'light',
    label: 'Light',
    sub: 'Always light',
    swatches: ['#F5F1EA', '#D6B98C', '#9F7A45'],
  },
  {
    mode: 'dark',
    label: 'Dark',
    sub: 'Always dark',
    swatches: ['#171919', '#D1B17C', '#F3EFE8'],
  },
];

// ─── Color swatches for step 5 ────────────────────────────────────────────────
const EVENT_COLORS = [
  '#C86B5A',
  '#9F7A45',
  '#547A76',
  '#D6B98C',
  '#6B7FA4',
  '#8A6BA4',
];

// ─── Helper: default date (today + 30 days) ───────────────────────────────────
function defaultEventDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation, route }: Props) {
  const t = useTheme();
  const { mode: currentMode, setMode } = useThemeMode();
  const { updateSetting } = useSettings();

  const step = route.params?.step ?? 1;

  // Step 1 state
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);

  // Step 2 state
  const [selectedInterests, setSelectedInterests] = useState<InterestCategory[]>([]);

  // Step 3 state
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(currentMode);

  // Step 5 state
  const [eventName, setEventName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [eventDate] = useState(defaultEventDate());

  // ─── Navigation helpers ─────────────────────────────────────────────────────
  function goBack() {
    navigation.goBack();
  }

  function goNext(nextStep: number) {
    navigation.navigate('Onboarding', { step: nextStep });
  }

  function goMain() {
    navigation.navigate('Main');
  }

  // ─── Step handlers ──────────────────────────────────────────────────────────
  async function handleStep1Continue() {
    await updateSetting('userName', name.trim());
    goNext(2);
  }

  async function handleStep2Continue() {
    await updateSetting('interests', selectedInterests);
    goNext(3);
  }

  async function handleStep3Continue() {
    setMode(selectedMode);
    await updateSetting('themeMode', selectedMode);
    goNext(4);
  }

  async function handleAllowNotifications() {
    await requestNotificationPermission();
    await updateSetting('notificationsEnabled', true);
    goNext(5);
  }

  async function handleSkipNotifications() {
    await updateSetting('notificationsEnabled', false);
    goNext(5);
  }

  async function handleFinish() {
    await updateSetting('onboardingComplete', true);
    goMain();
  }

  async function handleSkipEvents() {
    await updateSetting('onboardingComplete', true);
    goMain();
  }

  // ─── Toggle interest ────────────────────────────────────────────────────────
  function toggleInterest(interest: InterestCategory) {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest],
    );
  }

  // ─── Shared UI pieces ───────────────────────────────────────────────────────
  function renderHeader(stepNum: number) {
    return (
      <View style={styles.headerRow}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
            <Text style={[styles.backChevron, { color: t.textMuted }]}>‹</Text>
            <Text style={[styles.backLabel, { color: t.textMuted }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={[styles.stepIndicator, { color: t.textMuted }]}>{stepNum} of 5</Text>
      </View>
    );
  }

  function renderCTA(label: string, onPress: () => void, disabled = false) {
    return (
      <TouchableOpacity
        style={[
          styles.ctaBtn,
          { backgroundColor: disabled ? t.border : t.accentStrong },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaBtnText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // ─── Step renders ───────────────────────────────────────────────────────────
  function renderStep1() {
    const hasName = name.trim().length > 0;
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader(1)}

          <Text style={[styles.heading, { color: t.text }]}>What should we call you?</Text>
          <Text style={[styles.helper, { color: t.textMuted }]}>
            You can change this anytime in Settings.
          </Text>

          {/* Name input */}
          <TextInput
            style={[
              styles.nameInput,
              {
                color: t.text,
                borderBottomColor: nameFocused ? t.accentStrong : t.border,
              },
            ]}
            placeholder="Your name"
            placeholderTextColor={t.textMuted}
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoCorrect={false}
            returnKeyType="done"
          />

          {/* Preview block */}
          {hasName && (
            <View style={[styles.previewBlock, { backgroundColor: t.surfaceMuted }]}>
              <Text style={[styles.previewText, { color: t.text }]}>
                {greeting}, {name.trim()}.
              </Text>
            </View>
          )}

          <View style={styles.spacer} />
          {renderCTA('Continue', handleStep1Continue, !hasName)}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderStep2() {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader(2)}

        <Text style={[styles.heading, { color: t.text }]}>What do you want to track?</Text>
        <Text style={[styles.helper, { color: t.textMuted }]}>Pick as many as feel right.</Text>

        {/* Pill chips */}
        <View style={styles.pillRow}>
          {INTERESTS.map(({ label, color }) => {
            const isSelected = selectedInterests.includes(label);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => toggleInterest(label)}
                activeOpacity={0.8}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? color : t.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isSelected ? '#FFF7EC' : t.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.countNote, { color: t.textMuted }]}>
          {selectedInterests.length} selected
        </Text>

        <TouchableOpacity onPress={() => goNext(3)} activeOpacity={0.7} style={styles.skipLink}>
          <Text style={[styles.skipLinkText, { color: t.textMuted }]}>I'll decide later</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
        {renderCTA('Continue', handleStep2Continue)}
      </ScrollView>
    );
  }

  function renderStep3() {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader(3)}

        <Text style={[styles.heading, { color: t.text }]}>Choose your tone.</Text>
        <Text style={[styles.helper, { color: t.textMuted }]}>
          You can change this anytime in Settings.
        </Text>

        {/* Theme cards */}
        <View style={styles.themeCardRow}>
          {THEME_OPTIONS.map(opt => {
            const isSelected = selectedMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                onPress={() => setSelectedMode(opt.mode)}
                activeOpacity={0.8}
                style={[
                  styles.themeCard,
                  {
                    borderColor: isSelected ? t.accentStrong : t.border,
                    backgroundColor: isSelected ? t.accentSoft : t.surface,
                  },
                ]}
              >
                {/* Color swatches */}
                <View style={styles.swatchRow}>
                  {opt.swatches.map((sw, idx) => (
                    <View
                      key={idx}
                      style={[styles.swatch, { backgroundColor: sw }]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.themeCardLabel,
                    { color: isSelected ? t.text : t.text },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={[styles.themeCardSub, { color: t.textMuted }]}>{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />
        {renderCTA('Continue', handleStep3Continue)}
      </ScrollView>
    );
  }

  function renderStep4() {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader(4)}

        <Text style={[styles.heading, { color: t.text }]}>Quiet nudges, at the right hour.</Text>
        <Text style={[styles.helper, { color: t.textMuted }]}>
          Mica will remind you a day before special events.
        </Text>

        {/* Mock notification preview */}
        <View style={[styles.notifCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: t.success }]}>
              <Text style={styles.notifIconText}>M</Text>
            </View>
            <View style={styles.notifTextCol}>
              <Text style={[styles.notifTitle, { color: t.text }]}>Mica</Text>
              <Text style={[styles.notifBody, { color: t.textMuted }]}>
                Mum's birthday in 1 day
              </Text>
            </View>
          </View>
        </View>

        {/* Feature rows */}
        <View style={styles.featureList}>
          {[
            { icon: '✓', text: '9:00 a.m. on the day before', muted: false },
            { icon: '✓', text: 'Snooze, never silenced', muted: false },
            { icon: '✗', text: 'No streaks. No pressure.', muted: true },
          ].map((row, i) => (
            <View key={i} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: row.muted ? t.surfaceMuted : t.success,
                  },
                ]}
              >
                <Text style={styles.featureIconText}>{row.icon}</Text>
              </View>
              <Text style={[styles.featureText, { color: row.muted ? t.textMuted : t.text }]}>
                {row.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />
        {renderCTA('Allow notifications', handleAllowNotifications)}

        <TouchableOpacity onPress={handleSkipNotifications} activeOpacity={0.7} style={styles.skipLink}>
          <Text style={[styles.skipLinkText, { color: t.textMuted }]}>Not now</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderStep5() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader(5)}

          <Text style={[styles.heading, { color: t.text }]}>Your first moment.</Text>
          <Text style={[styles.helper, { color: t.textMuted }]}>
            Add one event to get started. You can always add more later.
          </Text>

          {/* Event form card */}
          <View style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            {/* Event name */}
            <View style={[styles.formRow, { borderBottomColor: t.border }]}>
              <Text style={[styles.formLabel, { color: t.textMuted }]}>EVENT NAME</Text>
              <TextInput
                style={[styles.formInput, { color: t.text }]}
                placeholder="e.g. Mum's birthday"
                placeholderTextColor={t.textMuted}
                value={eventName}
                onChangeText={setEventName}
                returnKeyType="done"
              />
            </View>

            {/* Date row */}
            <View style={[styles.formRow, { borderBottomColor: t.border }]}>
              <Text style={[styles.formLabel, { color: t.textMuted }]}>DATE</Text>
              <Text
                style={[
                  styles.formInput,
                  { color: eventDate ? t.text : t.textMuted },
                ]}
              >
                {eventDate}
              </Text>
            </View>

            {/* Color row */}
            <View style={styles.formRowLast}>
              <Text style={[styles.formLabel, { color: t.textMuted }]}>COLOUR</Text>
              <View style={styles.colorSwatchRow}>
                {EVENT_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColorIdx(idx)}
                    activeOpacity={0.8}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selectedColorIdx === idx && styles.colorSwatchSelected,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.spacer} />
          {renderCTA('Save & finish', handleFinish)}

          <TouchableOpacity onPress={handleSkipEvents} activeOpacity={0.7} style={styles.skipLink}>
            <Text style={[styles.skipLinkText, { color: t.textMuted }]}>I'll add events later</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Root render ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Bloom decoration */}
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      {(() => {
        switch (step) {
          case 1: return renderStep1();
          case 2: return renderStep2();
          case 3: return renderStep3();
          case 4: return renderStep4();
          case 5: return renderStep5();
          default: return renderStep1();
        }
      })()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    top: -50,
    right: -80,
    opacity: 0.45,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 20,
  },

  // Header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backChevron: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  backPlaceholder: {
    width: 48,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Heading + helper
  heading: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.9,
    lineHeight: 38,
    marginTop: 8,
  },
  helper: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: -4,
  },

  // Step 1: name input
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginTop: 8,
  },

  // Step 1: preview block
  previewBlock: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Step 2: pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  pill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
  },
  countNote: {
    fontSize: 13,
    marginTop: -4,
  },

  // Step 3: theme cards
  themeCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  themeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  themeCardLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeCardSub: {
    fontSize: 12,
  },

  // Step 4: notification preview
  notifCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  notifTextCol: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  notifBody: {
    fontSize: 13,
  },

  // Step 4: feature rows
  featureList: {
    gap: 12,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },

  // Step 5: event form
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  formRow: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 6,
  },
  formRowLast: {
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  formInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorSwatchRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // CTA button
  ctaBtn: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaBtnText: {
    color: '#FFF7EC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Skip / text link
  skipLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },

  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
