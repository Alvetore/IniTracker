import React, { useState, useEffect } from 'react';
import { CreatureTemplate, DiceSystem } from '../../types';
import { CatalogMonster } from '../../types/bestiary';
import { rollInitiativeForSystem } from '../../utils/dice';
import {
  X,
  Swords,
  Dices,
  RotateCw,
  Plus,
  Minus,
  Heart,
  Shield,
  Zap,
  Check,
  Users,
} from 'lucide-react';

export interface AddToCombatOptions {
  creature: CreatureTemplate | CatalogMonster;
  count: number;
  initiativeMode: 'auto' | 'manual';
  groupInitiative: boolean;
  manualInitiative: number;
  navigateNow: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  creature: CreatureTemplate | CatalogMonster | null;
  diceSystem?: DiceSystem;
  onConfirm: (options: AddToCombatOptions) => void;
}

export const AddToCombatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  creature,
  diceSystem = 'd20',
  onConfirm,
}) => {
  const [count, setCount] = useState<number>(1);
  const [initiativeMode, setInitiativeMode] = useState<'auto' | 'manual'>('auto');
  const [groupInitiative, setGroupInitiative] = useState<boolean>(true);
  const [manualInitiative, setManualInitiative] = useState<number>(10);
  const [previewRoll, setPreviewRoll] = useState<{ total: number; rollDetails: string }>({
    total: 10,
    rollDetails: '',
  });
  const [navigateNow, setNavigateNow] = useState<boolean>(false);

  // Re-roll preview and reset inputs when modal opens or creature changes
  useEffect(() => {
    if (isOpen && creature) {
      setCount(1);
      const mod = creature.initiativeModifier || 0;
      const roll = rollInitiativeForSystem(diceSystem, mod);
      setPreviewRoll(roll);
      setManualInitiative(roll.total);
    }
  }, [isOpen, creature, diceSystem]);

  if (!isOpen || !creature) return null;

  const initMod = creature.initiativeModifier || 0;
  const modStr = initMod >= 0 ? `+${initMod}` : `${initMod}`;

  const handleReroll = () => {
    const roll = rollInitiativeForSystem(diceSystem, initMod);
    setPreviewRoll(roll);
    if (initiativeMode === 'manual') {
      setManualInitiative(roll.total);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      creature,
      count: Math.max(1, count),
      initiativeMode,
      groupInitiative,
      manualInitiative,
      navigateNow,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white font-rpg truncate">
                Добавить в бой
              </h3>
              <div className="text-xs text-slate-400 truncate">
                {creature.name}{' '}
                {creature.englishName && (
                  <span className="italic">({creature.englishName})</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Creature Summary Bar */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
            <div>
              <div className="text-[10px] font-semibold text-rose-400 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> HP
              </div>
              <div className="text-sm font-bold text-white">{creature.maxHp}</div>
            </div>
            <div className="border-x border-slate-800/80">
              <div className="text-[10px] font-semibold text-blue-400 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> КД
              </div>
              <div className="text-sm font-bold text-white">{creature.armorClass}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Мод. иниц.
              </div>
              <div className="text-sm font-bold text-white">{modStr}</div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Количество существ
              </label>
              {count > 1 && (
                <span className="text-[11px] text-amber-400 font-medium">
                  Будут пронумерованы (1..{count})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition"
                  disabled={count <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 bg-transparent text-center font-bold text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(50, c + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick count chips */}
              <div className="flex items-center gap-1 flex-1 overflow-x-auto">
                {[1, 2, 3, 4, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition border ${
                      count === n
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
                    }`}
                  >
                    ×{n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Initiative Roll Section */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Инициатива
              </label>

              {/* Toggle Mode: Auto vs Manual */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setInitiativeMode('auto')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    initiativeMode === 'auto'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-3 h-3" />
                  Авто-бросок
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInitiativeMode('manual');
                    setManualInitiative(previewRoll.total);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    initiativeMode === 'manual'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✍️ Вручную
                </button>
              </div>
            </div>

            {/* AUTO MODE */}
            {initiativeMode === 'auto' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400">
                      Результат броска ({diceSystem}):
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-amber-300 text-base">
                        {previewRoll.total}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({previewRoll.rollDetails})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReroll}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                    title="Бросить кубик заново"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    Перебросить
                  </button>
                </div>

                {count > 1 && (
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={groupInitiative}
                      onChange={(e) => setGroupInitiative(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                    />
                    <span>
                      Один общий бросок ({previewRoll.total}) для всей группы
                    </span>
                  </label>
                )}
                {count > 1 && !groupInitiative && (
                  <p className="text-[11px] text-slate-400 italic">
                    Каждое существо сделает свой независимый бросок инициативы при добавлении.
                  </p>
                )}
              </div>
            )}

            {/* MANUAL MODE */}
            {initiativeMode === 'manual' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Введите выпавшую инициативу:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualInitiative((v) => v - 1)}
                        className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-base"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={manualInitiative}
                        onChange={(e) =>
                          setManualInitiative(parseInt(e.target.value) || 0)
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded-xl py-2 text-center text-lg font-bold text-white focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setManualInitiative((v) => v + 1)}
                        className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReroll}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                    title="Заполнить значением с кубика"
                  >
                    <Dices className="w-3.5 h-3.5 text-amber-400" />
                    Бросить кубик
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Число с физического кубика или мастерского броска (модификатор существа: {modStr}).
                  {count > 1 && ' Применится ко всей добавляемой группе.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Option: Navigate directly to Combat */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={navigateNow}
              onChange={(e) => setNavigateNow(e.target.checked)}
              className="rounded border-slate-700 text-rose-500 focus:ring-0 w-4 h-4"
            />
            <span>Сразу перейти во вкладку «Бой» после добавления</span>
          </label>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Добавить в бой {count > 1 ? `(${count} шт.)` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
