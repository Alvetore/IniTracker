import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { CreatureTemplate, CreatureType, DiceSystem } from '../../types';
import { CatalogMonster, BestiarySection } from '../../types/bestiary';
import { convertCatalogMonsterToTemplate } from '../../utils/catalogToTemplate';
import {
  CatalogFilterOptions,
  CATALOG_SIZE_OPTIONS,
  CATALOG_SORT_OPTIONS,
  DEFAULT_CATALOG_FILTERS,
  filterAndSortCatalog,
  getCatalogSourceBooks,
} from '../../utils/catalogFilters';
import { TemplateFormModal } from './TemplateFormModal';
import { CatalogMonsterDetailsModal } from './CatalogMonsterDetailsModal';
import { ImportMonsterModal } from './ImportMonsterModal';
import { AddToCombatModal, AddToCombatOptions } from '../combat/AddToCombatModal';
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
  Sparkles,
  Filter,
  Swords,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  RotateCcw,
  UserRound,
  Crown,
  X,
} from 'lucide-react';

/**
 * Known catalog sizes. The actual data modules are imported lazily so opening
 * the app does not download several megabytes of monster statblocks.
 */
const CATALOG_COUNTS: Record<'5e14' | '5e24', number> = {
  '5e24': 657,
  '5e14': 2875,
};

interface Props {
  templates: CreatureTemplate[];
  onSaveTemplate: (template: CreatureTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (template: CreatureTemplate) => void;
  onAddToCombat?: (template: CreatureTemplate) => void;
  onAddToCombatWithOptions?: (options: AddToCombatOptions) => void;
  onNavigateToCombat?: () => void;
  diceSystem?: DiceSystem;
}

export const TemplatesView: React.FC<Props> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onAddToCombat,
  onAddToCombatWithOptions,
  onNavigateToCombat,
  diceSystem = 'd20',
}) => {
  // Current active section: 'saved' | '5e24' | '5e14'
  const [activeSection, setActiveSection] = useState<BestiarySection>('saved');

  // Personal templates filter state
  const [savedSearch, setSavedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');

  // Catalog filters state (for 5e24 and 5e14)
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterOptions>(
    DEFAULT_CATALOG_FILTERS
  );
  const [catalogLimit, setCatalogLimit] = useState(48);
  const deferredCatalogSearch = useDeferredValue(catalogFilters.search);

  // Lazy-loaded catalog: only one edition is kept in memory at a time. The
  // browser caches the imported module, so switching tabs is effectively free.
  const [loadedCatalog, setLoadedCatalog] = useState<{
    edition: '5e14' | '5e24';
    monsters: CatalogMonster[];
  } | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);

  useEffect(() => {
    setCatalogLimit(48);
  }, [activeSection, catalogFilters]);

  useEffect(() => {
    setCatalogFilters((previous) => {
      const sort =
        activeSection === '5e24' && previous.sort === 'source-asc' ? 'name-asc' : previous.sort;
      if (previous.sourceBook === 'all' && previous.sort === sort) return previous;
      return { ...previous, sourceBook: 'all', sort };
    });
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== '5e14' && activeSection !== '5e24') return;
    if (loadedCatalog?.edition === activeSection) return;

    let cancelled = false;
    setCatalogError(null);

    const load = async () => {
      try {
        const monsters =
          activeSection === '5e24'
            ? (await import('../../data/bestiary5e24')).BESTIARY_5E24
            : (await import('../../data/bestiary5e14')).BESTIARY_5E14;
        if (!cancelled) setLoadedCatalog({ edition: activeSection, monsters });
      } catch {
        if (!cancelled) {
          setCatalogError(
            'Не удалось загрузить каталог. Проверьте соединение и попробуйте ещё раз.'
          );
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeSection, catalogReloadKey, loadedCatalog?.edition]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CreatureTemplate | null>(null);

  const [inspectingMonster, setInspectingMonster] = useState<CatalogMonster | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importEdition, setImportEdition] = useState<'5e14' | '5e24'>('5e24');

  // Add to Combat Modal state
  const [combatCandidate, setCombatCandidate] = useState<CreatureTemplate | CatalogMonster | null>(null);
  const [isAddToCombatOpen, setIsAddToCombatOpen] = useState(false);

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
    return loadedCatalog?.edition === activeSection ? loadedCatalog.monsters : [];
  }, [activeSection, loadedCatalog]);

  const isCatalogLoading =
    (activeSection === '5e14' || activeSection === '5e24') &&
    loadedCatalog?.edition !== activeSection &&
    catalogError === null;

  // Source books present in the active catalog (Monster Manual, Theros, ...).
  const catalogSourceBooks = useMemo(
    () => getCatalogSourceBooks(activeCatalog),
    [activeCatalog]
  );

  const catalogSortOptions = useMemo(
    () =>
      catalogSourceBooks.length > 0
        ? CATALOG_SORT_OPTIONS
        : CATALOG_SORT_OPTIONS.filter((option) => option.id !== 'source-asc'),
    [catalogSourceBooks.length]
  );

  const effectiveCatalogFilters = useMemo(
    () => ({ ...catalogFilters, search: deferredCatalogSearch }),
    [catalogFilters, deferredCatalogSearch]
  );

  const filteredCatalogMonsters = useMemo(
    () => filterAndSortCatalog(activeCatalog, effectiveCatalogFilters),
    [activeCatalog, effectiveCatalogFilters]
  );

  const activeCatalogFilterCount = useMemo(
    () =>
      [
        catalogFilters.search.trim() !== '',
        catalogFilters.cr !== 'all',
        catalogFilters.category !== 'all',
        catalogFilters.size !== 'all',
        catalogFilters.sourceBook !== 'all',
        catalogFilters.named !== 'all',
        catalogFilters.legendaryOnly,
      ].filter(Boolean).length,
    [catalogFilters]
  );

  const resetCatalogFilters = () => {
    setCatalogFilters((previous) => ({
      ...DEFAULT_CATALOG_FILTERS,
      sort: previous.sort,
    }));
  };

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

  const canAddToCombat = Boolean(onAddToCombatWithOptions || onAddToCombat);

  const handleOpenAddToCombat = (creature: CreatureTemplate | CatalogMonster) => {
    setCombatCandidate(creature);
    setIsAddToCombatOpen(true);
  };

  const handleConfirmAddToCombat = (options: AddToCombatOptions) => {
    if (onAddToCombatWithOptions) {
      onAddToCombatWithOptions(options);
    } else if (onAddToCombat) {
      const template = 'stats' in options.creature
        ? convertCatalogMonsterToTemplate(options.creature as CatalogMonster)
        : (options.creature as CreatureTemplate);
      onAddToCombat(template);
    }

    const countStr = options.count > 1 ? ` (${options.count} шт.)` : '';
    setToastMessage(`Существо «${options.creature.name}»${countStr} добавлено в активный бой!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    if (options.navigateNow && onNavigateToCombat) {
      onNavigateToCombat();
    }
  };

  const handleAddCatalogMonsterToCombat = (monster: CatalogMonster) => {
    handleOpenAddToCombat(monster);
  };

  const handleAddSavedCreatureToCombat = (template: CreatureTemplate) => {
    handleOpenAddToCombat(template);
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white border border-slate-700 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          {onNavigateToCombat && (
            <button
              onClick={() => {
                setToastMessage(null);
                onNavigateToCombat();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md whitespace-nowrap ml-1"
            >
              <Swords className="w-3.5 h-3.5" />
              В бой
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1 text-xs p-1"
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
              {loadedCatalog?.edition === '5e24' ? loadedCatalog.monsters.length : CATALOG_COUNTS['5e24']}
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
              {loadedCatalog?.edition === '5e14' ? loadedCatalog.monsters.length : CATALOG_COUNTS['5e14']}
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
                        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/50 text-xs text-slate-300 font-mono line-clamp-3 whitespace-pre-line mb-3">
                          {template.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Actions */}
                    <div className="pt-2.5 mt-auto border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 truncate">
                        {template.tags[0] || 'Существо'}
                      </span>
                      {canAddToCombat && (
                        <button
                          type="button"
                          onClick={() => handleAddSavedCreatureToCombat(template)}
                          className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Добавить это существо в текущий бой"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          + В бой
                        </button>
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
                  {isCatalogLoading || catalogError
                    ? `${CATALOG_COUNTS[activeSection]} существ в каталоге`
                    : `${filteredCatalogMonsters.length} ${
                        filteredCatalogMonsters.length === 1 ? 'существо' : 'существ'
                      }`}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                {activeSection === '5e24' ? '⚔️ Каталог бестиария 5e24' : '📜 Каталог бестиария 5e14'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {activeSection === '5e24'
                  ? 'Полный каталог существ и NPC обновлённой редакции 2024 года с сайта next.dnd.su. Добавляйте в личный бестиарий в один клик.'
                  : 'Полный каталог существ и NPC редакции 2014 года с сайта 5e14.dnd.su — включая дополнения, homebrew и именных NPC. Добавляйте в личный бестиарий в один клик.'}
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

          {/* Search, filters & sorting */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogFilters.search}
                  onChange={(e) =>
                    setCatalogFilters((previous) => ({ ...previous, search: e.target.value }))
                  }
                  placeholder="Поиск по имени, способности, мировоззрению или источнику..."
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {catalogFilters.search && (
                  <button
                    type="button"
                    onClick={() =>
                      setCatalogFilters((previous) => ({ ...previous, search: '' }))
                    }
                    aria-label="Очистить поиск"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={catalogFilters.sort}
                  onChange={(e) =>
                    setCatalogFilters((previous) => ({ ...previous, sort: e.target.value as CatalogFilterOptions['sort'] }))
                  }
                  title="Сортировка каталога"
                  className="bg-transparent py-2.5 pr-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  {catalogSortOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() =>
                      setCatalogFilters((previous) => ({ ...previous, cr: filter.id }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      catalogFilters.cr === filter.id
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={catalogFilters.category}
                onChange={(e) =>
                  setCatalogFilters((previous) => ({ ...previous, category: e.target.value }))
                }
                title="Тип существа"
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
                <option value="Фея">Фея</option>
                <option value="Исчадие">Исчадие</option>
                <option value="Элементаль">Элементаль</option>
                <option value="Конструкт">Конструкт</option>
                <option value="Растение">Растение</option>
                <option value="Небожитель">Небожитель</option>
              </select>

              {/* Size Filter */}
              <select
                value={catalogFilters.size}
                onChange={(e) =>
                  setCatalogFilters((previous) => ({ ...previous, size: e.target.value }))
                }
                title="Размер существа"
                className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Все размеры</option>
                {CATALOG_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              {/* Source book filter */}
              {catalogSourceBooks.length > 0 && (
                <select
                  value={catalogFilters.sourceBook}
                  onChange={(e) =>
                    setCatalogFilters((previous) => ({ ...previous, sourceBook: e.target.value }))
                  }
                  title="Источник (книга или дополнение)"
                  className="max-w-[220px] bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Все источники</option>
                  {catalogSourceBooks.map((book) => (
                    <option key={book} value={book}>
                      {book}
                    </option>
                  ))}
                </select>
              )}

              {/* Named NPC filter */}
              <button
                type="button"
                onClick={() =>
                  setCatalogFilters((previous) => ({
                    ...previous,
                    named: previous.named === 'named' ? 'all' : 'named',
                  }))
                }
                title="Показать только именных NPC"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                  catalogFilters.named === 'named'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <UserRound className="w-3.5 h-3.5" />
                Именные НИП
              </button>

              {/* Legendary filter */}
              <button
                type="button"
                onClick={() =>
                  setCatalogFilters((previous) => ({
                    ...previous,
                    legendaryOnly: !previous.legendaryOnly,
                  }))
                }
                title="Показать только существ с легендарными действиями"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                  catalogFilters.legendaryOnly
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Легендарные
              </button>

              {/* Reset filters */}
              {activeCatalogFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetCatalogFilters}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/30 border border-rose-900/60 hover:bg-rose-950/50 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить ({activeCatalogFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Grid of Catalog Creatures */}
          {isCatalogLoading ? (
            <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
              <Loader2 className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-spin" />
              <h3 className="text-base font-bold text-slate-200">
                Загружаем каталог {activeSection === '5e24' ? '5e24' : '5e14'}…
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeSection === '5e24'
                  ? '657 существ из next.dnd.su загружаются отдельным файлом.'
                  : '2875 существ из 5e14.dnd.su загружаются один раз и далее берутся из кэша браузера.'}
              </p>
            </div>
          ) : catalogError ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-rose-900/70 rounded-2xl p-8">
              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">Каталог не загрузился</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{catalogError}</p>
              <button
                onClick={() => {
                  setLoadedCatalog(null);
                  setCatalogReloadKey((key) => key + 1);
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition"
              >
                Повторить загрузку
              </button>
            </div>
          ) : filteredCatalogMonsters.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">Существа не найдены</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Попробуйте изменить запрос, тип, размер, источник или фильтр по уровню опасности (CR)
              </p>
              <button
                onClick={resetCatalogFilters}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalogMonsters.slice(0, catalogLimit).map((monster) => {
                const isAdded =
                  addedMonsterIds.has(monster.id) ||
                  templates.some((template) => template.sourceUrl === monster.sourceUrl);
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
                            {monster.sourceBook && (
                              <span
                                title={`Источник: ${monster.sourceBook}`}
                                className="max-w-[150px] truncate text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/25"
                              >
                                {monster.sourceBook}
                              </span>
                            )}
                            {monster.notes.startsWith('Именной НИП') && (
                              <span className="text-[10px] text-fuchsia-300 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/25">
                                Именной НИП
                              </span>
                            )}
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
                        {monster.notes ||
                          'Нет описания способностей — откройте карточку, чтобы посмотреть статблок.'}
                      </div>
                    </div>

                    {/* Card Actions Bottom */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleOpenInspect(monster)}
                        className="px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                        title="Подробнее о существе"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Инфо</span>
                      </button>

                      {canAddToCombat && (
                        <button
                          onClick={() => handleAddCatalogMonsterToCombat(monster)}
                          className="px-2.5 sm:px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm whitespace-nowrap"
                          title="Добавить в текущий бой"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          + В бой
                        </button>
                      )}

                      <button
                        onClick={() => handleAddMonsterToPersonal(monster)}
                        disabled={isAdded}
                        title={
                          isAdded
                            ? 'Уже добавлено. Откройте карточку, чтобы добавить копию'
                            : 'Добавить в личный бестиарий'
                        }
                        className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md disabled:cursor-default ${
                          isAdded
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="truncate">В бестиарии</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="truncate">В бестиарий</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredCatalogMonsters.length > catalogLimit && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setCatalogLimit((previous) => previous + 48)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Показать ещё ({filteredCatalogMonsters.length - catalogLimit} из {filteredCatalogMonsters.length})
                </button>
              </div>
            )}
            </>
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
        onAddToCombat={canAddToCombat ? handleAddCatalogMonsterToCombat : undefined}
        isAlreadyAdded={
          inspectingMonster
            ? addedMonsterIds.has(inspectingMonster.id) ||
              templates.some((template) => template.sourceUrl === inspectingMonster.sourceUrl)
            : false
        }
      />

      {/* 3. Import Monster Modal (URL / Text) */}
      <ImportMonsterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSaveTemplate={onSaveTemplate}
        initialEdition={importEdition}
      />

      {/* 4. Add to Combat Modal with initiative roll and count */}
      <AddToCombatModal
        isOpen={isAddToCombatOpen}
        onClose={() => setIsAddToCombatOpen(false)}
        creature={combatCandidate}
        diceSystem={diceSystem}
        onConfirm={handleConfirmAddToCombat}
      />
    </div>
  );
};
