import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Invite'>;
  t: Theme;
};

const REFERRAL_CODE = 'ALEX-MICA-2026';

const FRIENDS = [
  { initials: 'JR', name: 'Jamie R.',  status: 'Joined',  color: '#547A76' },
  { initials: 'PK', name: 'Priya K.',  status: 'Pending', color: '#9F7A45' },
  { initials: 'TL', name: 'Tom L.',    status: 'Pending', color: '#6B7FA4' },
];

const SHARE_BTNS = [
  { label: 'Share link', icon: '↗', flex: 2, primary: true },
  { label: 'Message',    icon: '✉', flex: 1, primary: false },
  { label: 'More',       icon: '···', flex: 1, primary: false },
];

export default function InviteScreen({ navigation, t }: Props) {
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
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={[styles.backChevron, { color: t.accentStrong }]}>‹</Text>
          <Text style={[styles.backText, { color: t.accentStrong }]}>Settings</Text>
        </TouchableOpacity>

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
            <Text style={[styles.codeText, { color: t.accentStrong }]}>{REFERRAL_CODE}</Text>
            <View style={[styles.copyBtn, { backgroundColor: t.accentStrong }]}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </View>
          </View>
          <Text style={[styles.codeCaption, { color: t.textMuted }]}>
            Your friend gets Mica free for 30 days. You unlock a premium month when they join.
          </Text>
        </View>

        {/* Share row */}
        <View style={styles.shareRow}>
          {SHARE_BTNS.map(btn => (
            <TouchableOpacity
              key={btn.label}
              style={[
                styles.shareBtn,
                { flex: btn.flex },
                btn.primary
                  ? { backgroundColor: t.accentStrong }
                  : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
              ]}
            >
              <Text style={btn.primary ? styles.shareBtnIconPrimary : [styles.shareBtnIcon, { color: t.text }]}>
                {btn.icon}
              </Text>
              <Text style={[styles.shareBtnLabel, { color: btn.primary ? '#FFF7EC' : t.text }]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friends list */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Invited friends</Text>
          {FRIENDS.map((f, i) => (
            <View
              key={f.name}
              style={[
                styles.friendRow,
                { borderBottomColor: t.border },
                i < FRIENDS.length - 1 && styles.friendRowBorder,
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: f.color + '28', borderColor: f.color + '40' },
                ]}
              >
                <Text style={[styles.avatarText, { color: f.color }]}>{f.initials}</Text>
              </View>
              <Text style={[styles.friendName, { color: t.text, flex: 1 }]}>{f.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: f.status === 'Joined' ? t.success + '18' : t.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: f.status === 'Joined' ? t.success : t.textMuted },
                  ]}
                >
                  {f.status}
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addContactsRow}>
            <View style={[styles.addContactsIcon, { backgroundColor: t.accentSoft }]}>
              <Text style={[styles.addContactsPlus, { color: t.accentStrong }]}>+</Text>
            </View>
            <Text style={[styles.addContactsText, { color: t.accentStrong }]}>
              Add from contacts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: t.textMuted }]}>
          Referral credits apply after your friend completes setup.{' '}
          <Text style={{ color: t.accentStrong }}>Terms apply.</Text>
        </Text>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bloomTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -40,
    right: -90,
    opacity: 0.55,
  },
  bloomBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 120,
    left: -80,
    opacity: 0.08,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingTop: 56,
    gap: 18,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backChevron: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 24,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
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
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -70,
    right: -50,
    opacity: 0.4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  codeBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  copyBtn: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF7EC',
    letterSpacing: 0.3,
  },
  codeCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareBtnIconPrimary: {
    fontSize: 14,
    color: '#FFF7EC',
  },
  shareBtnIcon: {
    fontSize: 14,
  },
  shareBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: -4,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  friendRowBorder: {
    borderBottomWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addContactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
  },
  addContactsIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactsPlus: {
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 18,
  },
  addContactsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  terms: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    paddingBottom: 4,
  },
  bottomPad: {
    height: 24,
  },
});
