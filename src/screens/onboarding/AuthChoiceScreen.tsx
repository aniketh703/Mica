// src/screens/onboarding/AuthChoiceScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AuthChoice'>;
};

export default function AuthChoiceScreen({ navigation }: Props) {
  const t = useTheme();

  function handleComingSoon() {
    Alert.alert('Coming soon', 'Sync features are coming in a future update.');
  }

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Bloom: top-right */}
      <View
        style={[styles.bloomTopRight, { backgroundColor: t.surfaceStrong }]}
      />

      <View style={styles.content}>
        {/* MICA wordmark */}
        <Text style={[styles.wordmark, { color: t.textMuted }]}>MICA</Text>

        {/* Heading */}
        <Text style={[styles.heading, { color: t.text }]}>
          Make time visible.
        </Text>

        {/* Subtext */}
        <Text style={[styles.subtext, { color: t.textMuted }]}>
          Pick how you'd like to start.
        </Text>

        {/* Privacy card */}
        <TouchableOpacity
          style={[
            styles.privacyCard,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
          onPress={() => navigation.navigate('Onboarding', {})}
          activeOpacity={0.85}
        >
          <View style={styles.privacyCardInner}>
            <Text style={styles.privacyIcon}>🛡</Text>
            <View style={styles.privacyTextBlock}>
              <Text style={[styles.privacyTitle, { color: t.text }]}>
                Use Mica privately
              </Text>
              <Text style={[styles.privacySubtitle, { color: t.textMuted }]}>
                No account. All on this device.
              </Text>
            </View>
            <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
          </View>
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>
            OR SYNC ACROSS DEVICES
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        {/* Social auth buttons */}
        <View style={styles.socialButtons}>
          {/* Continue with Apple */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 },
            ]}
            onPress={handleComingSoon}
            activeOpacity={0.8}
          >
            <Text style={[styles.socialButtonText, { color: t.text }]}>
              Continue with Apple{' '}
              <Text style={[styles.comingSoon, { color: t.textMuted }]}>
                (coming soon)
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 },
            ]}
            onPress={handleComingSoon}
            activeOpacity={0.8}
          >
            <Text style={[styles.socialButtonText, { color: t.text }]}>
              Continue with Google{' '}
              <Text style={[styles.comingSoon, { color: t.textMuted }]}>
                (coming soon)
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Continue with email */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: t.surfaceMuted }]}
            onPress={handleComingSoon}
            activeOpacity={0.8}
          >
            <Text style={[styles.socialButtonText, { color: t.text }]}>
              Continue with email{' '}
              <Text style={[styles.comingSoon, { color: t.textMuted }]}>
                (coming soon)
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bloomTopRight: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -80,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
  },
  wordmark: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 16,
  },
  subtext: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  privacyCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: 36,
  },
  privacyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  privacyIcon: {
    fontSize: 22,
  },
  privacyTextBlock: {
    flex: 1,
    gap: 2,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  privacySubtitle: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  socialButtons: {
    marginTop: 16,
    gap: 10,
  },
  socialButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 13,
    fontWeight: '400',
  },
});
