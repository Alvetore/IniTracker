import React, { useState, useMemo } from 'react';
import { Encounter, CreatureTemplate } from '../../types';
import { EncounterFormModal } from './EncounterFormModal';
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  Play,
  Layers,
  MapPin,
  Tag,
  Skull,
  Scroll,
} from 'lucide-react';

interface Props {
  encounters: Encounter[];
  templates: CreatureTemplate[];
  isCombatActive: boolean;
  onSaveEncounter: (encounter: Encounter) => void;
  onDeleteEncounter: (id: string) => void;
  onDuplicateEncounter: (encounter: Encounter) => void;
  onStartCombat: (encounter: Encounter) => void;
  onAddAsReinforcement: (encounter: Encounter) => void;
}

export const EncountersView: React.FC<Props> = ({
  encounters,
  templates,
  isCombatActive,
  onSaveEncounter,
  onDeleteEncounter,
  onDuplicateEncounter,
  onStartCombat,
  onAddAsReinforcement,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    encounters.forEach((e) => e.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [encounters]);

  const filteredEncounters = useMemo(() => {
    return encounters.filter((e) => {
      const matchesSearch =
        search.trim() === '' ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(search.toLowerCase())) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
        e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesTag = selectedTag === null || e.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [encounters, search, selectedTag]);

  const handleOpenCreate = () => {
    setEditingEncounter(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (encounter: Encounter) => {
    setEditingEncounter(encounter);
    setIsModalOpen(true);
  };

  const getDifficultyBadge = (diff?: Encounter['difficulty']) => {
    switch (diff) {
      case 'easy':
        return { label: 'Легкий', cls: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' };
      case 'medium':
        return { label: 'Средний', cls: 'bg-blue-950/60 text-blue-400 border-blue-800/60' };
      case 'hard':
        return { label: 'Сложный', cls: 'bg-amber-950/60 text-amber-400 border-amber-800/60' };
      case 'deadly':
        return { label: 'Смертельный', cls: 'bg-red-950/60 text-red-400 border-red-800/60' };
      default:
        return { label: 'Особый', cls: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            Заготовленные энкаунтеры ({encounters.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Сохраняйте боевые сцены заранее и запускайте их прямо на игре в 1 клик с участием всей партии!
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать энкаунтер
        </button>
      </div>

      {/* Search & Tag Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск энкаунтеров по названию, локации или тегам..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedTag === null
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Все теги
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedTag === tag
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Encounters Grid */}
      {filteredEncounters.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
          <Scroll className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Энкаунтеры не найдены</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedTag
              ? 'Попробуйте изменить поисковый запрос'
              : 'Создайте ваш первый заготовленный энкаунтер к предстоящей сессии!'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Создать первый энкаунтер
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEncounters.map((encounter) => {
            const diffBadge = getDifficultyBadge(encounter.difficulty);
            const totalMonsters = encounter.monsters.reduce((acc, m) => acc + m.count, 0);

            return (
              <div
                key={encounter.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition group"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${diffBadge.cls}`}
                        >
                          {diffBadge.label}
                        </span>
                        {encounter.location && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {encounter.location}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition leading-snug">
                        {encounter.title}
                      </h3>
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onDuplicateEncounter(encounter)}
                        title="Дублировать энкаунтер"
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(encounter)}
                        title="Редактировать"
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить энкаунтер "${encounter.title}"?`)) {
                            onDeleteEncounter(encounter.id);
                          }
                        }}
                        title="Удалить"
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Notes */}
                  {encounter.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      {encounter.description}
                    </p>
                  )}

                  {/* Monsters breakdown */}
                  <div className="mb-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Skull className="w-3.5 h-3.5 text-red-400" /> Состав ({totalMonsters}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {encounter.monsters.map((m) => (
                        <div
                          key={m.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="font-semibold text-white">{m.name}</span>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold text-[11px]">
                            ×{m.count}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (HP:{m.maxHp} КД:{m.armorClass})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {encounter.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {encounter.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700/50"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Launch Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => onStartCombat(encounter)}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 group-hover:shadow-amber-500/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Запустить этот бой
                  </button>

                  {isCombatActive && (
                    <button
                      onClick={() => onAddAsReinforcement(encounter)}
                      title="Добавить этих монстров к уже идущему активному бою как подкрепление (Волна 2)"
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      + В активный бой
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <EncounterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveEncounter}
        templates={templates}
        initialEncounter={editingEncounter}
      />
    </div>
  );
};
