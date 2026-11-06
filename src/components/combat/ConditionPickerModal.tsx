import React, { useEffect, useMemo, useState } from 'react';
import { Condition, Combatant, SavedCondition } from '../../types';
import { STANDARD_CONDITIONS } from '../../utils/defaultData';
import { Storage } from '../../utils/storage';
import { useDialogAccessibility } from '../../utils/useDialogAccessibility';
import { X, Sparkles, Clock, Plus, Search, Check, AlertCircle, Trash2, Bookmark } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  combatant: Combatant | null;
  onAddCondition: (combatantId: string, condition: Condition) => void;
}

const DURATION_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: 'Бессрочно', value: null },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
];

const CONDITION_COLORS = [
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#ec4899',
  '#64748b',
  '#3b82f6',
];

const CONDITION_ICONS = [
  '☠️',
  '🔥',
  '❄️',
  '⚡',
  '💫',
  '😵',
  '🩸',
  '🛡️',
  '✨',
  '💤',
  '🌀',
  '🕸️',
  '🙈',
  '💗',
  '🔇',
  '😱',
  '👻',
  '🧠',
];

function formatRounds(rounds: number | null): string {
  if (rounds === null) return 'Бессрочно';
  const mod10 = rounds % 10;
  const mod100 = rounds % 100;
  if (mod10 === 1 && mod100 !== 11) return `${rounds} раунд`;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${rounds} раунда`;
  }
  return `${rounds} раундов`;
}

export const ConditionPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  combatant,
  onAddCondition,
}) => {
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [durationRounds, setDurationRounds] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [savedConditions, setSavedConditions] = useState<SavedCondition[]>([]);

  // Reset the form between openings and when switching to another combatant.
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedName('');
      setCustomName('');
      setDurationRounds(null);
      setSelectedColor('#8b5cf6');
      setSelectedIcon('');
      setNotes('');
      setSavedConditions(Storage.getCustomConditions());
    }
  }, [isOpen, combatant?.id]);

  const dialogRef = useDialogAccessibility(isOpen, onClose);

  const filteredConditions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return STANDARD_CONDITIONS;
    return STANDARD_CONDITIONS.filter((condition) =>
      condition.name.toLowerCase().includes(query)
    );
  }, [search]);

  if (!isOpen || !combatant) return null;

  const finalName = (customName.trim() || selectedName).trim();
  const durationLabel = formatRounds(durationRounds);
  const isAlreadyActive = combatant.conditions.some(
    (condition) => condition.name.toLowerCase() === finalName.toLowerCase()
  );
  const isStandardCondition = STANDARD_CONDITIONS.some(
    (condition) => condition.name === finalName
  );

  const applySavedCondition = (saved: SavedCondition) => {
    setSelectedName('');
    setCustomName(saved.name);
    setSelectedColor(saved.color);
    setSelectedIcon(saved.icon || '');
    setDurationRounds(saved.defaultDuration ?? null);
    setNotes(saved.notes || '');
  };

  const removeSavedCondition = (id: string) => {
    const next = savedConditions.filter((condition) => condition.id !== id);
    setSavedConditions(next);
    Storage.saveCustomConditions(next);
  };

  const saveCustomCondition = () => {
    if (!finalName || isStandardCondition) return;

    const existing = savedConditions.find(
      (condition) => condition.name.toLowerCase() === finalName.toLowerCase()
    );
    const entry: SavedCondition = {
      id: existing?.id || `saved-cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      color: selectedColor,
      icon: selectedIcon || undefined,
      defaultDuration: durationRounds,
      notes: notes.trim() || undefined,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const next = [entry, ...savedConditions.filter((condition) => condition.id !== entry.id)];
    setSavedConditions(next);
    Storage.saveCustomConditions(next);
  };

  const handleSelectStandard = (condition: { name: string; color: string; icon: string }) => {
    setSelectedName(condition.name);
    setSelectedColor(condition.color);
    setSelectedIcon(condition.icon);
    setCustomName('');
  };

  const handleCustomNameChange = (value: string) => {
    setCustomName(value);
    if (value) setSelectedName('');
  };

  const handleDurationInput = (value: string) => {
    if (!value) {
      setDurationRounds(null);
      return;
    }
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      setDurationRounds(Math.min(999, Math.max(1, parsed)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalName) return;

    const newCondition: Condition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      roundsRemaining: durationRounds,
      color: selectedColor,
      icon: selectedIcon || undefined,
      notes: notes.trim() || undefined,
    };

    saveCustomCondition();
    onAddCondition(combatant.id, newCondition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Добавить состояние: ${combatant.name}`}
        tabIndex={-1}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white font-rpg truncate">
                Состояние: {combatant.name}
              </h3>
              <p className="text-xs text-slate-400">
                Выберите готовое состояние или создайте своё
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Already active conditions */}
            {combatant.conditions.length > 0 && (
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Уже активно
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {combatant.conditions.map((condition) => (
                    <span
                      key={condition.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium"
                      style={{
                        borderColor: `${condition.color || '#8b5cf6'}60`,
                        backgroundColor: `${condition.color || '#8b5cf6'}20`,
                        color: condition.color || '#cbd5e1',
                      }}
                    >
                      {condition.icon && <span aria-hidden>{condition.icon}</span>}
                      {condition.name}
                      {condition.roundsRemaining !== null && (
                        <span className="font-bold text-[9px] bg-black/40 px-1 rounded">
                          {condition.roundsRemaining}р
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Saved custom conditions */}
            {savedConditions.length > 0 && (
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-fuchsia-400" /> Мои состояния
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {savedConditions.map((saved) => (
                    <div
                      key={saved.id}
                      className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950/70 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => applySavedCondition(saved)}
                        className="min-h-8 flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800 transition"
                        title="Подставить в форму"
                      >
                        {saved.icon ? (
                          <span aria-hidden>{saved.icon}</span>
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: saved.color }}
                          />
                        )}
                        <span>{saved.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedCondition(saved.id)}
                        aria-label={`Удалить сохранённое состояние ${saved.name}`}
                        className="min-h-8 min-w-8 p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                        title="Удалить из библиотеки"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Стандартные состояния
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск: отравлен, страх, invis..."
                  aria-label="Поиск состояния"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Очистить поиск"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-none sm:max-h-52 overflow-y-auto pr-1 mt-2">
                {filteredConditions.map((condition) => {
                  const isSelected = selectedName === condition.name;
                  const isActive = combatant.conditions.some(
                    (active) => active.name === condition.name
                  );
                  return (
                    <button
                      key={condition.name}
                      type="button"
                      onClick={() => handleSelectStandard(condition)}
                      className={`min-h-8 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition flex items-center gap-2 border ${
                        isSelected
                          ? 'border-amber-400 bg-slate-800 text-white ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="w-6 h-6 rounded-md flex items-center justify-center text-sm shrink-0"
                        style={{
                          backgroundColor: `${condition.color}20`,
                          color: condition.color,
                        }}
                      >
                        {condition.icon}
                      </span>
                      <span className="truncate flex-1">{condition.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {!isSelected && isActive && (
                        <span
                          className="text-[9px] text-emerald-400 shrink-0"
                          title="Уже активно"
                        >
                          уже
                        </span>
                      )}
                    </button>
                  );
                })}
                {filteredConditions.length === 0 && (
                  <div className="col-span-2 text-center py-5 text-xs text-slate-500">
                    Ничего не найдено — введите своё состояние ниже.
                  </div>
                )}
              </div>
            </div>

            {/* Custom condition */}
            <div>
              <label
                htmlFor="custom-condition-name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Или своё состояние / эффект
              </label>
              <input
                id="custom-condition-name"
                type="text"
                value={customName}
                onChange={(e) => handleCustomNameChange(e.target.value)}
                placeholder="Например: Горит (1d4 огня), Метка охотника..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Icon and color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Иконка
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedIcon('')}
                    aria-label="Без иконки"
                    aria-pressed={selectedIcon === ''}
                    className={`w-8 h-8 rounded-lg border text-[11px] transition ${
                      selectedIcon === ''
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-950/60 text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    —
                  </button>
                  {CONDITION_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      aria-label={`Иконка ${icon}`}
                      aria-pressed={selectedIcon === icon}
                      className={`w-8 h-8 rounded-lg border text-sm transition ${
                        selectedIcon === icon
                          ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                          : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Цвет
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {CONDITION_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Цвет ${color}`}
                      aria-pressed={selectedColor === color}
                      title={color}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        selectedColor === color
                          ? 'border-white ring-2 ring-amber-400/70 scale-110'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Длительность
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDurationRounds(preset.value)}
                    aria-label={preset.value === null ? 'Бессрочно' : formatRounds(preset.value)}
                    aria-pressed={durationRounds === preset.value}
                    className={`min-h-8 min-w-[42px] py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      durationRounds === preset.value
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                    {preset.value !== null && ' р.'}
                  </button>
                ))}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={durationRounds ?? ''}
                    onChange={(e) => handleDurationInput(e.target.value)}
                    placeholder="∞"
                    aria-label="Длительность в раундах"
                    className="w-12 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">раундов</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="condition-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Примечание
              </label>
              <input
                id="condition-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Спасбросок в конце хода, эффект при получении..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              {finalName ? (
                <>
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    {selectedIcon ? (
                      <span className="shrink-0 text-sm" aria-hidden>{selectedIcon}</span>
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedColor }}
                      />
                    )}
                    <span className="font-semibold text-white truncate">{finalName}</span>
                    <span className="text-slate-500 shrink-0">· {durationLabel}</span>
                  </div>
                  {isAlreadyActive && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Уже активно — будет добавлена вторая запись
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-slate-500">
                  Выберите состояние или введите своё название
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!finalName}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Наложить статус
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
