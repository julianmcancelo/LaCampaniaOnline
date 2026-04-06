import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { BattleAction, Carta, ClientBattleView, ClientMatchView, OpponentBattleView, PlayerBattleState, SpyView, UnitInPlay } from "../../../../../motor/tipos";
import { palette, radius, spacing } from "../../theme/tokens";
import { ActionButton } from "../ui/ActionButton";
import { SectionCard } from "../ui/SectionCard";
import { BitacoraBatalla } from "./BitacoraBatalla";
import { CastleHud } from "./CastleHud";
import { TiraCartas, TiraUnidades } from "./CartaJuego";

type ScorePlayer = Pick<ClientMatchView["players"][number], "playerId" | "displayName">;

export interface MesaTacticaProps {
  battleView: ClientBattleView;
  scorePlayers: ScorePlayer[];
  scoreByPlayer: Record<string, number>;
  privateSpyView?: SpyView | null;
  onAction: (action: BattleAction) => void;
  onExit?: () => void;
  error?: string | null;
  onClearError?: () => void;
  mode: "solo" | "online";
}

interface ActionOption {
  label: string;
  action: BattleAction;
  tone?: "primary" | "secondary";
}

const phaseTitle: Record<string, string> = {
  BATTLE_INITIATIVE: "Iniciativa",
  INITIAL_DEPLOY: "Despliegue",
  TURN_DRAW: "Tomar",
  TURN_ATTACK: "Ataque",
  TURN_SABOTAGE: "Sabotaje",
  TURN_TRADE: "Comercio",
  TURN_BUILD: "Construir",
  TURN_END_CHECKS: "Cierre",
  BATTLE_OVER: "Batalla terminada",
  MATCH_OVER: "Match terminado",
};

function isPlayableGuerrero(card: Carta) {
  return card.tipo === "guerrero" || (card.tipo === "especial" && card.especial === "Dragon");
}

function valueOf(card: Carta) {
  return card.tipo === "arma" || card.tipo === "oro" ? card.valor : 0;
}

function sameTeam(me: PlayerBattleState, other: OpponentBattleView | PlayerBattleState) {
  return Boolean(me.teamId && other.teamId && me.teamId === other.teamId);
}

function findCard(cards: Carta[], id?: string | null) {
  return id ? cards.find((card) => card.id === id) ?? null : null;
}

function findOwnUnit(me: PlayerBattleState, id?: string | null) {
  return id ? me.field.find((unit) => unit.instanceId === id) ?? null : null;
}

function findAnyUnit(view: ClientBattleView, id?: string | null) {
  if (!id) return null;
  const own = view.me.field.find((unit) => unit.instanceId === id);
  if (own) return { ownerId: view.me.playerId, unit: own };
  for (const opponent of view.opponents) {
    const found = opponent.field.find((unit) => unit.instanceId === id);
    if (found) return { ownerId: opponent.playerId, unit: found };
  }
  return null;
}

function phasePrompt(view: ClientBattleView, selectedCardIds: string[], sourceId: string | null, targetId: string | null) {
  const selectedCard = findCard(view.me.hand, selectedCardIds[0]);
  const selectedSource = findOwnUnit(view.me, sourceId);
  const selectedTarget = findAnyUnit(view, targetId);
  switch (view.phase) {
    case "BATTLE_INITIATIVE":
      return "Todos tiran un dado. El mayor inicia.";
    case "INITIAL_DEPLOY":
      return "Selecciona guerreros y confirma.";
    case "TURN_DRAW":
      return "Toma carta o descarta si tu mano esta llena.";
    case "TURN_ATTACK":
      if (!selectedSource) return "Toca un guerrero propio.";
      if (!selectedCard) return "Ahora elige arma o poder.";
      if (!selectedTarget) return "Por ultimo elige objetivo.";
      return "Jugada lista.";
    case "TURN_SABOTAGE":
      return "Usa Ladron o Espia.";
    case "TURN_TRADE":
      return "Selecciona oro o cartas para trueque.";
    case "TURN_BUILD":
      return "Inicia reliquia o agrega oro.";
    case "TURN_END_CHECKS":
      return "Cierra el turno.";
    default:
      return "Sigue el estado actual de la batalla.";
  }
}

function BarraJugador({
  name,
  cards,
  active,
  compact,
}: {
  name: string;
  cards: number;
  active: boolean;
  compact: boolean;
}) {
  return (
    <View style={[styles.playerBar, compact && styles.playerBarCompact, active && styles.playerBarActive]}>
      <View style={[styles.playerBadge, compact && styles.playerBadgeCompact]}>
        <Text style={[styles.playerBadgeText, compact && styles.playerBadgeTextCompact]}>{cards}</Text>
      </View>
      <View style={styles.playerNameWrap}>
        <Text numberOfLines={1} style={[styles.playerName, compact && styles.playerNameCompact]}>
          {name}
        </Text>
        <View style={styles.playerTrack}>
          <View style={styles.playerTrackFill} />
        </View>
      </View>
    </View>
  );
}

export function MesaTactica({
  battleView,
  scorePlayers,
  scoreByPlayer,
  privateSpyView,
  onAction,
  onExit,
  error,
  onClearError,
}: MesaTacticaProps) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const compact = width < 560;
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSourceUnitId, setSelectedSourceUnitId] = useState<string | null>(null);
  const [selectedTargetUnitId, setSelectedTargetUnitId] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState(1);

  const me = battleView.me;
  const allies = battleView.opponents.filter((opponent) => sameTeam(me, opponent));
  const enemies = battleView.opponents.filter((opponent) => !sameTeam(me, opponent));
  const rival = enemies[0] ?? battleView.opponents[0];
  const isMyTurn = battleView.activePlayerId === me.playerId;
  const selectedCard = findCard(me.hand, selectedCardIds[0]);
  const selectedSource = findOwnUnit(me, selectedSourceUnitId);
  const selectedTarget = findAnyUnit(battleView, selectedTargetUnitId);
  const prompt = phasePrompt(battleView, selectedCardIds, selectedSourceUnitId, selectedTargetUnitId);
  const spyView = privateSpyView ?? battleView.me.pendingSpy;

  function resetSelection() {
    setSelectedCardIds([]);
    setSelectedSourceUnitId(null);
    setSelectedTargetUnitId(null);
    setTradeAmount(1);
    onClearError?.();
  }

  function execute(action: BattleAction) {
    onClearError?.();
    onAction(action);
    resetSelection();
  }

  function toggleCard(card: Carta) {
    onClearError?.();
    if (battleView.phase === "INITIAL_DEPLOY") {
      if (!isPlayableGuerrero(card)) return;
      setSelectedCardIds((current) => (current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]));
      return;
    }
    if (battleView.phase === "TURN_TRADE") {
      setSelectedCardIds((current) => (current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]));
      return;
    }
    setSelectedCardIds((current) => (current[0] === card.id ? [] : [card.id]));
  }

  const options = useMemo<ActionOption[]>(() => {
    const list: ActionOption[] = [];
    if (battleView.phase === "BATTLE_INITIATIVE" && battleView.initiative.contenders.includes(me.playerId) && battleView.initiative.rolls[me.playerId] === null) {
      return [{ label: "Tirar dado", action: { type: "ROLL_INITIATIVE", payload: {} } }];
    }
    if (battleView.phase === "INITIAL_DEPLOY") {
      const ids = selectedCardIds.filter((id) => {
        const card = findCard(me.hand, id);
        return card ? isPlayableGuerrero(card) : false;
      });
      if (ids.length > 0) list.push({ label: `Desplegar ${ids.length}`, action: { type: "INITIAL_DEPLOY", payload: { cardIds: ids } } });
      if (me.field.length > 0) list.push({ label: "Confirmar", action: { type: "CONFIRM_INITIAL_DEPLOY", payload: {} }, tone: "secondary" });
      return list;
    }
    if (!isMyTurn || battleView.phase === "BATTLE_OVER" || battleView.phase === "MATCH_OVER") return list;

    if (!me.recruitedThisTurn && selectedCard && isPlayableGuerrero(selectedCard) && battleView.phase !== "TURN_DRAW") {
      if (me.field.length < 5) list.push({ label: "Reclutar", action: { type: "RECRUIT", payload: { cardId: selectedCard.id } } });
      allies.filter((ally) => ally.field.length < 5).forEach((ally) => {
        list.push({ label: `Refuerzo ${ally.displayName}`, action: { type: "SEND_REINFORCEMENT", payload: { cardId: selectedCard.id, allyPlayerId: ally.playerId } }, tone: "secondary" });
      });
    }

    if (battleView.phase === "TURN_DRAW") {
      if (me.hand.length >= 7) {
        if (selectedCard) list.push({ label: "Descartar y tomar", action: { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: selectedCard.id } } });
      } else {
        list.push({ label: "Tomar carta", action: { type: "DRAW_CARD", payload: {} } });
      }
      return list;
    }

    if (battleView.phase === "TURN_ATTACK") {
      if (selectedCard?.tipo === "arma" && selectedSource && selectedTarget) {
        list.push({ label: "Atacar", action: { type: "ATTACK_WITH_WEAPON", payload: { attackerId: selectedSource.instanceId, defenderId: selectedTarget.unit.instanceId, weaponCardId: selectedCard.id } } });
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Poder" && selectedSource && selectedTarget) {
        list.push({ label: "Usar poder", action: { type: "USE_POWER_CARD", payload: { cardId: selectedCard.id, sourceUnitId: selectedSource.instanceId, targetUnitId: selectedTarget.unit.instanceId } } });
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Asedio") {
        enemies.filter((enemy) => enemy.castle.cards.length > 0).forEach((enemy) => {
          list.push({ label: `Asedio ${enemy.displayName}`, action: { type: "ATTACK_WITH_SIEGE", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } }, tone: "secondary" });
        });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_SABOTAGE") {
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Ladron") {
        enemies.forEach((enemy) => list.push({ label: `Robar ${enemy.displayName}`, action: { type: "USE_THIEF", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } } }));
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Espia") {
        list.push({ label: "Espiar mazo", action: { type: "USE_SPY", payload: { cardId: selectedCard.id, targetDeck: true } } });
        enemies.forEach((enemy) => list.push({ label: `Espiar ${enemy.displayName}`, action: { type: "USE_SPY", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } }, tone: "secondary" }));
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_TRADE") {
      if (selectedCard?.tipo === "oro") {
        const max = Math.max(1, Math.floor(selectedCard.valor / 2));
        list.push({ label: `Comprar ${tradeAmount}/${max}`, action: { type: "TRADE_WITH_GOLD", payload: { goldCardId: selectedCard.id, amountToDraw: Math.min(tradeAmount, max) } } });
      }
      if (selectedCardIds.length === 3 || selectedCardIds.length === 6) {
        list.push({ label: `Trueque ${selectedCardIds.length / 3}`, action: { type: "TRADE_BARTER", payload: { paymentCardIds: selectedCardIds, amountToDraw: selectedCardIds.length === 3 ? 1 : 2 } } });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_BUILD") {
      if (selectedCard && !me.castle.reliquia && valueOf(selectedCard) === 1 && (selectedCard.tipo === "oro" || selectedCard.tipo === "arma")) {
        list.push({ label: "Usar reliquia", action: { type: "BUILD_RELIC", payload: { cardId: selectedCard.id } } });
      }
      if (selectedCard?.tipo === "oro" && me.castle.reliquia) {
        list.push({ label: "Agregar oro", action: { type: "BUILD_CASTLE_CARD", payload: { cardId: selectedCard.id } } });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_END_CHECKS") return [{ label: "Cerrar turno", action: { type: "ADVANCE_PHASE", payload: {} } }];
    return list;
  }, [allies, battleView, enemies, isMyTurn, me, selectedCard, selectedCardIds, selectedSource, selectedTarget, tradeAmount]);

  const tradeMax = selectedCard?.tipo === "oro" ? Math.max(1, Math.floor(selectedCard.valor / 2)) : 1;

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      <LinearGradient colors={["#d8bf97", "#e8d5af", "#c9ab7e"]} style={[styles.board, compact && styles.boardCompact, landscape && styles.boardLandscape]}>
        <View style={styles.boardOverlay} />
        <View style={[styles.topBar, compact && styles.topBarCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>La Campana</Text>
          <View style={styles.topActions}>
            <View style={styles.phaseChip}>
              <Text style={styles.phaseChipText}>{phaseTitle[battleView.phase] ?? battleView.phase}</Text>
            </View>
            <View style={styles.phaseChip}>
              <Text style={styles.phaseChipText}>T{battleView.currentTurn}</Text>
            </View>
            {onExit ? <ActionButton label={compact ? "X" : "Salir"} onPress={onExit} tone="secondary" /> : null}
          </View>
        </View>

        <BarraJugador name={rival?.displayName ?? "Rival"} cards={rival?.cardCount ?? 0} active={battleView.activePlayerId === rival?.playerId} compact={compact} />

        <View style={styles.zoneBlock}>
          <Text style={styles.zoneLabel}>Campo rival</Text>
          <TiraUnidades title="Rival" units={rival?.field ?? []} selectedUnitId={selectedTargetUnitId} onUnitPress={(unit) => setSelectedTargetUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))} emptyLabel="Espacio" />
        </View>

        <View style={styles.centerRow}>
          <View style={[styles.pileBox, compact && styles.pileBoxCompact]}>
            <Text style={styles.pileLabel}>Mazo</Text>
            <Text style={styles.pileValue}>{battleView.centralDeckCount}</Text>
          </View>
          <View style={[styles.promptBox, compact && styles.promptBoxCompact]}>
            <Text style={[styles.promptText, compact && styles.promptTextCompact]}>{prompt}</Text>
          </View>
          <View style={[styles.pileBox, compact && styles.pileBoxCompact]}>
            <Text style={styles.pileLabel}>Desc</Text>
            <Text style={styles.pileValue}>{battleView.discardCount}</Text>
          </View>
        </View>

        <View style={styles.zoneBlock}>
          <Text style={styles.zoneLabel}>Tu campo</Text>
          <TiraUnidades title="Propio" units={me.field} selectedUnitId={selectedSourceUnitId} onUnitPress={(unit) => setSelectedSourceUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))} emptyLabel="Solta" />
        </View>

        <BarraJugador name={me.displayName} cards={me.hand.length} active={battleView.activePlayerId === me.playerId} compact={compact} />

        <View style={[styles.handBox, compact && styles.handBoxCompact]}>
          <View style={styles.handHead}>
            <Text style={styles.zoneLabel}>Tu mano</Text>
            <Text style={styles.handMeta}>{selectedCardIds.length > 0 ? `${selectedCardIds.length} seleccionadas` : "Lista"}</Text>
          </View>
          <TiraCartas title="Cartas" cards={me.hand} selectedCardIds={selectedCardIds} onCardPress={toggleCard} />
        </View>
      </LinearGradient>

      <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
        <SectionCard eyebrow="Accion" title="Jugada" compact={compact}>
          <Text style={styles.sideText}>{prompt}</Text>
          {battleView.phase === "TURN_TRADE" && selectedCard?.tipo === "oro" ? (
            <View style={styles.tradeRow}>
              <ActionButton label="-" onPress={() => setTradeAmount((current) => Math.max(1, current - 1))} tone="secondary" />
              <Text style={styles.tradeValue}>{tradeAmount}/{tradeMax}</Text>
              <ActionButton label="+" onPress={() => setTradeAmount((current) => Math.min(tradeMax, current + 1))} tone="secondary" />
            </View>
          ) : null}
          <View style={styles.stack}>
            {options.length > 0 ? options.map((item, index) => (
              <ActionButton key={`${item.label}-${index}`} label={item.label} onPress={() => execute(item.action)} tone={item.tone ?? "primary"} />
            )) : <Text style={styles.sideText}>Sin accion lista.</Text>}
          </View>
        </SectionCard>

        {spyView ? (
          <SectionCard eyebrow="Espia" title={spyView.targetLabel} compact={compact}>
            <Text style={styles.sideText}>{spyView.cards.map((card) => card.nombre).join(" · ") || "Sin cartas visibles."}</Text>
          </SectionCard>
        ) : null}

        {error ? (
          <SectionCard eyebrow="Aviso" title="No se pudo ejecutar" compact={compact}>
            <Text style={styles.errorText}>{error}</Text>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Bitacora" title="Ultimos movimientos" compact={compact}>
          <BitacoraBatalla eventos={battleView.log} limit={compact ? 3 : 6} compact={compact} />
        </SectionCard>

        <SectionCard eyebrow="Match" title="Marcador" compact={compact}>
          <View style={styles.stack}>
            {scorePlayers.map((player) => (
              <View key={player.playerId} style={styles.scoreRow}>
                <Text style={styles.scoreName}>{player.displayName}</Text>
                <Text style={styles.scoreValue}>{scoreByPlayer[player.playerId] ?? 0}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard eyebrow="Castillo" title="Progreso" compact={compact}>
          <CastleHud me={battleView.me} opponents={battleView.opponents} />
        </SectionCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.sm },
  rootLandscape: { flexDirection: "row", alignItems: "stretch" },
  board: {
    flex: 1,
    minHeight: 0,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(96,65,27,0.22)",
  },
  boardLandscape: { flex: 1.45 },
  boardCompact: { flex: 0, padding: 6, gap: 6 },
  boardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.08)" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  topBarCompact: { gap: 4 },
  title: { color: "#fff4d9", fontSize: 24, fontWeight: "700" },
  titleCompact: { fontSize: 18 },
  topActions: { flexDirection: "row", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  phaseChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(109,92,51,0.3)", backgroundColor: "rgba(61,81,52,0.68)" },
  phaseChipText: { color: "#f7e8bf", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  playerBar: { flexDirection: "row", alignSelf: "center", alignItems: "center", gap: 10, minWidth: 150, maxWidth: 220, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.lg, backgroundColor: "rgba(104,84,53,0.78)" },
  playerBarCompact: { minWidth: 118, maxWidth: 170, paddingHorizontal: 8, paddingVertical: 3, gap: 7 },
  playerBarActive: { shadowColor: "#92dd66", shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  playerBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#fbf4e8", alignItems: "center", justifyContent: "center" },
  playerBadgeCompact: { width: 18, height: 18, borderRadius: 6 },
  playerBadgeText: { color: "#5b4322", fontSize: 12, fontWeight: "800" },
  playerBadgeTextCompact: { fontSize: 9 },
  playerNameWrap: { flex: 1, gap: 3 },
  playerName: { color: "#fff7e6", fontSize: 13, fontWeight: "700" },
  playerNameCompact: { fontSize: 11 },
  playerTrack: { height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  playerTrackFill: { height: "100%", width: "72%", borderRadius: 999, backgroundColor: "#53d05a" },
  zoneBlock: { borderRadius: radius.lg, padding: 6, backgroundColor: "rgba(255,255,255,0.09)", borderWidth: 1, borderColor: "rgba(112,84,41,0.22)", gap: 6 },
  zoneLabel: { color: "#6d531f", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pileBox: { width: 50, minHeight: 58, borderRadius: radius.md, backgroundColor: "rgba(62,98,86,0.88)", borderWidth: 1, borderColor: "rgba(255,255,255,0.36)", alignItems: "center", justifyContent: "center", gap: 2 },
  pileBoxCompact: { width: 42, minHeight: 48 },
  pileLabel: { color: "#e4f6e1", fontSize: 8, fontWeight: "800", textTransform: "uppercase" },
  pileValue: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  promptBox: { flex: 1, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(116,88,40,0.2)" },
  promptBoxCompact: { paddingHorizontal: 6, paddingVertical: 5 },
  promptText: { color: "#5c4825", fontSize: 11, lineHeight: 14, textAlign: "center", fontWeight: "700" },
  promptTextCompact: { fontSize: 10, lineHeight: 12 },
  handBox: { borderRadius: radius.lg, padding: 6, backgroundColor: "rgba(255,255,255,0.22)", borderWidth: 1, borderColor: "rgba(112,84,41,0.18)", gap: 6 },
  handBoxCompact: { padding: 5, gap: 4 },
  handHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  handMeta: { color: "#8a7752", fontSize: 8, fontWeight: "700" },
  sidebar: { gap: 8, flex: 0.42 },
  sidebarCompact: { flex: 0, gap: 6 },
  sideText: { color: palette.textSoft, fontSize: 10, lineHeight: 14 },
  tradeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tradeValue: { color: palette.parchment, fontSize: 12, fontWeight: "800", minWidth: 40, textAlign: "center" },
  stack: { gap: 6 },
  errorText: { color: "#f1cbc7", fontSize: 10, lineHeight: 14 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.04)" },
  scoreName: { color: palette.parchment, fontSize: 11, fontWeight: "600" },
  scoreValue: { color: palette.goldSoft, fontSize: 13, fontWeight: "800" },
});
