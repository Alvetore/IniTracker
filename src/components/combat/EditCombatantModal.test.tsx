import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCombatantModal } from './EditCombatantModal';
import { Combatant } from '../../types';

const combatant: Combatant = {
  id: 'c-1',
  name: 'Стражник',
  type: 'enemy',
  initiative: 12,
  initiativeModifier: 2,
  hp: { current: 10, max: 10, temp: 0 },
  armorClass: 15,
  conditions: [],
  notes: '',
  isDefeated: false,
  isDelayed: false,
};

function renderModal(onSave = vi.fn()) {
  const onClose = vi.fn();
  render(
    <EditCombatantModal
      isOpen
      onClose={onClose}
      combatant={combatant}
      diceSystem="d20"
      onSave={onSave}
    />
  );
  return { onSave, onClose };
}

describe('EditCombatantModal', () => {
  it('clamps current HP to the new maximum and keeps text armor class', async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderModal();

    const maxHpInput = screen.getByLabelText('Максимальные HP');
    fireEvent.change(maxHpInput, { target: { value: '5' } });

    const armorClassInput = screen.getByLabelText('Класс доспеха');
    fireEvent.change(armorClassInput, { target: { value: '15 (щит)' } });

    await user.click(screen.getByRole('button', { name: /Сохранить изменения/ }));

    expect(onSave).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({
        armorClass: '15 (щит)',
        hp: { current: 5, max: 5, temp: 0 },
        isDefeated: false,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('turns a negative current HP into zero and marks the combatant defeated', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    const currentHpInput = screen.getByLabelText('Текущие HP');
    fireEvent.change(currentHpInput, { target: { value: '-3' } });

    await user.click(screen.getByRole('button', { name: /Сохранить изменения/ }));

    expect(onSave).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({
        hp: { current: 0, max: 10, temp: 0 },
        isDefeated: true,
      })
    );
  });
});
