import { CatalogMonster } from '../types/bestiary';

export type CatalogSort =
  | 'name-asc'
  | 'name-desc'
  | 'cr-asc'
  | 'cr-desc'
  | 'hp-desc'
  | 'hp-asc'
  | 'ac-desc'
  | 'initiative-desc'
  | 'source-asc';

export type CatalogNamedFilter = 'all' | 'named' | 'regular';

export interface CatalogFilterOptions {
  search: string;
  cr: string;
  category: string;
  size: string;
  sourceBook: string;
  named: CatalogNamedFilter;
  legendaryOnly: boolean;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterOptions = {
  search: '',
  cr: 'all',
  category: 'all',
  size: 'all',
  sourceBook: 'all',
  named: 'all',
  legendaryOnly: false,
  sort: 'name-asc',
};

export const CATALOG_SIZE_OPTIONS = [
  'Крошечный',
  'Маленький',
  'Средний',
  'Большой',
  'Огромный',
  'Громадный',
] as const;

export const CATALOG_SORT_OPTIONS: Array<{ id: CatalogSort; label: string }> = [
  { id: 'name-asc', label: 'Имя: А–Я' },
  { id: 'name-desc', label: 'Имя: Я–А' },
  { id: 'cr-asc', label: 'CR: по возрастанию' },
  { id: 'cr-desc', label: 'CR: по убыванию' },
  { id: 'hp-desc', label: 'HP: по убыванию' },
  { id: 'hp-asc', label: 'HP: по возрастанию' },
  { id: 'ac-desc', label: 'КД: по убыванию' },
  { id: 'initiative-desc', label: 'Инициатива: по убыванию' },
  { id: 'source-asc', label: 'Источник: А–Я' },
];

const sortName = (monster: CatalogMonster) =>
  monster.name.replace(/^[^\p{L}\p{N}]+/u, '').trim();

const compareName = (a: CatalogMonster, b: CatalogMonster) =>
  sortName(a).localeCompare(sortName(b), 'ru');

function compareByName(a: CatalogMonster, b: CatalogMonster, direction: 1 | -1) {
  return compareName(a, b) * direction;
}

export function getCatalogSourceBooks(monsters: CatalogMonster[]): string[] {
  const set = new Set<string>();
  for (const monster of monsters) {
    for (const book of monster.sourceBook?.split(/,\s*/) ?? []) {
      if (book.trim()) set.add(book.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

function matchesSearch(monster: CatalogMonster, q: string): boolean {
  if (!q) return true;
  const items = [
    monster.name,
    monster.englishName,
    monster.category,
    monster.alignment,
    monster.sourceBook,
    monster.notes,
    monster.cr,
  ];
  if (items.some((item) => item?.toLowerCase().includes(q))) return true;

  const sections = [
    monster.traits,
    monster.actions,
    monster.bonusActions,
    monster.reactions,
    monster.legendaryActions,
  ];
  return sections.some(
    (section) =>
      section?.some(
        (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      ) ?? false
  );
}

function matchesChallenge(monster: CatalogMonster, cr: string): boolean {
  if (cr === 'all') return true;
  if (cr === 'low') return monster.crNum <= 0.5;
  if (cr === 'tier1') return monster.crNum >= 1 && monster.crNum <= 4;
  if (cr === 'tier2') return monster.crNum >= 5 && monster.crNum <= 10;
  if (cr === 'tier3') return monster.crNum >= 11;
  return monster.cr === cr;
}

function matchesSource(monster: CatalogMonster, sourceBook: string): boolean {
  if (sourceBook === 'all') return true;
  return (
    monster.sourceBook
      ?.split(/,\s*/)
      .map((book) => book.trim())
      .includes(sourceBook) ?? false
  );
}

function isNamedNpc(monster: CatalogMonster): boolean {
  return monster.notes.startsWith('Именной НИП');
}

function sortMonsters(monsters: CatalogMonster[], sort: CatalogSort): CatalogMonster[] {
  const sorted = [...monsters];
  switch (sort) {
    case 'name-desc':
      return sorted.sort((a, b) => compareByName(a, b, -1));
    case 'cr-asc':
      return sorted.sort((a, b) => a.crNum - b.crNum || compareName(a, b));
    case 'cr-desc':
      return sorted.sort((a, b) => b.crNum - a.crNum || compareName(a, b));
    case 'hp-desc':
      return sorted.sort((a, b) => b.maxHp - a.maxHp || compareName(a, b));
    case 'hp-asc':
      return sorted.sort((a, b) => a.maxHp - b.maxHp || compareName(a, b));
    case 'ac-desc':
      return sorted.sort(
        (a, b) => Number(b.armorClass) - Number(a.armorClass) || compareName(a, b)
      );
    case 'initiative-desc':
      return sorted.sort(
        (a, b) => b.initiativeModifier - a.initiativeModifier || compareName(a, b)
      );
    case 'source-asc':
      return sorted.sort(
        (a, b) =>
          (a.sourceBook || 'Я').localeCompare(b.sourceBook || 'Я', 'ru') || compareName(a, b)
      );
    case 'name-asc':
    default:
      return sorted.sort(compareName);
  }
}

export function filterAndSortCatalog(
  monsters: CatalogMonster[],
  options: CatalogFilterOptions
): CatalogMonster[] {
  const q = options.search.trim().toLowerCase();

  const filtered = monsters.filter((monster) => {
    if (!matchesSearch(monster, q)) return false;
    if (!matchesChallenge(monster, options.cr)) return false;
    if (options.category !== 'all' && monster.category !== options.category) return false;
    if (options.size !== 'all' && !monster.size.includes(options.size)) return false;
    if (!matchesSource(monster, options.sourceBook)) return false;
    if (options.named === 'named' && !isNamedNpc(monster)) return false;
    if (options.named === 'regular' && isNamedNpc(monster)) return false;
    if (options.legendaryOnly && !monster.legendaryActions?.length) return false;
    return true;
  });

  return sortMonsters(filtered, options.sort);
}
