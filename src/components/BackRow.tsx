// Shared "go back" navigation row: chevron + label. Previously implemented
// independently in EventDetailScreen and InviteScreen with slightly different
// markup (vector icon vs. text glyph) for the identical purpose.
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/palette';

type BackRowProps = {
  t: Theme;
  label: string;
  onPress: () => void;
};

export default function BackRow({ t, label, onPress }: BackRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={20} color={t.accentStrong} />
      <Text style={[styles.label, { color: t.accentStrong }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 15, fontWeight: '500' },
});
