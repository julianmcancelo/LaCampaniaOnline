import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, spacing } from "../../theme/tokens";

export function Screen({ children, scroll = false }: PropsWithChildren<{ scroll?: boolean }>) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width > 1100 ? spacing.xl : spacing.md;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
      style={styles.flex}
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );

  return (
    <LinearGradient colors={[palette.bg, "#0d1f17", "#10281d"]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.flex}>{content}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  inner: {
    gap: spacing.md,
  },
});
