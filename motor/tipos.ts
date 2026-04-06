export type ModoJuego = "individual" | "alianzas";

export type EquipoId = "A" | "B";

export type TipoCarta = "guerrero" | "arma" | "oro" | "especial";

export type TipoGuerrero = "Mago" | "Caballero" | "Arquero" | "Dragon";

export type TipoArma = "Pocion" | "Espada" | "Flecha";

export type NombreEspecial = "Poder" | "Dragon" | "Ladron" | "Espia" | "Asedio";

export type TipoDanio = "puro" | "impuro";

export type BattlePhase =
  | "WAITING_PLAYERS"
  | "BATTLE_SETUP"
  | "BATTLE_INITIATIVE"
  | "INITIAL_DEPLOY"
  | "TURN_DRAW"
  | "TURN_ATTACK"
  | "TURN_SABOTAGE"
  | "TURN_TRADE"
  | "TURN_BUILD"
  | "TURN_END_CHECKS"
  | "BATTLE_OVER"
  | "MATCH_OVER";

export type RoomStatus = "waiting" | "playing" | "finished";

export type BattleActionType =
  | "ROLL_INITIATIVE"
  | "INITIAL_DEPLOY"
  | "CONFIRM_INITIAL_DEPLOY"
  | "DRAW_CARD"
  | "DISCARD_ONE_FOR_DRAW"
  | "ATTACK_WITH_WEAPON"
  | "ATTACK_WITH_SIEGE"
  | "USE_POWER_CARD"
  | "USE_THIEF"
  | "USE_SPY"
  | "TRADE_WITH_GOLD"
  | "TRADE_BARTER"
  | "BUILD_RELIC"
  | "BUILD_CASTLE_CARD"
  | "RECRUIT"
  | "SEND_REINFORCEMENT"
  | "ADVANCE_PHASE";

export interface CartaBase {
  id: string;
  tipo: TipoCarta;
  nombre: string;
}

export interface CartaGuerrero extends CartaBase {
  tipo: "guerrero";
  guerrero: Exclude<TipoGuerrero, "Dragon">;
}

export interface CartaArma extends CartaBase {
  tipo: "arma";
  arma: TipoArma;
  valor: number;
  compatibleCon: Exclude<TipoGuerrero, "Dragon">;
}

export interface CartaOro extends CartaBase {
  tipo: "oro";
  valor: number;
}

export interface CartaEspecial extends CartaBase {
  tipo: "especial";
  especial: NombreEspecial;
}

export type Carta = CartaGuerrero | CartaArma | CartaOro | CartaEspecial;

export interface DamageMark {
  cardId: string;
  cardName: string;
  amount: number;
  kind: TipoDanio;
  sourceWeapon: TipoArma | "Especial";
}

export interface ShieldState {
  cardId: string;
  remaining: number;
}

export interface UnitInPlay {
  instanceId: string;
  sourceCardId: string;
  guerrero: TipoGuerrero;
  vida: number;
  vidaMaxima: number;
  damageTaken: number;
  damageMarks: DamageMark[];
  shield: ShieldState | null;
  enteredTurn: number;
  canAttackThisTurn: boolean;
}

export interface CastleState {
  ownerTeamId: EquipoId | null;
  reliquia: CartaArma | CartaOro | null;
  cards: Array<CartaArma | CartaOro>;
  oroConstruido: number;
  objetivo: number;
}

export interface PlayerBattleState {
  playerId: string;
  displayName: string;
  teamId: EquipoId | null;
  connected: boolean;
  hand: Carta[];
  field: UnitInPlay[];
  discardPile: Carta[];
  cemetery: Carta[];
  castle: CastleState;
  eliminated: boolean;
  initialDeployCount: number;
  initialDeployConfirmed: boolean;
  drewThisTurn: boolean;
  recruitedThisTurn: boolean;
  pendingSpy: SpyView | null;
}

export interface BattleLogEntry {
  id: string;
  createdAt: number;
  actorPlayerId: string | null;
  text: string;
}

export interface BattleInitiativeState {
  contenders: string[];
  rolls: Record<string, number | null>;
  winnerPlayerId: string | null;
  round: number;
  status: "rolling" | "tiebreak" | "resolved";
}

export interface BattleResultSummary {
  winnerPlayerId: string | null;
  winnerTeamId: EquipoId | null;
  reason: "elimination" | "castle";
}

export interface BattleState {
  id: string;
  battleNumber: number;
  phase: BattlePhase;
  activePlayerId: string | null;
  turnOrder: string[];
  currentTurn: number;
  startingPlayerIndex: number;
  initiative: BattleInitiativeState;
  players: Record<string, PlayerBattleState>;
  centralDeck: Carta[];
  discardPile: Carta[];
  cemetery: Carta[];
  result: BattleResultSummary | null;
  log: BattleLogEntry[];
  updatedAt: number;
}

export interface MatchPlayer {
  playerId: string;
  displayName: string;
  socketId: string | null;
  isReady: boolean;
  isHost: boolean;
  teamId: EquipoId | null;
  connected: boolean;
}

export interface MatchState {
  id: string;
  roomId: string;
  mode: ModoJuego;
  targetBattleWins: number;
  players: MatchPlayer[];
  scoreByPlayer: Record<string, number>;
  scoreByTeam: Partial<Record<EquipoId, number>>;
  currentBattle: BattleState | null;
  battleHistory: BattleResultSummary[];
  winnerPlayerId: string | null;
  winnerTeamId: EquipoId | null;
}

export interface Sala {
  id: string;
  nombre: string;
  modo: ModoJuego;
  maxJugadores: number;
  hostPlayerId: string;
  estado: RoomStatus;
  playerSlots: MatchPlayer[];
  matchState: MatchState | null;
  createdAt: number;
  updatedAt: number;
}

export interface RoomSummary {
  id: string;
  nombre: string;
  modo: ModoJuego;
  maxJugadores: number;
  estado: RoomStatus;
  hostPlayerId: string;
  players: Array<Pick<MatchPlayer, "playerId" | "displayName" | "isReady" | "isHost" | "teamId" | "connected">>;
}

export interface OpponentBattleView {
  playerId: string;
  displayName: string;
  teamId: EquipoId | null;
  connected: boolean;
  cardCount: number;
  field: UnitInPlay[];
  castle: CastleState;
  eliminated: boolean;
}

export interface SpyView {
  source: "deck" | "hand";
  targetPlayerId?: string;
  targetLabel: string;
  cards: Carta[];
}

export interface ClientBattleView {
  id: string;
  battleNumber: number;
  phase: BattlePhase;
  activePlayerId: string | null;
  currentTurn: number;
  turnOrder: string[];
  initiative: BattleInitiativeState;
  me: PlayerBattleState;
  opponents: OpponentBattleView[];
  centralDeckCount: number;
  discardCount: number;
  cemeteryCount: number;
  log: BattleLogEntry[];
}

export interface ClientMatchView {
  matchId: string | null;
  roomId: string;
  roomName: string;
  mode: ModoJuego;
  targetBattleWins: number;
  players: MatchPlayer[];
  scoreByPlayer: Record<string, number>;
  scoreByTeam: Partial<Record<EquipoId, number>>;
  winnerPlayerId: string | null;
  winnerTeamId: EquipoId | null;
}

export interface AvailableAction {
  type: BattleActionType | "START_MATCH" | "SET_READY" | "ASSIGN_TEAM";
  enabled: boolean;
  reason?: string;
}

export interface ClientGameView {
  playerId: string;
  room: RoomSummary;
  match: ClientMatchView;
  battle: ClientBattleView | null;
  availableActions: AvailableAction[];
  privateContext: {
    spyView: SpyView | null;
  };
}

export interface InitialDeployPayload {
  cardIds: string[];
}

export interface RollInitiativePayload {
  playerId?: string;
}

export interface ConfirmInitialDeployPayload {
  playerId?: string;
}

export interface DiscardOneForDrawPayload {
  cardId: string;
}

export interface AttackWithWeaponPayload {
  attackerId: string;
  defenderId: string;
  weaponCardId: string;
}

export interface AttackWithSiegePayload {
  cardId: string;
  targetPlayerId: string;
}

export interface UsePowerCardPayload {
  cardId: string;
  sourceUnitId: string;
  targetUnitId: string;
}

export interface UseThiefPayload {
  cardId: string;
  targetPlayerId: string;
}

export interface UseSpyPayload {
  cardId: string;
  targetPlayerId?: string;
  targetDeck?: boolean;
}

export interface TradeWithGoldPayload {
  goldCardId: string;
  amountToDraw?: number;
}

export interface TradeBarterPayload {
  paymentCardIds: string[];
  amountToDraw: 1 | 2;
}

export interface BuildRelicPayload {
  cardId: string;
  targetPlayerId?: string;
}

export interface BuildCastleCardPayload {
  cardId: string;
  targetPlayerId?: string;
}

export interface RecruitPayload {
  cardId: string;
}

export interface SendReinforcementPayload {
  cardId: string;
  allyPlayerId: string;
}

export interface ActionPayloadMap {
  ROLL_INITIATIVE: RollInitiativePayload;
  INITIAL_DEPLOY: InitialDeployPayload;
  CONFIRM_INITIAL_DEPLOY: ConfirmInitialDeployPayload;
  DRAW_CARD: Record<string, never>;
  DISCARD_ONE_FOR_DRAW: DiscardOneForDrawPayload;
  ATTACK_WITH_WEAPON: AttackWithWeaponPayload;
  ATTACK_WITH_SIEGE: AttackWithSiegePayload;
  USE_POWER_CARD: UsePowerCardPayload;
  USE_THIEF: UseThiefPayload;
  USE_SPY: UseSpyPayload;
  TRADE_WITH_GOLD: TradeWithGoldPayload;
  TRADE_BARTER: TradeBarterPayload;
  BUILD_RELIC: BuildRelicPayload;
  BUILD_CASTLE_CARD: BuildCastleCardPayload;
  RECRUIT: RecruitPayload;
  SEND_REINFORCEMENT: SendReinforcementPayload;
  ADVANCE_PHASE: Record<string, never>;
}

export type BattleAction = {
  [K in BattleActionType]: {
    type: K;
    payload: ActionPayloadMap[K];
  };
}[BattleActionType];

export interface RoomCreatePayload {
  roomName: string;
  displayName: string;
  mode: ModoJuego;
  maxPlayers: number;
  teamId?: EquipoId | null;
}

export interface RoomJoinPayload {
  roomId: string;
  displayName: string;
  teamId?: EquipoId | null;
}

export interface SessionReadyPayload {
  playerId: string;
}
