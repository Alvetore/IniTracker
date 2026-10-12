import React, { useState, useEffect } from 'react';
import { CreatureTemplate, CreatureType } from '../../types';
import { X, Plus, Sparkles, Shield, Heart, Zap, Tag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CreatureTemplate) => void;
  initialTemplate?: CreatureTemplate | null;
}

const COMMON_TAGS = [
  'Гуманоид',
  'Нежить',
  'Гоблиноид',
  'Зверь',
  'Босс',
  'Маг',
  'Стрелок',
  'Великан',
  'Дракон',
  'Демон',
  'Миньон',
];

export const TemplateFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CreatureType>('enemy');
  const [maxHp, setMaxHp] = useState<number>(10);
  const [armorClass, setArmorClass] = useState<string>('12');
  const [initiativeModifier, setInitiativeModifier] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setType(initialTemplate.type);
      setMaxHp(initialTemplate.maxHp);
      setArmorClass(String(initialTemplate.armorClass));
      setInitiativeModifier(initialTemplate.initiativeModifier);
      setTags([...initialTemplate.tags]);
      setNotes(initialTemplate.notes);
    } else {
      // Default empty values for new template
      setName('');
      setType('enemy');
      setMaxHp(12);
      setArmorClass('12');
      setInitiativeModifier(0);
      setTags([]);
      setNotes('');
    }
    setError('');
  }, [initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Пожалуйста, введите имя существа');
      return;
    }
    if (maxHp <= 0) {
      setError('Здоровье (HP) должно быть больше 0');
      return;
    }

    const templateToSave: CreatureTemplate = {
      id: initialTemplate ? initialTemplate.id : `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      type,
      maxHp: Number(maxHp),
      armorClass: armorClass.trim() || '10',
      initiativeModifier: Number(initiativeModifier),
      tags,
      notes: notes.trim(),
      createdAt: initialTemplate ? initialTemplate.createdAt : Date.now(),
    };

    onSave(templateToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                {initialTemplate ? 'Редактировать существо' : 'Новый шаблон существа / NPC'}
              </h2>
              <p className="text-xs text-slate-400">
                Заполните удобную карточку характеристик существа
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Name & Type */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Имя существа / NPC <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="например: Вождь орков, Гоблин-лучник, Трактирщик"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Принадлежность
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'enemy', label: 'Враг', color: 'border-red-500/60 bg-red-950/40 text-red-300' },
                  { id: 'ally', label: 'Союзник', color: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300' },
                  { id: 'neutral', label: 'Нейтрал', color: 'border-amber-500/60 bg-amber-950/40 text-amber-300' },
                  { id: 'hazard', label: 'Ловушка / Событие', color: 'border-purple-500/60 bg-purple-950/40 text-purple-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as CreatureType)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                      type === item.id
                        ? `${item.color} ring-2 ring-amber-400/50 shadow-md`
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Stats: HP, AC, Initiative Mod */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            {/* HP */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                <Heart className="w-3.5 h-3.5" /> Здоровье (HP)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setMaxHp(Math.max(1, maxHp - 5))}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-l-lg border border-r-0 border-slate-700 text-xs"
                >
                  -5
                </button>
                <input
                  type="number"
                  min="1"
                  value={maxHp}
                  onChange={(e) => setMaxHp(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 py-2 text-center text-white font-bold focus:outline-none focus:border-rose-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMaxHp(maxHp + 5)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-r-lg border border-l-0 border-slate-700 text-xs"
                >
                  +5
                </button>
              </div>
            </div>

            {/* AC / Armor */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                <Shield className="w-3.5 h-3.5" /> Защита / КД
              </label>
              <input
                type="text"
                value={armorClass}
                onChange={(e) => setArmorClass(e.target.value)}
                placeholder="15"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-center text-white font-bold focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Initiative Modifier */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Zap className="w-3.5 h-3.5" /> Мод. Иниц.
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setInitiativeModifier(initiativeModifier - 1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-l-lg border border-r-0 border-slate-700 text-xs"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={initiativeModifier}
                  onChange={(e) => setInitiativeModifier(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 py-2 text-center text-white font-bold focus:outline-none focus:border-amber-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setInitiativeModifier(initiativeModifier + 1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-r-lg border border-l-0 border-slate-700 text-xs"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Tag className="w-3.5 h-3.5 text-amber-400" /> Теги и категории
            </label>
            
            {/* Quick preset tags */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input & Selected Tags */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Свой тег..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 font-medium transition"
              >
                Добавить
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-red-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes / Actions / Attacks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Действия, атаки и заметки мастера
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Атака: Длинный меч +5 (1d8+3 рубящего)&#10;Особое: Всплеск ярости, сопротивление к огню, уязвимость к серебру..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs font-mono transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {initialTemplate ? 'Сохранить изменения' : 'Создать существо'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
