import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { mica, midnight } from '../theme/palette';
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
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? midnight : mica;

  return (
    <View style={styles.root}>
      {activeTab === 'home' && <HomeScreen navigation={navigation} t={t} />}
      {activeTab === 'events' && <EventsScreen navigation={navigation} t={t} />}
      {activeTab === 'settings' && <SettingsScreen navigation={navigation} t={t} />}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
