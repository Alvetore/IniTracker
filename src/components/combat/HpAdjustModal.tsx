import React, { useState, useEffect } from 'react';
import { Combatant } from '../../types';
import { X, Heart, ShieldAlert, Sparkles, Plus, Minus, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  combatant: Combatant | null;
  onApplyHpChange: (
    combatantId: string,
    newCurrentHp: number,
    newTempHp: number,
    logMsg: string
  ) => void;
}

export const HpAdjustModal: React.FC<Props> = ({
  isOpen,
  onClose,
  combatant,
  onApplyHpChange,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [lastDeltaMessage, setLastDeltaMessage] = useState<{ text: string; isNegative: boolean } | null>(null);

  useEffect(() => {
    setAmount('');
    setLastDeltaMessage(null);
  }, [isOpen, combatant?.id]);

  if (!isOpen || !combatant) return null;

  const currentHp = combatant.hp.current;
  const maxHp = combatant.hp.max;
  const tempHp = combatant.hp.temp;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));

  const getHpColor = () => {
    if (currentHp <= 0) return 'bg-slate-600';
    if (hpPercent <= 25) return 'bg-red-500';
    if (hpPercent <= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleDamage = (mult: number = 1) => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    const actualDmg = Math.floor(parsed * mult);
    let remainingDmg = actualDmg;
    let newTemp = tempHp;
    let newHp = currentHp;

    if (newTemp > 0) {
      if (remainingDmg >= newTemp) {
        remainingDmg -= newTemp;
        newTemp = 0;
      } else {
        newTemp -= remainingDmg;
        remainingDmg = 0;
      }
    }

    newHp = Math.max(0, newHp - remainingDmg);
    const multText = mult === 0.5 ? ' (половина урона)' : mult === 2 ? ' (крит x2)' : '';
    const logMsg = `${combatant.name} получил ${actualDmg} урона${multText}. HP: ${newHp}/${maxHp}`;

    onApplyHpChange(combatant.id, newHp, newTemp, logMsg);
    onClose();
  };

  const handleHeal = () => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    const newHp = Math.min(maxHp, currentHp + parsed);
    const actualHealed = newHp - currentHp;
    const logMsg = `${combatant.name} восстановил ${actualHealed} HP. HP: ${newHp}/${maxHp}`;

    onApplyHpChange(combatant.id, newHp, tempHp, logMsg);
    onClose();
  };

  const handleSetTempHp = () => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed < 0) return;

    const logMsg = `${combatant.name} получил ${parsed} временных HP.`;
    onApplyHpChange(combatant.id, currentHp, parsed, logMsg);
    onClose();
  };

  const handleQuickDelta = (delta: number) => {
    if (delta < 0) {
      let remainingDmg = Math.abs(delta);
      let newTemp = tempHp;
      let newHp = currentHp;

      if (newTemp > 0) {
        if (remainingDmg >= newTemp) {
          remainingDmg -= newTemp;
          newTemp = 0;
        } else {
          newTemp -= remainingDmg;
          remainingDmg = 0;
        }
      }

      newHp = Math.max(0, newHp - remainingDmg);
      const logMsg = `${combatant.name} получил ${Math.abs(delta)} урона. HP: ${newHp}/${maxHp}`;
      onApplyHpChange(combatant.id, newHp, newTemp, logMsg);

      setLastDeltaMessage({ text: `-${Math.abs(delta)} HP`, isNegative: true });
    } else {
      const newHp = Math.min(maxHp, currentHp + delta);
      const actualHealed = newHp - currentHp;
      const logMsg = `${combatant.name} восстановил ${actualHealed} HP. HP: ${newHp}/${maxHp}`;
      onApplyHpChange(combatant.id, newHp, tempHp, logMsg);

      setLastDeltaMessage({ text: `+${actualHealed} HP`, isNegative: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-rpg">{combatant.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>HP:</span>
                  <span className="font-bold text-white">{currentHp}</span>
                  <span>/ {maxHp}</span>
                  {tempHp > 0 && <span className="text-cyan-400 font-semibold">(+{tempHp} темп)</span>}
                  {lastDeltaMessage && (
                    <span
                      key={Date.now()}
                      className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold animate-in fade-in zoom-in-75 duration-150 ${
                        lastDeltaMessage.isNegative
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {lastDeltaMessage.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Visual Health Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${getHpColor()}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
              Значение урона или исцеления
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Введите число..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-center text-2xl font-bold text-white focus:outline-none focus:border-amber-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleDamage(1);
                }
              }}
            />

            {/* Quick preset chips to fill amount input */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 mr-0.5">Ввод:</span>
              {[1, 5, 10, 15, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-semibold border border-slate-700/60 transition"
                >
                  {val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(String(maxHp))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-md text-xs font-semibold border border-slate-700/60 transition"
              >
                Max
              </button>
            </div>
          </div>

          {/* Core Action Buttons: Damage & Heal */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDamage(1)}
              className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Minus className="w-4 h-4" /> Нанести урон
            </button>
            <button
              type="button"
              onClick={handleHeal}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Исцелить
            </button>
          </div>

          {/* Modifiers: Half dmg, Double dmg, Temp HP */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDamage(0.5)}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
              title="Половина урона (при успешном спасброске)"
            >
              Урон ÷ 2
            </button>
            <button
              type="button"
              onClick={() => handleDamage(2)}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
              title="Двойной урон (критический удар)"
            >
              Урон × 2
            </button>
            <button
              type="button"
              onClick={handleSetTempHp}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-semibold rounded-lg text-xs transition"
              title="Установить временные хиты"
            >
              Темп HP
            </button>
          </div>

          {/* Quick +/- Delta buttons */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Быстрые изменения (мгновенно)
              </span>
              <span className="text-[10px] text-slate-500">нажмите для применения</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[-10, -5, -1, 1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickDelta(delta)}
                  className={`py-2 rounded-xl text-xs font-bold transition border active:scale-90 ${
                    delta < 0
                      ? 'border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-red-300'
                      : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-300'
                  }`}
                  title={`${delta < 0 ? 'Отнять' : 'Добавить'} ${Math.abs(delta)} HP`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Готово / Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
