import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataManagementModal } from './DataManagementModal';
import { Storage } from '../../utils/storage';
import { CreatureTemplate } from '../../types';

const importedTemplate: CreatureTemplate = {
  id: 'tpl-imported',
  name: 'Импортированный гоблин',
  englishName: 'Imported Goblin',
  type: 'enemy',
  maxHp: 7,
  armorClass: 15,
  initiativeModifier: 2,
  tags: ['Гоблиноид'],
  notes: 'Скимитар',
  cr: '1/4',
  edition: '5e14',
  createdAt: 1,
};

function backupFile(payload: unknown) {
  return new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
}

function renderModal(onDataReloaded = vi.fn()) {
  const utils = render(
    <DataManagementModal isOpen onClose={() => {}} onDataReloaded={onDataReloaded} />
  );
  const input = utils.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { ...utils, input, onDataReloaded };
}

describe('DataManagementModal import', () => {
  it('imports a valid backup and reloads application data', async () => {
    const user = userEvent.setup();
    Storage.saveTemplates([]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { input, onDataReloaded } = renderModal();

    await user.upload(
      input,
      backupFile({
        version: 1,
        exportDate: '2026-01-01T00:00:00.000Z',
        templates: [importedTemplate],
        party: [],
        encounters: [],
        activeCombat: null,
      })
    );

    expect(await screen.findByText('Данные успешно импортированы и обновлены!')).toBeInTheDocument();
    await waitFor(() => expect(onDataReloaded).toHaveBeenCalledTimes(1));
    expect(Storage.getTemplates()).toEqual([importedTemplate]);
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('shows an error and keeps existing data for an invalid backup', async () => {
    const user = userEvent.setup();
    Storage.saveTemplates([importedTemplate]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { input, onDataReloaded } = renderModal();

    await user.upload(input, backupFile({ hello: 'world' }));

    expect(
      await screen.findByText(/нет ни одного известного раздела/)
    ).toBeInTheDocument();
    expect(onDataReloaded).not.toHaveBeenCalled();
    expect(Storage.getTemplates()).toEqual([importedTemplate]);
  });

  it('does nothing when the confirmation is declined', async () => {
    const user = userEvent.setup();
    Storage.saveTemplates([]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { input, onDataReloaded } = renderModal();

    await user.upload(
      input,
      backupFile({
        templates: [importedTemplate],
        party: [],
        encounters: [],
        activeCombat: null,
      })
    );

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(onDataReloaded).not.toHaveBeenCalled();
    expect(Storage.getTemplates()).toEqual([]);
  });
});
