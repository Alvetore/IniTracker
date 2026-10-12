import React, { useState, useRef } from 'react';
import { Storage } from '../../utils/storage';
import { X, Download, Upload, RotateCcw, AlertTriangle, Check, FileJson } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataReloaded: () => void;
}

export const DataManagementModal: React.FC<Props> = ({ isOpen, onClose, onDataReloaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr = Storage.exportAll();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ttrpg_initiative_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Данные успешно экспортированы в JSON-файл!' });
    } catch {
      setStatusMsg({ text: 'Не удалось экспортировать данные', error: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = Storage.importAll(content);
      if (res.success) {
        setStatusMsg({ text: 'Данные успешно импортированы и обновлены!' });
        onDataReloaded();
      } else {
        setStatusMsg({ text: res.error || 'Ошибка при чтении файла', error: true });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToDefaults = () => {
    if (confirm('Сбросить базу к базовым шаблонам и энкаунтерам по умолчанию? Текущие данные будут заменены.')) {
      Storage.resetToDefaults();
      setStatusMsg({ text: 'База сброшена к исходным данным!' });
      onDataReloaded();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-rpg">Управление данными и Бэкап</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.error
                  ? 'bg-red-950/60 border border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              {statusMsg.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Все ваши партии, существа и энкаунтеры автоматически сохраняются в браузере (LocalStorage). Вы можете экспортировать их в единый JSON-файл для переноса на другое устройство или создания резервной копии.
          </p>

          <div className="space-y-2.5">
            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 hover:border-amber-500/50 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <div className="text-left">
                  <div>Экспорт всех данных в JSON</div>
                  <div className="text-[10px] text-slate-400 font-normal">Скачать резервную копию на диск</div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded">.json</span>
            </button>

            {/* Import */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 hover:border-blue-500/50 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                  <div className="text-left">
                    <div>Импорт данных из JSON</div>
                    <div className="text-[10px] text-slate-400 font-normal">Восстановить из файла или перенести с телефона</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded">Выбрать</span>
              </button>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/50 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-300 transition flex items-center gap-2.5"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Сбросить к демонстрационным данным</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
