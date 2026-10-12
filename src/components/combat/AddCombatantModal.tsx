import React, { useState } from 'react';
import { Combatant, CreatureTemplate, CreatureType, DiceSystem } from '../../types';
import { rollInitiativeForSystem } from '../../utils/dice';
import { X, UserPlus, Sparkles, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templates: CreatureTemplate[];
  diceSystem: DiceSystem;
  onAddCombatants: (combatants: Combatant[]) => void;
}

export const AddCombatantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  templates,
  diceSystem,
  onAddCombatants,
}) => {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.length > 0 ? templates[0].id : ''
  );
  const [count, setCount] = useState<number>(1);

  // Custom fields
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<CreatureType>('enemy');
  const [customHp, setCustomHp] = useState<number>(15);
  const [customAc, setCustomAc] = useState<string>('13');
  const [customInitMod, setCustomInitMod] = useState<number>(0);
  const [customNotes, setCustomNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCombatants: Combatant[] = [];

    if (mode === 'template') {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      if (!tpl) return;

      for (let i = 1; i <= count; i++) {
        const name = count > 1 ? `${tpl.name} ${i}` : tpl.name;
        const { total: initVal } = rollInitiativeForSystem(diceSystem, tpl.initiativeModifier);

        newCombatants.push({
          id: `combatant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          name,
          type: tpl.type,
          initiative: initVal,
          initiativeModifier: tpl.initiativeModifier,
          hp: {
            current: tpl.maxHp,
            max: tpl.maxHp,
            temp: 0,
          },
          armorClass: tpl.armorClass,
          conditions: [],
          notes: tpl.notes,
          isDefeated: false,
          isDelayed: false,
          templateId: tpl.id,
        });
      }
    } else {
      if (!customName.trim()) return;

      for (let i = 1; i <= count; i++) {
        const name = count > 1 ? `${customName.trim()} ${i}` : customName.trim();
        const { total: initVal } = rollInitiativeForSystem(diceSystem, customInitMod);

        newCombatants.push({
          id: `combatant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          name,
          type: customType,
          initiative: initVal,
          initiativeModifier: customInitMod,
          hp: {
            current: customHp,
            max: customHp,
            temp: 0,
          },
          armorClass: customAc.trim() || '10',
          conditions: [],
          notes: customNotes.trim(),
          isDefeated: false,
          isDelayed: false,
        });
      }
    }

    onAddCombatants(newCombatants);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-rpg">Добавить участника в бой</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode Switch */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('template')}
              disabled={templates.length === 0}
              className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'template'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white disabled:opacity-40'
              }`}
            >
              Из шаблона существ
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'custom' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Создать вручную
            </button>
          </div>

          {mode === 'template' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Выберите существо
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (HP: {t.maxHp}, КД: {t.armorClass})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Имя участника
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Разбойник, Призванный волк..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-rose-400 font-semibold mb-1">HP</label>
                  <input
                    type="number"
                    min="1"
                    value={customHp}
                    onChange={(e) => setCustomHp(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-400 font-semibold mb-1">КД</label>
                  <input
                    type="text"
                    value={customAc}
                    onChange={(e) => setCustomAc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-400 font-semibold mb-1">Иниц. мод</label>
                  <input
                    type="number"
                    value={customInitMod}
                    onChange={(e) => setCustomInitMod(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Count */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Количество существ (автонумерация при &gt; 1)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${
                    count === num
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ×{num}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-center text-xs text-white"
              />
            </div>
          </div>

          {/* Submit */}
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
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить в бой
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
