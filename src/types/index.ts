export type CreatureType = 'enemy' | 'player' | 'ally' | 'neutral' | 'hazard';

export interface Condition {
  id: string;
  name: string;
  roundsRemaining: number | null; // null = бессрочно до снятия
  color?: string; // hex или tailwind класс
  notes?: string;
}

export interface CreatureTemplate {
  id: string;
  name: string;
  type: CreatureType;
  maxHp: number;
  armorClass: string | number; // КД / Защита
  initiativeModifier: number; // +2, 0, -1
  tags: string[]; // ['Гоблиноид', 'Лучник']
  notes: string; // Действия, статы, способности
  createdAt: number;
}

export interface PartyMember {
  id: string;
  name: string;
  playerName?: string;
  maxHp: number;
  currentHp: number;
  armorClass: string | number;
  initiativeModifier: number;
  passivePerception?: number | string;
  notes?: string;
  color?: string;
}

export interface EncounterMonster {
  id: string; // уникальный ID записи в энкаунтере
  templateId?: string; // ID связанного шаблона, если есть
  name: string;
  type: CreatureType;
  count: number; // количество (например 3 гоблина)
  maxHp: number;
  armorClass: string | number;
  initiativeModifier: number;
  notes?: string;
}

export interface Encounter {
  id: string;
  title: string;
  description?: string;
  location?: string;
  tags: string[];
  monsters: EncounterMonster[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly' | 'custom';
  createdAt: number;
  updatedAt: number;
}

export interface Combatant {
  id: string;
  name: string;
  type: CreatureType;
  initiative: number;
  initiativeModifier: number;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  armorClass: string | number;
  conditions: Condition[];
  notes: string;
  isDefeated: boolean; // повержен / без сознания
  isDelayed: boolean; // задержал ход
  templateId?: string;
  sourcePartyMemberId?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  message: string;
  type: 'damage' | 'heal' | 'turn' | 'round' | 'condition' | 'system' | 'roll';
}

export type DiceSystem = 'd20' | 'd10' | '2d6' | '3d6' | 'manual';

export interface ActiveCombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  combatants: Combatant[];
  log: CombatLogEntry[];
  diceSystem: DiceSystem;
  encounterTitle?: string;
  encounterId?: string;
}

export interface AppDataExport {
  version: number;
  exportDate: string;
  templates: CreatureTemplate[];
  party: PartyMember[];
  encounters: Encounter[];
  activeCombat?: ActiveCombatState;
}
