import React, { useState, useMemo } from 'react';
import { CreatureTemplate, CreatureType } from '../../types';
import { TemplateFormModal } from './TemplateFormModal';
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  Heart,
  Shield,
  Zap,
  Tag,
  Skull,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface Props {
  templates: CreatureTemplate[];
  onSaveTemplate: (template: CreatureTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (template: CreatureTemplate) => void;
}

export const TemplatesView: React.FC<Props> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CreatureTemplate | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        search.trim() === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.notes.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesTag = selectedTag === null || t.tags.includes(selectedTag);
      const matchesType = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesTag && matchesType;
    });
  }, [templates, search, selectedTag, selectedType]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: CreatureTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const getTypeBadge = (type: CreatureType) => {
    switch (type) {
      case 'enemy':
        return { label: 'Враг', cls: 'bg-red-950/60 text-red-400 border-red-800/60' };
      case 'ally':
        return { label: 'Союзник', cls: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' };
      case 'neutral':
        return { label: 'Нейтрал', cls: 'bg-amber-950/60 text-amber-400 border-amber-800/60' };
      case 'hazard':
        return { label: 'Ловушка / Окружение', cls: 'bg-purple-950/60 text-purple-400 border-purple-800/60' };
      case 'player':
      default:
        return { label: 'Игрок', cls: 'bg-blue-950/60 text-blue-400 border-blue-800/60' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
            <Skull className="w-5 h-5 text-amber-400" />
            Библиотека существ и NPC
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Создавайте шаблоны монстров, союзников и боссов с помощью простой формы для использования в любых энкаунтерах
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать существо
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, способностям или тегам..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'Все' },
              { id: 'enemy', label: 'Враги' },
              { id: 'ally', label: 'Союзники' },
              { id: 'neutral', label: 'Нейтралы' },
              { id: 'hazard', label: 'События' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag pills bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" /> Теги:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedTag === null
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Все теги
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedTag === tag
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Creatures */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Существа не найдены</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedTag || selectedType !== 'all'
              ? 'Попробуйте изменить параметры поиска или фильтров'
              : 'В бестиарии пока нет существ. Создайте первого монстра с помощью формы!'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Создать существо
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const badge = getTypeBadge(template.type);
            const initSign = template.initiativeModifier >= 0 ? `+${template.initiativeModifier}` : template.initiativeModifier;

            return (
              <div
                key={template.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border mb-1.5 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                        {template.name}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onDuplicateTemplate(template)}
                        title="Дублировать"
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(template)}
                        title="Редактировать"
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить существо "${template.name}"?`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                        title="Удалить"
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stat badges */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center mb-3">
                    <div>
                      <div className="text-[10px] font-semibold text-rose-400/90 flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" /> HP
                      </div>
                      <div className="text-sm font-bold text-slate-100">{template.maxHp}</div>
                    </div>
                    <div className="border-x border-slate-800/80">
                      <div className="text-[10px] font-semibold text-blue-400/90 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> КД
                      </div>
                      <div className="text-sm font-bold text-slate-100">{template.armorClass}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-amber-400/90 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" /> Иниц.
                      </div>
                      <div className="text-sm font-bold text-slate-100">{initSign}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes / Actions */}
                  {template.notes && (
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/50 text-xs text-slate-300 font-mono line-clamp-3 whitespace-pre-line">
                      {template.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <TemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveTemplate}
        initialTemplate={editingTemplate}
      />
    </div>
  );
};
