import { describe, expect, it } from 'vitest';
import { CatalogMonster } from '../types/bestiary';
import {
  CatalogFilterOptions,
  DEFAULT_CATALOG_FILTERS,
  filterAndSortCatalog,
  getCatalogSourceBooks,
} from './catalogFilters';

const baseMonster: CatalogMonster = {
  id: 'base',
  name: 'Базовое существо',
  englishName: 'Base Creature',
  edition: '5e14',
  cr: '1',
  crNum: 1,
  size: 'Средний',
  category: 'Монстр',
  alignment: 'Нейтральный',
  maxHp: 10,
  hpFormula: '2d8+2',
  armorClass: 12,
  speed: '30 футов',
  initiativeModifier: 0,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  actions: [],
  notes: '',
  sourceUrl: 'https://5e14.dnd.su/bestiary/1-base/',
  sourceLabel: '5e14.dnd.su (5e14)',
};

function monster(overrides: Partial<CatalogMonster>): CatalogMonster {
  return { ...baseMonster, ...overrides };
}

const goblin = monster({
  id: '5e14-goblin',
  name: 'Гоблин',
  englishName: 'Goblin',
  cr: '1/4',
  crNum: 0.25,
  size: 'Маленький',
  category: 'Гуманоид',
  maxHp: 7,
  armorClass: 15,
  initiativeModifier: 2,
  sourceBook: 'Monster Manual',
  actions: [{ name: 'Скимитар', description: 'Рукопашная атака оружием.' }],
});

const dragon = monster({
  id: '5e14-adult-red-dragon',
  name: 'Взрослый красный дракон',
  englishName: 'Adult Red Dragon',
  cr: '17',
  crNum: 17,
  size: 'Огромный',
  category: 'Дракон',
  maxHp: 256,
  armorClass: 19,
  initiativeModifier: 0,
  sourceBook: 'Monster Manual',
  traits: [{ name: 'Легендарное сопротивление', description: 'Может перебросить спасбросок.' }],
  legendaryActions: [{ name: 'Обнаружение', description: 'Совершает проверку Восприятия.' }],
});

const alastrah = monster({
  id: '5e14-alastrah',
  name: 'Аластра',
  englishName: 'Alastrah',
  cr: '0',
  crNum: 0,
  size: 'Средний',
  category: 'Великан',
  maxHp: 4,
  armorClass: 10,
  sourceBook: "Storm King's Thunder",
  notes: 'Именной НИП.\nДействия: Деревянная игрушка',
  actions: [{ name: 'Деревянная игрушка', description: 'Рукопашная атака игрушкой.' }],
});

const archmage = monster({
  id: '5e14-archmage',
  name: 'Архимаг',
  englishName: 'Archmage',
  cr: '12',
  crNum: 12,
  size: 'Средний',
  category: 'Гуманоид',
  maxHp: 99,
  armorClass: 12,
  initiativeModifier: 2,
  sourceBook: "Monster Manual, Player's Handbook 2024",
  traits: [{ name: 'Использование заклинаний', description: 'Архимаг — заклинатель 18-го уровня.' }],
});

const tarrasque = monster({
  id: '5e14-tarrasque',
  name: 'Тарраск',
  englishName: 'Tarrasque',
  cr: '30',
  crNum: 30,
  size: 'Громадный',
  category: 'Монстр',
  maxHp: 676,
  armorClass: 25,
  initiativeModifier: -1,
  sourceBook: 'Monster Manual',
  legendaryActions: [{ name: 'Атака', description: 'Совершает одну атаку.' }],
});

const catalog = [goblin, dragon, alastrah, archmage, tarrasque];

function options(overrides: Partial<CatalogFilterOptions> = {}): CatalogFilterOptions {
  return { ...DEFAULT_CATALOG_FILTERS, ...overrides };
}

function ids(monsters: CatalogMonster[]) {
  return monsters.map((monster) => monster.id);
}

describe('filterAndSortCatalog', () => {
  it('sorts by name by default', () => {
    expect(ids(filterAndSortCatalog(catalog, options()))).toEqual([
      '5e14-alastrah',
      '5e14-archmage',
      '5e14-adult-red-dragon',
      '5e14-goblin',
      '5e14-tarrasque',
    ]);
  });

  it('sorts quoted names by their first letter', () => {
    const quoted = monster({
      id: 'quoted',
      name: '«Демогоргон»',
      englishName: 'The Demogorgon',
    });
    expect(ids(filterAndSortCatalog([quoted, goblin, alastrah], options()))).toEqual([
      '5e14-alastrah',
      '5e14-goblin',
      'quoted',
    ]);
  });

  it('searches across traits, actions and legendary actions', () => {
    expect(ids(filterAndSortCatalog(catalog, options({ search: 'заклинатель' })))).toEqual([
      '5e14-archmage',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ search: 'деревянная' })))).toEqual([
      '5e14-alastrah',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ search: 'обнаружение' })))).toEqual([
      '5e14-adult-red-dragon',
    ]);
  });

  it('filters by CR tier and exact CR', () => {
    expect(ids(filterAndSortCatalog(catalog, options({ cr: 'tier3' })))).toEqual([
      '5e14-archmage',
      '5e14-adult-red-dragon',
      '5e14-tarrasque',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ cr: 'low' })))).toEqual([
      '5e14-alastrah',
      '5e14-goblin',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ cr: '17' })))).toEqual([
      '5e14-adult-red-dragon',
    ]);
  });

  it('filters by size, named NPC status and legendary actions', () => {
    expect(ids(filterAndSortCatalog(catalog, options({ size: 'Маленький' })))).toEqual([
      '5e14-goblin',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ named: 'named' })))).toEqual([
      '5e14-alastrah',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ named: 'regular' })))).not.toContain(
      '5e14-alastrah'
    );
    expect(ids(filterAndSortCatalog(catalog, options({ legendaryOnly: true })))).toEqual([
      '5e14-adult-red-dragon',
      '5e14-tarrasque',
    ]);
  });

  it('filters by source book, including multi-source entries', () => {
    expect(ids(filterAndSortCatalog(catalog, options({ sourceBook: 'Monster Manual' })))).toEqual([
      '5e14-archmage',
      '5e14-adult-red-dragon',
      '5e14-goblin',
      '5e14-tarrasque',
    ]);
    expect(
      ids(filterAndSortCatalog(catalog, options({ sourceBook: "Storm King's Thunder" })))
    ).toEqual(['5e14-alastrah']);
  });

  it('combines several filters', () => {
    expect(
      ids(
        filterAndSortCatalog(
          catalog,
          options({ category: 'Гуманоид', size: 'Средний', sourceBook: 'Monster Manual' })
        )
      )
    ).toEqual(['5e14-archmage']);
  });

  it('sorts by CR, HP, AC and initiative', () => {
    expect(ids(filterAndSortCatalog(catalog, options({ sort: 'cr-desc' })))).toEqual([
      '5e14-tarrasque',
      '5e14-adult-red-dragon',
      '5e14-archmage',
      '5e14-goblin',
      '5e14-alastrah',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ sort: 'hp-desc' })))).toEqual([
      '5e14-tarrasque',
      '5e14-adult-red-dragon',
      '5e14-archmage',
      '5e14-goblin',
      '5e14-alastrah',
    ]);
    expect(ids(filterAndSortCatalog(catalog, options({ sort: 'hp-asc' })))[0]).toBe(
      '5e14-alastrah'
    );
    expect(ids(filterAndSortCatalog(catalog, options({ sort: 'ac-desc' })))[0]).toBe(
      '5e14-tarrasque'
    );
    expect(ids(filterAndSortCatalog(catalog, options({ sort: 'initiative-desc' }))).slice(0, 2)).toEqual([
      '5e14-archmage',
      '5e14-goblin',
    ]);
  });

  it('sorts by source book', () => {
    const sorted = filterAndSortCatalog(catalog, options({ sort: 'source-asc' }));
    expect(sorted[0].sourceBook).toBe('Monster Manual');
    expect(sorted[sorted.length - 1].id).toBe('5e14-alastrah');
  });
});

describe('getCatalogSourceBooks', () => {
  it('splits combined source plaques and sorts them', () => {
    expect(getCatalogSourceBooks(catalog)).toEqual([
      'Monster Manual',
      "Player's Handbook 2024",
      "Storm King's Thunder",
    ]);
  });
});
