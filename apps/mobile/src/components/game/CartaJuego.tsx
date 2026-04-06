import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Carta, UnitInPlay } from "../../../../../motor/tipos";
import { palette, radius, spacing } from "../../theme/tokens";

function tituloCarta(card: Carta): string {
  if (card.tipo === "guerrero") {
    return card.guerrero;
  }
  if (card.tipo === "especial") {
    return card.especial;
  }
  return card.nombre;
}

function subtituloCarta(card: Carta): string {
  if (card.tipo === "arma") {
    return `${card.arma} ${card.valor}`;
  }
  if (card.tipo === "oro") {
    return `Oro ${card.valor}`;
  }
  if (card.tipo === "especial") {
    return "Especial";
  }
  return "Guerrero";
}

function colorCarta(card: Carta): [string, string, string] {
  switch (card.tipo) {
    case "guerrero":
      return ["#fbf5e6", "#efe4cf", "#e6dac3"];
    case "arma":
      return ["#f5f2e6", "#ebe4d1", "#ddd2bf"];
    case "oro":
      return ["#fbf4db", "#f2e3aa", "#e4cd7d"];
    case "especial":
      return ["#f8eee7", "#ead4c8", "#dcc1b5"];
    default:
      return ["#fbf5e6", "#eee1c8", "#e0d1b7"];
  }
}

function AnimatedCardShell({
  selected,
  children,
}: {
  selected?: boolean;
  children: React.ReactNode;
}) {
  const translate = useRef(new Animated.Value(12)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: selected ? -6 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, selected, translate]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: translate }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function CartaJuego({
  card,
  selected = false,
  onPress,
}: {
  card: Carta;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 430 || height < 430;

  const content = (
    <AnimatedCardShell selected={selected}>
      <LinearGradient colors={colorCarta(card)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, compact ? styles.cardCompact : null, selected ? styles.selected : null]}>
        <View style={styles.outerFrame}>
          <Text style={styles.kicker}>{card.tipo.toUpperCase()}</Text>
          <View style={styles.illustration}>
            <View style={styles.orb} />
            <Text style={styles.title} numberOfLines={2}>
              {tituloCarta(card)}
            </Text>
            <View style={styles.orb} />
          </View>
          <Text style={styles.meta}>{subtituloCarta(card)}</Text>
        </View>
      </LinearGradient>
    </AnimatedCardShell>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      {content}
    </Pressable>
  );
}

export function UnidadJuego({
  unit,
  selected = false,
  onPress,
}: {
  unit: UnitInPlay;
  selected?: boolean;
  onPress?: () => void;
}) {
  const vidaActual = Math.max(unit.vidaMaxima - unit.damageTaken, 0);
  const ratio = unit.vidaMaxima > 0 ? vidaActual / unit.vidaMaxima : 0;
  const barColor = ratio > 0.65 ? palette.success : ratio > 0.3 ? palette.gold : palette.danger;

  const content = (
    <AnimatedCardShell selected={selected}>
      <LinearGradient colors={["#fbf5e8", "#eee4d0", "#ded2be"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, styles.unitCard, selected ? styles.selected : null]}>
        <View style={styles.outerFrame}>
          <Text style={styles.kicker}>UNIDAD</Text>
          <View style={styles.illustration}>
            <View style={styles.orb} />
            <Text style={styles.title}>{unit.guerrero}</Text>
            <View style={styles.orb} />
          </View>
          <View style={styles.healthTrack}>
            <View style={[styles.healthFill, { width: `${Math.max(10, ratio * 100)}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={styles.meta}>
            Vida {vidaActual}/{unit.vidaMaxima}
          </Text>
          <Text style={styles.meta}>{unit.shield ? `Escudo ${unit.shield.remaining}` : `Danio ${unit.damageTaken}`}</Text>
        </View>
      </LinearGradient>
    </AnimatedCardShell>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      {content}
    </Pressable>
  );
}

function SlotVacio({ label }: { label: string }) {
  return (
    <View style={styles.slot}>
      <Text style={styles.slotText}>{label}</Text>
    </View>
  );
}

export function TiraCartas({
  title,
  cards,
  selectedCardIds,
  onCardPress,
}: {
  title: string;
  cards: Carta[];
  selectedCardIds?: string[];
  onCardPress?: (card: Carta) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin cartas</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {cards.map((card) => (
            <CartaJuego
              key={card.id}
              card={card}
              selected={selectedCardIds?.includes(card.id)}
              onPress={onCardPress ? () => onCardPress(card) : undefined}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function TiraUnidades({
  title,
  units,
  selectedUnitId,
  onUnitPress,
  maxSlots = 5,
  emptyLabel = "Espacio",
}: {
  title: string;
  units: UnitInPlay[];
  selectedUnitId?: string | null;
  onUnitPress?: (unit: UnitInPlay) => void;
  maxSlots?: number;
  emptyLabel?: string;
}) {
  const slots = Math.max(maxSlots - units.length, 0);

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {units.map((unit) => (
          <UnidadJuego
            key={unit.instanceId}
            unit={unit}
            selected={selectedUnitId === unit.instanceId}
            onPress={onUnitPress ? () => onUnitPress(unit) : undefined}
          />
        ))}
        {Array.from({ length: slots }).map((_, index) => (
          <SlotVacio key={`${title}-slot-${index}`} label={emptyLabel} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  blockTitle: {
    color: "#775c26",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "800",
  },
  row: {
    gap: 10,
    paddingRight: 6,
  },
  card: {
    width: 98,
    minHeight: 136,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(126, 99, 54, 0.32)",
    padding: 6,
    shadowColor: "#3b2b15",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardCompact: {
    width: 88,
    minHeight: 124,
  },
  outerFrame: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 111, 77, 0.26)",
    padding: 8,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
    gap: 8,
  },
  unitCard: {
    minHeight: 142,
  },
  kicker: {
    color: "#977b49",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "800",
  },
  illustration: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(104, 91, 66, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  orb: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(118, 115, 143, 0.45)",
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  title: {
    color: "#58685f",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  meta: {
    color: "#907f62",
    fontSize: 10,
    lineHeight: 14,
  },
  healthTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(92, 79, 53, 0.14)",
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 999,
  },
  slot: {
    width: 94,
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(137, 104, 48, 0.34)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  slotText: {
    color: "#8a744f",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  empty: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(137, 104, 48, 0.28)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  emptyText: {
    color: "#8d7a5f",
    fontSize: 12,
  },
  selected: {
    borderColor: "rgba(212,160,23,0.62)",
    shadowColor: palette.gold,
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
