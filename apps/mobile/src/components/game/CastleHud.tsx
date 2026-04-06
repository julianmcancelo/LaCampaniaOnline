import { StyleSheet, Text, View } from "react-native";
import type { OpponentBattleView, PlayerBattleState } from "../../../../../motor/tipos";
import { palette, radius } from "../../theme/tokens";

export function CastleHud({
  me,
  opponents,
  compact = false,
}: {
  me: PlayerBattleState;
  opponents: OpponentBattleView[];
  compact?: boolean;
}) {
  const seen = new Set<string>();
  const entries = [me, ...opponents]
    .map((player) => {
      const key = player.castle.ownerTeamId ? `team-${player.castle.ownerTeamId}` : `player-${player.playerId}`;
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);

      const allies = [me, ...opponents].filter((candidate) =>
        player.castle.ownerTeamId ? candidate.teamId === player.castle.ownerTeamId : candidate.playerId === player.playerId,
      );

      return {
        key,
        label: player.castle.ownerTeamId && allies.length > 1 ? `Alianza ${player.castle.ownerTeamId}` : player.displayName,
        progress: player.castle.oroConstruido,
        goal: player.castle.objetivo,
        remaining: Math.max(player.castle.objetivo - player.castle.oroConstruido, 0),
        relic: player.castle.reliquia?.valor ?? null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <View style={styles.wrap}>
      {entries.map((entry) => (
        <View key={entry.key} style={[styles.card, compact ? styles.cardCompact : null]}>
          <Text style={[styles.label, compact ? styles.labelCompact : null]} numberOfLines={1}>
            {entry.label}
          </Text>
          <Text style={[styles.progress, compact ? styles.progressCompact : null]}>{entry.progress}/{entry.goal}</Text>
          <Text style={[styles.meta, compact ? styles.metaCompact : null]}>{entry.relic ? `R${entry.relic}` : "SR"} · -{entry.remaining}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  card: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 249, 240, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(140, 107, 49, 0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardCompact: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 4,
  },
  label: {
    color: palette.textSoft,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
    flex: 1,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  progress: {
    color: palette.parchment,
    fontSize: 12,
    fontWeight: "800",
  },
  progressCompact: {
    fontSize: 11,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  metaCompact: {
    fontSize: 9,
  },
});
