import React, { useState } from 'react';
import { Condition, Combatant } from '../../types';
import { STANDARD_CONDITIONS } from '../../utils/defaultData';
import { X, Sparkles, Clock, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  combatant: Combatant | null;
  onAddCondition: (combatantId: string, condition: Condition) => void;
}

export const ConditionPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  combatant,
  onAddCondition,
}) => {
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [durationRounds, setDurationRounds] = useState<number | null>(null); // null = infinite
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [notes, setNotes] = useState('');

  if (!isOpen || !combatant) return null;

  const handleSelectStandard = (cond: { name: string; color: string }) => {
    setSelectedName(cond.name);
    setSelectedColor(cond.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (customName.trim() || selectedName).trim();
    if (!finalName) return;

    const newCond: Condition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      roundsRemaining: durationRounds,
      color: selectedColor,
      notes: notes.trim() || undefined,
    };

    onAddCondition(combatant.id, newCond);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white font-rpg">
                Добавить состояние: {combatant.name}
              </h3>
              <p className="text-xs text-slate-400">Выберите стандартный эффект или введите свой</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Standard Conditions Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Стандартные состояния
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {STANDARD_CONDITIONS.map((cond) => {
                const isSelected = selectedName === cond.name;
                return (
                  <button
                    key={cond.name}
                    type="button"
                    onClick={() => handleSelectStandard(cond)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition flex items-center gap-2 border ${
                      isSelected
                        ? 'border-amber-400 bg-slate-800 text-white ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cond.color }}
                    />
                    <span className="truncate">{cond.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Or Custom Condition */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Или произвольное состояние / заклинание
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (e.target.value) setSelectedName('');
              }}
              placeholder="Например: Горит (1d4 огня), Укрыт щитом, Метка охотника..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Duration in Rounds */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Длительность эффекта
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Бессрочно', value: null },
                { label: '1 раунд', value: 1 },
                { label: '2 раунда', value: 2 },
                { label: '3 раунда', value: 3 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setDurationRounds(item.value)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                    durationRounds === item.value
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Примечание (эффект при получении, спасбросок в конце хода)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Спасбросок Телосложения СЛ 14 в конце каждого хода..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!selectedName && !customName.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Наложить статус
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
