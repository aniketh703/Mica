import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as H from '../utils/haptics';
import { useTheme, useThemeMode } from '../theme/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { THEME_MODE_OPTIONS } from '../theme/themeOptions';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

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
      <View style={[styles.toggleThumb, { left: value ? 21 : 3 }]} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const { settings, updateSetting } = useSettings();

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

        {/* Appearance card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconBadge, { backgroundColor: t.accentSoft }]}>
              <Ionicons name="color-palette-outline" size={16} color={t.accentStrong} />
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.themeLabel, { color: t.textMuted }]}>THEME</Text>
          <View style={styles.themeRow}>
            {THEME_MODE_OPTIONS.map(opt => {
              const isActive = opt.mode === mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  onPress={() => {
                    setMode(opt.mode);
                    updateSetting('themeMode', opt.mode);
                  }}
                  style={[
                    styles.themeBtn,
                    isActive
                      ? { backgroundColor: t.accentStrong }
                      : { backgroundColor: t.surfaceMuted },
                  ]}
                >
                  <Text style={[styles.themeBtnText, { color: isActive ? t.onAccent : t.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminders card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconBadge, { backgroundColor: t.accentSoft }]}>
              <Ionicons name="notifications-outline" size={16} color={t.accentStrong} />
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Reminders & Feedback</Text>
          </View>

          {/* Daily nudge */}
          <View style={[styles.settingRow, styles.settingRowBorder, { borderBottomColor: t.border }]}>
            <View style={[styles.iconBadge, { backgroundColor: t.surfaceMuted }]}>
              <Ionicons name="alarm-outline" size={16} color={t.textMuted} />
            </View>
            <Text style={[styles.settingLabel, { color: t.text, flex: 1 }]}>Daily nudge</Text>
            <Toggle
              value={settings.notificationsEnabled}
              onToggle={() => {
                H.selectionAsync();
                updateSetting('notificationsEnabled', !settings.notificationsEnabled);
              }}
              activeColor={t.accentStrong}
              inactiveColor={t.surfaceMuted}
            />
          </View>

          {/* Haptic feedback */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBadge, { backgroundColor: t.surfaceMuted }]}>
              <Ionicons name="pulse-outline" size={16} color={t.textMuted} />
            </View>
            <Text style={[styles.settingLabel, { color: t.text, flex: 1 }]}>Haptic feedback</Text>
            <Toggle
              value={settings.hapticsEnabled}
              onToggle={() => {
                // Fire one last haptic before potentially disabling them
                if (settings.hapticsEnabled) H.selectionAsync();
                updateSetting('hapticsEnabled', !settings.hapticsEnabled);
              }}
              activeColor={t.accentStrong}
              inactiveColor={t.surfaceMuted}
            />
          </View>
        </View>

        {/* About card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconBadge, { backgroundColor: t.accentSoft }]}>
              <Ionicons name="information-circle-outline" size={16} color={t.accentStrong} />
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>About</Text>
          </View>
          {([
            {
              icon: 'barcode-outline' as IoniconName,
              label: 'Version',
              value: '1.0.0',
              onPress: undefined as (() => void) | undefined,
            },
            {
              icon: 'shield-checkmark-outline' as IoniconName,
              label: 'Privacy Policy',
              value: undefined,
              onPress: () => Linking.openURL('https://gist.github.com/aniketh703/24b12ba1a350d351a7d0543b4204652b'),
            },
            {
              icon: 'star-outline' as IoniconName,
              label: 'Rate Mica',
              value: undefined,
              onPress: () => Alert.alert('Coming soon', 'Rating will be available on Play Store.'),
            },
          ] as const).map((row, i, arr) => (
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
              <View style={[styles.iconBadge, { backgroundColor: t.surfaceMuted }]}>
                <Ionicons name={row.icon} size={15} color={t.textMuted} />
              </View>
              <Text style={[styles.settingLabel, { color: t.textMuted, flex: 1 }]}>{row.label}</Text>
              {row.value
                ? <Text style={[styles.aboutValue, { color: t.text }]}>{row.value}</Text>
                : <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
              }
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  themeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: -4 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  themeBtnText: { fontSize: 14, fontWeight: '600' },
  iconBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  settingRowBorder: { borderBottomWidth: 1, paddingBottom: 12, marginBottom: 4 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, position: 'relative' },
  toggleThumb: {
    position: 'absolute',
    top: 3,
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
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 52 },
  aboutRowBorder: { borderBottomWidth: 1 },
  aboutValue: { fontSize: 15 },
  bottomPad: { height: 8 },
});
