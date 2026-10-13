import React, { useState, useMemo } from 'react';
import { CreatureTemplate, CreatureType } from '../../types';
import { CatalogMonster, BestiarySection } from '../../types/bestiary';
import { BESTIARY_5E14 } from '../../data/bestiary5e14';
import { BESTIARY_5E24 } from '../../data/bestiary5e24';
import { convertCatalogMonsterToTemplate } from '../../utils/monsterParser';
import { TemplateFormModal } from './TemplateFormModal';
import { CatalogMonsterDetailsModal } from './CatalogMonsterDetailsModal';
import { ImportMonsterModal } from './ImportMonsterModal';
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
  ExternalLink,
  Info,
  Check,
  BookOpen,
  Sparkles,
  Layers,
  Filter,
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
  // Current active section: 'saved' | '5e24' | '5e14'
  const [activeSection, setActiveSection] = useState<BestiarySection>('saved');

  // Personal templates filter state
  const [savedSearch, setSavedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');

  // Catalog filters state (for 5e24 and 5e14)
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCrFilter, setCatalogCrFilter] = useState<string>('all');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CreatureTemplate | null>(null);

  const [inspectingMonster, setInspectingMonster] = useState<CatalogMonster | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importEdition, setImportEdition] = useState<'5e14' | '5e24'>('5e24');

  // Feedback for added monsters (IDs added in current session)
  const [addedMonsterIds, setAddedMonsterIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Extract all unique tags for personal templates
  const allSavedTags = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [templates]);

  // Filter personal templates
  const filteredSavedTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        savedSearch.trim() === '' ||
        t.name.toLowerCase().includes(savedSearch.toLowerCase()) ||
        (t.englishName && t.englishName.toLowerCase().includes(savedSearch.toLowerCase())) ||
        t.notes.toLowerCase().includes(savedSearch.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(savedSearch.toLowerCase()));

      const matchesTag = selectedTag === null || t.tags.includes(selectedTag);
      const matchesType = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesTag && matchesType;
    });
  }, [templates, savedSearch, selectedTag, selectedType]);

  // Catalog list depending on 5e24 vs 5e14
  const activeCatalog = useMemo(() => {
    return activeSection === '5e24' ? BESTIARY_5E24 : BESTIARY_5E14;
  }, [activeSection]);

  // Filter catalog monsters
  const filteredCatalogMonsters = useMemo(() => {
    return activeCatalog.filter((m) => {
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        m.name.toLowerCase().includes(q) ||
        m.englishName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q) ||
        m.traits?.some((trait) => trait.name.toLowerCase().includes(q) || trait.description.toLowerCase().includes(q)) ||
        m.actions?.some((act) => act.name.toLowerCase().includes(q) || act.description.toLowerCase().includes(q));

      // CR filter
      let matchesCr = true;
      if (catalogCrFilter === 'low') matchesCr = m.crNum <= 0.5; // CR 0 - 1/2
      else if (catalogCrFilter === 'tier1') matchesCr = m.crNum >= 1 && m.crNum <= 4; // CR 1 - 4
      else if (catalogCrFilter === 'tier2') matchesCr = m.crNum >= 5 && m.crNum <= 10; // CR 5 - 10
      else if (catalogCrFilter === 'tier3') matchesCr = m.crNum >= 11; // CR 11+
      else if (catalogCrFilter !== 'all') matchesCr = m.cr === catalogCrFilter;

      // Category filter
      const matchesCat = catalogCategoryFilter === 'all' || m.category === catalogCategoryFilter;

      return matchesSearch && matchesCr && matchesCat;
    });
  }, [activeCatalog, catalogSearch, catalogCrFilter, catalogCategoryFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (template: CreatureTemplate) => {
    setEditingTemplate(template);
    setIsFormModalOpen(true);
  };

  const handleOpenInspect = (monster: CatalogMonster) => {
    setInspectingMonster(monster);
    setIsInspectModalOpen(true);
  };

  const handleOpenImport = (editionToImport?: '5e14' | '5e24') => {
    setImportEdition(editionToImport || (activeSection === '5e14' ? '5e14' : '5e24'));
    setIsImportModalOpen(true);
  };

  const handleAddMonsterToPersonal = (monster: CatalogMonster) => {
    const template = convertCatalogMonsterToTemplate(monster);
    onSaveTemplate(template);

    setAddedMonsterIds((prev) => new Set(prev).add(monster.id));
    setToastMessage(`Существо «${monster.name}» добавлено в личный бестиарий!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
        return { label: 'Событие / Ловушка', cls: 'bg-purple-950/60 text-purple-400 border-purple-800/60' };
      case 'player':
      default:
        return { label: 'Игрок', cls: 'bg-blue-950/60 text-blue-400 border-blue-800/60' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900/90 text-white border border-emerald-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Section Navigation Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 p-1.5 sm:p-2 rounded-2xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {/* Saved Section Tab */}
          <button
            onClick={() => setActiveSection('saved')}
            className={`py-3 px-4 rounded-xl text-left transition flex items-center justify-between gap-3 ${
              activeSection === 'saved'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white border border-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  activeSection === 'saved' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                🛡️
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold">Личный бестиарий</div>
                <div
                  className={`text-[10px] sm:text-[11px] ${
                    activeSection === 'saved' ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  Мои шаблоны существ и NPC
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeSection === 'saved' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {templates.length}
            </span>
          </button>

          {/* 5e24 (next.dnd.su) Section Tab */}
          <button
            onClick={() => setActiveSection('5e24')}
            className={`py-3 px-4 rounded-xl text-left transition flex items-center justify-between gap-3 ${
              activeSection === '5e24'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 font-bold'
                : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white border border-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  activeSection === '5e24' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                ⚔️
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  Бестиарий 5e24
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                      activeSection === '5e24' ? 'bg-black/30 text-emerald-100' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    }`}
                  >
                    2024
                  </span>
                </div>
                <div
                  className={`text-[10px] sm:text-[11px] ${
                    activeSection === '5e24' ? 'text-emerald-100 font-medium' : 'text-slate-400'
                  }`}
                >
                  next.dnd.su
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeSection === '5e24' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {BESTIARY_5E24.length}
            </span>
          </button>

          {/* 5e14 (5e14.dnd.su) Section Tab */}
          <button
            onClick={() => setActiveSection('5e14')}
            className={`py-3 px-4 rounded-xl text-left transition flex items-center justify-between gap-3 ${
              activeSection === '5e14'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold'
                : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:text-white border border-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  activeSection === '5e14' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                📜
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  Бестиарий 5e14
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                      activeSection === '5e14' ? 'bg-black/30 text-indigo-100' : 'bg-indigo-950 text-indigo-400 border border-indigo-800/80'
                    }`}
                  >
                    2014
                  </span>
                </div>
                <div
                  className={`text-[10px] sm:text-[11px] ${
                    activeSection === '5e14' ? 'text-indigo-100 font-medium' : 'text-slate-400'
                  }`}
                >
                  5e14.dnd.su
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeSection === '5e14' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {BESTIARY_5E14.length}
            </span>
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: PERSONAL BESTIARY ================= */}
      {activeSection === 'saved' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Banner & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 rounded-2xl">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                <Skull className="w-5 h-5 text-amber-400" />
                Личный бестиарий ({templates.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ваши собственные существа, импортированные монстры из каталогов 5e24 и 5e14, готовые для энкаунтеров
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => handleOpenImport()}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                title="Импорт по ссылке или тексту с dnd.su"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Импорт с dnd.su
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Создать существо
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
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
          {allSavedTags.length > 0 && (
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
              {allSavedTags.map((tag) => (
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
          {filteredSavedTemplates.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">Существа не найдены</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {savedSearch || selectedTag || selectedType !== 'all'
                  ? 'Попробуйте изменить параметры поиска или фильтров'
                  : 'В личном бестиарии пока нет существ. Добавьте монстров из вкладок 5e24 / 5e14 или создайте своего!'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveSection('5e24')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                >
                  ⚔️ Открыть каталог 5e24
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Создать существо
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSavedTemplates.map((template) => {
                const badge = getTypeBadge(template.type);
                const initSign =
                  template.initiativeModifier >= 0 ? `+${template.initiativeModifier}` : template.initiativeModifier;

                return (
                  <div
                    key={template.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>

                            {template.edition && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  template.edition === '5e24'
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                    : 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60'
                                }`}
                              >
                                {template.edition === '5e24' ? '5e24' : '5e14'}
                              </span>
                            )}

                            {template.cr && (
                              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                CR {template.cr}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                            {template.name}
                            {template.englishName && (
                              <span className="text-xs text-slate-400 font-normal ml-1.5 font-sans italic">
                                ({template.englishName})
                              </span>
                            )}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {template.sourceUrl && (
                            <a
                              href={template.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Открыть на dnd.su"
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
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
        </div>
      )}

      {/* ================= SECTION 2 & 3: 5E24 OR 5E14 CATALOG VIEW ================= */}
      {(activeSection === '5e24' || activeSection === '5e14') && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header Banner */}
          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
              activeSection === '5e24'
                ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-slate-900 border-emerald-800/60'
                : 'bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-900 border-indigo-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                    activeSection === '5e24'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {activeSection === '5e24'
                    ? 'D&D 5e (Редакция 2024) • next.dnd.su'
                    : 'D&D 5e (Редакция 2014) • 5e14.dnd.su'}
                </span>
                <span className="text-xs text-slate-400">
                  {filteredCatalogMonsters.length} {filteredCatalogMonsters.length === 1 ? 'существо' : 'существ'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                {activeSection === '5e24' ? '⚔️ Каталог бестиария 5e24' : '📜 Каталог бестиария 5e14'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {activeSection === '5e24'
                  ? 'Официальные существа и NPC по обновленной редакции правил 2024 года с сайта next.dnd.su. Добавляйте в свой личный бестиарий в один клик!'
                  : 'Классические существа и NPC по оригинальной редакции правил 2014 года с сайта 5e14.dnd.su. Добавляйте в свой личный бестиарий в один клик!'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <a
                href={activeSection === '5e24' ? 'https://next.dnd.su/bestiary/' : 'https://5e14.dnd.su/bestiary/'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                {activeSection === '5e24' ? 'next.dnd.su ↗' : '5e14.dnd.su ↗'}
              </a>

              <button
                onClick={() => handleOpenImport(activeSection)}
                className={`px-4 py-2.5 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-1.5 ${
                  activeSection === '5e24'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Импорт по ссылке
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Поиск существа (Гоблин, Dragon, Опасность, способность...)"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CR Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> CR:
              </span>
              {[
                { id: 'all', label: 'Все CR' },
                { id: 'low', label: '0 – 1/2' },
                { id: 'tier1', label: '1 – 4' },
                { id: 'tier2', label: '5 – 10' },
                { id: 'tier3', label: '11+' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCatalogCrFilter(filter.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    catalogCrFilter === filter.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <select
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Все типы</option>
                <option value="Гуманоид">Гуманоид</option>
                <option value="Нежить">Нежить</option>
                <option value="Зверь">Зверь</option>
                <option value="Дракон">Дракон</option>
                <option value="Великан">Великан</option>
                <option value="Монстр">Монстр</option>
                <option value="Аберрация">Аберрация</option>
                <option value="Слизь">Слизь</option>
              </select>
            </div>
          </div>

          {/* Grid of Catalog Creatures */}
          {filteredCatalogMonsters.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">Существа не найдены</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Попробуйте изменить поисковый запрос или фильтр по уровню опасности (CR)
              </p>
              <button
                onClick={() => {
                  setCatalogSearch('');
                  setCatalogCrFilter('all');
                  setCatalogCategoryFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalogMonsters.map((monster) => {
                const isAdded = addedMonsterIds.has(monster.id);
                const initSign =
                  monster.initiativeModifier >= 0
                    ? `+${monster.initiativeModifier}`
                    : monster.initiativeModifier;

                return (
                  <div
                    key={monster.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                monster.edition === '5e24'
                                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                                  : 'bg-indigo-950/70 text-indigo-400 border-indigo-800/80'
                              }`}
                            >
                              {monster.edition === '5e24' ? '5e24 • next.dnd.su' : '5e14 • 5e14.dnd.su'}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              CR {monster.cr}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {monster.size} {monster.category}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5 flex-wrap">
                            {monster.name}
                            <span className="text-xs text-slate-400 font-normal font-sans italic">
                              ({monster.englishName})
                            </span>
                          </h3>
                        </div>

                        {/* Direct link to dnd.su */}
                        <a
                          href={monster.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Открыть на ${monster.sourceLabel}`}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Stat grid */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center mb-3">
                        <div>
                          <div className="text-[10px] font-semibold text-rose-400/90 flex items-center justify-center gap-1">
                            <Heart className="w-3 h-3" /> HP
                          </div>
                          <div className="text-sm font-bold text-slate-100">{monster.maxHp}</div>
                          <div className="text-[9px] text-slate-500">({monster.hpFormula})</div>
                        </div>
                        <div className="border-x border-slate-800/80">
                          <div className="text-[10px] font-semibold text-blue-400/90 flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" /> КД
                          </div>
                          <div className="text-sm font-bold text-slate-100">{monster.armorClass}</div>
                          <div className="text-[9px] text-slate-500">
                            {monster.acNote ? monster.acNote.slice(0, 10) : 'доспех'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-amber-400/90 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" /> Иниц.
                          </div>
                          <div className="text-sm font-bold text-slate-100">{initSign}</div>
                          <div className="text-[9px] text-slate-500">{monster.speed.split(',')[0]}</div>
                        </div>
                      </div>

                      {/* Ability scores preview mini bar */}
                      <div className="grid grid-cols-6 gap-1 py-1.5 px-2 bg-slate-950/40 rounded-lg border border-slate-800/60 text-center text-[10px] mb-3">
                        <div>
                          <span className="text-slate-500 block">СИЛ</span>
                          <span className="font-bold text-slate-200">{monster.stats.str}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ЛОВ</span>
                          <span className="font-bold text-slate-200">{monster.stats.dex}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ТЕЛ</span>
                          <span className="font-bold text-slate-200">{monster.stats.con}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ИНТ</span>
                          <span className="font-bold text-slate-200">{monster.stats.int}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">МУД</span>
                          <span className="font-bold text-slate-200">{monster.stats.wis}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ХАР</span>
                          <span className="font-bold text-slate-200">{monster.stats.cha}</span>
                        </div>
                      </div>

                      {/* Actions / abilities preview */}
                      <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50 text-xs text-slate-300 font-mono line-clamp-3 whitespace-pre-line mb-4">
                        {monster.notes}
                      </div>
                    </div>

                    {/* Card Actions Bottom */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenInspect(monster)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Подробнее
                      </button>

                      <button
                        onClick={() => handleAddMonsterToPersonal(monster)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                          isAdded
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Добавлено (+еще)
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            В личный бестиарий
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Modal Form for Custom Creature */}
      <TemplateFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={onSaveTemplate}
        initialTemplate={editingTemplate}
      />

      {/* 2. Detailed Statblock Modal for Catalog Monster */}
      <CatalogMonsterDetailsModal
        monster={inspectingMonster}
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        onAddToPersonal={handleAddMonsterToPersonal}
        isAlreadyAdded={inspectingMonster ? addedMonsterIds.has(inspectingMonster.id) : false}
      />

      {/* 3. Import Monster Modal (URL / Text) */}
      <ImportMonsterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSaveTemplate={onSaveTemplate}
        initialEdition={importEdition}
      />
    </div>
  );
};
