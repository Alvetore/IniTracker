import { Combatant } from '../types';

/**
 * Sorts combatants by initiative descending.
 * Tie-breaker 1: initiative modifier descending.
 * Tie-breaker 2: name alphabetical.
 *
 * If combat is active and currentTurnIndex is valid, preserves the active combatant's
 * turn by locating their ID in the newly sorted array and returning the new index.
 */
export function sortCombatantsPreservingTurn(
  combatants: Combatant[],
  currentTurnIndex: number = 0,
  isActive: boolean = false
): { sortedCombatants: Combatant[]; nextTurnIndex: number } {
  if (!combatants || combatants.length === 0) {
    return { sortedCombatants: [], nextTurnIndex: 0 };
  }

  if (combatants.length === 1) {
    return { sortedCombatants: [...combatants], nextTurnIndex: 0 };
  }

  // 1. Identify the currently active combatant before sorting
  const currentActiveId =
    isActive && currentTurnIndex >= 0 && currentTurnIndex < combatants.length
      ? combatants[currentTurnIndex]?.id
      : null;

  // 2. Perform stable sort
  const sortedCombatants = [...combatants].sort((a, b) => {
    // Primary: initiative descending
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    // Tie-breaker 1: initiative modifier descending
    const modA = a.initiativeModifier ?? 0;
    const modB = b.initiativeModifier ?? 0;
    if (modB !== modA) {
      return modB - modA;
    }
    // Tie-breaker 2: name alphabetical
    return a.name.localeCompare(b.name, 'ru');
  });

  // 3. Recalculate nextTurnIndex
  let nextTurnIndex = 0;
  if (isActive && currentActiveId) {
    const foundIndex = sortedCombatants.findIndex((c) => c.id === currentActiveId);
    nextTurnIndex = foundIndex !== -1 ? foundIndex : Math.min(currentTurnIndex, sortedCombatants.length - 1);
  } else if (isActive) {
    nextTurnIndex = Math.max(0, Math.min(currentTurnIndex, sortedCombatants.length - 1));
  } else {
    nextTurnIndex = 0;
  }

  return { sortedCombatants, nextTurnIndex };
}
