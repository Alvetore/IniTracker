import { describe, expect, it } from 'vitest';
import { Combatant, PartyMember } from '../types';
import { syncPartyHpWithCombat } from './partySync';

function member(overrides: Partial<PartyMember> = {}): PartyMember {
  return {
    id: 'hero-1',
    name: 'Герой',
    maxHp: 20,
    currentHp: 20,
    armorClass: 15,
    initiativeModifier: 1,
    ...overrides,
  };
}

function combatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'c-1',
    name: 'Герой',
    type: 'player',
    initiative: 10,
    initiativeModifier: 1,
    hp: { current: 12, max: 20, temp: 0 },
    armorClass: 15,
    conditions: [],
    notes: '',
    isDefeated: false,
    isDelayed: false,
    sourcePartyMemberId: 'hero-1',
    ...overrides,
  };
}

describe('syncPartyHpWithCombat', () => {
  it('updates a single combatant instance', () => {
    const result = syncPartyHpWithCombat([member()], [combatant()]);
    expect(result?.[0].currentHp).toBe(12);
  });

  it('returns null when nothing changed or no source is linked', () => {
    expect(syncPartyHpWithCombat([member({ currentHp: 12 })], [combatant()])).toBeNull();
    expect(
      syncPartyHpWithCombat(
        [member()],
        [combatant({ sourcePartyMemberId: undefined })]
      )
    ).toBeNull();
  });

  it('updates multiple copies only when their HP matches', () => {
    const result = syncPartyHpWithCombat(
      [member()],
      [
        combatant({ id: 'c-1', hp: { current: 7, max: 20, temp: 0 } }),
        combatant({ id: 'c-2', hp: { current: 7, max: 20, temp: 0 } }),
      ]
    );
    expect(result?.[0].currentHp).toBe(7);
  });

  it('does not guess when copy HP differs', () => {
    expect(
      syncPartyHpWithCombat(
        [member()],
        [
          combatant({ id: 'c-1', hp: { current: 7, max: 20, temp: 0 } }),
          combatant({ id: 'c-2', hp: { current: 3, max: 20, temp: 0 } }),
        ]
      )
    ).toBeNull();
  });

  it('clamps values to the party member range', () => {
    const healed = syncPartyHpWithCombat(
      [member({ currentHp: 5 })],
      [combatant({ hp: { current: 25, max: 20, temp: 0 } })]
    );
    expect(healed?.[0].currentHp).toBe(20);

    const dead = syncPartyHpWithCombat(
      [member({ currentHp: 5 })],
      [combatant({ hp: { current: -3, max: 20, temp: 0 } })]
    );
    expect(dead?.[0].currentHp).toBe(0);
  });
});
