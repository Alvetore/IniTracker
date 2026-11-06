import { describe, expect, it } from 'vitest';
import { findMonsterByUrlOrSlug } from './monsterParser';

describe('findMonsterByUrlOrSlug', () => {
  it('finds an exact 5e14 catalog URL', async () => {
    const result = await findMonsterByUrlOrSlug('https://5e14.dnd.su/bestiary/4-goblin/');
    expect(result?.source).toBe('catalog');
    expect(result?.monster.id).toBe('5e14-goblin');
    expect(result?.monster.name).toBe('Гоблин');
  });

  it('finds an exact 5e24 catalog URL', async () => {
    const result = await findMonsterByUrlOrSlug(
      'https://next.dnd.su/bestiary/21369-goblin-warrior/'
    );
    expect(result?.source).toBe('catalog');
    expect(result?.monster.id).toBe('5e24-goblin-warrior');
    expect(result?.monster.name).toBe('Гоблин-воитель');
  });

  it('normalizes query parameters and a missing trailing slash', async () => {
    const result = await findMonsterByUrlOrSlug(
      'https://5e14.dnd.su/bestiary/4-goblin?utm_source=test'
    );
    expect(result?.monster.id).toBe('5e14-goblin');
  });

  it('does not match an unknown slug just because it contains a known name', async () => {
    expect(
      await findMonsterByUrlOrSlug('https://5e14.dnd.su/bestiary/9999-goblin-something/')
    ).toBeNull();
  });

  it('does not resolve a wrong slug by numeric page id alone', async () => {
    expect(
      await findMonsterByUrlOrSlug('https://5e14.dnd.su/bestiary/4-not-a-goblin/')
    ).toBeNull();
  });

  it('marks dictionary matches as approximate', async () => {
    const result = await findMonsterByUrlOrSlug('https://5e14.dnd.su/bestiary/9999-dragon/');
    expect(result?.source).toBe('dictionary');
    expect(result?.monster.name).toBe('Дракон');
    expect(result?.monster.sourceLabel).toContain('словарь');
  });

  it('returns null for a completely unknown link', async () => {
    expect(
      await findMonsterByUrlOrSlug('https://5e14.dnd.su/bestiary/unknown-monster/')
    ).toBeNull();
  });
});
