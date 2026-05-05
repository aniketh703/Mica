import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';
import { TabName } from '../types';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  t: Theme;
}

function HomeIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[
        styles.houseBody,
        filled
          ? { backgroundColor: color, borderWidth: 0 }
          : { backgroundColor: 'transparent', borderWidth: 1.6, borderColor: color },
      ]} />
    </View>
  );
}

function CalendarIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.calendarBox,
        filled
          ? { backgroundColor: color + '26', borderColor: color }
          : { backgroundColor: 'transparent', borderColor: color },
      ]}>
        <View style={[styles.calendarHeader, { backgroundColor: color }]} />
        <View style={styles.calendarDots}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
      </View>
      <View style={[styles.calendarPegs, { borderColor: color }]}>
        <View style={[styles.peg, { backgroundColor: color }]} />
        <View style={[styles.peg, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function SettingsIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.gearOuter,
        { borderColor: color },
        filled && { backgroundColor: color + '33' },
      ]}>
        <View style={[styles.gearInner, { borderColor: color }]} />
      </View>
    </View>
  );
}

export default function TabBar({ activeTab, onTabChange, t }: TabBarProps) {
  const tabs: Array<{ id: TabName; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Events' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const color = isActive ? t.accentStrong : t.textMuted;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            {tab.id === 'home' && <HomeIcon color={color} filled={isActive} />}
            {tab.id === 'events' && <CalendarIcon color={color} filled={isActive} />}
            {tab.id === 'settings' && <SettingsIcon color={color} filled={isActive} />}
            <Text style={[styles.label, { color, fontWeight: isActive ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Home icon
  roof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  houseBody: {
    width: 12,
    height: 8,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  // Calendar icon
  calendarBox: {
    width: 16,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  calendarHeader: {
    height: 4,
    width: '100%',
    opacity: 0.7,
  },
  calendarDots: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.8,
  },
  calendarPegs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  peg: {
    width: 2,
    height: 4,
    borderRadius: 1,
  },
  // Settings icon
  gearOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
  },
});
