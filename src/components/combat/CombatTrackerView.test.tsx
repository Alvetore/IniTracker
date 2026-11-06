import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatTrackerView } from './CombatTrackerView';
import { ActiveCombatState, Combatant, PartyMember } from '../../types';

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
    isActive: false,
    round: 1,
    currentTurnIndex: 0,
    combatants: [],
    log: [],
    diceSystem: 'd20',
    turnHistory: [],
    ...overrides,
  };
}

function renderTracker(combatState: ActiveCombatState, party: PartyMember[] = []) {
  const onUpdateCombatState = vi.fn();
  render(
    <CombatTrackerView
      combatState={combatState}
      onUpdateCombatState={onUpdateCombatState}
      party={party}
      templates={[]}
      encounters={[]}
    />
  );
  return onUpdateCombatState;
}

const hero: PartyMember = {
  id: 'hero-1',
  name: 'Герой',
  maxHp: 20,
  currentHp: 20,
  armorClass: 15,
  initiativeModifier: 3,
};

describe('CombatTrackerView turn handling', () => {
  it('clears delay markers when combat is reset to preparation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const delay = combatant({ id: 'a', name: 'Активный', initiative: 30, isDelayed: true });
    const other = combatant({ id: 'b', name: 'Другой', initiative: 20 });
    const onUpdate = renderTracker(
      state({ isActive: true, round: 3, currentTurnIndex: 0, combatants: [delay, other] })
    );

    await user.click(screen.getByTitle('Сбросить бой к фазе подготовки'));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        round: 1,
        currentTurnIndex: 0,
        turnHistory: [],
      })
    );
    const nextState = onUpdate.mock.calls[0][0] as ActiveCombatState;
    expect(nextState.combatants.every((item) => !item.isDelayed)).toBe(true);
  });

  it('starts on the first eligible combatant and clears prep delay flags', async () => {
    const user = userEvent.setup();
    const defeated = combatant({
      id: 'dead',
      name: 'Поверженный',
      initiative: 30,
      isDefeated: true,
    });
    const delayed = combatant({
      id: 'delayed',
      name: 'Задержанный',
      initiative: 20,
      isDelayed: true,
    });
    const player = combatant({ id: 'player', name: 'Игрок', type: 'player', initiative: 10 });
    const onUpdate = renderTracker(
      state({ combatants: [defeated, delayed, player] })
    );

    await user.click(screen.getByRole('button', { name: /НАЧАТЬ БОЙ/ }));

    const nextState = onUpdate.mock.calls[0][0] as ActiveCombatState;
    expect(nextState.isActive).toBe(true);
    expect(nextState.currentTurnIndex).toBe(1);
    expect(nextState.combatants[1].isDelayed).toBe(false);
  });

  it('disables combat start when every participant is defeated', () => {
    renderTracker(
      state({
        combatants: [
          combatant({ id: 'dead-1', name: 'Мёртвый 1', isDefeated: true }),
          combatant({ id: 'dead-2', name: 'Мёртвый 2', isDefeated: true }),
        ],
      })
    );

    expect(screen.getByRole('button', { name: /НАЧАТЬ БОЙ/ })).toBeDisabled();
  });

  it('delaying the active combatant skips a defeated neighbour', async () => {
    const user = userEvent.setup();
    const active = combatant({ id: 'active', name: 'Активный', initiative: 30 });
    const dead = combatant({ id: 'dead', name: 'Поверженный', initiative: 20, isDefeated: true });
    const alive = combatant({ id: 'alive', name: 'Живой', initiative: 10 });
    const onUpdate = renderTracker(
      state({ isActive: true, round: 1, currentTurnIndex: 0, combatants: [active, dead, alive] })
    );

    const activeCard = screen.getByRole('heading', {
      level: 4,
      name: 'Активный',
    }).closest('.rounded-2xl') as HTMLElement;
    await user.click(
      within(activeCard).getByTitle('Задержать ход: перенести в конец раунда')
    );

    const nextState = onUpdate.mock.calls[0][0] as ActiveCombatState;
    expect(nextState.combatants.map((item) => item.id)).toEqual(['dead', 'alive', 'active']);
    expect(nextState.currentTurnIndex).toBe(1);
    expect(nextState.combatants[2].isDelayed).toBe(true);
    expect(nextState.round).toBe(1);
  });

  it('removing the active combatant passes the turn to the next eligible one', async () => {
    const user = userEvent.setup();
    const active = combatant({ id: 'active', name: 'Активный', initiative: 30 });
    const dead = combatant({ id: 'dead', name: 'Поверженный', initiative: 20, isDefeated: true });
    const alive = combatant({ id: 'alive', name: 'Живой', initiative: 10 });
    const onUpdate = renderTracker(
      state({ isActive: true, round: 1, currentTurnIndex: 0, combatants: [active, dead, alive] })
    );

    const activeCard = screen.getByRole('heading', {
      level: 4,
      name: 'Активный',
    }).closest('.rounded-2xl') as HTMLElement;
    await user.click(within(activeCard).getByTitle('Удалить из боя'));

    const nextState = onUpdate.mock.calls[0][0] as ActiveCombatState;
    expect(nextState.combatants.map((item) => item.id)).toEqual(['dead', 'alive']);
    expect(nextState.currentTurnIndex).toBe(1);
    expect(nextState.round).toBe(1);
  });

  it('rolls initiative when a party hero joins an active combat', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // d20 => 11, +3 => 14
    const onUpdate = renderTracker(
      state({
        isActive: true,
        currentTurnIndex: 0,
        combatants: [combatant({ id: 'enemy', name: 'Враг', initiative: 30 })],
      }),
      [hero]
    );

    await user.click(
      screen.getByTitle('Выбрать персонажей партии для добавления в бой')
    );
    const dialog = screen.getByRole('dialog', { name: 'Добавить героев партии в бой' });
    await user.click(within(dialog).getByRole('button', { name: /В бой/ }));

    const nextState = onUpdate.mock.calls[0][0] as ActiveCombatState;
    const added = nextState.combatants.find((item) => item.sourcePartyMemberId === hero.id);
    expect(added?.initiative).toBe(14);
    expect(added?.initiativeModifier).toBe(3);
  });
});
