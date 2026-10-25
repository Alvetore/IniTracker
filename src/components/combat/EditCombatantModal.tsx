import React, { useState, useEffect } from 'react';
import { Combatant, CreatureType, DiceSystem } from '../../types';
import { rollInitiativeForSystem } from '../../utils/dice';
import { X, UserCheck, Shield, Heart, Zap, Dices, FileText, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  combatant: Combatant | null;
  diceSystem: DiceSystem;
  onSave: (id: string, updates: Partial<Combatant>) => void;
}

export const EditCombatantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  combatant,
  diceSystem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CreatureType>('enemy');
  const [initiative, setInitiative] = useState<number>(10);
  const [initiativeModifier, setInitiativeModifier] = useState<number>(0);
  const [currentHp, setCurrentHp] = useState<number>(10);
  const [maxHp, setMaxHp] = useState<number>(10);
  const [tempHp, setTempHp] = useState<number>(0);
  const [armorClass, setArmorClass] = useState<string | number>(10);
  const [notes, setNotes] = useState('');
  const [isDelayed, setIsDelayed] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);

  useEffect(() => {
    if (combatant && isOpen) {
      setName(combatant.name);
      setType(combatant.type);
      setInitiative(combatant.initiative);
      setInitiativeModifier(combatant.initiativeModifier ?? 0);
      setCurrentHp(combatant.hp.current);
      setMaxHp(combatant.hp.max);
      setTempHp(combatant.hp.temp ?? 0);
      setArmorClass(combatant.armorClass);
      setNotes(combatant.notes || '');
      setIsDelayed(combatant.isDelayed || false);
      setIsDefeated(combatant.isDefeated || false);
    }
  }, [combatant, isOpen]);

  if (!isOpen || !combatant) return null;

  const handleReroll = () => {
    const { total } = rollInitiativeForSystem(diceSystem, initiativeModifier);
    setInitiative(total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(combatant.id, {
      name: name.trim() || combatant.name,
      type,
      initiative,
      initiativeModifier,
      armorClass: typeof armorClass === 'number' ? armorClass : parseInt(String(armorClass)) || 10,
      hp: {
        current: currentHp,
        max: Math.max(1, maxHp),
        temp: Math.max(0, tempHp),
      },
      notes,
      isDelayed,
      isDefeated: currentHp <= 0 ? true : isDefeated,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-rpg">
                Редактирование участника
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{combatant.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name & Type */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Имя участника
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Тип существа
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                {(
                  [
                    { id: 'player', label: 'Игрок', cls: 'border-blue-500/40 text-blue-400' },
                    { id: 'enemy', label: 'Враг', cls: 'border-red-500/40 text-red-400' },
                    { id: 'ally', label: 'Союзник', cls: 'border-emerald-500/40 text-emerald-400' },
                    { id: 'neutral', label: 'Нейтрал', cls: 'border-amber-500/40 text-amber-400' },
                    { id: 'hazard', label: 'Событие', cls: 'border-purple-500/40 text-purple-400' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`py-1.5 px-2 rounded-xl font-bold border transition text-center ${
                      type === t.id
                        ? 'bg-slate-800 text-white border-amber-500 shadow-sm'
                        : `bg-slate-950/60 ${t.cls} hover:bg-slate-800/60`
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Initiative Section */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Инициатива в бою
              </span>
              <span className="text-[11px] text-slate-400">
                При изменении список автоматически пересортируется
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Текущая инициатива:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={initiative}
                    onChange={(e) => setInitiative(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleReroll}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl transition shrink-0"
                    title={`Перебросить (${diceSystem}) с текущим модификатором`}
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Модификатор инициативы:
                </label>
                <input
                  type="number"
                  value={initiativeModifier}
                  onChange={(e) => setInitiativeModifier(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* HP and AC */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mb-1">
                <Heart className="w-3 h-3" /> Тек. HP
              </label>
              <input
                type="number"
                value={currentHp}
                onChange={(e) => setCurrentHp(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-bold text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1 text-center">
                Макс. HP
              </label>
              <input
                type="number"
                value={maxHp}
                min="1"
                onChange={(e) => setMaxHp(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-bold text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 mb-1">
                <Shield className="w-3 h-3" /> КД (AC)
              </label>
              <input
                type="text"
                value={armorClass}
                onChange={(e) => setArmorClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-bold text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Temp HP & State flags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-cyan-400 font-semibold whitespace-nowrap">Врем. HP:</span>
              <input
                type="number"
                value={tempHp}
                min="0"
                onChange={(e) => setTempHp(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent text-center font-bold text-white text-xs focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isDelayed}
                onChange={(e) => setIsDelayed(e.target.checked)}
                className="rounded border-slate-700 text-purple-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Ход задержан</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isDefeated}
                onChange={(e) => setIsDefeated(e.target.checked)}
                className="rounded border-slate-700 text-red-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Повержен 💀</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Заметки и способности
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Особые атаки, ауры, резисты, подсказки для ведущего..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
