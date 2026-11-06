import { CreatureTemplate } from '../types';
import { CatalogMonster } from '../types/bestiary';

/**
 * Convert a CatalogMonster directly into a CreatureTemplate for the user's personal bestiary.
 * Kept in a lightweight module so importing it does not pull the entire catalog data into
 * the initial application bundle.
 */
export function convertCatalogMonsterToTemplate(monster: CatalogMonster): CreatureTemplate {
  const isAlly = monster.category === 'Гуманоид' && monster.alignment.toLowerCase().includes('добр');
  const type = isAlly ? 'ally' : 'enemy';
  const sections: Array<[string, CatalogMonster['actions'] | undefined]> = [
    ['Черты', monster.traits],
    ['Действия', monster.actions],
    ['Бонусные действия', monster.bonusActions],
    ['Реакции', monster.reactions],
    ['Легендарные действия', monster.legendaryActions],
  ];
  const actionsAndAttacks = sections
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .map(
      ([label, items]) =>
        `${label}:\n${items!.map((item) => `${item.name}. ${item.description}`).join('\n')}`
    )
    .join('\n\n');

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
      ...(monster.sourceBook ? [monster.sourceBook.split(',')[0].trim()] : []),
      ...(monster.notes.startsWith('Именной НИП') ? ['Именной НИП'] : []),
    ],
    notes: '',
    actionsAndAttacks: actionsAndAttacks || undefined,
    cr: monster.cr,
    edition: monster.edition,
    sourceUrl: monster.sourceUrl,
    sourceLabel: monster.sourceLabel,
    createdAt: Date.now(),
  };
}
