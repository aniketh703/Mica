// Shared empty-state card: emoji + muted message + accent action.
// Previously implemented independently in HomeScreen and EventsScreen with
// near-identical markup — consolidated here so both stay in sync.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../theme/palette';

type EmptyStateProps = {
  t: Theme;
  title: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
  // When true, the whole card is one touch target (Home's spotlight-card
  // style); when false, only the action text itself is tappable (Events'
  // style, used when the action isn't always shown).
  wholeCardPressable?: boolean;
};

export default function EmptyState({
  t, title, emoji = '📅', actionLabel, onAction, wholeCardPressable = false,
}: EmptyStateProps) {
  const content = (
    <>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: t.textMuted }]}>{title}</Text>
      {actionLabel && !wholeCardPressable && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action, { color: t.accentStrong }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {actionLabel && wholeCardPressable && (
        <Text style={[styles.action, { color: t.accentStrong }]}>{actionLabel}</Text>
      )}
    </>
  );

  if (wholeCardPressable) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={onAction}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card:   { borderRadius: 24, padding: 28, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 6 },
  emoji:  { fontSize: 32, marginBottom: 4 },
  title:  { fontSize: 15, fontWeight: '500' },
  action: { fontSize: 15, fontWeight: '700', marginTop: 4 },
});
