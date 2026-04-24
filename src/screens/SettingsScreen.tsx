import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Screen} from '../components/Screen';
import {SectionCard} from '../components/SectionCard';
import {useMicaStore} from '../store/useMicaStore';
import {useTheme} from '../theme/ThemeProvider';

export function SettingsScreen(): JSX.Element {
  const {theme} = useTheme();
  const premium = useMicaStore(state => state.premium.isPremium);
  const setPremium = useMicaStore(state => state.setPremium);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.title, {color: theme.text}]}>Calm, your way</Text>
        <Text style={[styles.subtitle, {color: theme.textMuted}]}>
          Theme controls, widget styling, reminders, and premium unlock live here.
        </Text>
      </View>
      <SectionCard
        title={premium ? 'Premium unlocked' : 'Upgrade to premium'}
        subtitle="One-time purchase, lifetime access">
        <Pressable
          accessibilityRole="button"
          onPress={() => setPremium(!premium)}
          style={[
            styles.button,
            {
              backgroundColor: theme.accentStrong,
            },
          ]}>
          <Text style={styles.buttonText}>
            {premium ? 'Simulate restore state' : 'Simulate unlock'}
          </Text>
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 6,
    paddingTop: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#FFF7EC',
    fontSize: 15,
    fontWeight: '700',
  },
});
