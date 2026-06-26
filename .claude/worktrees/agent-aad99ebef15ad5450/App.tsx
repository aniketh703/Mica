import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { mica, midnight } from './src/theme/palette';
import { RootStackParamList } from './src/types';
import MainScreen from './src/screens/MainScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import AddEventScreen from './src/screens/AddEventScreen';
import InviteScreen from './src/screens/InviteScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? midnight : mica;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: t.background } }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen
          name="EventDetail"
          options={{ presentation: 'card' }}
        >
          {props => <EventDetailScreen {...props} t={t} />}
        </Stack.Screen>
        <Stack.Screen
          name="AddEvent"
          options={{ presentation: 'modal' }}
        >
          {props => <AddEventScreen {...props} t={t} />}
        </Stack.Screen>
        <Stack.Screen
          name="Invite"
          options={{ presentation: 'card' }}
        >
          {props => <InviteScreen {...props} t={t} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
