import React, { useState } from 'react';
import { rollDie, parseDiceFormula } from '../../utils/dice';
import { X, Dices, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogRoll?: (msg: string) => void;
}

interface RollLogItem {
  id: string;
  time: string;
  text: string;
  total: number;
}

export const DiceRollerModal: React.FC<Props> = ({ isOpen, onClose, onLogRoll }) => {
  const [formula, setFormula] = useState('');
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [log, setLog] = useState<RollLogItem[]>([]);

  if (!isOpen) return null;

  const handleRollDie = (sides: number) => {
    const res = rollDie(sides);
    setLastResult(res);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logText = `d${sides}: [${res}] = ${res}`;

    const newLogItem = { id: String(Date.now()), time: timeStr, text: logText, total: res };
    setLog([newLogItem, ...log.slice(0, 19)]);
    if (onLogRoll) onLogRoll(logText);
  };

  const handleRollFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formula.trim()) return;

    const result = parseDiceFormula(formula);
    if (!result) return;

    setLastResult(result.total);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newLogItem = { id: String(Date.now()), time: timeStr, text: result.text, total: result.total };
    setLog([newLogItem, ...log.slice(0, 19)]);
    if (onLogRoll) onLogRoll(result.text);
    setFormula('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-white font-rpg">Броски кубиков</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Big Result Display */}
          <div className="py-4 bg-slate-950 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Результат последнего броска
            </span>
            <div className="text-4xl font-extrabold text-amber-400 font-mono my-1">
              {lastResult !== null ? lastResult : '—'}
            </div>
            {log.length > 0 && (
              <div className="text-xs text-slate-400 truncate px-4">{log[0].text}</div>
            )}
          </div>

          {/* Quick Dice Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
              <button
                key={sides}
                type="button"
                onClick={() => handleRollDie(sides)}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                  sides === 20
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>d{sides}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLog([])}
              title="Очистить лог"
              className="py-2 px-2 rounded-xl border border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formula input */}
          <form onSubmit={handleRollFormula} className="flex gap-2">
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Формула (2d6+3, 1d20-1...)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Бросок
            </button>
          </form>

          {/* Roll History */}
          {log.length > 0 && (
            <div className="space-y-1 max-h-36 overflow-y-auto pt-2 border-t border-slate-800 pr-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">История</span>
              {log.map((item) => (
                <div
                  key={item.id}
                  className="text-[11px] flex items-center justify-between py-1 px-2 rounded bg-slate-950/50 border border-slate-800/40 text-slate-300 font-mono"
                >
                  <span className="text-slate-500">{item.time}</span>
                  <span className="text-amber-300 font-semibold">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
