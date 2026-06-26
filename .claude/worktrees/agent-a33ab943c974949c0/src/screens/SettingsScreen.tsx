import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  t: Theme;
};

type ThemeOption = 'System' | 'Light' | 'Dark';

const PREMIUM_FEATURES = [
  'Widgets for your home screen',
  'Unlimited events',
  'Custom reminders & sounds',
];

const REMINDER_ROWS = [
  { label: 'Daily nudge',             on: true },
  { label: 'Year milestone alerts',   on: true },
  { label: 'Event week reminder',     on: false },
];

const ABOUT_ROWS = [
  { label: 'Version',        value: '1.0.0' },
  { label: 'Privacy Policy', value: '→' },
  { label: 'Rate Mica',      value: '→' },
];

function Toggle({ on, color, mutedColor }: { on: boolean; color: string; mutedColor: string }) {
  return (
    <View style={[styles.toggleTrack, { backgroundColor: on ? color : mutedColor }]}>
      <View
        style={[
          styles.toggleThumb,
          {
            left: on ? 19 : 2.5,
            backgroundColor: on ? '#FFF7EC' : 'rgba(100,100,100,0.5)',
          },
        ]}
      />
    </View>
  );
}

export default function SettingsScreen({ navigation, t }: Props) {
  const [activeTheme, setActiveTheme] = useState<ThemeOption>('System');
  const themeOptions: ThemeOption[] = ['System', 'Light', 'Dark'];

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: 8 }]}>
          <Text style={[styles.heroTitle, { color: t.text }]}>Calm, your way</Text>
          <Text style={[styles.heroSubtitle, { color: t.textMuted }]}>
            Theme controls, widget styling, reminders, and premium unlock live here.
          </Text>
        </View>

        {/* Premium card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <View style={styles.premiumHeader}>
            <Text style={[styles.premiumTitle, { color: t.text }]}>Upgrade to premium</Text>
            <Text style={[styles.premiumSubtitle, { color: t.textMuted }]}>
              One-time purchase, lifetime access
            </Text>
          </View>
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: t.accentStrong }]} />
                <Text style={[styles.featureText, { color: t.text }]}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.unlockBtn, { backgroundColor: t.accentStrong }]}>
            <Text style={styles.unlockBtnText}>Unlock Mica Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Appearance</Text>
          <Text style={[styles.themeLabel, { color: t.textMuted }]}>THEME</Text>
          <View style={styles.themeRow}>
            {themeOptions.map(opt => {
              const isActive = opt === activeTheme;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setActiveTheme(opt)}
                  style={[
                    styles.themeBtn,
                    isActive
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surfaceMuted, borderWidth: 1, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.themeBtnText, { color: isActive ? '#FFF7EC' : t.textMuted }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminders */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Reminders</Text>
          {REMINDER_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.reminderRow,
                { borderBottomColor: t.border },
                i < REMINDER_ROWS.length - 1 && styles.reminderRowBorder,
              ]}
            >
              <Text style={[styles.reminderLabel, { color: t.text }]}>{row.label}</Text>
              <Toggle on={row.on} color={t.accentStrong} mutedColor={t.surfaceMuted} />
            </View>
          ))}
        </View>

        {/* Invite a friend */}
        <TouchableOpacity
          style={[styles.card, styles.inviteRow, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => navigation.navigate('Invite')}
        >
          <Text style={[styles.reminderLabel, { color: t.text }]}>Invite a friend</Text>
          <Text style={[{ color: t.accentStrong, fontSize: 18 }]}>›</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {ABOUT_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.reminderRow,
                { borderBottomColor: t.border },
                i < ABOUT_ROWS.length - 1 && styles.reminderRowBorder,
              ]}
            >
              <Text style={[styles.reminderLabel, { color: t.textMuted }]}>{row.label}</Text>
              <Text style={[styles.aboutValue, { color: t.text }]}>{row.value}</Text>
            </View>
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
    top: -20,
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
  hero: {
    gap: 6,
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
    maxWidth: 300,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
    opacity: 0.38,
  },
  premiumHeader: {
    gap: 4,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  premiumSubtitle: {
    fontSize: 13,
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
  },
  unlockBtn: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    color: '#FFF7EC',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: -4,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: -6,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  reminderRowBorder: {
    borderBottomWidth: 1,
  },
  reminderLabel: {
    fontSize: 14,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
  },
  toggleTrack: {
    width: 42,
    height: 25,
    borderRadius: 12.5,
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutValue: {
    fontSize: 14,
  },
  bottomPad: {
    height: 8,
  },
});
