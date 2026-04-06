import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";
import type { DificultadLocal } from "../../store/profile-store";

const difficulties: Array<{ title: string; difficulty: DificultadLocal; icon: string }> = [
  { title: "Recluta", difficulty: "recluta", icon: "◌" },
  { title: "Capitan", difficulty: "capitan", icon: "◈" },
  { title: "General", difficulty: "general", icon: "✦" },
];

function Tile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <View style={styles.tileText}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function PantallaLocal() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 900 && width > height;
  const profile = useProfileStore((state) => state.profile);
  const setLastCpuDifficulty = useProfileStore((state) => state.setLastCpuDifficulty);

  async function abrirSolo(difficulty: DificultadLocal) {
    await setLastCpuDifficulty(difficulty);
    router.push({ pathname: "/solo", params: { dificultad: difficulty } });
  }

  return (
    <Screen>
      <View style={[styles.wrap, wide ? styles.wrapHorizontal : null]}>
        <SectionCard eyebrow="Local" title="Partida rapida">
          <View style={styles.tileList}>
            <Tile icon="▶" title="Nueva partida" subtitle="Arranca una batalla local contra la CPU." onPress={() => void abrirSolo(profile?.preferencias.lastCpuDifficulty ?? "capitan")} />
            <Tile icon="↺" title="Continuar" subtitle="Retoma la dificultad que venias usando." onPress={() => void abrirSolo(profile?.preferencias.lastCpuDifficulty ?? "capitan")} />
          </View>
        </SectionCard>

        <SectionCard eyebrow="CPU" title="Dificultad">
          <View style={styles.tileList}>
            {difficulties.map((item) => (
              <Tile key={item.difficulty} icon={item.icon} title={item.title} subtitle="Abrir partida con esta dificultad." onPress={() => void abrirSolo(item.difficulty)} />
            ))}
          </View>
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    flex: 1,
  },
  wrapHorizontal: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tileList: {
    gap: 10,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  tilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  tileIcon: {
    color: palette.goldSoft,
    fontSize: 22,
    width: 24,
    textAlign: "center",
  },
  tileText: {
    flex: 1,
    gap: 2,
  },
  tileTitle: {
    color: palette.parchment,
    fontSize: 15,
    fontWeight: "700",
  },
  tileSubtitle: {
    color: palette.textSoft,
    fontSize: 12,
    lineHeight: 17,
  },
});
