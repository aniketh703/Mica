import React, { useEffect, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as H from '../utils/haptics';
import { Theme } from '../theme/palette';
import { TabName } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MOTION_DURATION, motionEasing } from '../utils/motion';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  t: Theme;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Array<{
  id: TabName;
  label: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}> = [
  { id: 'home',     label: 'Home',     activeIcon: 'home',          inactiveIcon: 'home-outline'          },
  { id: 'events',   label: 'Events',   activeIcon: 'calendar',      inactiveIcon: 'calendar-outline'      },
  { id: 'settings', label: 'Settings', activeIcon: 'settings-sharp', inactiveIcon: 'settings-outline'     },
];

function TabItem({
  tab,
  isActive,
  onPress,
  t,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
  t: Theme;
}) {
  const reduceMotion = useReducedMotion();
  const [activeProgress] = useState(() => new Animated.Value(isActive ? 1 : 0));
  const color = isActive ? t.accentStrong : t.textMuted;

  useEffect(() => {
    if (reduceMotion) {
      activeProgress.stopAnimation();
      activeProgress.setValue(isActive ? 1 : 0);
      return;
    }

    const animation = Animated.timing(activeProgress, {
      toValue: isActive ? 1 : 0,
      duration: MOTION_DURATION.tab,
      easing: motionEasing,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [activeProgress, isActive, reduceMotion]);

  const inactiveOpacity = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.iconLayer, { opacity: inactiveOpacity }]}>
          <Ionicons name={tab.inactiveIcon} size={24} color={t.textMuted} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, { opacity: activeProgress }]}>
          <Ionicons name={tab.activeIcon} size={24} color={t.accentStrong} />
        </Animated.View>
      </View>
      <Text style={[styles.label, { color, fontWeight: isActive ? '700' : '500' }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ activeTab, onTabChange, t }: TabBarProps) {
  function handlePress(id: TabName) {
    if (id !== activeTab) {
      H.selectionAsync();
    }
    onTabChange(id);
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      {TABS.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={isActive}
            onPress={() => handlePress(tab.id)}
            t={t}
          />
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
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  iconSlot: {
    width: 24,
    height: 24,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
