import React, { useState, useEffect } from 'react';
import { PartyMember } from '../../types';
import { X, UserPlus, Heart, Shield, Zap, Eye, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: PartyMember) => void;
  initialMember?: PartyMember | null;
}

const COLOR_OPTIONS = [
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Изумрудный', value: '#10b981' },
  { name: 'Золотой', value: '#eab308' },
  { name: 'Фиолетовый', value: '#a855f7' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Бирюзовый', value: '#06b6d4' },
  { name: 'Розовый', value: '#ec4899' },
  { name: 'Оранжевый', value: '#f97316' },
];

export const PartyMemberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
}) => {
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [maxHp, setMaxHp] = useState<number>(20);
  const [currentHp, setCurrentHp] = useState<number>(20);
  const [armorClass, setArmorClass] = useState<string>('15');
  const [initiativeModifier, setInitiativeModifier] = useState<number>(0);
  const [passivePerception, setPassivePerception] = useState<string>('12');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setPlayerName(initialMember.playerName || '');
      setMaxHp(initialMember.maxHp);
      setCurrentHp(initialMember.currentHp);
      setArmorClass(String(initialMember.armorClass));
      setInitiativeModifier(initialMember.initiativeModifier);
      setPassivePerception(String(initialMember.passivePerception || '10'));
      setNotes(initialMember.notes || '');
      setColor(initialMember.color || COLOR_OPTIONS[0].value);
    } else {
      setName('');
      setPlayerName('');
      setMaxHp(20);
      setCurrentHp(20);
      setArmorClass('14');
      setInitiativeModifier(1);
      setPassivePerception('12');
      setNotes('');
      setColor(COLOR_OPTIONS[0].value);
    }
    setError('');
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите имя персонажа');
      return;
    }

    const memberToSave: PartyMember = {
      id: initialMember ? initialMember.id : `hero-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      playerName: playerName.trim() || undefined,
      maxHp: Number(maxHp),
      currentHp: Number(currentHp),
      armorClass: armorClass.trim() || '10',
      initiativeModifier: Number(initiativeModifier),
      passivePerception: passivePerception.trim() || undefined,
      notes: notes.trim() || undefined,
      color,
    };

    onSave(memberToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow"
              style={{ backgroundColor: color }}
            >
              🛡️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-rpg tracking-wide">
                {initialMember ? 'Редактировать героя' : 'Новый персонаж игрока'}
              </h2>
              <p className="text-xs text-slate-400">
                Карточка участника постоянной партии приключенцев
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Имя персонажа <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Торин, Ваэлин..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Игрок (за столом)
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Алексей, Лена..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 mb-1">
                <Heart className="w-3 h-3" /> Макс HP
              </label>
              <input
                type="number"
                min="1"
                value={maxHp}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setMaxHp(val);
                  if (!initialMember) setCurrentHp(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 mb-1">
                <Shield className="w-3 h-3" /> Защита (КД)
              </label>
              <input
                type="text"
                value={armorClass}
                onChange={(e) => setArmorClass(e.target.value)}
                placeholder="16"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 mb-1">
                <Zap className="w-3 h-3" /> Мод. Иниц.
              </label>
              <input
                type="number"
                value={initiativeModifier}
                onChange={(e) => setInitiativeModifier(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mb-1">
                <Eye className="w-3 h-3" /> Пассив. Вспр.
              </label>
              <input
                type="text"
                value={passivePerception}
                onChange={(e) => setPassivePerception(e.target.value)}
                placeholder="13"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-white font-bold text-sm"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Palette className="w-3.5 h-3.5 text-amber-400" /> Цветовой акцент
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 ${
                    color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Класс, особенности, способности
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Воин 3 ур. / Архетип Чемпион. Спасброски: Сил +5, Тел +4..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              {initialMember ? 'Сохранить героя' : 'Добавить в партию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
