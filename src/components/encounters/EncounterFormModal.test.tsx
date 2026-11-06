import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EncounterFormModal } from './EncounterFormModal';
import { Encounter } from '../../types';

function encounter(): Encounter {
  return {
    id: 'enc-1',
    title: 'Засада',
    tags: ['Лес'],
    createdAt: 1,
    updatedAt: 1,
    monsters: [
      {
        id: 'em-1',
        templateId: 'tpl-goblin',
        name: 'Гоблин-лучник',
        type: 'enemy',
        count: 2,
        maxHp: 7,
        armorClass: 15,
        initiativeModifier: 2,
        notes: 'Сидят на уступах в укрытии.',
        actionsAndAttacks: 'Короткий лук: +4, 1d6+2.',
      },
    ],
  };
}

describe('EncounterFormModal per-instance notes', () => {
  it('splits a group and keeps separate notes for each instance', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <EncounterFormModal
        isOpen
        onClose={() => {}}
        onSave={onSave}
        templates={[]}
        initialEncounter={encounter()}
      />
    );

    await user.click(screen.getByTitle('Заметка и действия этого экземпляра'));
    expect(screen.getByLabelText('Заметка: Гоблин-лучник')).toHaveValue(
      'Сидят на уступах в укрытии.'
    );

    await user.click(screen.getByRole('button', { name: /Разделить на отдельные записи/ }));

    const firstNote = screen.getByLabelText('Заметка: Гоблин-лучник 1');
    await user.clear(firstNote);
    await user.type(firstNote, 'В бою сразу');

    const toggles = screen.getAllByTitle('Заметка и действия этого экземпляра');
    await user.click(toggles[1]);
    const secondNote = screen.getByLabelText('Заметка: Гоблин-лучник 2');
    await user.clear(secondNote);
    await user.type(secondNote, 'Выходит на второй раунд');

    await user.click(screen.getByRole('button', { name: /Сохранить энкаунтер/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as Encounter;
    expect(saved.monsters).toHaveLength(2);
    expect(saved.monsters.map((monster) => monster.notes)).toEqual([
      'В бою сразу',
      'Выходит на второй раунд',
    ]);
    expect(saved.monsters.every((monster) => monster.count === 1)).toBe(true);
    expect(saved.monsters[0].actionsAndAttacks).toContain('Короткий лук');
  });

  it('edits notes without touching the linked bestiary template data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const current = encounter();
    current.monsters[0].count = 1;
    render(
      <EncounterFormModal
        isOpen
        onClose={() => {}}
        onSave={onSave}
        templates={[
          {
            id: 'tpl-goblin',
            name: 'Гоблин-лучник',
            type: 'enemy',
            maxHp: 7,
            armorClass: 15,
            initiativeModifier: 2,
            tags: ['Гоблиноид'],
            notes: 'Заметка из бестиария',
            actionsAndAttacks: 'Короткий лук: +4',
            createdAt: 1,
          },
        ]}
        initialEncounter={current}
      />
    );

    await user.click(screen.getByTitle('Заметка и действия этого экземпляра'));
    const note = screen.getByLabelText('Заметка: Гоблин-лучник');
    await user.clear(note);
    await user.type(note, 'Только для этого энкаунтера');
    await user.click(screen.getByRole('button', { name: /Сохранить энкаунтер/ }));

    const saved = onSave.mock.calls[0][0] as Encounter;
    expect(saved.monsters[0].notes).toBe('Только для этого энкаунтера');
    expect(saved.monsters[0].actionsAndAttacks).toBe('Короткий лук: +4, 1d6+2.');
  });
});
