import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, useThemeMode, ThemeMode } from '../theme/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { usePremium, FREE_EVENT_LIMIT } from '../context/PremiumContext';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
};

const PREMIUM_FEATURES = [
  'Unlimited events',
  'Cross-device sync',
  'Multiple reminders per event',
  'Export your events as CSV',
];

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

function Toggle({
  value,
  onToggle,
  activeColor,
  inactiveColor,
}: {
  value: boolean;
  onToggle: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggleTrack, { backgroundColor: value ? activeColor : inactiveColor }]}
      activeOpacity={0.85}
    >
      <View style={[styles.toggleThumb, { left: value ? 19 : 2.5 }]} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const { settings, updateSetting } = useSettings();
  const { eventCount } = usePremium();

  const atLimit = eventCount >= FREE_EVENT_LIMIT;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: t.text }]}>Calm, your way.</Text>
          <Text style={[styles.heroSubtitle, { color: t.textMuted }]}>
            Tune Mica to match how you think about time.
          </Text>
        </View>

        {/* Premium card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>MICA · PREMIUM</Text>
          <Text style={[styles.premiumTitle, { color: t.text }]}>Upgrade to Premium</Text>
          <Text style={[styles.premiumSubtitle, { color: t.textMuted }]}>
            One-time purchase, lifetime access.
          </Text>
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: t.accentStrong }]} />
                <Text style={[styles.featureText, { color: t.text }]}>{f}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.usageLine, { color: atLimit ? t.danger : t.textMuted }]}>
            {eventCount} / {FREE_EVENT_LIMIT} events used
          </Text>
          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: t.accentStrong }]}
            onPress={() =>
              Alert.alert('Coming soon', 'Premium features are coming in a future update.')
            }
          >
            <Text style={styles.unlockBtnText}>Unlock Mica Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Appearance</Text>
          <Text style={[styles.themeLabel, { color: t.textMuted }]}>THEME</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(opt => {
              const isActive = opt.value === mode;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setMode(opt.value);
                    updateSetting('themeMode', opt.value);
                  }}
                  style={[
                    styles.themeBtn,
                    isActive
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[styles.themeBtnText, { color: isActive ? '#FFF7EC' : t.textMuted }]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminders card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Reminders</Text>
          <View style={styles.reminderRow}>
            <Text style={[styles.reminderLabel, { color: t.text }]}>Daily nudge</Text>
            <Toggle
              value={settings.notificationsEnabled}
              onToggle={() =>
                updateSetting('notificationsEnabled', !settings.notificationsEnabled)
              }
              activeColor={t.accentStrong}
              inactiveColor={t.surfaceMuted}
            />
          </View>
        </View>

        {/* Invite */}
        <TouchableOpacity
          style={[styles.card, styles.inviteRow, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => navigation.navigate('Invite')}
        >
          <Text style={[styles.reminderLabel, { color: t.text }]}>Invite a friend</Text>
          <Text style={[{ color: t.accentStrong, fontSize: 18 }]}>›</Text>
        </TouchableOpacity>

        {/* About card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>About</Text>
          {[
            { label: 'Version', value: '1.0.0', onPress: undefined },
            {
              label: 'Privacy Policy',
              value: '›',
              onPress: () =>
                Alert.alert('Coming soon', 'Privacy policy will be at mica.app/privacy'),
            },
            {
              label: 'Rate Mica',
              value: '›',
              onPress: () =>
                Alert.alert('Coming soon', 'Rating will be available on Play Store.'),
            },
          ].map((row, i, arr) => (
            <TouchableOpacity
              key={row.label}
              disabled={!row.onPress}
              onPress={row.onPress}
              style={[
                styles.aboutRow,
                { borderBottomColor: t.border },
                i < arr.length - 1 && styles.aboutRowBorder,
              ]}
            >
              <Text style={[styles.reminderLabel, { color: t.textMuted }]}>{row.label}</Text>
              <Text style={[styles.aboutValue, { color: t.text }]}>{row.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  bloom: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -20, right: -100, opacity: 0.5 },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 18 },
  hero: { gap: 6, paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7, lineHeight: 34 },
  heroSubtitle: { fontSize: 15, lineHeight: 22, maxWidth: 300 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', gap: 12 },
  cardBloom: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -80, right: -60, opacity: 0.38 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  premiumTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: -4 },
  premiumSubtitle: { fontSize: 13, marginTop: -4 },
  featureList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  featureText: { fontSize: 14 },
  usageLine: { fontSize: 12, marginTop: -4 },
  unlockBtn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  unlockBtnText: { color: '#FFF7EC', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: -2 },
  themeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: -4 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeBtnText: { fontSize: 13, fontWeight: '600' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderLabel: { fontSize: 14 },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTrack: { width: 42, height: 25, borderRadius: 12.5, position: 'relative' },
  toggleThumb: {
    position: 'absolute',
    top: 2.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  aboutRowBorder: { borderBottomWidth: 1 },
  aboutValue: { fontSize: 14 },
  bottomPad: { height: 8 },
});
