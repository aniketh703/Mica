import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export function Screen({
  children,
  contentContainerStyle,
}: ScreenProps): JSX.Element {
  const {theme} = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
});
