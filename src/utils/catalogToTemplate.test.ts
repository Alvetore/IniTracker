import { describe, expect, it } from 'vitest';
import { CatalogMonster } from '../types/bestiary';
import { convertCatalogMonsterToTemplate } from './catalogToTemplate';

const monster: CatalogMonster = {
  id: '5e24-test-goblin',
  name: 'Гоблин',
  englishName: 'Goblin',
  edition: '5e24',
  cr: '1/4',
  crNum: 0.25,
  size: 'Маленький',
  category: 'Гуманоид',
  alignment: 'Нейтрально-злой',
  maxHp: 10,
  hpFormula: '3d6',
  armorClass: 15,
  speed: '30 футов',
  initiativeModifier: 2,
  stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  notes: 'Черты: Ловкий побег\nДействия: Скимитар',
  sourceUrl: 'https://next.dnd.su/bestiary/1-goblin/',
  sourceLabel: 'next.dnd.su (5e24)',
  traits: [{ name: 'Ловкий побег', description: 'Отход или Засада бонусным действием.' }],
  actions: [{ name: 'Скимитар', description: 'Рукопашная атака: +4, 1d6+2.' }],
};

describe('convertCatalogMonsterToTemplate', () => {
  it('puts the statblock into actions instead of the DM notes', () => {
    const template = convertCatalogMonsterToTemplate(monster);

    expect(template.notes).toBe('');
    expect(template.actionsAndAttacks).toContain('Черты:');
    expect(template.actionsAndAttacks).toContain('Ловкий побег');
    expect(template.actionsAndAttacks).toContain('Действия:');
    expect(template.actionsAndAttacks).toContain('Скимитар');
  });

  it('keeps named NPCs recognizable through tags', () => {
    const template = convertCatalogMonsterToTemplate({
      ...monster,
      notes: 'Именной НИП.\nДействия: Скимитар',
    });
    expect(template.tags).toContain('Именной НИП');
    expect(template.notes).toBe('');
  });
});
