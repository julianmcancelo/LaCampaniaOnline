import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { palette, radius, spacing } from "../../theme/tokens";

export function ActionButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
  icon?: ReactNode;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "secondary" ? styles.secondary : styles.primary,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon}
      <Text style={[styles.label, tone === "secondary" ? styles.labelSecondary : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primary: {
    backgroundColor: palette.gold,
  },
  secondary: {
    backgroundColor: "rgba(255, 244, 226, 0.06)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    color: "#4f3714",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  labelSecondary: {
    color: palette.parchment,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
});
