import React from 'react';
import { THEMES, ThemeId } from '../../types/theme';
import { X, Palette, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemePickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-rpg tracking-wide">
                Темы оформления трекера
              </h2>
              <p className="text-xs text-slate-400">
                Выберите атмосферный стиль под сеттинг вашей игровой сессии
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

        {/* Themes List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  isSelected
                    ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/50 shadow-lg'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                      {theme.badge}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                      {theme.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    {theme.description}
                  </p>
                </div>

                {/* Color swatches & Selected indicator */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bgColor }}
                      title="Фон"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.borderColor }}
                      title="Границы"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shadow"
                      style={{ backgroundColor: theme.accentColor }}
                      title="Акцент"
                    />
                  </div>

                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-slate-700 text-slate-600 group-hover:border-slate-500 flex items-center justify-center" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
