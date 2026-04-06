import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import type { ModoJuego } from "../../../../../motor/tipos";
import { RoomCard } from "../../components/lobby/RoomCard";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const presets = [
  { title: "Duelo", mode: "individual" as ModoJuego, maxPlayers: 2, icon: "⚔" },
  { title: "Triada", mode: "individual" as ModoJuego, maxPlayers: 3, icon: "◈" },
  { title: "Consejo", mode: "individual" as ModoJuego, maxPlayers: 4, icon: "◍" },
  { title: "Alianzas", mode: "alianzas" as ModoJuego, maxPlayers: 4, icon: "✦" },
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
  const wide = width >= 900 && width > height;
  const profile = useProfileStore((state) => state.profile);
  const { connection, currentRoom, error, roomList, setError } = useMobileGameStore();
  const [roomName, setRoomName] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (currentRoom?.id) {
      router.replace(`/sala/${currentRoom.id}`);
    }
  }, [currentRoom]);

  const rooms = useMemo(() => roomList.filter((room) => room.estado !== "finished"), [roomList]);

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
          <SectionCard eyebrow="Online" title="Acciones">
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{estadoConexionLabel(connection)}</Text>
              </View>
              <Text style={styles.statusMeta}>{profile?.displayName || "Jugador"}</Text>
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
                <Tile key={item.title} icon={item.icon} title={`Crear ${item.title}`} subtitle={`${item.mode === "alianzas" ? "Equipos" : "Individual"} · ${item.maxPlayers} jugadores`} onPress={() => void createRoom(item.mode, item.maxPlayers)} />
              ))}
            </View>
          </SectionCard>
        </View>

        <View style={styles.sideColumn}>
          <SectionCard eyebrow="Salas" title="Activas">
            {rooms.length === 0 ? (
              <Text style={styles.emptyCopy}>No hay salas disponibles todavia.</Text>
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
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1,
    gap: spacing.md,
  },
  sideColumn: {
    flex: 1,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(212,160,23,0.12)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  statusText: {
    color: palette.parchment,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusMeta: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "600",
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
