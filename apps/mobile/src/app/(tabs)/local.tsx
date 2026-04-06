import { Redirect, router } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { resolveGameViewport } from "../../components/game/viewport";
import { BrandHero } from "../../components/ui/BrandHero";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import type { DificultadLocal } from "../../store/profile-store";
import { reachedAnonymousLimit, useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const difficulties: Array<{ title: string; difficulty: DificultadLocal; icon: string }> = [
  { title: "Recluta", difficulty: "recluta", icon: "R" },
  { title: "Capitan", difficulty: "capitan", icon: "C" },
  { title: "General", difficulty: "general", icon: "G" },
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
  const viewport = resolveGameViewport(width, height);
  const wide = viewport.mode === "tabletLandscape";
  const authStatus = useProfileStore((state) => state.authStatus);
  const profile = useProfileStore((state) => state.profile);
  const setLastCpuDifficulty = useProfileStore((state) => state.setLastCpuDifficulty);

  if (authStatus !== "authenticated" || reachedAnonymousLimit(profile)) {
    return <Redirect href={"/acceso" as never} />;
  }

  async function abrirSolo(difficulty: DificultadLocal) {
    await setLastCpuDifficulty(difficulty);
    router.push({ pathname: "/solo", params: { dificultad: difficulty } });
  }

  return (
    <Screen scroll={!wide}>
      <View style={[styles.wrap, wide ? styles.wrapHorizontal : null]}>
        <View style={styles.heroBox}>
          <BrandHero
            eyebrow="Rodada local"
            title="Sangre y Plata"
            subtitle="Entrena en el campo, proba dificultades y afila tu rueda antes del duelo online."
            compact={!wide}
          />
        </View>

        <View style={[styles.panel, wide ? styles.panelWide : null]}>
          <SectionCard eyebrow="Local" title="Partida rapida">
            <View style={styles.tileList}>
              <Tile
                icon=">"
                title="Nueva partida"
                subtitle="Arranca una batalla local contra la CPU."
                onPress={() => void abrirSolo(profile?.preferencias.lastCpuDifficulty ?? "capitan")}
              />
              <Tile
                icon="~"
                title="Continuar"
                subtitle="Retoma la ultima dificultad que venias usando."
                onPress={() => void abrirSolo(profile?.preferencias.lastCpuDifficulty ?? "capitan")}
              />
            </View>
          </SectionCard>
        </View>

        <View style={[styles.panel, wide ? styles.panelWide : null]}>
          <SectionCard eyebrow="CPU" title="Dificultad">
            <View style={styles.tileList}>
              {difficulties.map((item) => (
                <Tile
                  key={item.difficulty}
                  icon={item.icon}
                  title={item.title}
                  subtitle="Abrir partida con esta dificultad."
                  onPress={() => void abrirSolo(item.difficulty)}
                />
              ))}
            </View>
          </SectionCard>
        </View>
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
    flexWrap: "wrap",
  },
  heroBox: {
    width: "100%",
    marginBottom: 2,
  },
  panel: {
    width: "100%",
  },
  panelWide: {
    flex: 1,
    minWidth: 0,
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
    backgroundColor: "rgba(255,255,255,0.04)",
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
