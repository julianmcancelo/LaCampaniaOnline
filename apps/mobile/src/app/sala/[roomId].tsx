import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { AvailableAction, BattleAction, BattleActionType } from "../../../../../motor/tipos";
import { MesaTactica } from "../../components/game/MesaTactica";
import { InvitePanel } from "../../components/lobby/InvitePanel";
import { resolveGameViewport } from "../../components/game/viewport";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { crearAccionSimple, etiquetaAccion } from "../../lib/acciones";
import { getSocketUrl, obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

export default function PantallaSala() {
  const { width, height } = useWindowDimensions();
  const viewport = resolveGameViewport(width, height);
  const params = useLocalSearchParams<{ roomId: string }>();
  const profile = useProfileStore((state) => state.profile);
  const { connection, transport, currentRoom, gameView, playerId, error, setError, resetRoomState } = useMobileGameStore();
  const recordOnlineMatch = useProfileStore((state) => state.recordOnlineMatch);
  const battle = gameView?.battle ?? null;
  const room = gameView?.room ?? currentRoom;
  const match = gameView?.match ?? null;
  const availableActions = gameView?.availableActions ?? [];
  const recordedMatchKey = useRef<string | null>(null);
  const endpoint = useMemo(() => {
    try {
      return new URL(getSocketUrl()).host;
    } catch {
      return getSocketUrl();
    }
  }, []);
  const meInRoom = room?.players.find((player) => player.playerId === playerId) ?? null;

  useEffect(() => {
    if (!room?.id) {
      router.replace("/online" as never);
      return;
    }

    if (params.roomId && room.id !== params.roomId) {
      router.replace(`/sala/${room.id}`);
    }
  }, [params.roomId, room]);

  useEffect(() => {
    if (!match || !playerId) {
      return;
    }

    const winnerKey = match.winnerPlayerId ? `player:${match.winnerPlayerId}` : match.winnerTeamId ? `team:${match.winnerTeamId}` : null;
    if (!winnerKey) {
      return;
    }

    const currentKey = `${match.matchId}:${winnerKey}`;
    if (recordedMatchKey.current === currentKey) {
      return;
    }

    const me = match.players.find((player) => player.playerId === playerId);
    const won = match.winnerPlayerId ? match.winnerPlayerId === playerId : Boolean(me?.teamId && match.winnerTeamId === me.teamId);
    recordedMatchKey.current = currentKey;
    void recordOnlineMatch(won ? "win" : "loss");
  }, [match, playerId, recordOnlineMatch]);

  async function ejecutarAccion(action: AvailableAction) {
    const socket = await obtenerSocket();

    if (action.type === "SET_READY") {
      socket.emit("room:setReady", { ready: !(meInRoom?.isReady ?? false) });
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
    resetRoomState();
    router.replace("/online" as never);
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
    <Screen scroll={viewport.mode === "phonePortrait"} edgeToEdge={Boolean(battle)}>
      <SectionCard eyebrow="Mesa tactica" title={room.nombre}>
        <View style={styles.topbar}>
          <View style={styles.topMeta}>
            <ProfileAvatar
              size={40}
              displayName={profile?.displayName || "Jugador"}
              photoURL={profile?.photoURL}
              avatarKind={profile?.avatarKind ?? "crest"}
              crestId={profile?.crestId}
            />
            <View style={styles.topMetaText}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{room.modo === "alianzas" ? "Alianzas" : "Individual"}</Text>
              </View>
              <Text style={styles.metaText}>
                {room.players.length}/{room.maxJugadores} jugadores
              </Text>
              <Text style={styles.metaText}>
                {connection === "connected"
                  ? "Render activo"
                  : connection === "connecting"
                    ? "Conectando a Render"
                    : connection === "disconnected"
                      ? "Sin conexion"
                      : "Error de red"}
                {transport ? ` · ${transport}` : ""}
                {` · ${endpoint}`}
              </Text>
            </View>
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
              <Text style={styles.copy}>Marca que estas listo y, si sos host, inicia la partida cuando todos esten preparados.</Text>
              <View style={styles.stack}>
                {availableActions
                  .filter((action) => action.enabled && (action.type === "SET_READY" || action.type === "START_MATCH"))
                  .map((action) => (
                    <ActionButton
                      key={action.type}
                      label={action.type === "SET_READY" && meInRoom?.isReady ? "Quitar listo" : etiquetaAccion(action.type)}
                      onPress={() => void ejecutarAccion(action)}
                    />
                  ))}
              </View>
            </SectionCard>
          </View>

          <View style={styles.sideColumn}>
            <InvitePanel roomId={room.id} />
            <SectionCard eyebrow="Jugadores" title="Mesa armada">
              <View style={styles.stack}>
                {room.players.map((player) => (
                  <View key={player.playerId} style={styles.waitingPlayer}>
                    <ProfileAvatar
                      size={36}
                      displayName={player.displayName}
                      photoURL={player.playerId === profile?.uid ? profile.photoURL : null}
                      avatarKind={player.playerId === profile?.uid ? profile.avatarKind : "crest"}
                      crestId={player.playerId === profile?.uid ? profile.crestId : player.playerId}
                    />
                    <View style={styles.waitingPlayerText}>
                      <Text style={styles.waitingName}>
                        {player.displayName}
                        {player.playerId === playerId ? " · Vos" : ""}
                      </Text>
                      <Text style={styles.waitingMeta}>
                        {player.isReady ? "Listo" : "Esperando"} · {player.connected ? "Conectado" : "Desconectado"}
                      </Text>
                    </View>
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
    gap: 10,
    flex: 1,
  },
  topMetaText: {
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: spacing.md,
  },
  waitingPlayerText: {
    flex: 1,
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
