import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { useEventRepository } from '../hooks/useEventRepository';
import { RootStackParamList } from '../types';
import BackRow from '../components/BackRow';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Invite'>;
};

const SHARE_BTNS = [
  { label: 'Share link', icon: '↗', flex: 1, primary: true },
];

export default function InviteScreen({ navigation }: Props) {
  const t = useTheme();
  const { settings } = useSettings();
  const repo = useEventRepository();
  const [copied, setCopied] = useState(false);
  // Stable per-install random suffix so two users with the same name don't
  // collide on the same referral code. Generated once, then persisted.
  const [suffix, setSuffix] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    repo.getSetting('referralSuffix').then(async existing => {
      if (existing) {
        if (mounted) setSuffix(existing);
        return;
      }
      const generated = randomSuffix();
      await repo.setSetting('referralSuffix', generated);
      if (mounted) setSuffix(generated);
    });
    return () => { mounted = false; };
  }, [repo]);

  // Build referral code from the user's name, falling back to a generic slug
  const userSlug = (settings.userName || 'YOU').toUpperCase().replace(/\s+/g, '-').slice(0, 12);
  const REFERRAL_CODE = suffix ? `${userSlug}-MICA-${suffix}` : null;

  async function handleCopy() {
    if (!REFERRAL_CODE) return;
    await Clipboard.setStringAsync(REFERRAL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!REFERRAL_CODE) return;
    try {
      await Share.share({
        message: `Join me on Mica — a personal countdown app. Use my code ${REFERRAL_CODE} to get started.\nhttps://mica.app`,
        title: 'Try Mica',
      });
    } catch {
      // user dismissed share sheet — no-op
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloomTop, { backgroundColor: t.surfaceStrong }]} />
      <View style={[styles.bloomBottom, { backgroundColor: t.success }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <BackRow t={t} label="Settings" onPress={() => navigation.goBack()} />

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: t.text }]}>Share the quiet.</Text>
          <Text style={[styles.heroSubtitle, { color: t.textMuted }]}>
            Invite a friend to Mica and help them make their time visible too.
          </Text>
        </View>

        {/* Referral code card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>YOUR REFERRAL CODE</Text>
          <View style={[styles.codeBox, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
            <Text style={[styles.codeText, { color: t.accentStrong }]}>{REFERRAL_CODE ?? '…'}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? t.success : t.accentStrong }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Text style={[styles.copyBtnText, { color: t.onAccent }]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.codeCaption, { color: t.textMuted }]}>
            Share your code so a friend can find Mica too.
          </Text>
        </View>

        {/* Share row */}
        <View style={styles.shareRow}>
          {SHARE_BTNS.map(btn => (
            <TouchableOpacity
              key={btn.label}
              onPress={handleShare}
              style={[styles.shareBtn, { flex: btn.flex, backgroundColor: t.accentStrong }]}
            >
              <Text style={[styles.shareBtnIconPrimary, { color: t.onAccent }]}>{btn.icon}</Text>
              <Text style={[styles.shareBtnLabel, { color: t.onAccent }]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friends list */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Invited friends</Text>
          <Text style={[styles.emptyFriends, { color: t.textMuted }]}>
            No invites yet. Once you share your code, friends who join will show up here.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bloomTop: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -40, right: -90, opacity: 0.55 },
  bloomBottom: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: 120, left: -80, opacity: 0.08 },
  scroll: { flex: 1 },
  content: { padding: 22, paddingTop: 56, gap: 18 },
  hero: { gap: 8, paddingTop: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36 },
  heroSubtitle: { fontSize: 15, lineHeight: 22, maxWidth: 300 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', gap: 14 },
  cardBloom: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -70, right: -50, opacity: 0.4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  codeBox: { borderRadius: 14, padding: 14, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  copyBtn: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  copyBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  codeCaption: { fontSize: 13, lineHeight: 18 },
  shareRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  shareBtnIconPrimary: { fontSize: 14 },
  shareBtnLabel: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: -4 },
  emptyFriends: { fontSize: 13, lineHeight: 19 },
  bottomPad: { height: 24 },
});
