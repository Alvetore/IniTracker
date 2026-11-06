import { describe, expect, it } from 'vitest';
import { BESTIARY_5E14 } from './bestiary5e14';
import { BESTIARY_5E24 } from './bestiary5e24';
import { CatalogMonster } from '../types/bestiary';

function collectProblems(catalog: CatalogMonster[]) {
  const problems: string[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const monster of catalog) {
    if (ids.has(monster.id)) problems.push(`duplicate id: ${monster.id}`);
    if (urls.has(monster.sourceUrl)) problems.push(`duplicate url: ${monster.sourceUrl}`);
    ids.add(monster.id);
    urls.add(monster.sourceUrl);

    if (!monster.name?.trim()) problems.push(`empty name: ${monster.id}`);
    if (!monster.englishName?.trim()) problems.push(`empty english name: ${monster.id}`);
    if (!(monster.maxHp > 0)) problems.push(`missing HP: ${monster.id}`);
    if (!(Number(monster.armorClass) > 0)) problems.push(`missing AC: ${monster.id}`);
    if (!/^https:\/\/(next|5e14)\.dnd\.su\/bestiary\//.test(monster.sourceUrl)) {
      problems.push(`missing source: ${monster.id}`);
    }
  }
  return problems;
}

describe('bundled bestiary catalogs', () => {
  it('contains the full 5e24 catalog', () => {
    expect(BESTIARY_5E24).toHaveLength(657);
    expect(collectProblems(BESTIARY_5E24)).toEqual([]);
  });

  it('contains the full 5e14 catalog', () => {
    expect(BESTIARY_5E14).toHaveLength(2875);
    expect(collectProblems(BESTIARY_5E14)).toEqual([]);
  });
});
