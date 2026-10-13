import { CreatureTemplate } from '../types';
import { CatalogMonster } from '../types/bestiary';
import { BESTIARY_5E14 } from '../data/bestiary5e14';
import { BESTIARY_5E24 } from '../data/bestiary5e24';

export interface ParsedMonsterResult {
  name: string;
  englishName?: string;
  edition: '5e14' | '5e24';
  cr?: string;
  maxHp: number;
  armorClass: string | number;
  initiativeModifier: number;
  tags: string[];
  notes: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

/**
 * Attempt to find a creature in pre-bundled catalogs by URL or slug
 */
export function findMonsterByUrlOrSlug(urlOrSlug: string): CatalogMonster | null {
  const clean = urlOrSlug.trim().toLowerCase();
  
  // Check exact URLs
  const allMonsters = [...BESTIARY_5E24, ...BESTIARY_5E14];
  const byUrl = allMonsters.find(
    (m) => m.sourceUrl.toLowerCase().includes(clean) || clean.includes(m.sourceUrl.toLowerCase())
  );
  if (byUrl) return byUrl;

  // Check by English name or Russian name or slug part
  const bySlug = allMonsters.find(
    (m) =>
      clean.includes(m.englishName.toLowerCase()) ||
      clean.includes(m.name.toLowerCase()) ||
      m.id.toLowerCase().includes(clean)
  );
  return bySlug || null;
}

/**
 * Intelligent text parser for creature statblock copied from dnd.su or next.dnd.su
 */
export function parseMonsterFromText(
  rawText: string,
  forcedEdition?: '5e14' | '5e24',
  sourceUrl?: string
): ParsedMonsterResult {
  const text = rawText.trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Auto-detect edition from URL or text
  let edition: '5e14' | '5e24' = forcedEdition || '5e24';
  if (sourceUrl) {
    if (sourceUrl.includes('next.dnd.su')) edition = '5e24';
    else if (sourceUrl.includes('5e14.dnd.su')) edition = '5e14';
  } else if (text.includes('5e14') || text.includes('2014')) {
    edition = '5e14';
  }

  // Extract Name (first non-empty line or matching regex)
  let name = lines[0] || 'Новое существо';
  let englishName = '';

  // E.g. "Гоблин [Goblin]" or "Гоблин (Goblin)"
  const nameMatch = name.match(/^([^[(\n]+)[([]([^\])]+)[\])]/);
  if (nameMatch) {
    name = nameMatch[1].trim();
    englishName = nameMatch[2].trim();
  }

  // Extract Armor Class (Класс Доспеха / КД)
  let armorClass: string | number = 12;
  const acMatch = text.match(/(?:Класс Доспеха|КД|Armor Class)\s*[:—–-]?\s*(\d+)(?:\s*\(([^)]+)\))?/i);
  if (acMatch) {
    armorClass = parseInt(acMatch[1], 10) || 12;
  }

  // Extract Hit Points (Хиты / HP)
  let maxHp = 10;
  const hpMatch = text.match(/(?:Хиты|Хит-поинты|Hit Points|HP)\s*[:—–-]?\s*(\d+)(?:\s*\(([^)]+)\))?/i);
  if (hpMatch) {
    maxHp = parseInt(hpMatch[1], 10) || 10;
  }

  // Extract Challenge Rating (Опасность / CR)
  let cr: string | undefined = undefined;
  const crMatch = text.match(/(?:Опасность|Показатель опасности|CR|Challenge)\s*[:—–-]?\s*(\d+\/\d+|\d+)/i);
  if (crMatch) {
    cr = crMatch[1];
  }

  // Extract Dexterity for Initiative modifier
  let initiativeModifier = 0;
  // Look for stat table: ЛОВ / DEX
  const dexMatch = text.match(/(?:ЛОВ|DEX)\s*[:|]?\s*(\d+)\s*(?:\(([+-]?\d+)\))?/i);
  if (dexMatch) {
    if (dexMatch[2]) {
      initiativeModifier = parseInt(dexMatch[2], 10);
    } else {
      const dexScore = parseInt(dexMatch[1], 10);
      initiativeModifier = Math.floor((dexScore - 10) / 2);
    }
  }

  // Check explicit initiative modifier
  const initMatch = text.match(/(?:Инициатива|Initiative)\s*[:—–-]?\s*([+-]?\d+)/i);
  if (initMatch) {
    initiativeModifier = parseInt(initMatch[1], 10);
  }

  // Tags
  const tags: string[] = [edition === '5e24' ? '5e24' : '5e14'];
  if (cr) tags.push(`CR ${cr}`);

  // Check categories in text
  const categories = [
    'Гуманоид',
    'Нежить',
    'Зверь',
    'Дракон',
    'Монстр',
    'Великан',
    'Аберрация',
    'Исчадие',
    'Фея',
    'Элементаль',
    'Конструкт',
    'Слизь',
    'Растение',
  ];
  for (const cat of categories) {
    if (new RegExp(cat, 'i').test(text)) {
      tags.push(cat);
      break;
    }
  }

  // Notes: take abilities / actions summary from text
  let notes = '';
  // Try to find sections like "Действия" / "Actions" or summarize
  const actionsIdx = text.search(/(?:Действия|Actions)/i);
  if (actionsIdx !== -1) {
    notes = text.substring(actionsIdx, actionsIdx + 500).trim();
  } else {
    // Take lines after the stats
    notes = lines.slice(2, 8).join('\n');
  }

  return {
    name,
    englishName,
    edition,
    cr,
    maxHp,
    armorClass,
    initiativeModifier,
    tags,
    notes,
    sourceUrl: sourceUrl || (edition === '5e24' ? 'https://next.dnd.su/bestiary/' : 'https://5e14.dnd.su/bestiary/'),
    sourceLabel: edition === '5e24' ? 'next.dnd.su (5e24)' : '5e14.dnd.su (5e14)',
  };
}

/**
 * Convert a CatalogMonster directly into a CreatureTemplate for the user's personal bestiary
 */
export function convertCatalogMonsterToTemplate(monster: CatalogMonster): CreatureTemplate {
  const isAlly = monster.category === 'Гуманоид' && monster.alignment.toLowerCase().includes('добр');
  const type = isAlly ? 'ally' : 'enemy';

  return {
    id: `tpl-${monster.edition}-${monster.id}-${Date.now().toString(36)}`,
    name: monster.name,
    englishName: monster.englishName,
    type,
    maxHp: monster.maxHp,
    armorClass: monster.armorClass,
    initiativeModifier: monster.initiativeModifier,
    tags: [
      monster.edition === '5e24' ? '5e24' : '5e14',
      monster.category,
      `CR ${monster.cr}`,
      monster.size,
    ],
    notes: monster.notes,
    cr: monster.cr,
    edition: monster.edition,
    sourceUrl: monster.sourceUrl,
    sourceLabel: monster.sourceLabel,
    createdAt: Date.now(),
  };
}
