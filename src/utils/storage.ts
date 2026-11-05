import {
  CreatureTemplate,
  PartyMember,
  Encounter,
  ActiveCombatState,
  AppDataExport,
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
};

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
    return safeParse<CreatureTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
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
      activeCombat: this.getCombatState() || undefined,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importAll(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, error: 'Неверный формат JSON файла' };
      }

      const hasKnownSection = ['templates', 'party', 'encounters', 'activeCombat'].some(
        (key) => key in parsed
      );
      if (!hasKnownSection) {
        return {
          success: false,
          error: 'В файле нет ни одного известного раздела (templates, party, encounters, activeCombat)',
        };
      }

      const errors = validateImportData(parsed);
      if (errors.length > 0) {
        const preview = errors.slice(0, 5).join('; ');
        const rest = errors.length > 5 ? `; и ещё ${errors.length - 5} ошибок` : '';
        return { success: false, error: `Файл не прошёл проверку: ${preview}${rest}` };
      }

      const data = parsed as Partial<AppDataExport> & { activeCombat?: unknown };

      if (Array.isArray(data.templates)) {
        this.saveTemplates(data.templates);
      }
      if (Array.isArray(data.party)) {
        this.saveParty(data.party);
      }
      if (Array.isArray(data.encounters)) {
        this.saveEncounters(data.encounters);
      }
      if ('activeCombat' in data) {
        this.saveCombatState((data.activeCombat ?? null) as ActiveCombatState | null);
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
  },
};
