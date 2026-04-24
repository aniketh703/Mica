import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {EventList} from '../components/EventList';
import {Screen} from '../components/Screen';
import {SectionCard} from '../components/SectionCard';
import {useTheme} from '../theme/ThemeProvider';

export function EventsScreen(): JSX.Element {
  const {theme} = useTheme();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.title, {color: theme.text}]}>Upcoming moments</Text>
        <Text style={[styles.subtitle, {color: theme.textMuted}]}>
          Countdowns for the dates that deserve your attention.
        </Text>
      </View>
      <SectionCard
        title="Your events"
        subtitle="Birthdays, deadlines, vacations, and more">
        <EventList />
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
    maxWidth: 300,
  },
});
