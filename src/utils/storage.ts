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

export const Storage = {
  getTemplates(): CreatureTemplate[] {
    const data = safeParse<CreatureTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    if (data.length === 0) {
      // Initialize with defaults if empty
      this.saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    return data;
  },

  saveTemplates(templates: CreatureTemplate[]): void {
    safeSave(STORAGE_KEYS.TEMPLATES, templates);
  },

  getParty(): PartyMember[] {
    const data = safeParse<PartyMember[]>(STORAGE_KEYS.PARTY, []);
    if (data.length === 0) {
      this.saveParty(DEFAULT_PARTY);
      return DEFAULT_PARTY;
    }
    return data;
  },

  saveParty(party: PartyMember[]): void {
    safeSave(STORAGE_KEYS.PARTY, party);
  },

  getEncounters(): Encounter[] {
    const data = safeParse<Encounter[]>(STORAGE_KEYS.ENCOUNTERS, []);
    if (data.length === 0) {
      this.saveEncounters(DEFAULT_ENCOUNTERS);
      return DEFAULT_ENCOUNTERS;
    }
    return data;
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
      const parsed = JSON.parse(jsonString) as Partial<AppDataExport>;
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Неверный формат JSON файла' };
      }

      if (Array.isArray(parsed.templates)) {
        this.saveTemplates(parsed.templates);
      }
      if (Array.isArray(parsed.party)) {
        this.saveParty(parsed.party);
      }
      if (Array.isArray(parsed.encounters)) {
        this.saveEncounters(parsed.encounters);
      }
      if (parsed.activeCombat) {
        this.saveCombatState(parsed.activeCombat);
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
