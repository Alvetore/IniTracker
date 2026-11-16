import { CreatureType } from '../types';

export interface CreatureTypeMeta {
  /** Generic label used in the bestiary and forms. */
  label: string;
  /** Compact label for combat cards ('Герой' for players, shorter hazard text). */
  combatLabel: string;
  /** Tailwind classes for a small uppercase badge (border/bg/text). */
  badgeCls: string;
  /** Tailwind background class for a status dot. */
  dotCls: string;
}

const TYPE_META: Record<CreatureType, CreatureTypeMeta> = {
  player: {
    label: 'Игрок',
    combatLabel: 'Герой',
    badgeCls: 'border-blue-800/60 bg-blue-950/60 text-blue-400',
    dotCls: 'bg-blue-400',
  },
  enemy: {
    label: 'Враг',
    combatLabel: 'Враг',
    badgeCls: 'border-red-800/60 bg-red-950/60 text-red-400',
    dotCls: 'bg-red-400',
  },
  ally: {
    label: 'Союзник',
    combatLabel: 'Союзник',
    badgeCls: 'border-emerald-800/60 bg-emerald-950/60 text-emerald-400',
    dotCls: 'bg-emerald-400',
  },
  neutral: {
    label: 'Нейтрал',
    combatLabel: 'Нейтрал',
    badgeCls: 'border-amber-800/60 bg-amber-950/60 text-amber-400',
    dotCls: 'bg-amber-400',
  },
  hazard: {
    label: 'Событие / Ловушка',
    combatLabel: 'Событие',
    badgeCls: 'border-purple-800/60 bg-purple-950/60 text-purple-400',
    dotCls: 'bg-purple-400',
  },
};

export function getCreatureTypeMeta(type: CreatureType): CreatureTypeMeta {
  return TYPE_META[type] ?? TYPE_META.enemy;
}
