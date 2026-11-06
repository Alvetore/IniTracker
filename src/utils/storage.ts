import {
  CreatureTemplate,
  PartyMember,
  Encounter,
  ActiveCombatState,
  AppDataExport,
  SavedCondition,
} from '../types';
import {
  DEFAULT_TEMPLATES,
  DEFAULT_PARTY,
  DEFAULT_ENCOUNTERS,
} from './defaultData';
import { validateImportData } from './importValidation';

const STORAGE_KEYS = {
  TEMPLATES: 'dnd_init_templates_v1',
  PARTY: 'dnd_init_party_v1',
  ENCOUNTERS: 'dnd_init_encounters_v1',
  COMBAT: 'dnd_init_combat_v1',
  CUSTOM_CONDITIONS: 'dnd_init_custom_conditions_v1',
};

// Older demo templates stored tactical notes and attacks together. Split the
// untouched demo records once so existing users get the new notes/actions UI.
const LEGACY_DEFAULT_TEMPLATE_SPLITS: Record<
  string,
  { legacyNotes: string; notes: string; actionsAndAttacks: string }
> = {
  'tpl-goblin-archer': {
    legacyNotes:
      'Короткий лук: +4 к атаке, 1d6+2 урона. Проворный побег (бонусное действие на Отход или Засаду).',
    notes: 'Держится на дистанции и использует укрытие.',
    actionsAndAttacks:
      'Короткий лук: +4 к атаке, 1d6+2 урона.\nПроворный побег: бонусным действием Отход или Засада.',
  },
  'tpl-skeleton': {
    legacyNotes:
      'Короткий меч: +4 к атаке, 1d6+2 колющего. Уязвимость к дробящему урону, иммунитет к яду.',
    notes: 'Нежить. Уязвим к дробящему урону, иммунитет к яду.',
    actionsAndAttacks: 'Короткий меч: +4 к атаке, 1d6+2 колющего урона.',
  },
  'tpl-ogre': {
    legacyNotes:
      'Большая дубина: +6 к атаке, 2d8+4 дробящего урона. Размашистый удар по области.',
    notes: 'Атакует ближайшую цель, ломает укрытия.',
    actionsAndAttacks:
      'Большая дубина: +6 к атаке, 2d8+4 дробящего урона.\nРазмашистый удар по области.',
  },
  'tpl-guard-ally': {
    legacyNotes: 'Копье: +3 к атаке, 1d6+1 колющего. Стена щитов.',
    notes: 'Держит строй и защищает союзников.',
    actionsAndAttacks: 'Копье: +3 к атаке, 1d6+1 колющего урона.\nСтена щитов.',
  },
};

function migrateLegacyTemplates(templates: CreatureTemplate[]): {
  templates: CreatureTemplate[];
  changed: boolean;
} {
  let changed = false;
  const migrated = templates.map((template) => {
    const split = LEGACY_DEFAULT_TEMPLATE_SPLITS[template.id];
    if (
      !split ||
      template.actionsAndAttacks ||
      template.notes !== split.legacyNotes
    ) {
      return template;
    }
    changed = true;
    return {
      ...template,
      notes: split.notes,
      actionsAndAttacks: split.actionsAndAttacks,
    };
  });
  return { templates: changed ? migrated : templates, changed };
}

// Safe JSON Parse
function safeParse<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return fallback;
  }
}

function safeSave<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
}

// Distinguishes "key never existed" from "user saved an empty array".
function hasStoredValue(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (err) {
    console.error(`Error reading key "${key}" from localStorage:`, err);
    return false;
  }
}

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export const Storage = {
  getTemplates(): CreatureTemplate[] {
    if (!hasStoredValue(STORAGE_KEYS.TEMPLATES)) {
      const defaults = cloneData(DEFAULT_TEMPLATES);
      this.saveTemplates(defaults);
      return defaults;
    }
    const stored = safeParse<CreatureTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const { templates, changed } = migrateLegacyTemplates(stored);
    if (changed) this.saveTemplates(templates);
    return templates;
  },

  saveTemplates(templates: CreatureTemplate[]): void {
    safeSave(STORAGE_KEYS.TEMPLATES, templates);
  },

  getParty(): PartyMember[] {
    if (!hasStoredValue(STORAGE_KEYS.PARTY)) {
      const defaults = cloneData(DEFAULT_PARTY);
      this.saveParty(defaults);
      return defaults;
    }
    return safeParse<PartyMember[]>(STORAGE_KEYS.PARTY, []);
  },

  saveParty(party: PartyMember[]): void {
    safeSave(STORAGE_KEYS.PARTY, party);
  },

  getEncounters(): Encounter[] {
    if (!hasStoredValue(STORAGE_KEYS.ENCOUNTERS)) {
      const defaults = cloneData(DEFAULT_ENCOUNTERS);
      this.saveEncounters(defaults);
      return defaults;
    }
    return safeParse<Encounter[]>(STORAGE_KEYS.ENCOUNTERS, []);
  },

  saveEncounters(encounters: Encounter[]): void {
    safeSave(STORAGE_KEYS.ENCOUNTERS, encounters);
  },

  getCustomConditions(): SavedCondition[] {
    return safeParse<SavedCondition[]>(STORAGE_KEYS.CUSTOM_CONDITIONS, []);
  },

  saveCustomConditions(conditions: SavedCondition[]): void {
    safeSave(STORAGE_KEYS.CUSTOM_CONDITIONS, conditions);
  },

  getCombatState(): ActiveCombatState | null {
    return safeParse<ActiveCombatState | null>(STORAGE_KEYS.COMBAT, null);
  },

  saveCombatState(state: ActiveCombatState | null): void {
    safeSave(STORAGE_KEYS.COMBAT, state);
  },

  exportAll(): string {
    const exportData: AppDataExport = {
      version: 1,
      exportDate: new Date().toISOString(),
      templates: this.getTemplates(),
      party: this.getParty(),
      encounters: this.getEncounters(),
      customConditions: this.getCustomConditions(),
      // Keep the key even when there is no active combat: on import an explicit
      // null means "clear the current fight", while a missing key would keep it.
      activeCombat: this.getCombatState(),
    };
    return JSON.stringify(exportData, null, 2);
  },

  importAll(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, error: 'Неверный формат JSON файла' };
      }

      const hasKnownSection = ['templates', 'party', 'encounters', 'activeCombat', 'customConditions'].some(
        (key) => key in parsed
      );
      if (!hasKnownSection) {
        return {
          success: false,
          error: 'В файле нет ни одного известного раздела (templates, party, encounters, activeCombat, customConditions)',
        };
      }

      const errors = validateImportData(parsed);
      if (errors.length > 0) {
        const preview = errors.slice(0, 5).join('; ');
        const rest = errors.length > 5 ? `; и ещё ${errors.length - 5} ошибок` : '';
        return { success: false, error: `Файл не прошёл проверку: ${preview}${rest}` };
      }

      const data = parsed as Partial<AppDataExport> & { activeCombat?: unknown };

      // A backup is a full snapshot: sections missing from the file are
      // restored as empty instead of silently keeping data from the old save.
      const nextValues: Array<[string, string]> = [
        [STORAGE_KEYS.TEMPLATES, JSON.stringify(Array.isArray(data.templates) ? data.templates : [])],
        [STORAGE_KEYS.PARTY, JSON.stringify(Array.isArray(data.party) ? data.party : [])],
        [
          STORAGE_KEYS.ENCOUNTERS,
          JSON.stringify(Array.isArray(data.encounters) ? data.encounters : []),
        ],
        [
          STORAGE_KEYS.CUSTOM_CONDITIONS,
          JSON.stringify(Array.isArray(data.customConditions) ? data.customConditions : []),
        ],
        [STORAGE_KEYS.COMBAT, JSON.stringify(data.activeCombat ?? null)],
      ];

      const previous = new Map<string, string | null>();
      try {
        for (const [key] of nextValues) previous.set(key, localStorage.getItem(key));
        for (const [key, value] of nextValues) localStorage.setItem(key, value);
      } catch (error: unknown) {
        // Roll back a partially written import when localStorage is full or
        // unavailable, and tell the user instead of reporting a false success.
        for (const [key, value] of previous) {
          try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          } catch {
            console.error(`Failed to roll back localStorage key "${key}"`);
          }
        }
        return {
          success: false,
          error: `Не удалось сохранить данные: ${
            error instanceof Error ? error.message : 'ошибка localStorage'
          }`,
        };
      }

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Ошибка разбора JSON' };
    }
  },

  resetToDefaults(): void {
    this.saveTemplates(DEFAULT_TEMPLATES);
    this.saveParty(DEFAULT_PARTY);
    this.saveEncounters(DEFAULT_ENCOUNTERS);
    this.saveCombatState(null);
    this.saveCustomConditions([]);
  },
};
