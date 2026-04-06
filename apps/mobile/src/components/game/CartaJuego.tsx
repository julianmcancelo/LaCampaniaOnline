import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Carta, UnitInPlay } from "../../../../../motor/tipos";
import { displayCardSubtitle, displayCardTitle, displayCardType, displayWarriorName } from "../../../../../lib/lore";
import { palette, radius } from "../../theme/tokens";
import { resolveGameViewport, type GameViewportMode } from "./viewport";

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
  variant,
}: {
  card: Carta;
  selected?: boolean;
  onPress?: () => void;
  variant?: GameViewportMode;
}) {
  const { width, height } = useWindowDimensions();
  const mode = variant ?? resolveGameViewport(width, height).mode;
  const scale = useMemo(() => getCardScale(mode), [mode]);

  const content = (
    <AnimatedCardShell selected={selected}>
      <LinearGradient
        colors={colorCarta(card)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            width: scale.cardWidth,
            minHeight: scale.cardHeight,
            padding: scale.cardPadding,
            borderRadius: scale.cardRadius,
          },
          selected ? styles.selected : null,
        ]}
      >
        <View style={[styles.outerFrame, { padding: scale.framePadding, borderRadius: scale.frameRadius, gap: scale.innerGap }]}>
          <Text style={[styles.kicker, { fontSize: scale.kickerSize }]}>{displayCardType(card).toUpperCase()}</Text>
          <View style={[styles.illustration, { paddingHorizontal: scale.illustrationPadding, borderRadius: scale.illustrationRadius, gap: scale.illustrationGap }]}>
            <View style={[styles.orb, { width: scale.orbSize, height: scale.orbSize }]} />
            <Text style={[styles.title, { fontSize: scale.titleSize, lineHeight: scale.titleLineHeight }]} numberOfLines={2}>
              {displayCardTitle(card)}
            </Text>
            <View style={[styles.orb, { width: scale.orbSize, height: scale.orbSize }]} />
          </View>
          <Text style={[styles.meta, { fontSize: scale.metaSize, lineHeight: scale.metaLineHeight }]}>{displayCardSubtitle(card)}</Text>
        </View>
      </LinearGradient>
    </AnimatedCardShell>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function UnidadJuego({
  unit,
  selected = false,
  onPress,
  variant,
}: {
  unit: UnitInPlay;
  selected?: boolean;
  onPress?: () => void;
  variant?: GameViewportMode;
}) {
  const { width, height } = useWindowDimensions();
  const mode = variant ?? resolveGameViewport(width, height).mode;
  const scale = useMemo(() => getCardScale(mode), [mode]);
  const vidaActual = Math.max(unit.vidaMaxima - unit.damageTaken, 0);
  const ratio = unit.vidaMaxima > 0 ? vidaActual / unit.vidaMaxima : 0;
  const barColor = ratio > 0.65 ? palette.success : ratio > 0.3 ? palette.gold : palette.danger;

  const content = (
    <AnimatedCardShell selected={selected}>
      <LinearGradient
        colors={["#fbf5e8", "#eee4d0", "#ded2be"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            width: scale.cardWidth,
            minHeight: scale.unitHeight,
            padding: scale.cardPadding,
            borderRadius: scale.cardRadius,
          },
          selected ? styles.selected : null,
        ]}
      >
        <View style={[styles.outerFrame, { padding: scale.framePadding, borderRadius: scale.frameRadius, gap: scale.innerGap }]}>
          <Text style={[styles.kicker, { fontSize: scale.kickerSize }]}>PAISANO</Text>
          <View style={[styles.illustration, { paddingHorizontal: scale.illustrationPadding, borderRadius: scale.illustrationRadius, gap: scale.illustrationGap }]}>
            <View style={[styles.orb, { width: scale.orbSize, height: scale.orbSize }]} />
            <Text style={[styles.title, { fontSize: scale.titleSize, lineHeight: scale.titleLineHeight }]}>{displayWarriorName(unit.guerrero)}</Text>
            <View style={[styles.orb, { width: scale.orbSize, height: scale.orbSize }]} />
          </View>
          <View style={[styles.healthTrack, { height: scale.healthTrackHeight }]}>
            <View style={[styles.healthFill, { width: `${Math.max(10, ratio * 100)}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.meta, { fontSize: scale.metaSize, lineHeight: scale.metaLineHeight }]}>
            Vida {vidaActual}/{unit.vidaMaxima}
          </Text>
          <Text style={[styles.meta, { fontSize: scale.metaSize, lineHeight: scale.metaLineHeight }]}>
            {unit.shield ? `Recio ${unit.shield.remaining}` : `Danio ${unit.damageTaken}`}
          </Text>
        </View>
      </LinearGradient>
    </AnimatedCardShell>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function SlotVacio({ label, variant }: { label: string; variant: GameViewportMode }) {
  const scale = getCardScale(variant);
  return (
    <View style={[styles.slot, { width: scale.slotWidth, minHeight: scale.slotHeight, borderRadius: scale.cardRadius }]}>
      <Text style={[styles.slotText, { fontSize: scale.slotTextSize, lineHeight: scale.slotLineHeight }]}>{label}</Text>
    </View>
  );
}

export function TiraCartas({
  title,
  cards,
  selectedCardIds,
  onCardPress,
  variant,
  showTitle = true,
}: {
  title: string;
  cards: Carta[];
  selectedCardIds?: string[];
  onCardPress?: (card: Carta) => void;
  variant?: GameViewportMode;
  showTitle?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const mode = variant ?? resolveGameViewport(width, height).mode;
  const scale = getCardScale(mode);

  return (
    <View style={styles.block}>
      {showTitle ? <Text style={[styles.blockTitle, { fontSize: scale.blockTitleSize }]}>{title}</Text> : null}
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin cartas</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap: scale.rowGap }]}>
          {cards.map((card) => (
            <CartaJuego
              key={card.id}
              card={card}
              selected={selectedCardIds?.includes(card.id)}
              onPress={onCardPress ? () => onCardPress(card) : undefined}
              variant={mode}
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
  variant,
  showTitle = true,
}: {
  title: string;
  units: UnitInPlay[];
  selectedUnitId?: string | null;
  onUnitPress?: (unit: UnitInPlay) => void;
  maxSlots?: number;
  emptyLabel?: string;
  variant?: GameViewportMode;
  showTitle?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const mode = variant ?? resolveGameViewport(width, height).mode;
  const scale = getCardScale(mode);
  const slots = Math.max(maxSlots - units.length, 0);

  return (
    <View style={styles.block}>
      {showTitle ? <Text style={[styles.blockTitle, { fontSize: scale.blockTitleSize }]}>{title}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap: scale.rowGap }]}>
        {units.map((unit) => (
          <UnidadJuego
            key={unit.instanceId}
            unit={unit}
            selected={selectedUnitId === unit.instanceId}
            onPress={onUnitPress ? () => onUnitPress(unit) : undefined}
            variant={mode}
          />
        ))}
        {Array.from({ length: slots }).map((_, index) => (
          <SlotVacio key={`${title}-slot-${index}`} label={emptyLabel} variant={mode} />
        ))}
      </ScrollView>
    </View>
  );
}

function getCardScale(mode: GameViewportMode) {
  switch (mode) {
    case "tabletLandscape":
      return {
        cardWidth: 90,
        cardHeight: 124,
        unitHeight: 132,
        slotWidth: 86,
        slotHeight: 124,
        cardPadding: 5,
        cardRadius: 18,
        framePadding: 7,
        frameRadius: 14,
        innerGap: 6,
        illustrationPadding: 7,
        illustrationRadius: 16,
        illustrationGap: 7,
        orbSize: 14,
        titleSize: 14,
        titleLineHeight: 17,
        kickerSize: 8,
        metaSize: 9,
        metaLineHeight: 11,
        healthTrackHeight: 5,
        slotTextSize: 10,
        slotLineHeight: 13,
        blockTitleSize: 9,
        rowGap: 7,
      };
    case "phoneLandscape":
      return {
        cardWidth: 88,
        cardHeight: 122,
        unitHeight: 130,
        slotWidth: 84,
        slotHeight: 122,
        cardPadding: 5,
        cardRadius: 14,
        framePadding: 7,
        frameRadius: 10,
        innerGap: 6,
        illustrationPadding: 6,
        illustrationRadius: 12,
        illustrationGap: 7,
        orbSize: 14,
        titleSize: 13,
        titleLineHeight: 16,
        kickerSize: 7,
        metaSize: 9,
        metaLineHeight: 11,
        healthTrackHeight: 5,
        slotTextSize: 10,
        slotLineHeight: 13,
        blockTitleSize: 9,
        rowGap: 8,
      };
    case "phonePortrait":
    default:
      return {
        cardWidth: 84,
        cardHeight: 118,
        unitHeight: 126,
        slotWidth: 80,
        slotHeight: 118,
        cardPadding: 5,
        cardRadius: 14,
        framePadding: 7,
        frameRadius: 10,
        innerGap: 6,
        illustrationPadding: 6,
        illustrationRadius: 12,
        illustrationGap: 7,
        orbSize: 14,
        titleSize: 13,
        titleLineHeight: 16,
        kickerSize: 7,
        metaSize: 9,
        metaLineHeight: 11,
        healthTrackHeight: 5,
        slotTextSize: 10,
        slotLineHeight: 13,
        blockTitleSize: 9,
        rowGap: 8,
      };
  }
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
    paddingRight: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(126, 99, 54, 0.32)",
    shadowColor: "#3b2b15",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  outerFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(128, 111, 77, 0.26)",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  kicker: {
    color: "#977b49",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "800",
  },
  illustration: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(104, 91, 66, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  orb: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(118, 115, 143, 0.45)",
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  title: {
    color: "#58685f",
    fontWeight: "700",
    textAlign: "center",
  },
  meta: {
    color: "#907f62",
  },
  healthTrack: {
    borderRadius: 999,
    backgroundColor: "rgba(92, 79, 53, 0.14)",
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 999,
  },
  slot: {
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
    textAlign: "center",
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
});
