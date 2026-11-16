import { ActiveCombatState, CombatLogEntry } from '../types';
import { sortCombatantsPreservingTurn, findNextTurn, isCombatantEligibleForTurn } from './combatUtils';

/**
 * Pure combat turn transitions. Each function takes the current combat state
 * and returns the next one (the same reference when nothing changes, so
 * callers may pass the result straight to a state setter).
 *
 * Extracted verbatim from CombatTrackerView so the turn rules can be unit
 * tested without mounting the component tree.
 */

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function buildStartCombat(state: ActiveCombatState): ActiveCombatState {
  if (state.combatants.length === 0) return state;

  const { sortedCombatants } = sortCombatantsPreservingTurn(state.combatants, 0, false);
  const preparedCombatants = sortedCombatants.map((combatant) =>
    combatant.isDelayed ? { ...combatant, isDelayed: false } : combatant
  );
  const firstTurn = findNextTurn(preparedCombatants, -1);
  if (!firstTurn) return state;
  const firstCombatant = preparedCombatants[firstTurn.index];

  const newLog: CombatLogEntry[] = [
    {
      id: String(Date.now()),
      timestamp: nowTime(),
      round: 1,
      message: `Бой начался! Раунд 1. Первый ходит: ${firstCombatant.name} (инициатива ${firstCombatant.initiative})`,
      type: 'round',
    },
    ...state.log,
  ];

  return {
    ...state,
    isActive: true,
    round: 1,
    currentTurnIndex: firstTurn.index,
    combatants: preparedCombatants,
    log: newLog,
    turnHistory: [],
  };
}

export function applyNextTurn(state: ActiveCombatState): ActiveCombatState {
  if (state.combatants.length === 0) return state;

  const nextTurn = findNextTurn(state.combatants, state.currentTurnIndex);
  if (!nextTurn) return state;

  const nextIndex = nextTurn.index;
  const nextRound = state.round + nextTurn.roundIncrement;

  // Check if round finished
  const logMsg = nextTurn.roundIncrement > 0 ? `--- НАЧАЛО РАУНДА ${nextRound} ---` : '';

  // Decrement conditions for the combatant finishing their turn
  const currentCombatant = state.combatants[state.currentTurnIndex];
  const conditionsBefore = currentCombatant
    ? currentCombatant.conditions.map((condition) => ({ ...condition }))
    : [];
  let updatedCombatants = [...state.combatants];

  if (currentCombatant) {
    const updatedConditions = currentCombatant.conditions
      .map((cond) => {
        if (cond.roundsRemaining !== null) {
          return { ...cond, roundsRemaining: cond.roundsRemaining - 1 };
        }
        return cond;
      })
      .filter((cond) => cond.roundsRemaining === null || cond.roundsRemaining > 0);

    updatedCombatants = updatedCombatants.map((c, i) =>
      i === state.currentTurnIndex ? { ...c, conditions: updatedConditions } : c
    );
  }

  let nextCombatant = updatedCombatants[nextIndex];
  let delayCompleted = false;
  if (nextCombatant.isDelayed) {
    delayCompleted = true;
    updatedCombatants = updatedCombatants.map((c, i) =>
      i === nextIndex ? { ...c, isDelayed: false } : c
    );
    nextCombatant = updatedCombatants[nextIndex];
  }
  const turnMsg = `Ход перешел к: ${nextCombatant.name} (Инициатива ${nextCombatant.initiative})${
    delayCompleted ? ' — задержка завершена' : ''
  }`;

  const turnHistory = [
    ...(state.turnHistory ?? []),
    {
      fromCombatantId: currentCombatant?.id,
      toCombatantId: nextCombatant.id,
      fromRound: state.round,
      toRound: nextRound,
      conditionsBefore,
      delayedClearedId: delayCompleted ? nextCombatant.id : undefined,
    },
  ].slice(-50);

  const logsToAdd: CombatLogEntry[] = [];
  const timeStr = nowTime();

  if (logMsg) {
    logsToAdd.push({
      id: `round-${Date.now()}`,
      timestamp: timeStr,
      round: nextRound,
      message: logMsg,
      type: 'round',
    });
  }
  logsToAdd.push({
    id: `turn-${Date.now()}`,
    timestamp: timeStr,
    round: nextRound,
    message: turnMsg,
    type: 'turn',
  });

  return {
    ...state,
    round: nextRound,
    currentTurnIndex: nextIndex,
    combatants: updatedCombatants,
    log: [...logsToAdd, ...state.log.slice(0, 48)],
    turnHistory,
  };
}

export function applyPrevTurn(state: ActiveCombatState): ActiveCombatState {
  if (state.combatants.length === 0) return state;

  const history = state.turnHistory ?? [];
  const snapshot = history[history.length - 1];
  const currentCombatant = state.combatants[state.currentTurnIndex];

  if (
    snapshot &&
    currentCombatant?.id === snapshot.toCombatantId &&
    state.round === snapshot.toRound
  ) {
    const restoredCombatants = state.combatants.map((combatant) => {
      let restored = combatant;
      if (snapshot.fromCombatantId && combatant.id === snapshot.fromCombatantId) {
        restored = {
          ...restored,
          conditions: snapshot.conditionsBefore.map((condition) => ({ ...condition })),
        };
      }
      if (snapshot.delayedClearedId && combatant.id === snapshot.delayedClearedId) {
        restored = { ...restored, isDelayed: true };
      }
      return restored;
    });

    const restoredIndex = snapshot.fromCombatantId
      ? restoredCombatants.findIndex((combatant) => combatant.id === snapshot.fromCombatantId)
      : -1;

    return {
      ...state,
      round: snapshot.fromRound,
      currentTurnIndex:
        restoredIndex !== -1 ? restoredIndex : Math.max(0, state.currentTurnIndex - 1),
      combatants: restoredCombatants,
      turnHistory: history.slice(0, -1),
    };
  }

  let prevIndex = state.currentTurnIndex - 1;
  let prevRound = state.round;

  if (prevIndex < 0) {
    prevIndex = state.combatants.length - 1;
    prevRound = Math.max(1, prevRound - 1);
  }

  return {
    ...state,
    round: prevRound,
    currentTurnIndex: prevIndex,
  };
}

export function buildResetCombat(state: ActiveCombatState): ActiveCombatState {
  return {
    ...state,
    isActive: false,
    round: 1,
    currentTurnIndex: 0,
    combatants: state.combatants.map((combatant) =>
      combatant.isDelayed ? { ...combatant, isDelayed: false } : combatant
    ),
    turnHistory: [],
  };
}

export function applyRemoveCombatant(
  state: ActiveCombatState,
  id: string
): ActiveCombatState {
  const idx = state.combatants.findIndex((c) => c.id === id);
  if (idx === -1) return state;
  const updated = state.combatants.filter((c) => c.id !== id);

  let nextTurnIndex = state.currentTurnIndex;
  let nextRound = state.round;
  if (updated.length === 0) {
    nextTurnIndex = 0;
    nextRound = 1;
  } else if (state.isActive && idx === state.currentTurnIndex) {
    // Removing the active combatant passes the turn to the next eligible
    // participant, skipping defeated NPCs and wrapping the round if needed.
    const next = findNextTurn(updated, idx - 1);
    if (next) {
      nextTurnIndex = next.index;
      nextRound += next.roundIncrement;
    } else {
      nextTurnIndex = 0;
    }
  } else if (idx < state.currentTurnIndex) {
    nextTurnIndex = Math.max(0, nextTurnIndex - 1);
  } else if (nextTurnIndex >= updated.length) {
    nextTurnIndex = 0;
  }

  return {
    ...state,
    isActive: updated.length === 0 ? false : state.isActive,
    round: nextRound,
    combatants: updated,
    currentTurnIndex: nextTurnIndex,
  };
}

/**
 * Delay = move the combatant to the end of the current round. The badge
 * stays until their postponed turn actually starts.
 */
export function applyToggleDelay(
  state: ActiveCombatState,
  combatantId: string
): ActiveCombatState {
  const target = state.combatants.find((c) => c.id === combatantId);
  if (!target) return state;

  const makeLog = (message: string): CombatLogEntry => ({
    id: `delay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTime(),
    round: state.round,
    message,
    type: 'system',
  });

  if (target.isDelayed) {
    return {
      ...state,
      combatants: state.combatants.map((c) =>
        c.id === combatantId ? { ...c, isDelayed: false } : c
      ),
      log: [makeLog(`${target.name} снова в очереди хода`), ...state.log],
    };
  }

  if (!state.isActive) {
    return {
      ...state,
      combatants: state.combatants.map((c) =>
        c.id === combatantId ? { ...c, isDelayed: true } : c
      ),
      log: [makeLog(`${target.name} отмечен как задержавший ход`), ...state.log],
    };
  }

  const activeId = state.combatants[state.currentTurnIndex]?.id;
  const fromIndex = state.combatants.findIndex((c) => c.id === combatantId);
  const reordered = [...state.combatants];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.push({ ...moved, isDelayed: true });

  let nextTurnIndex: number;
  if (activeId === combatantId) {
    const movedIndex = reordered.length - 1;
    const nextEligible = reordered.findIndex(
      (combatant, index) =>
        index >= fromIndex && index < movedIndex && isCombatantEligibleForTurn(combatant)
    );
    if (nextEligible !== -1) {
      nextTurnIndex = nextEligible;
    } else {
      // Nobody else can act before the delayed combatant. Keep the turn on
      // them and clear the marker so it cannot stay stuck forever.
      nextTurnIndex = movedIndex;
      reordered[movedIndex] = { ...reordered[movedIndex], isDelayed: false };
    }
  } else {
    const activeIndex = reordered.findIndex((c) => c.id === activeId);
    nextTurnIndex =
      activeIndex !== -1
        ? activeIndex
        : Math.max(0, Math.min(state.currentTurnIndex, reordered.length - 1));
  }

  return {
    ...state,
    combatants: reordered,
    currentTurnIndex: nextTurnIndex,
    log: [
      makeLog(`${target.name} задерживает ход и переносится в конец раунда`),
      ...state.log,
    ],
  };
}

export function applyMoveOrder(
  state: ActiveCombatState,
  index: number,
  direction: 'up' | 'down'
): ActiveCombatState {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= state.combatants.length) return state;

  const list = [...state.combatants];
  const [moved] = list.splice(index, 1);
  list.splice(targetIndex, 0, moved);

  // Adjust turn index if current active was moved
  let newTurn = state.currentTurnIndex;
  if (state.currentTurnIndex === index) {
    newTurn = targetIndex;
  } else if (state.currentTurnIndex === targetIndex) {
    newTurn = index;
  }

  return {
    ...state,
    combatants: list,
    currentTurnIndex: newTurn,
  };
}
