import { describe, expect, it } from 'vitest';
import { ActiveCombatState, Combatant, Condition } from '../types';
import {
  applyMoveOrder,
  applyNextTurn,
  applyPrevTurn,
  applyRemoveCombatant,
  applyToggleDelay,
  buildResetCombat,
  buildStartCombat,
} from './turnEngine';

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

function state(overrides: Partial<ActiveCombatState> = {}): ActiveCombatState {
  return {
    isActive: true,
    round: 1,
    currentTurnIndex: 0,
    combatants: [],
    log: [],
    diceSystem: 'd20',
    turnHistory: [],
    ...overrides,
  };
}

describe('buildStartCombat', () => {
  it('starts on the first eligible combatant and clears prep delay flags', () => {
    const delayed = combatant({ id: 'delayed', name: 'Задержанный', initiative: 20, isDelayed: true });
    const defeated = combatant({ id: 'dead', name: 'Поверженный', initiative: 15, isDefeated: true });
    const player = combatant({ id: 'player', name: 'Игрок', type: 'player', initiative: 10 });
    const next = buildStartCombat(
      state({ isActive: false, combatants: [delayed, defeated, player] })
    );

    expect(next.isActive).toBe(true);
    expect(next.round).toBe(1);
    expect(next.currentTurnIndex).toBe(0);
    expect(next.combatants[0].isDelayed).toBe(false);
    expect(next.log[0].type).toBe('round');
    expect(next.log[0].message).toContain('Задержанный');
  });

  it('returns the same state when nobody can act', () => {
    const everyone = state({
      combatants: [combatant({ id: 'dead', name: 'Мёртвый', isDefeated: true })],
    });
    expect(buildStartCombat(everyone)).toBe(everyone);
  });
});

describe('applyNextTurn', () => {
  it('decrements timed conditions of the finishing combatant and drops expired ones', () => {
    const two: Condition = { id: 'fire-2', name: 'Горит', roundsRemaining: 2 };
    const last: Condition = { id: 'bleed-1', name: 'Кровь', roundsRemaining: 1 };
    const forever: Condition = { id: 'curse', name: 'Проклятие', roundsRemaining: null };
    const caster = combatant({ id: 'a', name: 'А', initiative: 20, conditions: [two, last, forever] });
    const other = combatant({ id: 'b', name: 'Б', initiative: 10 });

    const next = applyNextTurn(state({ combatants: [caster, other], currentTurnIndex: 0 }));
    const updatedA = next.combatants.find((c) => c.id === 'a')!;

    expect(updatedA.conditions.map((c) => [c.id, c.roundsRemaining])).toEqual([
      ['fire-2', 1],
      ['curse', null],
    ]);
  });

  it('wraps the round when passing the last combatant', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const b = combatant({ id: 'b', name: 'Б' });
    const next = applyNextTurn(
      state({ combatants: [a, b], currentTurnIndex: 1, round: 3 })
    );

    expect(next.round).toBe(4);
    expect(next.currentTurnIndex).toBe(0);
    expect(next.log.some((e) => e.type === 'round' && e.message.includes('4'))).toBe(true);
    expect(next.log.some((e) => e.type === 'turn')).toBe(true);
  });

  it('clears the delayed marker when the postponed turn starts', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const delayed = combatant({ id: 'b', name: 'Б', isDelayed: true });
    const next = applyNextTurn(state({ combatants: [a, delayed], currentTurnIndex: 0 }));

    expect(next.currentTurnIndex).toBe(1);
    expect(next.combatants.find((c) => c.id === 'b')!.isDelayed).toBe(false);
    expect(next.log[0].message).toContain('задержка завершена');
  });

  it('records a snapshot in turn history for the previous turn', () => {
    const cond: Condition = { id: 'fire-2', name: 'Горит', roundsRemaining: 2 };
    const a = combatant({ id: 'a', name: 'А', conditions: [cond] });
    const b = combatant({ id: 'b', name: 'Б' });
    const next = applyNextTurn(state({ combatants: [a, b], currentTurnIndex: 0 }));

    expect(next.turnHistory).toHaveLength(1);
    expect(next.turnHistory![0].fromCombatantId).toBe('a');
    expect(next.turnHistory![0].toCombatantId).toBe('b');
    expect(next.turnHistory![0].conditionsBefore[0].roundsRemaining).toBe(2);
  });

  it('returns the same state when nobody is eligible', () => {
    const everyone = state({
      combatants: [combatant({ id: 'dead', name: 'Мёртвый', isDefeated: true })],
      currentTurnIndex: 0,
    });
    expect(applyNextTurn(everyone)).toBe(everyone);
  });
});

describe('applyPrevTurn', () => {
  it('restores the snapshot: condition timers, delay flag and turn index', () => {
    const snapshot = {
      fromCombatantId: 'a',
      toCombatantId: 'b',
      fromRound: 1,
      toRound: 2,
      conditionsBefore: [{ id: 'fire-3', name: 'Горит', roundsRemaining: 3 } as Condition],
      delayedClearedId: 'b',
    };
    const a = combatant({ id: 'a', name: 'А', conditions: [{ id: 'fire-1', name: 'Горит', roundsRemaining: 1 }] });
    const b = combatant({ id: 'b', name: 'Б', isDelayed: false });
    const prev = applyPrevTurn(
      state({ combatants: [a, b], currentTurnIndex: 1, round: 2, turnHistory: [snapshot] })
    );

    expect(prev.round).toBe(1);
    expect(prev.currentTurnIndex).toBe(0);
    expect(prev.combatants.find((c) => c.id === 'a')!.conditions[0].roundsRemaining).toBe(3);
    expect(prev.combatants.find((c) => c.id === 'b')!.isDelayed).toBe(true);
    expect(prev.turnHistory).toHaveLength(0);
  });

  it('falls back to stepping back an index without a matching snapshot', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const b = combatant({ id: 'b', name: 'Б' });
    const prev = applyPrevTurn(
      state({ combatants: [a, b], currentTurnIndex: 1, round: 2 })
    );

    expect(prev.currentTurnIndex).toBe(0);
    expect(prev.round).toBe(2);
  });

  it('wraps to the end of the previous round from the first slot', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const b = combatant({ id: 'b', name: 'Б' });
    const prev = applyPrevTurn(state({ combatants: [a, b], currentTurnIndex: 0, round: 3 }));

    expect(prev.currentTurnIndex).toBe(1);
    expect(prev.round).toBe(2);
  });
});

describe('applyToggleDelay', () => {
  it('moves the active combatant to the end and passes the turn to the next eligible', () => {
    const active = combatant({ id: 'active', name: 'Активный', initiative: 30 });
    const dead = combatant({ id: 'dead', name: 'Поверженный', initiative: 20, isDefeated: true });
    const alive = combatant({ id: 'alive', name: 'Живой', initiative: 10 });
    const next = applyToggleDelay(
      state({ combatants: [active, dead, alive], currentTurnIndex: 0 }),
      'active'
    );

    expect(next.combatants.map((c) => c.id)).toEqual(['dead', 'alive', 'active']);
    expect(next.combatants.find((c) => c.id === 'active')!.isDelayed).toBe(true);
    expect(next.currentTurnIndex).toBe(1);
  });

  it('keeps the turn on the delayer when nobody else can act', () => {
    const active = combatant({ id: 'active', name: 'Активный', initiative: 30 });
    const dead = combatant({ id: 'dead', name: 'Поверженный', initiative: 20, isDefeated: true });
    const next = applyToggleDelay(
      state({ combatants: [active, dead], currentTurnIndex: 0 }),
      'active'
    );

    expect(next.combatants.map((c) => c.id)).toEqual(['dead', 'active']);
    expect(next.currentTurnIndex).toBe(1);
    expect(next.combatants.find((c) => c.id === 'active')!.isDelayed).toBe(false);
  });

  it('returns a delayed combatant to the queue without reordering', () => {
    const delayed = combatant({ id: 'delayed', name: 'Задержанный', isDelayed: true });
    const other = combatant({ id: 'other', name: 'Другой', initiative: 30 });
    const next = applyToggleDelay(
      state({ combatants: [other, delayed], currentTurnIndex: 0 }),
      'delayed'
    );

    expect(next.combatants.map((c) => c.id)).toEqual(['other', 'delayed']);
    expect(next.combatants.find((c) => c.id === 'delayed')!.isDelayed).toBe(false);
  });

  it('marks a combatant as delayed during preparation', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const b = combatant({ id: 'b', name: 'Б', initiative: 30 });
    const next = applyToggleDelay(
      state({ isActive: false, combatants: [b, a], currentTurnIndex: 0 }),
      'a'
    );

    expect(next.combatants.find((c) => c.id === 'a')!.isDelayed).toBe(true);
    expect(next.combatants.map((c) => c.id)).toEqual(['b', 'a']);
  });
});

describe('applyRemoveCombatant', () => {
  it('removing the active combatant passes the turn to the next eligible one', () => {
    const active = combatant({ id: 'active', name: 'Активный', initiative: 30 });
    const dead = combatant({ id: 'dead', name: 'Поверженный', initiative: 20, isDefeated: true });
    const alive = combatant({ id: 'alive', name: 'Живой', initiative: 10 });
    const next = applyRemoveCombatant(
      state({ combatants: [active, dead, alive], currentTurnIndex: 0 }),
      'active'
    );

    expect(next.combatants.map((c) => c.id)).toEqual(['dead', 'alive']);
    expect(next.currentTurnIndex).toBe(1);
    expect(next.round).toBe(1);
  });

  it('removing the last active combatant wraps the round', () => {
    const a = combatant({ id: 'a', name: 'А', initiative: 30 });
    const b = combatant({ id: 'b', name: 'Б', initiative: 10 });
    const next = applyRemoveCombatant(
      state({ combatants: [a, b], currentTurnIndex: 1, round: 2 }),
      'b'
    );

    expect(next.currentTurnIndex).toBe(0);
    expect(next.round).toBe(3);
  });

  it('deactivates combat when the last combatant is removed', () => {
    const next = applyRemoveCombatant(
      state({ combatants: [combatant({ id: 'last', name: 'Последний' })], currentTurnIndex: 0, round: 4 }),
      'last'
    );

    expect(next.isActive).toBe(false);
    expect(next.round).toBe(1);
    expect(next.combatants).toHaveLength(0);
  });
});

describe('applyMoveOrder', () => {
  it('swaps neighbours and keeps the turn on the moved combatant', () => {
    const a = combatant({ id: 'a', name: 'А', initiative: 30 });
    const b = combatant({ id: 'b', name: 'Б', initiative: 10 });
    const next = applyMoveOrder(state({ combatants: [a, b], currentTurnIndex: 0 }), 0, 'down');

    expect(next.combatants.map((c) => c.id)).toEqual(['b', 'a']);
    expect(next.currentTurnIndex).toBe(1);
  });

  it('returns the same state at the list boundary', () => {
    const a = combatant({ id: 'a', name: 'А' });
    const b = combatant({ id: 'b', name: 'Б' });
    const current = state({ combatants: [a, b], currentTurnIndex: 0 });
    expect(applyMoveOrder(current, 0, 'up')).toBe(current);
  });
});

describe('buildResetCombat', () => {
  it('returns to preparation clearing round, delay flags and history', () => {
    const delayed = combatant({ id: 'a', name: 'А', isDelayed: true });
    const next = buildResetCombat(
      state({
        isActive: true,
        round: 5,
        currentTurnIndex: 2,
        combatants: [delayed],
        turnHistory: [
          {
            fromCombatantId: 'x',
            toCombatantId: 'a',
            fromRound: 4,
            toRound: 5,
            conditionsBefore: [],
          },
        ],
      })
    );

    expect(next.isActive).toBe(false);
    expect(next.round).toBe(1);
    expect(next.currentTurnIndex).toBe(0);
    expect(next.combatants[0].isDelayed).toBe(false);
    expect(next.turnHistory).toHaveLength(0);
  });
});
