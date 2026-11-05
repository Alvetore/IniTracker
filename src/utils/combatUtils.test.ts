import { describe, expect, it } from 'vitest';
import { Combatant } from '../types';
import {
  findNextTurn,
  isCombatantEligibleForTurn,
  sortCombatantsPreservingTurn,
} from './combatUtils';

function combatant(overrides: Partial<Combatant> & Pick<Combatant, 'id' | 'name'>): Combatant {
  return {
    type: 'enemy',
    initiative: 10,
    initiativeModifier: 0,
    hp: { current: 10, max: 10, temp: 0 },
    armorClass: 10,
    conditions: [],
    notes: '',
    isDefeated: false,
    isDelayed: false,
    ...overrides,
  };
}

describe('sortCombatantsPreservingTurn', () => {
  it('sorts by initiative, then modifier, then name', () => {
    const combatants = [
      combatant({ id: 'a', name: 'Бета', initiative: 15, initiativeModifier: 1 }),
      combatant({ id: 'b', name: 'Альфа', initiative: 15, initiativeModifier: 1 }),
      combatant({ id: 'c', name: 'Гамма', initiative: 15, initiativeModifier: 3 }),
      combatant({ id: 'd', name: 'Дельта', initiative: 20 }),
    ];

    const result = sortCombatantsPreservingTurn(combatants, 0, false);

    expect(result.sortedCombatants.map((item) => item.id)).toEqual(['d', 'c', 'b', 'a']);
    expect(result.nextTurnIndex).toBe(0);
  });

  it('preserves the active combatant when adding a higher-initiative participant', () => {
    const active = combatant({ id: 'active', name: 'Активный', initiative: 10 });
    const other = combatant({ id: 'other', name: 'Другой', initiative: 5 });
    const newcomer = combatant({ id: 'new', name: 'Новый', initiative: 30 });

    const result = sortCombatantsPreservingTurn([active, other, newcomer], 0, true);

    expect(result.sortedCombatants.map((item) => item.id)).toEqual(['new', 'active', 'other']);
    expect(result.nextTurnIndex).toBe(1);
  });
});

describe('findNextTurn', () => {
  it('skips defeated NPCs', () => {
    const combatants = [
      combatant({ id: 'current', name: 'Текущий' }),
      combatant({ id: 'dead', name: 'Мёртвый', isDefeated: true }),
      combatant({ id: 'alive', name: 'Живой' }),
    ];

    expect(findNextTurn(combatants, 0)).toEqual({ index: 2, roundIncrement: 0 });
  });

  it('keeps defeated players in the rotation', () => {
    const player = combatant({
      id: 'player',
      name: 'Игрок',
      type: 'player',
      isDefeated: true,
    });

    expect(isCombatantEligibleForTurn(player)).toBe(true);
    expect(findNextTurn([player], 0)).toEqual({ index: 0, roundIncrement: 1 });
  });

  it('increments the round when wrapping', () => {
    const combatants = [
      combatant({ id: 'a', name: 'A' }),
      combatant({ id: 'b', name: 'B' }),
    ];

    expect(findNextTurn(combatants, 1)).toEqual({ index: 0, roundIncrement: 1 });
  });

  it('returns null when nobody can act', () => {
    const combatants = [
      combatant({ id: 'a', name: 'A', isDefeated: true }),
      combatant({ id: 'b', name: 'B', isDefeated: true }),
    ];

    expect(findNextTurn(combatants, 0)).toBeNull();
  });
});
