import { describe, expect, it, vi } from 'vitest';
import { parseDiceFormula, rollDie, rollInitiativeForSystem } from './dice';

describe('rollDie', () => {
  it('returns the minimum and maximum faces for boundary random values', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);
    expect(rollDie(20)).toBe(1);
    expect(rollDie(20)).toBe(20);
  });
});

describe('parseDiceFormula', () => {
  it('parses dice, count and modifier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(parseDiceFormula('2d6+3')).toEqual({
      total: 5,
      text: '2d6+3: 2 [1, 1] +3 = 5',
    });
  });

  it('supports a single die without a count', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(parseDiceFormula('d8')?.total).toBe(1);
  });

  it('rejects malformed and out-of-range formulas', () => {
    expect(parseDiceFormula('abc')).toBeNull();
    expect(parseDiceFormula('0d6')).toBeNull();
    expect(parseDiceFormula('101d6')).toBeNull();
    expect(parseDiceFormula('d1001')).toBeNull();
  });
});

describe('rollInitiativeForSystem', () => {
  it('adds the modifier to a d20 roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollInitiativeForSystem('d20', 3)).toEqual({
      total: 4,
      rollDetails: 'd20 (1) +3 = 4',
    });
  });

  it('keeps the modifier as the total in manual mode', () => {
    expect(rollInitiativeForSystem('manual', 7)).toEqual({
      total: 7,
      rollDetails: 'Ручной ввод: 7',
    });
  });
});
