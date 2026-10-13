import React from 'react';
import { CatalogMonster } from '../../types/bestiary';
import { X, ExternalLink, Plus, Shield, Heart, Zap, Footprints, Skull, BookOpen } from 'lucide-react';

interface Props {
  monster: CatalogMonster | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToPersonal: (monster: CatalogMonster) => void;
  isAlreadyAdded?: boolean;
}

export const CatalogMonsterDetailsModal: React.FC<Props> = ({
  monster,
  isOpen,
  onClose,
  onAddToPersonal,
  isAlreadyAdded = false,
}) => {
  if (!isOpen || !monster) return null;

  const is5e24 = monster.edition === '5e24';
  const editionBadge = is5e24 ? {
    label: 'D&D 5e (2024) • next.dnd.su',
    cls: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  } : {
    label: 'D&D 5e (2014) • 5e14.dnd.su',
    cls: 'bg-indigo-950/70 text-indigo-400 border-indigo-800/80',
  };

  const formatMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${editionBadge.cls}`}>
                {editionBadge.label}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                CR {monster.cr}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                {monster.size} {monster.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
              {monster.name}
              <span className="text-xs sm:text-sm text-slate-400 font-sans font-normal italic">
                ({monster.englishName})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {monster.alignment}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition ml-2"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm">
          {/* Main stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
              <div className="text-[10px] font-semibold text-rose-400 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Здоровье (HP)
              </div>
              <div className="text-base font-bold text-white">{monster.maxHp}</div>
              <div className="text-[10px] text-slate-400">({monster.hpFormula})</div>
            </div>

            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
              <div className="text-[10px] font-semibold text-blue-400 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Защита (КД)
              </div>
              <div className="text-base font-bold text-white">{monster.armorClass}</div>
              {monster.acNote && <div className="text-[10px] text-slate-400">{monster.acNote}</div>}
            </div>

            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
              <div className="text-[10px] font-semibold text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Инициатива
              </div>
              <div className="text-base font-bold text-white">
                {monster.initiativeModifier >= 0 ? `+${monster.initiativeModifier}` : monster.initiativeModifier}
              </div>
              <div className="text-[10px] text-slate-400">модификатор</div>
            </div>

            <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
              <div className="text-[10px] font-semibold text-emerald-400 flex items-center justify-center gap-1">
                <Footprints className="w-3 h-3" /> Скорость
              </div>
              <div className="text-xs font-bold text-white mt-1">{monster.speed}</div>
            </div>
          </div>

          {/* Ability scores 6-grid */}
          <div className="grid grid-cols-6 gap-1.5 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center">
            {[
              { label: 'СИЛ', score: monster.stats.str },
              { label: 'ЛОВ', score: monster.stats.dex },
              { label: 'ТЕЛ', score: monster.stats.con },
              { label: 'ИНТ', score: monster.stats.int },
              { label: 'МУД', score: monster.stats.wis },
              { label: 'ХАР', score: monster.stats.cha },
            ].map((stat) => (
              <div key={stat.label} className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</div>
                <div className="text-sm font-bold text-white">{stat.score}</div>
                <div className="text-[10px] text-amber-400 font-semibold">{formatMod(stat.score)}</div>
              </div>
            ))}
          </div>

          {/* Senses, saves, languages */}
          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
            {monster.savingThrows && (
              <div><strong className="text-slate-200">Спасброски:</strong> {monster.savingThrows}</div>
            )}
            {monster.skills && (
              <div><strong className="text-slate-200">Навыки:</strong> {monster.skills}</div>
            )}
            {monster.damageVulnerabilities && (
              <div><strong className="text-rose-300">Уязвимость к урону:</strong> {monster.damageVulnerabilities}</div>
            )}
            {monster.damageResistances && (
              <div><strong className="text-blue-300">Сопротивление к урону:</strong> {monster.damageResistances}</div>
            )}
            {monster.damageImmunities && (
              <div><strong className="text-emerald-300">Иммунитет к урону:</strong> {monster.damageImmunities}</div>
            )}
            {monster.conditionImmunities && (
              <div><strong className="text-amber-300">Иммунитет к состояниям:</strong> {monster.conditionImmunities}</div>
            )}
            {monster.senses && (
              <div><strong className="text-slate-200">Чувства:</strong> {monster.senses}</div>
            )}
            {monster.languages && (
              <div><strong className="text-slate-200">Языки:</strong> {monster.languages}</div>
            )}
          </div>

          {/* Special Traits */}
          {monster.traits && monster.traits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Особенности
              </h4>
              <div className="space-y-2 text-xs">
                {monster.traits.map((trait, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <strong className="text-white block mb-0.5">{trait.name}.</strong>
                    <span className="text-slate-300">{trait.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {monster.actions && monster.actions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5" /> Действия
              </h4>
              <div className="space-y-2 text-xs">
                {monster.actions.map((action, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <strong className="text-white block mb-0.5">{action.name}.</strong>
                    <span className="text-slate-300">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus Actions / Reactions */}
          {monster.bonusActions && monster.bonusActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 border-b border-slate-800 pb-1">
                Бонусные действия
              </h4>
              <div className="space-y-2 text-xs">
                {monster.bonusActions.map((ba, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <strong className="text-white block mb-0.5">{ba.name}.</strong>
                    <span className="text-slate-300">{ba.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monster.reactions && monster.reactions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 border-b border-slate-800 pb-1">
                Реакции
              </h4>
              <div className="space-y-2 text-xs">
                {monster.reactions.map((react, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <strong className="text-white block mb-0.5">{react.name}.</strong>
                    <span className="text-slate-300">{react.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={monster.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition order-2 sm:order-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Открыть на {monster.sourceLabel}
          </a>

          <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                onAddToPersonal(monster);
                onClose();
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                isAlreadyAdded
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              {isAlreadyAdded ? 'Добавить еще копию' : '+ В личный бестиарий'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
