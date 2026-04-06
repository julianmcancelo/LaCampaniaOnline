import type { BattleAction, ClientBattleView, ClientMatchView, SpyView } from "../../../../../motor/tipos";

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
