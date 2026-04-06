import { StyleSheet, Text, View } from "react-native";
import type { BattleLogEntry } from "../../../../../motor/tipos";
import { palette, radius } from "../../theme/tokens";

function formatearHora(fecha: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

export function BitacoraBatalla({ eventos, limit = 6, compact = false }: { eventos: BattleLogEntry[]; limit?: number; compact?: boolean }) {
  const visibles = [...eventos].reverse().slice(0, limit);

  return (
    <View style={styles.wrap}>
      {visibles.map((evento, index) => (
        <View key={evento.id} style={[styles.item, compact ? styles.itemCompact : null, index === 0 ? styles.itemReciente : null]}>
          <View style={styles.header}>
            <Text style={[styles.etiqueta, compact ? styles.etiquetaCompact : null]}>{index === 0 ? "Ultima accion" : "Registro"}</Text>
            <Text style={[styles.hora, compact ? styles.horaCompact : null]}>{formatearHora(evento.createdAt)}</Text>
          </View>
          <Text style={[styles.texto, compact ? styles.textoCompact : null]}>{evento.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  item: {
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: "rgba(255,248,239,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.1)",
    gap: 4,
  },
  itemReciente: {
    borderColor: palette.borderStrong,
    backgroundColor: "rgba(212,160,23,0.1)",
  },
  itemCompact: {
    padding: 7,
    gap: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  etiqueta: {
    color: palette.gold,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  etiquetaCompact: {
    fontSize: 8,
    letterSpacing: 0.6,
  },
  hora: {
    color: palette.textMuted,
    fontSize: 10,
  },
  horaCompact: {
    fontSize: 8,
  },
  texto: {
    color: palette.parchment,
    fontSize: 12,
    lineHeight: 16,
  },
  textoCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
});
