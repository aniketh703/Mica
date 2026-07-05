// Shared color-swatch picker: a row of tappable color circles with a
// press-bounce animation and an accent-colored selection ring. Previously
// implemented independently in AddEventScreen (with animation + a 44px touch
// target) and OnboardingScreen (plain, no animation, smaller touch target,
// hardcoded white selection border) — consolidated here so both get the same
// polish and stay in sync.
import React, { useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';

function Swatch({
  color, isSelected, onPress, reduceMotion, t,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
  reduceMotion: boolean;
  t: Theme;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  function handlePress() {
    onPress();
    if (!reduceMotion) {
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 75, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 75, useNativeDriver: true }),
      ]).start();
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.outer,
        { borderColor: isSelected ? t.accentStrong : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View style={[styles.swatch, { backgroundColor: color, transform: [{ scale }] }]} />
    </TouchableOpacity>
  );
}

type ColorSwatchPickerProps = {
  colors: readonly string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  reduceMotion: boolean;
  t: Theme;
};

export default function ColorSwatchPicker({
  colors, selectedColor, onSelect, reduceMotion, t,
}: ColorSwatchPickerProps) {
  return (
    <View style={styles.row}>
      {colors.map(c => (
        <Swatch
          key={c}
          color={c}
          isSelected={selectedColor === c}
          onPress={() => onSelect(c)}
          reduceMotion={reduceMotion}
          t={t}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  outer: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  swatch:{ width: 34, height: 34, borderRadius: 17 },
});
