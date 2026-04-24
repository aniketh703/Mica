import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {ThemeProvider, useTheme} from './src/theme/ThemeProvider';

function AppShell(): JSX.Element {
  const {theme, statusBarStyle} = useTheme();

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
