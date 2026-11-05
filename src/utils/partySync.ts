import { Combatant, PartyMember } from '../types';

/**
 * Copies combat HP back to party cards.
 * When a hero has several combatant copies, their HP is only applied while all
 * copies agree; otherwise the party value is left untouched to avoid guessing.
 * Returns null when nothing changed.
 */
export function syncPartyHpWithCombat(
  party: PartyMember[],
  combatants: Combatant[]
): PartyMember[] | null {
  const byPartyMember = new Map<string, Combatant[]>();
  combatants.forEach((combatant) => {
    if (!combatant.sourcePartyMemberId) return;
    const list = byPartyMember.get(combatant.sourcePartyMemberId) ?? [];
    list.push(combatant);
    byPartyMember.set(combatant.sourcePartyMemberId, list);
  });

  let changed = false;
  const updatedParty = party.map((member) => {
    const instances = byPartyMember.get(member.id);
    if (!instances || instances.length === 0) return member;

    const instanceHp = instances[0].hp.current;
    if (instances.some((instance) => instance.hp.current !== instanceHp)) return member;

    const nextHp = Math.min(member.maxHp, Math.max(0, instanceHp));
    if (member.currentHp === nextHp) return member;
    changed = true;
    return { ...member, currentHp: nextHp };
  });

  return changed ? updatedParty : null;
}
