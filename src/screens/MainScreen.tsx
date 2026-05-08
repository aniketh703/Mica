import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { PremiumProvider } from '../context/PremiumContext';
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
    <PremiumProvider>
      <View style={[styles.root, { backgroundColor: t.background }]}>
        {activeTab === 'home' && <HomeScreen navigation={navigation} />}
        {activeTab === 'events' && <EventsScreen navigation={navigation} />}
        {activeTab === 'settings' && <SettingsScreen navigation={navigation} />}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />
      </View>
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
