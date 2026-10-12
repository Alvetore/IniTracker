import { DiceSystem } from '../types';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollMultiple(count: number, sides: number): { total: number; rolls: number[] } {
  const rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const val = rollDie(sides);
    rolls.push(val);
    total += val;
  }
  return { total, rolls };
}

export function rollInitiativeForSystem(system: DiceSystem, modifier: number): { total: number; rollDetails: string } {
  switch (system) {
    case 'd20': {
      const roll = rollDie(20);
      const total = roll + modifier;
      const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      return { total, rollDetails: `d20 (${roll}) ${modStr} = ${total}` };
    }
    case 'd10': {
      const roll = rollDie(10);
      const total = roll + modifier;
      const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      return { total, rollDetails: `d10 (${roll}) ${modStr} = ${total}` };
    }
    case '2d6': {
      const { total: roll, rolls } = rollMultiple(2, 6);
      const total = roll + modifier;
      const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      return { total, rollDetails: `2d6 [${rolls.join('+')}] (${roll}) ${modStr} = ${total}` };
    }
    case '3d6': {
      const { total: roll, rolls } = rollMultiple(3, 6);
      const total = roll + modifier;
      const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      return { total, rollDetails: `3d6 [${rolls.join('+')}] (${roll}) ${modStr} = ${total}` };
    }
    case 'manual':
    default:
      return { total: modifier, rollDetails: `Ручной ввод: ${modifier}` };
  }
}

export function parseDiceFormula(formula: string): { total: number; text: string } | null {
  // Supports formulas like "2d6+3", "1d20-1", "d8", "4d6"
  const clean = formula.trim().toLowerCase().replace(/\s+/g, '');
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count <= 0 || count > 100 || sides <= 0 || sides > 1000) return null;

  const { total: rollTotal, rolls } = rollMultiple(count, sides);
  const finalTotal = rollTotal + modifier;
  const modStr = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
  const rollsStr = rolls.length > 1 ? ` [${rolls.join(', ')}]` : '';

  return {
    total: finalTotal,
    text: `${formula}: ${rollTotal}${rollsStr} ${modStr} = ${finalTotal}`,
  };
}
