import type { AvailableAction, BattleAction, BattleActionType } from "../../../../motor/tipos";

export function etiquetaAccion(tipo: AvailableAction["type"]): string {
  switch (tipo) {
    case "SET_READY":
      return "Estoy listo";
    case "START_MATCH":
      return "Iniciar partida";
    case "ASSIGN_TEAM":
      return "Asignar equipo";
    case "ROLL_INITIATIVE":
      return "Tirar dado";
    case "DRAW_CARD":
      return "Tomar carta";
    case "DISCARD_ONE_FOR_DRAW":
      return "Descartar y tomar";
    case "CONFIRM_INITIAL_DEPLOY":
      return "Confirmar despliegue";
    case "ADVANCE_PHASE":
      return "Pasar fase";
    default:
      return "Accion tactica";
  }
}

export function esAccionSimple(tipo: AvailableAction["type"]): tipo is BattleActionType | "SET_READY" | "START_MATCH" {
  return ["SET_READY", "START_MATCH", "ROLL_INITIATIVE", "DRAW_CARD", "CONFIRM_INITIAL_DEPLOY", "ADVANCE_PHASE"].includes(tipo);
}

export function crearAccionSimple(tipo: BattleActionType): BattleAction | null {
  switch (tipo) {
    case "ROLL_INITIATIVE":
    case "DRAW_CARD":
    case "CONFIRM_INITIAL_DEPLOY":
    case "ADVANCE_PHASE":
      return { type: tipo, payload: {} };
    default:
      return null;
  }
}
