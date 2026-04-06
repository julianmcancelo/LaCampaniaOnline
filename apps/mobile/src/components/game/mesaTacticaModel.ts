import { useMemo, useState } from "react";
import type {
  BattleAction,
  Carta,
  ClientBattleView,
  OpponentBattleView,
  PlayerBattleState,
  SpyView,
} from "../../../../../motor/tipos";
import { GOLD_LABEL, RELIC_LABEL, displaySpecialName } from "../../../../../lib/lore";

export interface ActionOption {
  label: string;
  action: BattleAction;
  tone?: "primary" | "secondary";
}

export const phaseTitle: Record<string, string> = {
  BATTLE_INITIATIVE: "Iniciativa",
  INITIAL_DEPLOY: "Despliegue",
  TURN_DRAW: "Leva",
  TURN_ATTACK: "Cruce",
  TURN_SABOTAGE: "Sabotaje",
  TURN_TRADE: "Trueque",
  TURN_BUILD: "Fortin",
  TURN_END_CHECKS: "Cierre",
  BATTLE_OVER: "Ronda saldada",
  MATCH_OVER: "Duelo resuelto",
};

export function isPlayableGuerrero(card: Carta) {
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
      return "Todos tiran un dado. El mayor arranca la rodada.";
    case "INITIAL_DEPLOY":
      return "Selecciona combatientes y confirma.";
    case "TURN_DRAW":
      return "Leva una carta o descarta si la mano esta llena.";
    case "TURN_ATTACK":
      if (!selectedSource) return "Toca un paisano propio.";
      if (!selectedCard) return "Ahora elige arma o coraje.";
      if (!selectedTarget) return "Por ultimo elige objetivo.";
      return "Jugada lista.";
    case "TURN_SABOTAGE":
      return "Usa Cuatrero o Baqueano.";
    case "TURN_TRADE":
      return `Selecciona ${GOLD_LABEL.toLowerCase()} o cartas para trueque.`;
    case "TURN_BUILD":
      return `Inicia ${RELIC_LABEL.toLowerCase()} o agrega ${GOLD_LABEL.toLowerCase()}.`;
    case "TURN_END_CHECKS":
      return "Cierra la rodada.";
    default:
      return "Sigue el estado actual de la batalla.";
  }
}

export function useMesaTacticaModel({
  battleView,
  privateSpyView,
  onAction,
  onClearError,
}: {
  battleView: ClientBattleView;
  privateSpyView?: SpyView | null;
  onAction: (action: BattleAction) => void;
  onClearError?: () => void;
}) {
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
      if (ids.length > 0) list.push({ label: `Bajar ${ids.length}`, action: { type: "INITIAL_DEPLOY", payload: { cardIds: ids } } });
      if (me.field.length > 0) list.push({ label: "Confirmar", action: { type: "CONFIRM_INITIAL_DEPLOY", payload: {} }, tone: "secondary" });
      return list;
    }
    if (!isMyTurn || battleView.phase === "BATTLE_OVER" || battleView.phase === "MATCH_OVER") return list;

    if (!me.recruitedThisTurn && selectedCard && isPlayableGuerrero(selectedCard) && battleView.phase !== "TURN_DRAW") {
      if (me.field.length < 5) list.push({ label: "Reclutar", action: { type: "RECRUIT", payload: { cardId: selectedCard.id } } });
      allies
        .filter((ally) => ally.field.length < 5)
        .forEach((ally) => {
          list.push({
            label: `Refuerzo ${ally.displayName}`,
            action: { type: "SEND_REINFORCEMENT", payload: { cardId: selectedCard.id, allyPlayerId: ally.playerId } },
            tone: "secondary",
          });
        });
    }

    if (battleView.phase === "TURN_DRAW") {
      if (me.hand.length >= 7) {
        if (selectedCard) list.push({ label: "Descartar y levar", action: { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: selectedCard.id } } });
      } else {
        list.push({ label: "Levar carta", action: { type: "DRAW_CARD", payload: {} } });
      }
      return list;
    }

    if (battleView.phase === "TURN_ATTACK") {
      if (selectedCard?.tipo === "arma" && selectedSource && selectedTarget) {
        list.push({
          label: "Atacar",
          action: {
            type: "ATTACK_WITH_WEAPON",
            payload: { attackerId: selectedSource.instanceId, defenderId: selectedTarget.unit.instanceId, weaponCardId: selectedCard.id },
          },
        });
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Poder" && selectedSource && selectedTarget) {
        list.push({
          label: `Usar ${displaySpecialName("Poder")}`,
          action: {
            type: "USE_POWER_CARD",
            payload: { cardId: selectedCard.id, sourceUnitId: selectedSource.instanceId, targetUnitId: selectedTarget.unit.instanceId },
          },
        });
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Asedio") {
        enemies
          .filter((enemy) => enemy.castle.cards.length > 0)
          .forEach((enemy) => {
            list.push({
              label: `Malon ${enemy.displayName}`,
              action: { type: "ATTACK_WITH_SIEGE", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } },
              tone: "secondary",
            });
          });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_SABOTAGE") {
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Ladron") {
        enemies.forEach((enemy) => list.push({ label: `Cuatrerear ${enemy.displayName}`, action: { type: "USE_THIEF", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } } }));
      }
      if (selectedCard?.tipo === "especial" && selectedCard.especial === "Espia") {
        list.push({ label: "Rastrear mazo", action: { type: "USE_SPY", payload: { cardId: selectedCard.id, targetDeck: true } } });
        enemies.forEach((enemy) => list.push({ label: `Rastrear ${enemy.displayName}`, action: { type: "USE_SPY", payload: { cardId: selectedCard.id, targetPlayerId: enemy.playerId } }, tone: "secondary" }));
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_TRADE") {
      if (selectedCard?.tipo === "oro") {
        const max = Math.max(1, Math.floor(selectedCard.valor / 2));
        list.push({ label: `Cambiar ${tradeAmount}/${max}`, action: { type: "TRADE_WITH_GOLD", payload: { goldCardId: selectedCard.id, amountToDraw: Math.min(tradeAmount, max) } } });
      }
      if (selectedCardIds.length === 3 || selectedCardIds.length === 6) {
        list.push({ label: `Trueque ${selectedCardIds.length / 3}`, action: { type: "TRADE_BARTER", payload: { paymentCardIds: selectedCardIds, amountToDraw: selectedCardIds.length === 3 ? 1 : 2 } } });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_BUILD") {
      if (selectedCard && !me.castle.reliquia && valueOf(selectedCard) === 1 && (selectedCard.tipo === "oro" || selectedCard.tipo === "arma")) {
        list.push({ label: `Usar ${RELIC_LABEL}`, action: { type: "BUILD_RELIC", payload: { cardId: selectedCard.id } } });
      }
      if (selectedCard?.tipo === "oro" && me.castle.reliquia) {
        list.push({ label: `Agregar ${GOLD_LABEL.toLowerCase()}`, action: { type: "BUILD_CASTLE_CARD", payload: { cardId: selectedCard.id } } });
      }
      list.push({ label: "Pasar fase", action: { type: "ADVANCE_PHASE", payload: {} }, tone: "secondary" });
      return list;
    }

    if (battleView.phase === "TURN_END_CHECKS") return [{ label: "Cerrar turno", action: { type: "ADVANCE_PHASE", payload: {} } }];
    return list;
  }, [allies, battleView, enemies, isMyTurn, me, selectedCard, selectedCardIds, selectedSource, selectedTarget, tradeAmount]);

  const tradeMax = selectedCard?.tipo === "oro" ? Math.max(1, Math.floor(selectedCard.valor / 2)) : 1;

  return {
    me,
    allies,
    enemies,
    rival,
    isMyTurn,
    selectedCardIds,
    selectedSourceUnitId,
    selectedTargetUnitId,
    selectedCard,
    selectedSource,
    selectedTarget,
    prompt,
    spyView,
    options,
    tradeAmount,
    tradeMax,
    setTradeAmount,
    setSelectedSourceUnitId,
    setSelectedTargetUnitId,
    toggleCard,
    execute,
  };
}
