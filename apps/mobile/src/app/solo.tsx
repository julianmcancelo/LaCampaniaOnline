import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { MesaTactica } from "../components/game/MesaTactica";
import { resolveGameViewport } from "../components/game/viewport";
import { Screen } from "../components/ui/Screen";
import { decidirAccionCpu } from "../lib/solo/cpu";
import { construirVistaLocal, type DificultadCpu } from "../lib/solo/tipos";
import { useProfileStore } from "../store/profile-store";
import { useSoloStore } from "../store/solo-store";
import { palette, spacing } from "../theme/tokens";

export default function PantallaSolo() {
  const { width, height } = useWindowDimensions();
  const viewport = resolveGameViewport(width, height);
  const scroll = viewport.mode !== "tabletLandscape";
  const params = useLocalSearchParams<{ dificultad?: DificultadCpu }>();
  const profile = useProfileStore((state) => state.profile);
  const recordLocalMatch = useProfileStore((state) => state.recordLocalMatch);
  const { estado, iniciar, aplicar, cerrar, error, limpiarError } = useSoloStore();
  const recordedMatchEnd = useRef(false);

  useEffect(() => {
    if (!estado && profile) {
      iniciar(profile.displayName || "Jugador", params.dificultad ?? profile.preferencias.lastCpuDifficulty);
    }
  }, [profile, estado, iniciar, params.dificultad]);

  useEffect(() => {
    if (!estado?.match.currentBattle) {
      return;
    }
    const action = decidirAccionCpu(estado.match, estado.cpuPlayerId, estado.dificultad);
    if (!action) {
      return;
    }
    const timer = setTimeout(() => {
      aplicar(estado.cpuPlayerId, action);
    }, estado.match.currentBattle.activePlayerId === estado.cpuPlayerId ? 650 : 350);

    return () => clearTimeout(timer);
  }, [estado, aplicar]);

  useEffect(() => {
    if (!estado?.match || !estado.match.winnerPlayerId) {
      return;
    }

    if (!recordedMatchEnd.current) {
      recordedMatchEnd.current = true;
      void recordLocalMatch(estado.match.winnerPlayerId === estado.playerId ? "win" : "loss", estado.dificultad);
    }
  }, [estado, recordLocalMatch]);

  const battle = estado ? construirVistaLocal(estado.match, estado.playerId) : null;
  const match = estado?.match ?? null;
  const spyView = battle?.me.pendingSpy ?? null;

  if (!estado || !battle || !match) {
    return (
      <Screen scroll={scroll} edgeToEdge>
        <View style={styles.center}>
          <Text style={styles.placeholderTitle}>Preparando rival automático</Text>
          <Text style={styles.placeholderCopy}>Armando la partida local nativa.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={scroll} edgeToEdge>
      <MesaTactica
        battleView={battle}
        scorePlayers={match.players}
        scoreByPlayer={match.scoreByPlayer}
        privateSpyView={spyView}
        error={error}
        onClearError={limpiarError}
        onAction={(action) => aplicar(estado.playerId, action)}
        onExit={() => {
          cerrar();
          router.replace("/local" as never);
        }}
        mode="solo"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  placeholderTitle: {
    color: palette.parchment,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  placeholderCopy: {
    color: palette.textSoft,
    fontSize: 15,
    textAlign: "center",
  },
});
