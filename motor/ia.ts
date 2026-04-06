// IA del CPU para el modo local (práctica).
// Implementa tres niveles de dificultad: fácil, normal y difícil.
// Recibe el BattleState completo (tiene acceso a la mano del CPU) y devuelve una BattleAction válida.
import { COMPATIBILIDAD_ARMA, MAXIMO_GUERREROS_CAMPO, VENTAJAS } from "./constantes";
import type {
  BattleAction,
  BattleState,
  Carta,
  CartaArma,
  CartaGuerrero,
  CartaOro,
  PlayerBattleState,
  TipoGuerrero,
  UnitInPlay,
} from "./tipos";

export type DificultadCPU = "facil" | "normal" | "dificil";

// ─── Utilidades internas ──────────────────────────────────────────────────────

function aleatorio<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

function guerrerosEnMano(cpu: PlayerBattleState): Carta[] {
  return cpu.hand.filter(
    (carta) => carta.tipo === "guerrero" || (carta.tipo === "especial" && carta.especial === "Dragon"),
  );
}

function armasEnMano(cpu: PlayerBattleState): CartaArma[] {
  return cpu.hand.filter((carta): carta is CartaArma => carta.tipo === "arma");
}

function armaCompatibleConUnidad(arma: CartaArma, unidad: UnitInPlay): boolean {
  if (unidad.guerrero === "Dragon") return true;
  return COMPATIBILIDAD_ARMA[arma.arma] === unidad.guerrero;
}

// Devuelve pares {atacante, arma} válidos para el CPU
function paresAtaque(cpu: PlayerBattleState): Array<{ atacante: UnitInPlay; arma: CartaArma }> {
  const pares: Array<{ atacante: UnitInPlay; arma: CartaArma }> = [];
  const armas = armasEnMano(cpu);
  for (const atacante of cpu.field) {
    if (!atacante.canAttackThisTurn) continue;
    for (const arma of armas) {
      if (armaCompatibleConUnidad(arma, atacante)) {
        pares.push({ atacante, arma });
      }
    }
  }
  return pares;
}

// Calcula daño esperado teniendo en cuenta ventajas del triángulo
function danoEsperado(atacante: TipoGuerrero, defensor: TipoGuerrero, valorArma: number): number {
  if (atacante === "Dragon" || defensor === "Dragon") return valorArma / 2;
  const tieneVentaja = VENTAJAS[atacante as Exclude<TipoGuerrero, "Dragon">] === defensor;
  return tieneVentaja ? valorArma : valorArma / 2;
}

// Obtiene el ID del oponente humano principal
function idOponente(batalla: BattleState, idCpu: string): string | null {
  return Object.keys(batalla.players).find((id) => id !== idCpu) ?? null;
}

// ─── DIFICULTAD FÁCIL ─────────────────────────────────────────────────────────
// Elige acciones al azar dentro de las que son válidas en cada fase.

function accionFacil(batalla: BattleState, idCpu: string): BattleAction {
  const cpu = batalla.players[idCpu];
  if (!cpu) throw new Error("CPU no encontrada en la batalla.");
  const idOp = idOponente(batalla, idCpu);

  switch (batalla.phase) {
    case "BATTLE_INITIATIVE":
      return { type: "ROLL_INITIATIVE", payload: {} };

    case "INITIAL_DEPLOY": {
      // Si ya confirmó, avanza; si no, despliega un guerrero al azar
      if (cpu.initialDeployConfirmed) return { type: "ADVANCE_PHASE", payload: {} };
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO) {
        const elegido = aleatorio(guerreros)!;
        return { type: "INITIAL_DEPLOY", payload: { cardIds: [elegido.id] } };
      }
      return { type: "CONFIRM_INITIAL_DEPLOY", payload: {} };
    }

    case "TURN_DRAW": {
      if (cpu.hand.length >= 7) {
        // Descarta una carta al azar
        const descarte = aleatorio(cpu.hand);
        if (descarte) return { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: descarte.id } };
      }
      return { type: "DRAW_CARD", payload: {} };
    }

    case "TURN_ATTACK": {
      const pares = paresAtaque(cpu);
      const oponente = idOp ? batalla.players[idOp] : null;
      const objetivos = oponente?.field ?? [];
      if (pares.length > 0 && objetivos.length > 0) {
        const par = aleatorio(pares)!;
        const objetivo = aleatorio(objetivos)!;
        return {
          type: "ATTACK_WITH_WEAPON",
          payload: { attackerId: par.atacante.instanceId, defenderId: objetivo.instanceId, weaponCardId: par.arma.id },
        };
      }
      // Reclutar guerrero si hay espacio
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO && !cpu.recruitedThisTurn) {
        return { type: "RECRUIT", payload: { cardId: aleatorio(guerreros)!.id } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_SABOTAGE":
      return { type: "ADVANCE_PHASE", payload: {} };

    case "TURN_TRADE":
      return { type: "ADVANCE_PHASE", payload: {} };

    case "TURN_BUILD":
      return { type: "ADVANCE_PHASE", payload: {} };

    case "TURN_END_CHECKS":
      return { type: "ADVANCE_PHASE", payload: {} };

    default:
      return { type: "ADVANCE_PHASE", payload: {} };
  }
}

// ─── DIFICULTAD NORMAL ────────────────────────────────────────────────────────
// Lógica con prioridades básicas de juego.

function accionNormal(batalla: BattleState, idCpu: string): BattleAction {
  const cpu = batalla.players[idCpu];
  if (!cpu) throw new Error("CPU no encontrada en la batalla.");
  const idOp = idOponente(batalla, idCpu);

  switch (batalla.phase) {
    case "BATTLE_INITIATIVE":
      return { type: "ROLL_INITIATIVE", payload: {} };

    case "INITIAL_DEPLOY": {
      if (cpu.initialDeployConfirmed) return { type: "ADVANCE_PHASE", payload: {} };
      // Prefiere Caballero o Mago, luego Arquero, luego Dragon
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO) {
        const preferido =
          guerreros.find((g) => g.tipo === "guerrero" && (g.guerrero === "Caballero" || g.guerrero === "Mago")) ??
          guerreros[0]!;
        // Despliega hasta 2 guerreros
        const desplegarHasta = Math.min(2, guerreros.length, MAXIMO_GUERREROS_CAMPO - cpu.field.length);
        const ids = guerreros.slice(0, desplegarHasta).map((g) => g.id);
        if (cpu.field.length === 0) {
          return { type: "INITIAL_DEPLOY", payload: { cardIds: [preferido.id] } };
        }
        return { type: "INITIAL_DEPLOY", payload: { cardIds: ids } };
      }
      return { type: "CONFIRM_INITIAL_DEPLOY", payload: {} };
    }

    case "TURN_DRAW": {
      if (cpu.hand.length >= 7) {
        // Descarta la carta de menor valor (arma o oro)
        const candidatos = cpu.hand
          .filter((carta) => carta.tipo === "arma" || carta.tipo === "oro")
          .sort((a, b) => (a as CartaArma).valor - (b as CartaArma).valor);
        const descarte = candidatos[0] ?? cpu.hand[0];
        if (descarte) return { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: descarte.id } };
      }
      return { type: "DRAW_CARD", payload: {} };
    }

    case "TURN_ATTACK": {
      const oponente = idOp ? batalla.players[idOp] : null;
      const objetivos = oponente?.field ?? [];
      const pares = paresAtaque(cpu);

      if (pares.length > 0 && objetivos.length > 0) {
        // Elige el objetivo con menos vida
        const objetivoDebil = objetivos.reduce((min, u) => (u.vida < min.vida ? u : min), objetivos[0]!);
        // Elige el arma de mayor valor compatible con el atacante
        const mejorPar = pares.reduce((mejor, par) => (par.arma.valor > mejor.arma.valor ? par : mejor), pares[0]!);
        return {
          type: "ATTACK_WITH_WEAPON",
          payload: { attackerId: mejorPar.atacante.instanceId, defenderId: objetivoDebil.instanceId, weaponCardId: mejorPar.arma.id },
        };
      }

      // Reclutar si hay guerreros en mano y espacio
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO && !cpu.recruitedThisTurn) {
        return { type: "RECRUIT", payload: { cardId: guerreros[0]!.id } };
      }

      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_SABOTAGE": {
      // Usa Ladrón si lo tiene
      const ladron = cpu.hand.find((c) => c.tipo === "especial" && c.especial === "Ladron");
      if (ladron && idOp) {
        return { type: "USE_THIEF", payload: { cardId: ladron.id, targetPlayerId: idOp } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_TRADE": {
      // Usa Oro si tiene valor >= 4
      const oroAlto = cpu.hand
        .filter((c): c is CartaOro => c.tipo === "oro" && (c as CartaOro).valor >= 4)
        .sort((a, b) => b.valor - a.valor)[0];
      if (oroAlto) {
        return { type: "TRADE_WITH_GOLD", payload: { goldCardId: oroAlto.id } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_BUILD": {
      // Pone Reliquia si no tiene y tiene carta de valor 1
      if (!cpu.castle.reliquia) {
        const reliquia = cpu.hand.find(
          (c) => (c.tipo === "arma" || c.tipo === "oro") && (c as CartaArma).valor === 1,
        );
        if (reliquia) return { type: "BUILD_RELIC", payload: { cardId: reliquia.id } };
      } else {
        // Agrega Oro al castillo
        const oroParaCastillo = cpu.hand.find((c) => c.tipo === "oro");
        if (oroParaCastillo) return { type: "BUILD_CASTLE_CARD", payload: { cardId: oroParaCastillo.id } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_END_CHECKS":
      return { type: "ADVANCE_PHASE", payload: {} };

    default:
      return { type: "ADVANCE_PHASE", payload: {} };
  }
}

// ─── DIFICULTAD DIFÍCIL ───────────────────────────────────────────────────────
// Estrategia más agresiva y óptima.

function accionDificil(batalla: BattleState, idCpu: string): BattleAction {
  const cpu = batalla.players[idCpu];
  if (!cpu) throw new Error("CPU no encontrada en la batalla.");
  const idOp = idOponente(batalla, idCpu);

  switch (batalla.phase) {
    case "BATTLE_INITIATIVE":
      return { type: "ROLL_INITIATIVE", payload: {} };

    case "INITIAL_DEPLOY": {
      if (cpu.initialDeployConfirmed) return { type: "ADVANCE_PHASE", payload: {} };
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO) {
        // Despliega hasta 3 guerreros, priorizando Caballero
        const ordenados = [...guerreros].sort((a, b) => {
          const prioridadA = a.tipo === "guerrero" && a.guerrero === "Caballero" ? 0 : a.tipo === "guerrero" && a.guerrero === "Mago" ? 1 : 2;
          const prioridadB = b.tipo === "guerrero" && b.guerrero === "Caballero" ? 0 : b.tipo === "guerrero" && b.guerrero === "Mago" ? 1 : 2;
          return prioridadA - prioridadB;
        });
        const cuantos = Math.min(3, ordenados.length, MAXIMO_GUERREROS_CAMPO - cpu.field.length);
        const ids = ordenados.slice(0, cuantos).map((g) => g.id);
        return { type: "INITIAL_DEPLOY", payload: { cardIds: ids } };
      }
      return { type: "CONFIRM_INITIAL_DEPLOY", payload: {} };
    }

    case "TURN_DRAW": {
      if (cpu.hand.length >= 7) {
        // Descarta la carta de menor valor útil
        const candidatos = cpu.hand
          .filter((carta) => carta.tipo === "arma" || carta.tipo === "oro")
          .sort((a, b) => (a as CartaArma).valor - (b as CartaArma).valor);
        const descarte = candidatos[0] ?? cpu.hand[0];
        if (descarte) return { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: descarte.id } };
      }
      return { type: "DRAW_CARD", payload: {} };
    }

    case "TURN_ATTACK": {
      const oponente = idOp ? batalla.players[idOp] : null;
      const objetivos = oponente?.field ?? [];
      const pares = paresAtaque(cpu);

      if (pares.length > 0 && objetivos.length > 0) {
        // Evalúa el par con mayor daño esperado al objetivo más débil
        let mejorPuntuacion = -1;
        let mejorPar = pares[0]!;
        let mejorObjetivo = objetivos[0]!;

        for (const par of pares) {
          for (const objetivo of objetivos) {
            const danio = danoEsperado(par.atacante.guerrero, objetivo.guerrero, par.arma.valor);
            const puntuacion = danio - objetivo.vida; // Positivo = elimina el objetivo
            if (puntuacion > mejorPuntuacion) {
              mejorPuntuacion = puntuacion;
              mejorPar = par;
              mejorObjetivo = objetivo;
            }
          }
        }

        return {
          type: "ATTACK_WITH_WEAPON",
          payload: { attackerId: mejorPar.atacante.instanceId, defenderId: mejorObjetivo.instanceId, weaponCardId: mejorPar.arma.id },
        };
      }

      // Reclutar si hay guerreros en mano y espacio
      const guerreros = guerrerosEnMano(cpu);
      if (guerreros.length > 0 && cpu.field.length < MAXIMO_GUERREROS_CAMPO && !cpu.recruitedThisTurn) {
        const mejorGuerrero =
          (guerreros.find((g) => g.tipo === "guerrero" && g.guerrero === "Caballero") as CartaGuerrero | undefined) ??
          guerreros[0]!;
        return { type: "RECRUIT", payload: { cardId: mejorGuerrero.id } };
      }

      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_SABOTAGE": {
      // Usa Espía primero para ver la mano del oponente
      const espia = cpu.hand.find((c) => c.tipo === "especial" && c.especial === "Espia");
      if (espia && idOp) {
        return { type: "USE_SPY", payload: { cardId: espia.id, targetPlayerId: idOp } };
      }
      // Luego Ladrón
      const ladron = cpu.hand.find((c) => c.tipo === "especial" && c.especial === "Ladron");
      if (ladron && idOp) {
        return { type: "USE_THIEF", payload: { cardId: ladron.id, targetPlayerId: idOp } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_TRADE": {
      // Prioriza Oro de mayor valor
      const oroPorValor = cpu.hand
        .filter((c): c is CartaOro => c.tipo === "oro")
        .sort((a, b) => b.valor - a.valor);
      if (oroPorValor[0] && oroPorValor[0].valor >= 2) {
        return { type: "TRADE_WITH_GOLD", payload: { goldCardId: oroPorValor[0].id } };
      }
      // Trueque si tiene 3+ cartas de poco valor
      const descartables = cpu.hand.filter(
        (c) => (c.tipo === "arma" || c.tipo === "oro") && (c as CartaArma).valor <= 2,
      );
      if (descartables.length >= 3) {
        const ids = descartables.slice(0, 3).map((c) => c.id);
        return { type: "TRADE_BARTER", payload: { paymentCardIds: ids, amountToDraw: 1 } };
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_BUILD": {
      // Prioriza castillo agresivamente
      if (!cpu.castle.reliquia) {
        const reliquia = cpu.hand.find(
          (c) => (c.tipo === "arma" || c.tipo === "oro") && (c as CartaArma).valor === 1,
        );
        if (reliquia) return { type: "BUILD_RELIC", payload: { cardId: reliquia.id } };
      } else {
        // Agrega el Oro de mayor valor al castillo
        const oroPorValor = cpu.hand
          .filter((c): c is CartaOro => c.tipo === "oro")
          .sort((a, b) => b.valor - a.valor);
        if (oroPorValor[0]) {
          return { type: "BUILD_CASTLE_CARD", payload: { cardId: oroPorValor[0].id } };
        }
      }
      return { type: "ADVANCE_PHASE", payload: {} };
    }

    case "TURN_END_CHECKS":
      return { type: "ADVANCE_PHASE", payload: {} };

    default:
      return { type: "ADVANCE_PHASE", payload: {} };
  }
}

// ─── Entrada pública ─────────────────────────────────────────────────────────

export function decidirAccionCPU(
  batalla: BattleState,
  idJugadorCPU: string,
  dificultad: DificultadCPU,
): BattleAction {
  try {
    switch (dificultad) {
      case "facil":
        return accionFacil(batalla, idJugadorCPU);
      case "normal":
        return accionNormal(batalla, idJugadorCPU);
      case "dificil":
        return accionDificil(batalla, idJugadorCPU);
    }
  } catch {
    // Fallback seguro: siempre avanzar de fase
    return { type: "ADVANCE_PHASE", payload: {} };
  }
}
