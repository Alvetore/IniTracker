import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getPartyHp(name: string): number | undefined {
  const stored = localStorage.getItem('dnd_init_party_v1');
  if (!stored) return undefined;
  const party = JSON.parse(stored) as Array<{ name: string; currentHp: number }>;
  return party.find((member) => member.name === name)?.currentHp;
}

describe('App integration', () => {
  it('renders the header and the empty combat table', async () => {
    render(<App />);

    expect(screen.getByText('IniTracker')).toBeInTheDocument();
    expect(await screen.findByText('Боевой стол пуст')).toBeInTheDocument();
  });

  it('opens a party modal with focus inside and closes it by Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /\+ Партия/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Добавить героев партии в бой' });
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe('');
  });

  it('synchronizes party HP with the active combatant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /\+ Партия/ }));
    await user.click(await screen.findByRole('button', { name: /Добавить всех/ }));
    await user.click(await screen.findByRole('button', { name: /НАЧАТЬ БОЙ/ }));

    const damageButtons = await screen.findAllByRole('button', { name: '-5' });
    expect(damageButtons.length).toBeGreaterThan(0);
    await user.click(damageButtons[0]);

    await waitFor(() => {
      expect(getPartyHp('Элиас Ночной Ветер')).toBe(16);
    });

    const header = screen.getByRole('banner');
    const partyTab = within(header).getAllByRole('button', { name: /Партия/ })[0];
    await user.click(partyTab);

    expect(await screen.findByText('16/21')).toBeInTheDocument();
  });

  it('rolls initiative when adding a party hero from the party tab to an active fight', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /\+ Партия/ }));
    await user.click(await screen.findByRole('button', { name: /Добавить всех/ }));
    await user.click(await screen.findByRole('button', { name: /НАЧАТЬ БОЙ/ }));

    const before = JSON.parse(localStorage.getItem('dnd_init_combat_v1')!);
    const beforeIds = new Set(before.combatants.map((combatant: { id: string }) => combatant.id));

    const header = screen.getByRole('banner');
    const partyTab = within(header).getAllByRole('button', { name: /Партия/ })[0];
    await user.click(partyTab);

    const addButtons = await screen.findAllByRole('button', { name: /\+ В бой/ });
    await user.click(addButtons[0]);

    await waitFor(() => {
      const after = JSON.parse(localStorage.getItem('dnd_init_combat_v1')!);
      const added = after.combatants.find(
        (combatant: { id: string }) => !beforeIds.has(combatant.id)
      );
      expect(added).toBeDefined();
      expect(added.initiative).toBeGreaterThan(added.initiativeModifier);
    });
  });

  it('applies data changes coming from another tab', async () => {
    render(<App />);
    await screen.findByText('Боевой стол пуст');

    const header = screen.getByRole('banner');
    expect(within(header).getAllByRole('button', { name: /Бестиарий\s*4/ }).length).toBeGreaterThan(0);

    localStorage.setItem('dnd_init_templates_v1', '[]');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'dnd_init_templates_v1',
          newValue: '[]',
          storageArea: localStorage,
        })
      );
    });

    await waitFor(() => {
      expect(within(header).getAllByRole('button', { name: /Бестиарий\s*0/ }).length).toBeGreaterThan(0);
    });
  });

  it('restores condition durations after a remount using persisted turn history', async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole('button', { name: /\+ Партия/ }));
    await user.click(await screen.findByRole('button', { name: /Добавить всех/ }));
    await user.click(await screen.findByRole('button', { name: /НАЧАТЬ БОЙ/ }));

    const initialState = JSON.parse(localStorage.getItem('dnd_init_combat_v1')!);
    const targetId = initialState.combatants[initialState.currentTurnIndex].id;

    const statusButtons = await screen.findAllByRole('button', { name: 'Статус' });
    await user.click(statusButtons[0]);
    const dialog = await screen.findByRole('dialog', { name: /Добавить состояние/ });
    await user.click(within(dialog).getByRole('button', { name: /Отравлен/ }));
    await user.click(within(dialog).getByRole('button', { name: /2 раунда/ }));
    await user.click(within(dialog).getByRole('button', { name: /Наложить статус/ }));

    await user.click(screen.getByRole('button', { name: /След\. ход/ }));

    await waitFor(() => {
      const state = JSON.parse(localStorage.getItem('dnd_init_combat_v1')!);
      expect(state.turnHistory).toHaveLength(1);
      const previous = state.combatants.find((combatant: { id: string }) => combatant.id === targetId);
      expect(previous.conditions[0].roundsRemaining).toBe(1);
    });

    firstRender.unmount();
    render(<App />);

    const previousTurn = await screen.findByTitle('Предыдущий ход');
    await user.click(previousTurn);

    await waitFor(() => {
      const state = JSON.parse(localStorage.getItem('dnd_init_combat_v1')!);
      const current = state.combatants[state.currentTurnIndex];
      expect(current.id).toBe(targetId);
      expect(current.conditions[0].roundsRemaining).toBe(2);
    });
  });
});
