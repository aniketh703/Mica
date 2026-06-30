import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { TabName, RootStackParamList } from '../types';
import TabBar from '../components/TabBar';
import HomeScreen from './HomeScreen';
import EventsScreen from './EventsScreen';
import SettingsScreen from './SettingsScreen';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
};

export default function MainScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const t = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Keep all tabs mounted (display:none when inactive) so scroll position
          and local state survive switching tabs, instead of remounting. */}
      <View style={activeTab === 'home' ? styles.tabPane : styles.hidden}>
        <HomeScreen navigation={navigation} />
      </View>
      <View style={activeTab === 'events' ? styles.tabPane : styles.hidden}>
        <EventsScreen navigation={navigation} />
      </View>
      <View style={activeTab === 'settings' ? styles.tabPane : styles.hidden}>
        <SettingsScreen navigation={navigation} />
      </View>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabPane: { flex: 1 },
  hidden: { display: 'none' },
});
