import { Image, StyleSheet, Text, View } from "react-native";
import { GAME_BRAND } from "../../../../../lib/lore";
import { palette } from "../../theme/tokens";

export function BrandHero({
  eyebrow,
  title,
  subtitle,
  compact = false,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Image source={require("../../assets/images/logo-gaucho-puro.png")} style={[styles.logo, compact ? styles.logoCompact : null]} resizeMode="contain" />
      <View style={styles.texts}>
        {eyebrow ? <Text style={[styles.eyebrow, compact ? styles.eyebrowCompact : null]}>{eyebrow}</Text> : null}
        <Text style={[styles.brand, compact ? styles.brandCompact : null]}>{title ?? GAME_BRAND}</Text>
        {subtitle ? <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  wrapCompact: {
    gap: 10,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 999,
  },
  logoCompact: {
    width: 54,
    height: 54,
  },
  texts: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: palette.gold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  eyebrowCompact: {
    fontSize: 9,
    letterSpacing: 1.3,
  },
  brand: {
    color: palette.parchment,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },
  brandCompact: {
    fontSize: 22,
    lineHeight: 24,
  },
  subtitle: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
});
