import React, { useState } from 'react';
import { PartyMember } from '../../types';
import { PartyMemberModal } from './PartyMemberModal';
import {
  UserPlus,
  Shield,
  Heart,
  Zap,
  Eye,
  Pencil,
  Trash2,
  Coffee,
  Users,
  Sparkles,
  Check,
  Swords,
} from 'lucide-react';

interface Props {
  party: PartyMember[];
  onSaveMember: (member: PartyMember) => void;
  onDeleteMember: (id: string) => void;
  onHealAll: () => void;
  onAddToCombat?: (member: PartyMember) => void;
  combatantPartyIds?: Set<string>;
}

export const PartyView: React.FC<Props> = ({
  party,
  onSaveMember,
  onDeleteMember,
  onHealAll,
  onAddToCombat,
  combatantPartyIds,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<PartyMember | null>(null);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: PartyMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Партия приключенцев ({party.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Постоянные персонажи игроков для быстрого добавления в любой бой
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          {party.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Восстановить всем персонажам максимальное здоровье?')) {
                  onHealAll();
                }
              }}
              title="Восстановить всем полное HP"
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <Coffee className="w-4 h-4" />
              <span>Хил всех</span>
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className={`${party.length > 0 ? '' : 'col-span-2'} px-3.5 py-2 sm:px-4 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Персонаж</span>
          </button>
        </div>
      </div>

      {/* Party Members Grid */}
      {party.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Партия пуста</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Добавьте персонажей ваших игроков, чтобы не вводить их вручную перед каждым боем.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Добавить первого героя
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {party.map((hero) => {
            const initSign =
              hero.initiativeModifier >= 0 ? `+${hero.initiativeModifier}` : hero.initiativeModifier;

            return (
              <div
                key={hero.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition group relative overflow-hidden"
              >
                {/* Accent Color Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: hero.color || '#3b82f6' }}
                />

                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: hero.color || '#3b82f6' }}
                      >
                        {hero.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition leading-tight">
                          {hero.name}
                        </h3>
                        {hero.playerName && (
                          <div className="text-xs text-slate-400 font-medium">
                            Игрок: <span className="text-slate-300">{hero.playerName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEdit(hero)}
                        title="Редактировать"
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить персонажа "${hero.name}" из партии?`)) {
                            onDeleteMember(hero.id);
                          }
                        }}
                        title="Удалить"
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-1.5 py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center mb-3">
                    <div>
                      <div className="text-[10px] font-semibold text-rose-400/90 flex items-center justify-center gap-0.5">
                        <Heart className="w-3 h-3" /> HP
                      </div>
                      <div className="text-xs font-bold text-slate-100">
                        {hero.currentHp}/{hero.maxHp}
                      </div>
                    </div>
                    <div className="border-l border-slate-800/80">
                      <div className="text-[10px] font-semibold text-blue-400/90 flex items-center justify-center gap-0.5">
                        <Shield className="w-3 h-3" /> КД
                      </div>
                      <div className="text-xs font-bold text-slate-100">{hero.armorClass}</div>
                    </div>
                    <div className="border-l border-slate-800/80">
                      <div className="text-[10px] font-semibold text-amber-400/90 flex items-center justify-center gap-0.5">
                        <Zap className="w-3 h-3" /> Иниц.
                      </div>
                      <div className="text-xs font-bold text-slate-100">{initSign}</div>
                    </div>
                    <div className="border-l border-slate-800/80">
                      <div className="text-[10px] font-semibold text-emerald-400/90 flex items-center justify-center gap-0.5">
                        <Eye className="w-3 h-3" /> Вспр.
                      </div>
                      <div className="text-xs font-bold text-slate-100">
                        {hero.passivePerception || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Class info */}
                  {hero.notes && (
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50 text-xs text-slate-300 font-mono whitespace-pre-line line-clamp-2">
                      {hero.notes}
                    </div>
                  )}

                  {/* Add to combat action */}
                  {onAddToCombat && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      {combatantPartyIds?.has(hero.id) ? (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> В активном бою
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Не в бою</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onAddToCombat(hero)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Swords className="w-3 h-3" /> + В бой
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <PartyMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveMember}
        initialMember={editingMember}
      />
    </div>
  );
};
