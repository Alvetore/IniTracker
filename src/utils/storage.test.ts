import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Storage as AppStorage } from './storage';

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => store.set(key, String(value)),
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

describe('Storage.importAll', () => {
  it('imports an empty template list without reseeding it', () => {
    expect(AppStorage.importAll(JSON.stringify({ templates: [] }))).toEqual({ success: true });
    expect(AppStorage.getTemplates()).toEqual([]);
  });

  it('rejects malformed data before writing anything', () => {
    const result = AppStorage.importAll(JSON.stringify({ templates: [{}] }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('templates[0].id');
    expect(store.has('dnd_init_templates_v1')).toBe(false);
  });

  it('rejects a file with no known sections', () => {
    const result = AppStorage.importAll(JSON.stringify({ hello: 'world' }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('нет ни одного известного раздела');
  });

  it('clears combat when activeCombat is explicitly null', () => {
    AppStorage.saveCombatState({
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: [],
      diceSystem: 'd20',
    });

    expect(AppStorage.importAll(JSON.stringify({ activeCombat: null }))).toEqual({
      success: true,
    });
    expect(AppStorage.getCombatState()).toBeNull();
  });
});
