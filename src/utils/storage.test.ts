import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Storage as AppStorage } from './storage';
import { ActiveCombatState, CreatureTemplate, Encounter, PartyMember } from '../types';

let store: Map<string, string>;
let failOnKey: string | null = null;

beforeEach(() => {
  store = new Map();
  failOnKey = null;
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      if (failOnKey === key) throw new Error('QuotaExceededError');
      store.set(key, String(value));
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const template: CreatureTemplate = {
  id: 'tpl-1',
  name: 'Гоблин',
  englishName: 'Goblin',
  type: 'enemy',
  maxHp: 7,
  armorClass: 15,
  initiativeModifier: 2,
  tags: ['Гоблиноид'],
  notes: 'Скимитар',
  cr: '1/4',
  edition: '5e14',
  sourceUrl: 'https://5e14.dnd.su/bestiary/4-goblin/',
  sourceLabel: '5e14.dnd.su (5e14)',
  createdAt: 1,
};

const partyMember: PartyMember = {
  id: 'hero-1',
  name: 'Герой',
  playerName: 'Игрок',
  maxHp: 20,
  currentHp: 12,
  armorClass: 16,
  initiativeModifier: 1,
};

const encounter: Encounter = {
  id: 'enc-1',
  title: 'Засада',
  tags: ['Лес'],
  createdAt: 1,
  updatedAt: 2,
  monsters: [
    {
      id: 'em-1',
      name: 'Гоблин',
      type: 'enemy',
      count: 2,
      maxHp: 7,
      armorClass: 15,
      initiativeModifier: 2,
    },
  ],
};

const combatState: ActiveCombatState = {
  isActive: true,
  round: 2,
  currentTurnIndex: 0,
  diceSystem: 'd20',
  combatants: [
    {
      id: 'c-1',
      name: 'Гоблин',
      type: 'enemy',
      initiative: 15,
      initiativeModifier: 2,
      hp: { current: 7, max: 7, temp: 0 },
      armorClass: 15,
      conditions: [
        { id: 'cond-1', name: 'Отравлен', roundsRemaining: 2, color: 'green' },
      ],
      notes: '',
      isDefeated: false,
      isDelayed: false,
    },
  ],
  log: [
    {
      id: 'log-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      round: 2,
      message: 'Бой начался',
      type: 'system',
    },
  ],
  turnHistory: [],
};

function seedFullData() {
  AppStorage.saveTemplates([template]);
  AppStorage.saveParty([partyMember]);
  AppStorage.saveEncounters([encounter]);
  AppStorage.saveCombatState(combatState);
}

describe('Storage defaults', () => {
  it('seeds demo data when the key does not exist', () => {
    expect(AppStorage.getTemplates()).toHaveLength(4);
    expect(AppStorage.getParty()).toHaveLength(4);
    expect(AppStorage.getEncounters()).toHaveLength(1);
    expect(store.has('dnd_init_templates_v1')).toBe(true);
  });

  it('keeps empty arrays instead of restoring demo data', () => {
    AppStorage.getTemplates();
    AppStorage.getParty();
    AppStorage.getEncounters();

    AppStorage.saveTemplates([]);
    AppStorage.saveParty([]);
    AppStorage.saveEncounters([]);

    expect(AppStorage.getTemplates()).toEqual([]);
    expect(AppStorage.getParty()).toEqual([]);
    expect(AppStorage.getEncounters()).toEqual([]);
  });
});

describe('Storage.exportAll', () => {
  it('exports every section and an explicit null combat state', () => {
    AppStorage.saveTemplates([]);
    AppStorage.saveParty([]);
    AppStorage.saveEncounters([]);
    AppStorage.saveCombatState(null);

    const exported = JSON.parse(AppStorage.exportAll());

    expect(exported.version).toBe(1);
    expect(exported.exportDate).toEqual(expect.any(String));
    expect(exported.templates).toEqual([]);
    expect(exported.party).toEqual([]);
    expect(exported.encounters).toEqual([]);
    expect(exported).toHaveProperty('activeCombat', null);
  });

  it('round-trips all data without loss', () => {
    seedFullData();
    const backup = AppStorage.exportAll();

    store.clear();
    expect(AppStorage.importAll(backup)).toEqual({ success: true });

    expect(AppStorage.getTemplates()).toEqual([template]);
    expect(AppStorage.getParty()).toEqual([partyMember]);
    expect(AppStorage.getEncounters()).toEqual([encounter]);
    expect(AppStorage.getCombatState()).toEqual(combatState);
  });
});

describe('Storage.importAll', () => {
  it('imports an empty template list without reseeding it', () => {
    expect(AppStorage.importAll(JSON.stringify({ templates: [] }))).toEqual({ success: true });
    expect(AppStorage.getTemplates()).toEqual([]);
  });

  it('replaces all sections and clears combat when the file omits them', () => {
    seedFullData();

    expect(AppStorage.importAll(JSON.stringify({ templates: [] }))).toEqual({ success: true });

    expect(AppStorage.getTemplates()).toEqual([]);
    expect(AppStorage.getParty()).toEqual([]);
    expect(AppStorage.getEncounters()).toEqual([]);
    expect(AppStorage.getCombatState()).toBeNull();
  });

  it('rejects malformed data before writing anything', () => {
    const result = AppStorage.importAll(JSON.stringify({ templates: [{}] }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('templates[0].id');
    expect(store.size).toBe(0);
  });

  it('rolls back all sections when localStorage rejects a write', () => {
    seedFullData();
    failOnKey = 'dnd_init_encounters_v1';

    const result = AppStorage.importAll(JSON.stringify({ templates: [] }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('QuotaExceededError');
    expect(AppStorage.getTemplates()).toEqual([template]);
    expect(AppStorage.getParty()).toEqual([partyMember]);
    expect(AppStorage.getEncounters()).toEqual([encounter]);
    expect(AppStorage.getCombatState()).toEqual(combatState);
  });

  it('rejects a file with no known sections', () => {
    const result = AppStorage.importAll(JSON.stringify({ hello: 'world' }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('нет ни одного известного раздела');
  });

  it('clears combat when activeCombat is explicitly null', () => {
    AppStorage.saveCombatState(combatState);

    expect(AppStorage.importAll(JSON.stringify({ activeCombat: null }))).toEqual({
      success: true,
    });
    expect(AppStorage.getCombatState()).toBeNull();
  });
});
