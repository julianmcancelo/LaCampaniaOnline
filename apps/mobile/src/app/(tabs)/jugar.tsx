import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import type { ModoJuego } from "../../../../../motor/tipos";
import { RoomCard } from "../../components/lobby/RoomCard";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import type { DificultadCpu } from "../../lib/solo/tipos";
import { obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { useProfileStore } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const presets = [
  { titulo: "Duelo", modo: "individual" as ModoJuego, maxJugadores: 2 },
  { titulo: "Tríada", modo: "individual" as ModoJuego, maxJugadores: 3 },
  { titulo: "Consejo", modo: "individual" as ModoJuego, maxJugadores: 4 },
  { titulo: "Alianzas", modo: "alianzas" as ModoJuego, maxJugadores: 4 },
];

const cpuModes: Array<{ titulo: string; dificultad: DificultadCpu; detalle: string }> = [
  { titulo: "CPU Recluta", dificultad: "recluta", detalle: "Más tranquila para aprender." },
  { titulo: "CPU Capitán", dificultad: "capitan", detalle: "Ritmo equilibrado y consistente." },
  { titulo: "CPU General", dificultad: "general", detalle: "Más presión sobre ataque y castillo." },
];

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

export default function PantallaJugar() {
  const { width, height } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const setLastCpuDifficulty = useProfileStore((state) => state.setLastCpuDifficulty);
  const { connection, currentRoom, error, roomList, setError } = useMobileGameStore();
  const [nombreSala, setNombreSala] = useState("");
  const [uniendoseA, setUniendoseA] = useState<string | null>(null);
  const esHorizontal = width > height;

  useEffect(() => {
    if (currentRoom?.id) {
      router.replace(`/sala/${currentRoom.id}`);
    }
  }, [currentRoom]);

  const salasAbiertas = useMemo(() => roomList.filter((room) => room.estado !== "finished"), [roomList]);

  async function crearSala(modo: ModoJuego, maxJugadores: number) {
    if (!profile?.displayName.trim()) {
      setError("Primero completá tu nombre en la app.");
      router.push("/onboarding");
      return;
    }

    const socket = await obtenerSocket();
    socket.emit("room:create", {
      roomName: nombreSala.trim() || `Sala ${maxJugadores} jugadores`,
      displayName: profile.displayName.trim(),
      mode: modo,
      maxPlayers: maxJugadores,
    });
  }

  async function unirseASala(roomId: string) {
    if (!profile?.displayName.trim()) {
      setError("Primero completá tu nombre en la app.");
      router.push("/onboarding");
      return;
    }

    setUniendoseA(roomId);
    const socket = await obtenerSocket();
    socket.emit("room:join", {
      roomId,
      displayName: profile.displayName.trim(),
    });
    setTimeout(() => setUniendoseA((value) => (value === roomId ? null : value)), 1200);
  }

  async function abrirModoCpu(dificultad: DificultadCpu) {
    await setLastCpuDifficulty(dificultad);
    router.push({
      pathname: "/solo",
      params: { dificultad },
    });
  }

  return (
    <Screen scroll>
      <SectionCard eyebrow="Centro de juego" title="Jugar">
        <View style={styles.heroRow}>
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionText}>{estadoConexionLabel(connection)}</Text>
          </View>
          <Text style={styles.metaText}>{profile?.displayName || "Jugador"}</Text>
        </View>
        <Text style={styles.heroCopy}>
          Elegí cómo querés jugar. La app está preparada para partidas locales, sesiones online y continuidad de perfil.
        </Text>
      </SectionCard>

      <View style={[styles.columns, esHorizontal ? styles.columnsHorizontal : null]}>
        <View style={styles.column}>
          <SectionCard eyebrow="Acción principal" title="Contra la computadora">
            <View style={styles.compactList}>
              {cpuModes.map((mode) => (
                <Pressable
                  key={mode.dificultad}
                  onPress={() => void abrirModoCpu(mode.dificultad)}
                  style={({ pressed }) => [styles.compactCard, pressed ? styles.presetPressed : null]}
                >
                  <Text style={styles.compactTitle}>{mode.titulo}</Text>
                  <Text style={styles.compactMeta}>{mode.detalle}</Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>

          <SectionCard eyebrow="Online" title="Crear sala">
            <TextInput
              value={nombreSala}
              onChangeText={setNombreSala}
              placeholder="Nombre opcional de sala"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              autoCapitalize="sentences"
            />
            <View style={styles.compactList}>
              {presets.map((preset) => (
                <Pressable
                  key={preset.titulo}
                  onPress={() => void crearSala(preset.modo, preset.maxJugadores)}
                  style={({ pressed }) => [styles.compactCard, pressed ? styles.presetPressed : null]}
                >
                  <Text style={styles.compactTitle}>{preset.titulo}</Text>
                  <Text style={styles.compactMeta}>
                    {preset.modo === "alianzas" ? "Equipos" : "Individual"} · {preset.maxJugadores} jugadores
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        </View>

        <View style={styles.column}>
          <SectionCard eyebrow="Online" title="Salas activas">
            {salasAbiertas.length === 0 ? (
              <Text style={styles.emptyCopy}>Todavía no hay salas disponibles.</Text>
            ) : (
              <View style={styles.roomList}>
                {salasAbiertas.map((room) => (
                  <View key={room.id} style={styles.roomRow}>
                    <RoomCard room={room} onJoin={() => void unirseASala(room.id)} />
                    <ActionButton
                      label={uniendoseA === room.id ? "Entrando..." : "Entrar"}
                      onPress={() => void unirseASala(room.id)}
                      disabled={uniendoseA === room.id}
                    />
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
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  connectionBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(212,160,23,0.12)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  connectionText: {
    color: palette.parchment,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metaText: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  heroCopy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  columns: {
    gap: spacing.md,
  },
  columnsHorizontal: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: spacing.md,
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
  compactList: {
    gap: 10,
  },
  compactCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 2,
  },
  presetPressed: {
    opacity: 0.9,
  },
  compactTitle: {
    color: palette.parchment,
    fontSize: 15,
    fontWeight: "700",
  },
  compactMeta: {
    color: palette.textSoft,
    fontSize: 12,
    lineHeight: 18,
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
    borderRadius: 14,
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
