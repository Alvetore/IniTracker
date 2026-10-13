import React, { useState, useEffect } from 'react';
import {
  Encounter,
  EncounterMonster,
  CreatureTemplate,
  CreatureType,
} from '../../types';
import {
  X,
  Plus,
  Trash2,
  Sword,
  MapPin,
  Tag,
  Skull,
  FileText,
  Minus,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (encounter: Encounter) => void;
  templates: CreatureTemplate[];
  initialEncounter?: Encounter | null;
}

export const EncounterFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  templates,
  initialEncounter,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Encounter['difficulty']>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [monsters, setMonsters] = useState<EncounterMonster[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEncounter) {
      setTitle(initialEncounter.title);
      setLocation(initialEncounter.location || '');
      setDescription(initialEncounter.description || '');
      setDifficulty(initialEncounter.difficulty || 'medium');
      setTags([...initialEncounter.tags]);
      setMonsters([...initialEncounter.monsters]);
    } else {
      setTitle('');
      setLocation('');
      setDescription('');
      setDifficulty('medium');
      setTags([]);
      setMonsters([]);
    }
    setSelectedTemplateId(templates.length > 0 ? templates[0].id : '');
    setError('');
  }, [initialEncounter, isOpen, templates]);

  if (!isOpen) return null;

  // Add monster from template
  const handleAddFromTemplate = () => {
    const targetId = selectedTemplateId || (templates.length > 0 ? templates[0].id : '');
    const tpl = templates.find((t) => t.id === targetId) || templates[0];
    if (!tpl) return;

    // Check if monster with same template already exists in encounter
    const existingIndex = monsters.findIndex((m) => m.templateId === tpl.id);
    if (existingIndex !== -1) {
      const updated = [...monsters];
      updated[existingIndex].count += 1;
      setMonsters(updated);
      return;
    }

    const newMonster: EncounterMonster = {
      id: `enc-m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      templateId: tpl.id,
      name: tpl.name,
      type: tpl.type,
      count: 1,
      maxHp: tpl.maxHp,
      armorClass: tpl.armorClass,
      initiativeModifier: tpl.initiativeModifier,
      notes: tpl.notes,
    };

    setMonsters([...monsters, newMonster]);
  };

  // Add ad-hoc custom monster directly to encounter
  const handleAddCustomMonster = () => {
    const newMonster: EncounterMonster = {
      id: `enc-m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Новый противник',
      type: 'enemy',
      count: 1,
      maxHp: 15,
      armorClass: '13',
      initiativeModifier: 1,
      notes: '',
    };
    setMonsters([...monsters, newMonster]);
  };

  const handleUpdateMonster = (id: string, updates: Partial<EncounterMonster>) => {
    setMonsters(
      monsters.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleRemoveMonster = (id: string) => {
    setMonsters(monsters.filter((m) => m.id !== id));
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTag.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название энкаунтера');
      return;
    }
    if (monsters.length === 0) {
      setError('Добавьте хотя бы одно существо или противника в энкаунтер');
      return;
    }

    const encounterToSave: Encounter = {
      id: initialEncounter
        ? initialEncounter.id
        : `enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      difficulty,
      tags,
      monsters,
      createdAt: initialEncounter ? initialEncounter.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(encounterToSave);
    onClose();
  };

  const totalEnemyCount = monsters
    .filter((m) => m.type === 'enemy')
    .reduce((acc, m) => acc + m.count, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sword className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                {initialEncounter ? 'Редактировать энкаунтер' : 'Создать новый энкаунтер'}
              </h2>
              <p className="text-xs text-slate-400">
                Заготовьте боевую сцену, противников и заметки заранее
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Title & Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Название встречи <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Засада у моста, Комната с саркофагом, Босс-файт..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Локация
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Подземелье, 2-й этаж"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Difficulty & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Оценка сложности
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'easy', label: 'Легкий', color: 'text-emerald-400 border-emerald-500/50' },
                  { id: 'medium', label: 'Средний', color: 'text-blue-400 border-blue-500/50' },
                  { id: 'hard', label: 'Сложный', color: 'text-amber-400 border-amber-500/50' },
                  { id: 'deadly', label: 'Смертельный', color: 'text-red-400 border-red-500/50' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as Encounter['difficulty'])}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition ${
                      difficulty === d.id
                        ? `${d.color} bg-slate-800 ring-1 ring-amber-400 shadow`
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Теги / Кампания
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Добавить тег..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description & DM Tactical Notes */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> Заметки для Мастера (тактика, триггеры, ловушки, освещение)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Гоблины стреляют с уступов; при потере половины сбегают в пещеру; сундук заминирован..."
              className="w-full bg-slate-850 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
            />
          </div>

          {/* Monsters & Combatants Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Участники встречи ({totalEnemyCount} противников)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddCustomMonster}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить уникального NPC
              </button>
            </div>

            {/* Quick Add from Templates */}
            {templates.length > 0 && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Из библиотеки существ:
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="flex-1 w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.cr ? `[CR ${t.cr}]` : ''} {t.edition ? `(${t.edition})` : ''} (HP: {t.maxHp}, КД: {t.armorClass}, Иниц: {t.initiativeModifier >= 0 ? `+${t.initiativeModifier}` : t.initiativeModifier})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddFromTemplate}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить в энкаунтер
                </button>
              </div>
            )}

            {/* Monsters List */}
            {monsters.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                Пока нет участников. Выберите существо из библиотеки выше или добавьте уникального NPC.
              </div>
            ) : (
              <div className="space-y-2">
                {monsters.map((monster) => (
                  <div
                    key={monster.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Name & Type */}
                    <div className="flex-1 min-w-[140px]">
                      <input
                        type="text"
                        value={monster.name}
                        onChange={(e) => handleUpdateMonster(monster.id, { name: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 text-sm font-bold text-white focus:outline-none w-full"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={monster.type}
                          onChange={(e) =>
                            handleUpdateMonster(monster.id, { type: e.target.value as CreatureType })
                          }
                          className="bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
                        >
                          <option value="enemy">Враг</option>
                          <option value="ally">Союзник</option>
                          <option value="neutral">Нейтрал</option>
                          <option value="hazard">Окружение</option>
                        </select>
                        {monster.notes && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {monster.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                      <span className="text-[10px] text-slate-500 font-semibold px-1">Кол-во:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateMonster(monster.id, { count: Math.max(1, monster.count - 1) })
                        }
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-amber-400">
                        {monster.count}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateMonster(monster.id, { count: monster.count + 1 })
                        }
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <span className="block text-[9px] text-rose-400 font-semibold">HP</span>
                        <input
                          type="number"
                          value={monster.maxHp}
                          onChange={(e) =>
                            handleUpdateMonster(monster.id, {
                              maxHp: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-12 bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-xs text-white font-bold"
                        />
                      </div>
                      <div className="text-center">
                        <span className="block text-[9px] text-blue-400 font-semibold">КД</span>
                        <input
                          type="text"
                          value={monster.armorClass}
                          onChange={(e) =>
                            handleUpdateMonster(monster.id, { armorClass: e.target.value })
                          }
                          className="w-12 bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-xs text-white font-bold"
                        />
                      </div>
                      <div className="text-center">
                        <span className="block text-[9px] text-amber-400 font-semibold">Иниц.</span>
                        <input
                          type="number"
                          value={monster.initiativeModifier}
                          onChange={(e) =>
                            handleUpdateMonster(monster.id, {
                              initiativeModifier: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-12 bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-xs text-white font-bold"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMonster(monster.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg ml-1 transition"
                        title="Удалить из встречи"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-1.5"
            >
              <Sword className="w-4 h-4" />
              {initialEncounter ? 'Сохранить энкаунтер' : 'Создать энкаунтер'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
