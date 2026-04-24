import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {HomeScreen} from '../screens/HomeScreen';
import {EventsScreen} from '../screens/EventsScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {useTheme} from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();

export function AppNavigator(): JSX.Element {
  const {theme} = useTheme();

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.accentStrong,
        },
      }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            height: 68,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: theme.text,
          tabBarInactiveTintColor: theme.textMuted,
        }}>
        <Tab.Screen
          name="Today"
          component={HomeScreen}
          options={{
            tabBarIcon: ({color}) => <Text style={{color}}>○</Text>,
          }}
        />
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{
            tabBarIcon: ({color}) => <Text style={{color}}>◇</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({color}) => <Text style={{color}}>△</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
