import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RoomSummary } from "../../../../../motor/tipos";
import { palette, radius, spacing } from "../../theme/tokens";

function modeLabel(room: RoomSummary): string {
  return room.modo === "alianzas" ? "Alianzas" : "Individual";
}

export function RoomCard({ room, onJoin }: { room: RoomSummary; onJoin: () => void }) {
  return (
    <Pressable onPress={onJoin} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{room.nombre}</Text>
          <Text style={styles.meta}>
            {modeLabel(room)} · {room.players.length}/{room.maxJugadores}
          </Text>
        </View>
        <View style={[styles.badge, room.estado === "playing" ? styles.badgePlaying : styles.badgeWaiting]}>
          <Text style={styles.badgeLabel}>{room.estado === "playing" ? "Jugando" : "Sala"}</Text>
        </View>
      </View>

      <View style={styles.players}>
        {room.players.map((player) => (
          <View key={player.playerId} style={styles.playerPill}>
            <Text style={styles.playerText}>
              {player.displayName}
              {player.isHost ? " · Host" : ""}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: "rgba(255, 249, 240, 0.07)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: palette.parchment,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: palette.textSoft,
    fontSize: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeWaiting: {
    backgroundColor: "rgba(212, 160, 23, 0.16)",
  },
  badgePlaying: {
    backgroundColor: "rgba(95, 181, 141, 0.18)",
  },
  badgeLabel: {
    color: palette.parchment,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  players: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  playerPill: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  playerText: {
    color: palette.textSoft,
    fontSize: 11,
  },
});
