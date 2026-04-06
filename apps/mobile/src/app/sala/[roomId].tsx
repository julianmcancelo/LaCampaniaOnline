import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AvailableAction, BattleAction, BattleActionType } from "../../../../../motor/tipos";
import { MesaTactica } from "../../components/game/MesaTactica";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { crearAccionSimple, etiquetaAccion } from "../../lib/acciones";
import { obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { palette, radius, spacing } from "../../theme/tokens";

export default function PantallaSala() {
  const params = useLocalSearchParams<{ roomId: string }>();
  const { currentRoom, gameView, playerId, error, setError } = useMobileGameStore();
  const battle = gameView?.battle ?? null;
  const room = gameView?.room ?? currentRoom;
  const match = gameView?.match ?? null;
  const availableActions = gameView?.availableActions ?? [];

  useEffect(() => {
    if (!room?.id) {
      router.replace("/(tabs)/jugar");
      return;
    }

    if (params.roomId && room.id !== params.roomId) {
      router.replace(`/sala/${room.id}`);
    }
  }, [params.roomId, room]);

  async function ejecutarAccion(action: AvailableAction) {
    const socket = await obtenerSocket();

    if (action.type === "SET_READY") {
      socket.emit("room:setReady", { ready: true });
      return;
    }

    if (action.type === "START_MATCH") {
      socket.emit("match:start");
      return;
    }

    const battleAction = crearAccionSimple(action.type as BattleActionType);
    if (battleAction) {
      socket.emit("battle:action", battleAction);
    }
  }

  async function ejecutarAccionBatalla(action: BattleAction) {
    const socket = await obtenerSocket();
    socket.emit("battle:action", action);
  }

  async function salirSala() {
    const socket = await obtenerSocket();
    socket.emit("room:leave");
    router.replace("/(tabs)/jugar");
  }

  if (!room) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.placeholderTitle}>Buscando sala</Text>
          <Text style={styles.placeholderCopy}>Espera un instante mientras resincronizamos el estado.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionCard eyebrow="Mesa tactica" title={room.nombre}>
        <View style={styles.topbar}>
          <View style={styles.topMeta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{room.modo === "alianzas" ? "Alianzas" : "Individual"}</Text>
            </View>
            <Text style={styles.metaText}>
              {room.players.length}/{room.maxJugadores} jugadores
            </Text>
          </View>
          <ActionButton label="Salir" onPress={() => void salirSala()} tone="secondary" />
        </View>
      </SectionCard>

      {battle ? (
        <MesaTactica
          battleView={battle}
          scorePlayers={match?.players ?? []}
          scoreByPlayer={match?.scoreByPlayer ?? {}}
          privateSpyView={gameView?.privateContext.spyView ?? null}
          error={error}
          onClearError={() => setError(null)}
          onAction={(action) => void ejecutarAccionBatalla(action)}
          onExit={() => void salirSala()}
          mode="online"
        />
      ) : (
        <View style={styles.workspace}>
          <View style={styles.mainColumn}>
            <SectionCard eyebrow="Sala de espera" title="Preparando el match">
              <Text style={styles.copy}>
                Marca que estas listo y, si sos host, inicia la partida cuando todos esten preparados.
              </Text>
              <View style={styles.stack}>
                {availableActions
                  .filter((action) => action.enabled && (action.type === "SET_READY" || action.type === "START_MATCH"))
                  .map((action) => (
                    <ActionButton
                      key={action.type}
                      label={etiquetaAccion(action.type)}
                      onPress={() => void ejecutarAccion(action)}
                    />
                  ))}
              </View>
            </SectionCard>
          </View>

          <View style={styles.sideColumn}>
            <SectionCard eyebrow="Jugadores" title="Mesa armada">
              <View style={styles.stack}>
                {room.players.map((player) => (
                  <View key={player.playerId} style={styles.waitingPlayer}>
                    <Text style={styles.waitingName}>
                      {player.displayName}
                      {player.playerId === playerId ? " · Vos" : ""}
                    </Text>
                    <Text style={styles.waitingMeta}>
                      {player.isReady ? "Listo" : "Esperando"} · {player.connected ? "Conectado" : "Desconectado"}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </View>
        </View>
      )}
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
  },
  placeholderCopy: {
    color: palette.textSoft,
    fontSize: 14,
    textAlign: "center",
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: "rgba(212,160,23,0.12)",
  },
  badgeText: {
    color: palette.parchment,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaText: {
    color: palette.textSoft,
    fontSize: 12,
  },
  workspace: {
    gap: spacing.md,
  },
  mainColumn: {
    gap: spacing.md,
  },
  sideColumn: {
    gap: spacing.md,
  },
  copy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  stack: {
    gap: spacing.sm,
  },
  waitingPlayer: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: spacing.md,
    gap: 4,
  },
  waitingName: {
    color: palette.parchment,
    fontSize: 15,
    fontWeight: "700",
  },
  waitingMeta: {
    color: palette.textSoft,
    fontSize: 12,
  },
});
