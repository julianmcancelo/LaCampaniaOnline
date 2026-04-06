import {
  COMPATIBILIDAD_ARMA,
  ESPECIALES,
  GUERREROS_INICIALES,
  PLANTILLAS_ARMAS,
  PLANTILLAS_GUERREROS,
  RECURSOS_INICIALES,
  VALORES_ORO,
  VIDA_POR_GUERRERO,
  objetivoCastilloPorModo,
} from "./constantes";
import { crearId } from "./id";
import type {
  BattleState,
  Carta,
  CartaArma,
  CartaEspecial,
  CartaGuerrero,
  CartaOro,
  MatchPlayer,
  ModoJuego,
  PlayerBattleState,
  TipoGuerrero,
  UnitInPlay,
} from "./tipos";

export function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function robar<T>(deck: T[], amount = 1): { drawn: T[]; rest: T[] } {
  return {
    drawn: deck.slice(0, amount),
    rest: deck.slice(amount),
  };
}

export function crearMazoGuerreros(): CartaGuerrero[] {
  return mezclar(
    PLANTILLAS_GUERREROS.flatMap((plantilla) =>
      Array.from({ length: plantilla.cantidad }, () => ({
        id: crearId("card"),
        tipo: "guerrero" as const,
        nombre: plantilla.guerrero,
        guerrero: plantilla.guerrero,
      }))
    )
  );
}

export function crearMazoRecursos(): Carta[] {
  const armas: CartaArma[] = PLANTILLAS_ARMAS.flatMap((plantilla) =>
    Array.from({ length: plantilla.cantidad }, () => ({
      id: crearId("card"),
      tipo: "arma" as const,
      nombre: `${plantilla.arma} ${plantilla.valor}`,
      arma: plantilla.arma,
      valor: plantilla.valor,
      compatibleCon: COMPATIBILIDAD_ARMA[plantilla.arma],
    }))
  );

  const oro: CartaOro[] = VALORES_ORO.map((valor) => ({
    id: crearId("card"),
    tipo: "oro" as const,
    nombre: `Oro ${valor}`,
    valor,
  }));

  const especiales: CartaEspecial[] = ESPECIALES.flatMap((plantilla) =>
    Array.from({ length: plantilla.cantidad }, () => ({
      id: crearId("card"),
      tipo: "especial" as const,
      nombre: plantilla.especial,
      especial: plantilla.especial,
    }))
  );

  return mezclar([...armas, ...oro, ...especiales]);
}

export function crearUnidadDesdeCarta(carta: CartaGuerrero | CartaEspecial, currentTurn: number): UnitInPlay {
  const guerrero: TipoGuerrero = carta.tipo === "especial" ? "Dragon" : carta.guerrero;

  return {
    instanceId: crearId("unit"),
    sourceCardId: carta.id,
    guerrero,
    vida: VIDA_POR_GUERRERO[guerrero],
    vidaMaxima: VIDA_POR_GUERRERO[guerrero],
    damageTaken: 0,
    damageMarks: [],
    shield: null,
    enteredTurn: currentTurn,
    canAttackThisTurn: false,
  };
}

function crearCastillo(modo: ModoJuego, teamId: PlayerBattleState["teamId"]) {
  return {
    ownerTeamId: modo === "alianzas" ? teamId : null,
    reliquia: null,
    cards: [],
    oroConstruido: 0,
    objetivo: objetivoCastilloPorModo(modo),
  };
}

export function crearJugadorBatalla(player: MatchPlayer, modo: ModoJuego): PlayerBattleState {
  return {
    playerId: player.playerId,
    displayName: player.displayName,
    teamId: player.teamId,
    connected: player.connected,
    hand: [],
    field: [],
    discardPile: [],
    cemetery: [],
    castle: crearCastillo(modo, player.teamId),
    eliminated: false,
    initialDeployCount: 0,
    initialDeployConfirmed: false,
    drewThisTurn: false,
    recruitedThisTurn: false,
    pendingSpy: null,
  };
}

function compartirCastillosEnAlianzas(players: BattleState["players"]): void {
  const porEquipo = new Map<string, PlayerBattleState[]>();
  for (const player of Object.values(players)) {
    const key = player.teamId ?? player.playerId;
    const group = porEquipo.get(key) ?? [];
    group.push(player);
    porEquipo.set(key, group);
  }

  for (const group of Array.from(porEquipo.values())) {
    if (group.length > 1 && group[0].teamId) {
      const compartido = group[0].castle;
      for (const player of group.slice(1)) {
        player.castle = compartido;
      }
    }
  }
}

export function crearBatalla(players: MatchPlayer[], modo: ModoJuego, battleNumber: number, startingPlayerIndex = 0): BattleState {
  let warriorDeck = crearMazoGuerreros();
  if (players.length === 2) {
    const removed = new Set<Exclude<TipoGuerrero, "Dragon">>();
    warriorDeck = warriorDeck.filter((card) => {
      if (!removed.has(card.guerrero)) {
        removed.add(card.guerrero);
        return false;
      }
      return true;
    });
  }

  let resourceDeck = crearMazoRecursos();
  const battlePlayers = Object.fromEntries(
    players.map((player) => [player.playerId, crearJugadorBatalla(player, modo)])
  ) as BattleState["players"];

  compartirCastillosEnAlianzas(battlePlayers);

  for (const player of players) {
    const warriorDeal = robar(warriorDeck, GUERREROS_INICIALES);
    warriorDeck = warriorDeal.rest;
    const resourceDeal = robar(resourceDeck, RECURSOS_INICIALES);
    resourceDeck = resourceDeal.rest;
    battlePlayers[player.playerId].hand = [...warriorDeal.drawn, ...resourceDeal.drawn];
  }

  const turnOrder = players.map((player) => player.playerId);
  const initiativeRolls = Object.fromEntries(turnOrder.map((playerId) => [playerId, null])) as Record<string, number | null>;
  return {
    id: crearId("battle"),
    battleNumber,
    phase: "BATTLE_INITIATIVE",
    activePlayerId: null,
    turnOrder,
    currentTurn: 1,
    startingPlayerIndex,
    initiative: {
      contenders: [...turnOrder],
      rolls: initiativeRolls,
      winnerPlayerId: null,
      round: 1,
      status: "rolling",
    },
    players: battlePlayers,
    centralDeck: mezclar([...warriorDeck, ...resourceDeck]),
    discardPile: [],
    cemetery: [],
    result: null,
    log: [],
    updatedAt: Date.now(),
  };
}
