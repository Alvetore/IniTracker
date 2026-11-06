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
    ],
    notes: monster.notes,
    cr: monster.cr,
    edition: monster.edition,
    sourceUrl: monster.sourceUrl,
    sourceLabel: monster.sourceLabel,
    createdAt: Date.now(),
  };
}
