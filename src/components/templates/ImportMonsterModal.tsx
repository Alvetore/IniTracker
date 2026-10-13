import React, { useState } from 'react';
import { CreatureTemplate } from '../../types';
import { findMonsterByUrlOrSlug, parseMonsterFromText, convertCatalogMonsterToTemplate } from '../../utils/monsterParser';
import { X, Link as LinkIcon, FileText, CheckCircle2, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: CreatureTemplate) => void;
  initialEdition?: '5e14' | '5e24';
}

export const ImportMonsterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveTemplate,
  initialEdition = '5e24',
}) => {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [edition, setEdition] = useState<'5e14' | '5e24'>(initialEdition);
  const [inputUrl, setInputUrl] = useState('');
  const [inputText, setInputText] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<CreatureTemplate | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleParseUrl = () => {
    setStatusMessage(null);
    setPreviewTemplate(null);

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setStatusMessage({ text: 'Пожалуйста, введите ссылку на существо', type: 'error' });
      return;
    }

    // Auto-detect edition from url
    let activeEdition = edition;
    if (trimmed.includes('next.dnd.su')) {
      activeEdition = '5e24';
      setEdition('5e24');
    } else if (trimmed.includes('5e14.dnd.su')) {
      activeEdition = '5e14';
      setEdition('5e14');
    }

    // Check catalog lookup
    const foundInCatalog = findMonsterByUrlOrSlug(trimmed);
    if (foundInCatalog) {
      const tpl = convertCatalogMonsterToTemplate(foundInCatalog);
      setPreviewTemplate(tpl);
      setStatusMessage({
        text: `Существо «${foundInCatalog.name}» успешно найдено в каталоге (${foundInCatalog.sourceLabel})!`,
        type: 'success',
      });
      return;
    }

    // Try text parser on the URL slug
    const parsed = parseMonsterFromText(trimmed.replace(/https?:\/\/[^/]+\/bestiary\//i, '').replace(/[-_/]/g, ' '), activeEdition, trimmed);
    const tpl: CreatureTemplate = {
      id: `tpl-${activeEdition}-${Date.now()}`,
      name: parsed.name,
      type: 'enemy',
      maxHp: parsed.maxHp,
      armorClass: parsed.armorClass,
      initiativeModifier: parsed.initiativeModifier,
      tags: parsed.tags,
      notes: `Источник: ${trimmed}\nРедакция: ${activeEdition === '5e24' ? 'D&D 5e (2024)' : 'D&D 5e (2014)'}`,
      cr: parsed.cr,
      edition: activeEdition,
      sourceUrl: trimmed,
      sourceLabel: activeEdition === '5e24' ? 'next.dnd.su (5e24)' : '5e14.dnd.su (5e14)',
      createdAt: Date.now(),
    };

    setPreviewTemplate(tpl);
    setStatusMessage({
      text: 'Создан шаблон по ссылке. Проверьте характеристики перед сохранением или скопируйте текст со страницы для точного импорта.',
      type: 'info',
    });
  };

  const handleParseText = () => {
    setStatusMessage(null);
    setPreviewTemplate(null);

    const trimmed = inputText.trim();
    if (!trimmed) {
      setStatusMessage({ text: 'Пожалуйста, вставьте текст характеристик существа', type: 'error' });
      return;
    }

    const parsed = parseMonsterFromText(trimmed, edition);
    const tpl: CreatureTemplate = {
      id: `tpl-${edition}-${Date.now()}`,
      name: parsed.name,
      englishName: parsed.englishName,
      type: 'enemy',
      maxHp: parsed.maxHp,
      armorClass: parsed.armorClass,
      initiativeModifier: parsed.initiativeModifier,
      tags: parsed.tags,
      notes: parsed.notes,
      cr: parsed.cr,
      edition,
      sourceUrl: edition === '5e24' ? 'https://next.dnd.su/bestiary/' : 'https://5e14.dnd.su/bestiary/',
      sourceLabel: edition === '5e24' ? 'next.dnd.su (5e24)' : '5e14.dnd.su (5e14)',
      createdAt: Date.now(),
    };

    setPreviewTemplate(tpl);
    setStatusMessage({
      text: `Успешно распознано: «${tpl.name}» (HP: ${tpl.maxHp}, КД: ${tpl.armorClass}, Иниц: ${tpl.initiativeModifier >= 0 ? '+' : ''}${tpl.initiativeModifier})`,
      type: 'success',
    });
  };

  const handleSave = () => {
    if (!previewTemplate) return;
    onSaveTemplate(previewTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Импорт существа с dnd.su
              </h2>
              <p className="text-xs text-slate-400">
                Добавьте существо из next.dnd.su (5e24) или 5e14.dnd.su (5e14)
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setMode('url');
                setStatusMessage(null);
                setPreviewTemplate(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                mode === 'url'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> По ссылке на страницу
            </button>
            <button
              onClick={() => {
                setMode('text');
                setStatusMessage(null);
                setPreviewTemplate(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                mode === 'text'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Вставить текст статблока
            </button>
          </div>

          {/* Edition Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
              Издание правил D&D
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEdition('5e24')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  edition === '5e24'
                    ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">⚔️ 5e24 (Редакция 2024)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">next.dnd.su</div>
              </button>

              <button
                type="button"
                onClick={() => setEdition('5e14')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  edition === '5e14'
                    ? 'border-indigo-500/80 bg-indigo-950/40 text-indigo-300 ring-2 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">📜 5e14 (Редакция 2014)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">5e14.dnd.su</div>
              </button>
            </div>
          </div>

          {/* Input field */}
          {mode === 'url' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                Ссылка на бестиарий
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={
                    edition === '5e24'
                      ? 'https://next.dnd.su/bestiary/127-goblin/'
                      : 'https://5e14.dnd.su/bestiary/127-goblin/'
                  }
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Найти
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Поддерживаются прямые ссылки на существ как с next.dnd.su, так и с 5e14.dnd.su.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                Текст блока характеристик
              </label>
              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={'Скопируйте и вставьте текст со страницы существа на dnd.su...\nПример:\nГоблин [Goblin]\nКласс Доспеха: 15 (кожаный доспех)\nХиты: 10 (3d6)\nОпасность: 1/4\nДействия: Скимитар: +4 к попаданию...'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Распознать характеристики
              </button>
            </div>
          )}

          {/* Status notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/60 border-red-800/80 text-red-300'
                  : 'bg-blue-950/60 border-blue-800/80 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Preview Card */}
          {previewTemplate && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 mr-2">
                    {previewTemplate.edition === '5e24' ? '5e24 (next.dnd.su)' : '5e14 (5e14.dnd.su)'}
                  </span>
                  <span className="text-sm font-bold text-white">{previewTemplate.name}</span>
                </div>
                {previewTemplate.cr && (
                  <span className="text-xs font-semibold text-slate-400">CR {previewTemplate.cr}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-rose-400 block font-semibold">HP</span>
                  <span className="font-bold text-white">{previewTemplate.maxHp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-400 block font-semibold">КД</span>
                  <span className="font-bold text-white">{previewTemplate.armorClass}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block font-semibold">Иниц.</span>
                  <span className="font-bold text-white">
                    {previewTemplate.initiativeModifier >= 0
                      ? `+${previewTemplate.initiativeModifier}`
                      : previewTemplate.initiativeModifier}
                  </span>
                </div>
              </div>

              {previewTemplate.notes && (
                <div className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 line-clamp-3 whitespace-pre-line">
                  {previewTemplate.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!previewTemplate}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
              previewTemplate
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Добавить в личный бестиарий
          </button>
        </div>
      </div>
    </div>
  );
};
