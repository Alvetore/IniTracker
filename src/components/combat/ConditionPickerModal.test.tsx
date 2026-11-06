import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionPickerModal } from './ConditionPickerModal';
import { Combatant } from '../../types';

const combatant: Combatant = {
  id: 'c-1',
  name: 'Гоблин',
  type: 'enemy',
  initiative: 12,
  initiativeModifier: 2,
  hp: { current: 7, max: 7, temp: 0 },
  armorClass: 15,
  conditions: [],
  notes: '',
  isDefeated: false,
  isDelayed: false,
};

function renderModal(onAddCondition = vi.fn(), current = combatant) {
  const onClose = vi.fn();
  render(
    <ConditionPickerModal
      isOpen
      onClose={onClose}
      combatant={current}
      onAddCondition={onAddCondition}
    />
  );
  return { onAddCondition, onClose };
}

describe('ConditionPickerModal', () => {
  it('filters standard conditions by Russian or English name', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('Поиск состояния'), 'ослеп');

    expect(screen.getByRole('button', { name: /Ослеплен/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Отравлен/ })).not.toBeInTheDocument();
  });

  it('adds a standard condition with a preset duration and its color', async () => {
    const user = userEvent.setup();
    const { onAddCondition, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /Отравлен/ }));
    await user.click(screen.getByRole('button', { name: '5 раундов' }));
    await user.click(screen.getByRole('button', { name: /Наложить статус/ }));

    expect(onAddCondition).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({
        name: 'Отравлен (Poisoned)',
        roundsRemaining: 5,
        color: '#22c55e',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('adds a custom condition with custom duration and color', async () => {
    const user = userEvent.setup();
    const { onAddCondition } = renderModal();

    await user.type(screen.getByLabelText('Или своё состояние / эффект'), 'Горит');
    fireEvent.change(screen.getByLabelText('Длительность в раундах'), {
      target: { value: '4' },
    });
    await user.click(screen.getByLabelText('Цвет #ef4444'));
    await user.type(screen.getByLabelText('Примечание'), '1d4 огня в начале хода');
    await user.click(screen.getByRole('button', { name: /Наложить статус/ }));

    expect(onAddCondition).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({
        name: 'Горит',
        roundsRemaining: 4,
        color: '#ef4444',
        notes: '1d4 огня в начале хода',
      })
    );
  });

  it('shows existing conditions and warns about a duplicate', async () => {
    const user = userEvent.setup();
    const poisoned = {
      ...combatant,
      conditions: [
        {
          id: 'cond-1',
          name: 'Отравлен (Poisoned)',
          roundsRemaining: 2,
          color: '#22c55e',
        },
      ],
    };
    renderModal(vi.fn(), poisoned);

    expect(screen.getByText('Уже активно')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Отравлен/ }));

    expect(
      screen.getByText('Уже активно — будет добавлена вторая запись')
    ).toBeInTheDocument();
  });

  it('keeps the submit button disabled until a condition is chosen', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Наложить статус/ })).toBeDisabled();
  });
});
