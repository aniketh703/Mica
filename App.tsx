import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { RootStackParamList } from './src/types';
import { ThemeProvider } from './src/theme/ThemeContext';
import { migrateDatabase } from './src/db/database';
import { setupAndroidChannel } from './src/services/NotificationService';
import MainScreen from './src/screens/MainScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import AddEventScreen from './src/screens/AddEventScreen';
import InviteScreen from './src/screens/InviteScreen';
import SplashScreen from './src/screens/onboarding/SplashScreen';
import PitchScreen from './src/screens/onboarding/PitchScreen';
import AuthChoiceScreen from './src/screens/onboarding/AuthChoiceScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  React.useEffect(() => {
    setupAndroidChannel().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SQLiteProvider databaseName="mica.db" onInit={migrateDatabase}>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Pitch" component={PitchScreen} />
              <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Main" component={MainScreen} />
              <Stack.Screen
                name="EventDetail"
                component={EventDetailScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="AddEvent"
                component={AddEventScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Invite"
                component={InviteScreen}
                options={{ presentation: 'card' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
