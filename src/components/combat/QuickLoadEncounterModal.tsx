import React from 'react';
import { Encounter } from '../../types';
import { useDialogAccessibility } from '../../utils/useDialogAccessibility';
import { Scroll, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounters: Encounter[];
  onSelect: (encounter: Encounter) => void;
}

export const QuickLoadEncounterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  encounters,
  onSelect,
}) => {
  const dialogRef = useDialogAccessibility(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Выберите энкаунтер для добавления"
        tabIndex={-1}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-rpg">
              Выберите энкаунтер для добавления
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-2.5">
          {encounters.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Нет сохраненных энкаунтеров. Создайте их во вкладке «Энкаунтеры».
            </div>
          ) : (
            encounters.map((encounter) => (
              <button
                key={encounter.id}
                type="button"
                onClick={() => onSelect(encounter)}
                className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-amber-300 text-sm">
                    {encounter.title}
                  </span>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    + Добавить
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {encounter.monsters.map((monster) => `${monster.name} ×${monster.count}`).join(', ')}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
