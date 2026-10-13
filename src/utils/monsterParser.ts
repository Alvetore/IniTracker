import { CreatureTemplate } from '../types';
import { CatalogMonster } from '../types/bestiary';
import { BESTIARY_5E14 } from '../data/bestiary5e14';
import { BESTIARY_5E24 } from '../data/bestiary5e24';
import { KNOWN_MONSTER_DICTIONARY } from '../data/knownMonsters';

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
 * Normalizes URL for consistent comparisons
 */
export function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
}

/**
 * Extracts numeric ID, English/Russian slug, and human-readable clean name from a dnd.su URL or slug
 */
export function extractMonsterSlugAndId(input: string): {
  id?: string;
  slug: string;
  rawName: string;
  edition?: '5e14' | '5e24';
} {
  const trimmed = input.trim();
  let edition: '5e14' | '5e24' | undefined = undefined;
  if (trimmed.includes('next.dnd.su')) {
    edition = '5e24';
  } else if (trimmed.includes('5e14.dnd.su')) {
    edition = '5e14';
  }

  // Strip domain and path prefix
  let str = trimmed.replace(/^https?:\/\/[^/]+\/bestiary\/?/i, '');
  // Strip query params and trailing slashes
  str = str.replace(/[?#].*$/, '').replace(/\/+$/, '');

  // Match optional leading numeric ID, e.g. "21205-banshee", "40_banshee", "21205 banshee"
  const match = str.match(/^(?:(\d+)[-_ ])?(.+)$/);
  const numId = match && match[1] ? match[1] : undefined;
  let slug = match && match[2] ? match[2].trim() : str;

  // Clean slug
  slug = slug.toLowerCase().replace(/[^a-z0-9а-яё\s-_]/gi, '');

  // Normalized raw name (replace hyphens/underscores with space, Title Case, no numeric prefixes)
  const cleanWords = slug
    .replace(/^\d+[-_\s]+/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const rawName = cleanWords.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()) || 'Существо';

  return { id: numId, slug, rawName, edition };
}

/**
 * Attempt to find a creature in pre-bundled catalogs or known dictionary by URL or slug
 */
export function findMonsterByUrlOrSlug(
  urlOrSlug: string,
  preferredEdition?: '5e14' | '5e24'
): CatalogMonster | null {
  const { id, slug, rawName, edition: detectedEdition } = extractMonsterSlugAndId(urlOrSlug);
  const targetEdition = detectedEdition || preferredEdition;

  const normInput = normalizeUrl(urlOrSlug);

  // Group monsters by edition priority
  const firstList = targetEdition === '5e14' ? BESTIARY_5E14 : BESTIARY_5E24;
  const secondList = targetEdition === '5e14' ? BESTIARY_5E24 : BESTIARY_5E14;
  const allMonsters = [...firstList, ...secondList];

  // 1. Exact normalized URL match
  const byExactUrl = allMonsters.find((m) => normalizeUrl(m.sourceUrl) === normInput);
  if (byExactUrl) return byExactUrl;

  // 2. Match by numeric ID in URL (e.g. 21205-banshee, 40-banshee)
  if (id) {
    const byIdUrl = allMonsters.find((m) => {
      const norm = normalizeUrl(m.sourceUrl);
      return norm.includes(`/${id}-`) || norm.includes(`/${id}/`) || norm.endsWith(`/${id}`);
    });
    if (byIdUrl) return byIdUrl;
  }

  // 3. Match by clean slug
  const cleanSlug = slug.toLowerCase();
  const cleanSlugWords = cleanSlug.replace(/[-_]+/g, ' ').toLowerCase();

  const bySlug = allMonsters.find((m) => {
    const mNorm = normalizeUrl(m.sourceUrl);
    const mSlug = mNorm.split('/').filter(Boolean).pop() || '';
    const mSlugClean = mSlug.replace(/^\d+[-_]/, '').toLowerCase();

    return (
      mSlugClean === cleanSlug ||
      m.englishName.toLowerCase() === cleanSlugWords ||
      m.name.toLowerCase() === cleanSlugWords ||
      m.id.toLowerCase() === cleanSlug ||
      m.id.toLowerCase().replace(/^(5e14-|5e24-)/, '') === cleanSlug
    );
  });
  if (bySlug) return bySlug;

  // 4. Partial slug match in catalog
  if (cleanSlug.length >= 3) {
    const byPartial = allMonsters.find(
      (m) =>
        m.englishName.toLowerCase().includes(cleanSlugWords) ||
        cleanSlugWords.includes(m.englishName.toLowerCase()) ||
        m.name.toLowerCase().includes(cleanSlugWords) ||
        cleanSlugWords.includes(m.name.toLowerCase())
    );
    if (byPartial) return byPartial;
  }

  // 5. Check KNOWN_MONSTER_DICTIONARY
  // Normalize lookup key
  const dictKey = cleanSlug.replace(/^\d+[-_]/, '');
  const dictEntry =
    KNOWN_MONSTER_DICTIONARY[dictKey] ||
    KNOWN_MONSTER_DICTIONARY[dictKey.replace(/[-_]/g, '')] ||
    Object.values(KNOWN_MONSTER_DICTIONARY).find(
      (entry) =>
        entry.englishName.toLowerCase() === cleanSlugWords ||
        entry.name.toLowerCase() === cleanSlugWords
    );

  if (dictEntry) {
    const edition = targetEdition || '5e24';
    return {
      id: `${edition}-${dictKey}`,
      name: dictEntry.name,
      englishName: dictEntry.englishName,
      edition,
      cr: dictEntry.cr,
      crNum: parseChallengeRating(dictEntry.cr),
      size: dictEntry.size || 'Средний',
      category: dictEntry.category || 'Монстр',
      alignment: 'Любое мировоззрение',
      maxHp: dictEntry.maxHp,
      hpFormula: '',
      armorClass: dictEntry.armorClass,
      speed: '30 фт.',
      initiativeModifier: dictEntry.initiativeModifier,
      stats: { str: 10, dex: 10 + dictEntry.initiativeModifier * 2, con: 10, int: 10, wis: 10, cha: 10 },
      senses: 'пассивное Восприятие 10',
      actions: [],
      notes: dictEntry.notes || `Существо ${dictEntry.name} [${dictEntry.englishName}].`,
      sourceUrl: urlOrSlug.startsWith('http')
        ? urlOrSlug
        : edition === '5e24'
        ? `https://next.dnd.su/bestiary/${slug}/`
        : `https://5e14.dnd.su/bestiary/${slug}/`,
      sourceLabel: edition === '5e24' ? 'next.dnd.su (5e24)' : '5e14.dnd.su (5e14)',
    };
  }

  return null;
}

function parseChallengeRating(crStr?: string): number {
  if (!crStr) return 0;
  if (crStr.includes('/')) {
    const [num, den] = crStr.split('/').map(Number);
    return den ? num / den : 0;
  }
  return parseFloat(crStr) || 0;
}

/**
 * Intelligent text parser for creature statblock copied from dnd.su or next.dnd.su
 */
export function parseMonsterFromText(
  rawText: string,
  forcedEdition?: '5e14' | '5e24',
  sourceUrl?: string
): ParsedMonsterResult {
  // Strip any raw HTML tags and non-breaking spaces if copied from browser
  const text = rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Auto-detect edition from URL or text
  let edition: '5e14' | '5e24' = forcedEdition || '5e24';
  if (sourceUrl) {
    if (sourceUrl.includes('next.dnd.su')) edition = '5e24';
    else if (sourceUrl.includes('5e14.dnd.su')) edition = '5e14';
  } else if (text.includes('5e14') || text.includes('2014')) {
    edition = '5e14';
  }

  // Extract Name & English name
  let firstLine = lines[0] || 'Новое существо';
  // Strip leading digits and IDs like "21205-banshee", "127 goblin", "40."
  firstLine = firstLine.replace(/^\d+[-_.\s]+/, '').trim();

  let name = firstLine;
  let englishName = '';

  // Case 1: "Гоблин [Goblin]" or "Банши (Banshee)"
  const bracketMatch = name.match(/^([^[(\n]+)[([]([^\])]+)[\])]/);
  if (bracketMatch) {
    name = bracketMatch[1].trim();
    englishName = bracketMatch[2].trim();
  } else if (lines.length > 1) {
    // Case 2: Line 0 is Russian name, Line 1 is English name (e.g. "Банши" \n "Banshee" or "[Banshee]")
    const secondLine = lines[1].trim().replace(/[\[\]()]/g, '');
    if (/^[a-zA-Z\s'-]+$/.test(secondLine) && secondLine.length < 50) {
      englishName = secondLine;
    }
  }

  // If name is purely English or slug-like, check dictionary for Russian translation
  const lowerName = name.toLowerCase().replace(/[-_]+/g, ' ').trim();
  const dictKey = lowerName.replace(/\s+/g, '-');
  const dictMatch =
    KNOWN_MONSTER_DICTIONARY[dictKey] ||
    Object.values(KNOWN_MONSTER_DICTIONARY).find(
      (e) => e.englishName.toLowerCase() === lowerName || e.name.toLowerCase() === lowerName
    );

  if (dictMatch) {
    if (!name || /^[a-zA-Z\s-_]+$/.test(name)) {
      name = dictMatch.name;
    }
    if (!englishName) {
      englishName = dictMatch.englishName;
    }
  }

  // Extract Armor Class (Класс Доспеха / Класс Защиты / КД / КЗ / Armor Class)
  let armorClass: string | number = dictMatch ? dictMatch.armorClass : 12;
  const acMatch = text.match(
    /(?:Класс\s+(?:Доспеха|Защиты)|КД|КЗ|Armor\s+Class|AC)\s*[:—–-]?\s*(\d+)(?:\s*\(([^)]+)\))?/i
  );
  if (acMatch) {
    armorClass = parseInt(acMatch[1], 10) || 12;
  }

  // Extract Hit Points (Хиты / Хит-поинты / Hit Points / HP)
  let maxHp = dictMatch ? dictMatch.maxHp : 10;
  const hpMatch = text.match(
    /(?:Хит[- ]?поинты|Хиты|Hit\s+Points|HP)\s*[:—–-]?\s*(\d+)(?:\s*\(([^)]+)\))?/i
  );
  if (hpMatch) {
    maxHp = parseInt(hpMatch[1], 10) || 10;
  }

  // Extract Challenge Rating (Опасность / Показатель опасности / CR / Challenge Rating)
  let cr: string | undefined = dictMatch ? dictMatch.cr : undefined;
  const crMatch = text.match(
    /(?:Показатель\s+опасности|Боевой\s+рейтинг|Опасность|Challenge(?:\s+Rating)?|CR)\s*[:—–-]?\s*(\d+\/\d+|\d+(?:[.,]\d+)?)/i
  );
  if (crMatch) {
    cr = crMatch[1];
  }

  // Extract Dexterity / Initiative modifier
  let initiativeModifier = dictMatch ? dictMatch.initiativeModifier : 0;
  // Look for stat table: ЛОВ / DEX / Ловкость
  const dexMatch = text.match(/(?:ЛОВ|DEX|Ловкость|Dexterity)\s*[:|]?\s*(\d+)\s*(?:\(([+-]?\d+)\))?/i);
  if (dexMatch) {
    if (dexMatch[2]) {
      initiativeModifier = parseInt(dexMatch[2], 10);
    } else {
      const dexScore = parseInt(dexMatch[1], 10);
      initiativeModifier = Math.floor((dexScore - 10) / 2);
    }
  }

  // Check explicit initiative modifier (Инициатива +2 / Initiative +2)
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
    'Небожитель',
  ];
  let foundCategory = false;
  for (const cat of categories) {
    if (new RegExp(cat, 'i').test(text)) {
      tags.push(cat);
      foundCategory = true;
      break;
    }
  }
  if (!foundCategory && dictMatch) {
    tags.push(dictMatch.category);
  }

  // Notes: take abilities / actions summary from text
  let notes = '';
  const actionsIdx = text.search(/(?:Действия|Actions|Особенности|Черты|Traits)/i);
  if (actionsIdx !== -1) {
    notes = text.substring(actionsIdx, actionsIdx + 600).trim();
  } else if (dictMatch && dictMatch.notes) {
    notes = dictMatch.notes;
  } else {
    // Take lines after stats
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
    sourceUrl:
      sourceUrl ||
      (edition === '5e24' ? 'https://next.dnd.su/bestiary/' : 'https://5e14.dnd.su/bestiary/'),
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
