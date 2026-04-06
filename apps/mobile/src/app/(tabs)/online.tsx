import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import type { ModoJuego } from "../../../../../motor/tipos";
import { resolveGameViewport } from "../../components/game/viewport";
import { RoomCard } from "../../components/lobby/RoomCard";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { getSocketUrl, obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const presets = [
  { title: "Duelo", mode: "individual" as ModoJuego, maxPlayers: 2, icon: "2P", enabled: true },
  { title: "Triada", mode: "individual" as ModoJuego, maxPlayers: 3, icon: "3P", enabled: false },
  { title: "Consejo", mode: "individual" as ModoJuego, maxPlayers: 4, icon: "4P", enabled: false },
  { title: "Alianzas", mode: "alianzas" as ModoJuego, maxPlayers: 4, icon: "4A", enabled: false },
];

function Tile({
  icon,
  title,
  subtitle,
  disabled,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tile, disabled ? styles.tileDisabled : null, pressed && !disabled ? styles.tilePressed : null]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <View style={styles.tileText}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSubtitle}>{subtitle}</Text>
      </View>
      {disabled ? (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Proximamente</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function estadoConexionLabel(estado: string): string {
  switch (estado) {
    case "connected":
      return "Conectado";
    case "disconnected":
      return "Desconectado";
    case "error":
      return "Error";
    default:
      return "Conectando";
  }
}

export default function PantallaOnline() {
  const { width, height } = useWindowDimensions();
  const viewport = resolveGameViewport(width, height);
  const wide = viewport.mode === "tabletLandscape";
  const profile = useProfileStore((state) => state.profile);
  const { connection, transport, currentRoom, error, roomList, setError } = useMobileGameStore();
  const [roomName, setRoomName] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const endpoint = useMemo(() => {
    try {
      return new URL(getSocketUrl()).host;
    } catch {
      return getSocketUrl();
    }
  }, []);

  useEffect(() => {
    if (currentRoom?.id) {
      router.replace(`/sala/${currentRoom.id}`);
    }
  }, [currentRoom]);

  const rooms = useMemo(
    () => roomList.filter((room) => room.estado !== "finished" && room.maxJugadores === 2 && room.modo === "individual"),
    [roomList],
  );

  async function createRoom(mode: ModoJuego, maxPlayers: number) {
    if (!profile?.displayName.trim()) {
      setError("Completa tu nombre antes de jugar online.");
      router.push("/onboarding");
      return;
    }
    const socket = await obtenerSocket();
    socket.emit("room:create", {
      roomName: roomName.trim() || `Sala ${maxPlayers} jugadores`,
      displayName: profile.displayName.trim(),
      mode,
      maxPlayers,
    });
  }

  async function joinRoom(roomId: string) {
    if (!profile?.displayName.trim()) {
      setError("Completa tu nombre antes de jugar online.");
      router.push("/onboarding");
      return;
    }

    setJoining(roomId);
    const socket = await obtenerSocket();
    socket.emit("room:join", { roomId, displayName: profile.displayName.trim() });
    setTimeout(() => setJoining((value) => (value === roomId ? null : value)), 1500);
  }

  return (
    <Screen scroll={!wide}>
      <View style={[styles.wrap, wide ? styles.wrapHorizontal : null]}>
        <View style={styles.mainColumn}>
          <SectionCard eyebrow="Online" title="Duelo en tiempo real">
            <View style={styles.statusRow}>
              <View style={styles.identity}>
                <ProfileAvatar
                  size={44}
                  displayName={profile?.displayName || "Jugador"}
                  photoURL={profile?.photoURL}
                  avatarKind={profile?.avatarKind ?? "crest"}
                  crestId={profile?.crestId}
                />
                <View style={styles.identityText}>
                  <Text style={styles.statusMeta}>{profile?.displayName || "Jugador"}</Text>
                  <Text style={styles.subtle}>Backend realtime activo sobre Render.</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, connection === "connected" ? styles.statusBadgeOk : null, connection === "error" ? styles.statusBadgeError : null]}>
                <Text style={styles.statusText}>{estadoConexionLabel(connection)}</Text>
              </View>
            </View>

            <View style={styles.networkRow}>
              <View style={styles.networkPill}>
                <Text style={styles.networkLabel}>Backend</Text>
                <Text style={styles.networkValue}>{endpoint}</Text>
              </View>
              <View style={styles.networkPill}>
                <Text style={styles.networkLabel}>Transporte</Text>
                <Text style={styles.networkValue}>{transport ?? "pendiente"}</Text>
              </View>
            </View>

            <TextInput
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Nombre opcional de sala"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              autoCapitalize="sentences"
            />

            <View style={styles.tileList}>
              {presets.map((item) => (
                <Tile
                  key={item.title}
                  icon={item.icon}
                  title={item.enabled ? `Crear ${item.title}` : item.title}
                  subtitle={item.enabled ? "Modo activo para mobile v1" : "Se habilita en una etapa posterior"}
                  disabled={!item.enabled}
                  onPress={() => void createRoom(item.mode, item.maxPlayers)}
                />
              ))}
            </View>
          </SectionCard>
        </View>

        <View style={styles.sideColumn}>
          <SectionCard eyebrow="Salas" title="Activas">
            {rooms.length === 0 ? (
              <Text style={styles.emptyCopy}>No hay duelos disponibles todavia.</Text>
            ) : (
              <View style={styles.roomList}>
                {rooms.map((room) => (
                  <View key={room.id} style={styles.roomRow}>
                    <RoomCard room={room} onJoin={() => void joinRoom(room.id)} />
                    <ActionButton label={joining === room.id ? "Entrando..." : "Entrar"} onPress={() => void joinRoom(room.id)} disabled={joining === room.id} />
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
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
    alignItems: "stretch",
  },
  mainColumn: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  sideColumn: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  subtle: {
    color: palette.textSoft,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(212,160,23,0.12)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  statusBadgeOk: {
    backgroundColor: "rgba(95,181,141,0.16)",
    borderColor: "rgba(95,181,141,0.4)",
  },
  statusBadgeError: {
    backgroundColor: "rgba(180,93,86,0.18)",
    borderColor: "rgba(180,93,86,0.42)",
  },
  statusText: {
    color: palette.parchment,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusMeta: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  networkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  networkPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 1,
  },
  networkLabel: {
    color: palette.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  networkValue: {
    color: palette.parchment,
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255, 248, 239, 0.05)",
    color: palette.parchment,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
  tileDisabled: {
    opacity: 0.65,
  },
  tilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  tileIcon: {
    color: palette.goldSoft,
    fontSize: 18,
    width: 26,
    textAlign: "center",
    fontWeight: "800",
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
  comingSoon: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  comingSoonText: {
    color: palette.textSoft,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  roomList: {
    gap: 10,
  },
  roomRow: {
    gap: 8,
  },
  emptyCopy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  errorBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(180,93,86,0.45)",
    backgroundColor: "rgba(180,93,86,0.12)",
    padding: 14,
  },
  errorText: {
    color: "#f1cbc7",
    fontSize: 13,
    lineHeight: 19,
  },
});
