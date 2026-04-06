import { StyleSheet, Text, View } from "react-native";
import type { OpponentBattleView, PlayerBattleState } from "../../../../../motor/tipos";
import { CASTLE_LABEL } from "../../../../../lib/lore";
import { palette, radius, spacing } from "../../theme/tokens";

type Participante = PlayerBattleState | OpponentBattleView;

function esPropio(jugador: Participante): jugador is PlayerBattleState {
  return "hand" in jugador;
}

export function FichaJugador({
  jugador,
  activo = false,
  propio = false,
}: {
  jugador: Participante;
  activo?: boolean;
  propio?: boolean;
}) {
  return (
    <View style={[styles.card, activo ? styles.activo : null]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.nombre}>
            {jugador.displayName}
            {propio ? " · Vos" : ""}
          </Text>
          <Text style={styles.estadoBatalla}>{jugador.eliminated ? "Caido" : "En la rodada"}</Text>
        </View>
        <Text style={[styles.estadoConexion, jugador.connected ? styles.conectado : styles.desconectado]}>
          {jugador.connected ? "Online" : "Offline"}
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Campo</Text>
          <Text style={styles.metricValue}>{jugador.field.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Mano</Text>
          <Text style={styles.metricValue}>{esPropio(jugador) ? jugador.hand.length : jugador.cardCount}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{CASTLE_LABEL}</Text>
          <Text style={styles.metricValue}>
            {jugador.castle.oroConstruido}/{jugador.castle.objetivo}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.12)",
    gap: 8,
  },
  activo: {
    borderColor: palette.borderStrong,
    backgroundColor: "rgba(212,160,23,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  estadoBatalla: {
    color: palette.textMuted,
    fontSize: 11,
  },
  estadoConexion: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  conectado: {
    color: palette.success,
  },
  desconectado: {
    color: palette.danger,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: 2,
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metricValue: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
});
