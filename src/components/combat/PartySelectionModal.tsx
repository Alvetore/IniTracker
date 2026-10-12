import React, { useState } from 'react';
import { PartyMember, Combatant } from '../../types';
import { X, Users, UserPlus, Check, Shield, Heart, Zap, Eye, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  party: PartyMember[];
  combatants: Combatant[];
  onAddPartyMembers: (members: PartyMember[]) => void;
}

export const PartySelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  party,
  combatants,
  onAddPartyMembers,
}) => {
  // IDs of party members currently in combat
  const existingSourceIds = new Set(combatants.map((c) => c.sourcePartyMemberId).filter(Boolean));

  // Selected for batch add
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddSingle = (member: PartyMember) => {
    onAddPartyMembers([member]);
  };

  const handleAddSelected = () => {
    const toAdd = party.filter((m) => selectedIds.includes(m.id));
    if (toAdd.length > 0) {
      onAddPartyMembers(toAdd);
      setSelectedIds([]);
      onClose();
    }
  };

  const handleAddAllAvailable = () => {
    const available = party.filter((m) => !existingSourceIds.has(m.id));
    if (available.length > 0) {
      onAddPartyMembers(available);
      onClose();
    }
  };

  const availableCount = party.filter((m) => !existingSourceIds.has(m.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-rpg tracking-wide">
                Добавить героев партии в бой
              </h2>
              <p className="text-xs text-slate-400">
                Добавляйте персонажей по отдельности или выберите нужных
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-slate-400">
            В партии {party.length} героев ({availableCount} еще не в бою)
          </span>

          <div className="flex items-center gap-2">
            {availableCount > 1 && (
              <button
                type="button"
                onClick={handleAddAllAvailable}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow"
              >
                <Users className="w-3.5 h-3.5" /> Добавить всех ({availableCount})
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" /> Добавить выбранных ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Party Members List */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {party.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              В партии пока нет персонажей. Создайте их во вкладке «Партия».
            </div>
          ) : (
            party.map((hero) => {
              const isInCombat = existingSourceIds.has(hero.id);
              const isSelected = selectedIds.includes(hero.id);
              const initSign =
                hero.initiativeModifier >= 0
                  ? `+${hero.initiativeModifier}`
                  : hero.initiativeModifier;

              return (
                <div
                  key={hero.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isInCombat
                      ? 'border-slate-800/60 bg-slate-950/40 opacity-75'
                      : isSelected
                      ? 'border-amber-400/80 bg-slate-800/80 ring-1 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Checkbox & Hero info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {!isInCombat && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(hero.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                      />
                    )}

                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow"
                      style={{ backgroundColor: hero.color || '#3b82f6' }}
                    >
                      {hero.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{hero.name}</span>
                        {hero.playerName && (
                          <span className="text-xs text-slate-400">({hero.playerName})</span>
                        )}
                        {isInCombat && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
                            <Check className="w-2.5 h-2.5" /> В бою
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 text-rose-400">
                          <Heart className="w-3 h-3" /> {hero.currentHp}/{hero.maxHp} HP
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <Shield className="w-3 h-3" /> КД {hero.armorClass}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Zap className="w-3 h-3" /> Иниц {initSign}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Add Single Button */}
                  <div>
                    {isInCombat ? (
                      <button
                        type="button"
                        onClick={() => handleAddSingle(hero)}
                        title="Добавить копию персонажа"
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition"
                      >
                        + Копию
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddSingle(hero)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> В бой
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
