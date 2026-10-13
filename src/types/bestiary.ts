import { CreatureType } from './index';

export interface CatalogMonster {
  id: string;
  name: string;
  englishName: string;
  edition: '5e14' | '5e24';
  cr: string;
  crNum: number;
  size: string; // 'Крошечный' | 'Маленький' | 'Средний' | 'Большой' | 'Огромный' | 'Громадный'
  category: string; // 'Гуманоид' | 'Нежить' | 'Зверь' | 'Дракон' | 'Монстр' | 'Великан' | etc.
  alignment: string;
  maxHp: number;
  hpFormula: string;
  armorClass: string | number;
  acNote?: string;
  speed: string;
  initiativeModifier: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows?: string;
  skills?: string;
  damageVulnerabilities?: string;
  damageResistances?: string;
  damageImmunities?: string;
  conditionImmunities?: string;
  senses?: string;
  languages?: string;
  traits?: { name: string; description: string }[];
  actions: { name: string; description: string }[];
  bonusActions?: { name: string; description: string }[];
  reactions?: { name: string; description: string }[];
  legendaryActions?: { name: string; description: string }[];
  notes: string;
  sourceUrl: string;
  sourceLabel: string;
}

export type BestiarySection = 'saved' | '5e24' | '5e14';
