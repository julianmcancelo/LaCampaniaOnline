import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, radius, spacing } from "../../theme/tokens";

export function SectionCard({
  eyebrow,
  title,
  compact = false,
  children,
}: PropsWithChildren<{ eyebrow?: string; title?: string; compact?: boolean }>) {
  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      {eyebrow ? <Text style={[styles.eyebrow, compact ? styles.eyebrowCompact : null]}>{eyebrow}</Text> : null}
      {title ? <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: "rgba(23, 16, 12, 0.78)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
    overflow: "hidden",
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 6,
  },
  eyebrow: {
    color: palette.gold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  eyebrowCompact: {
    fontSize: 8,
    letterSpacing: 1,
  },
  title: {
    color: palette.parchment,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
});
