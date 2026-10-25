import React, { useState, useEffect } from 'react';
import {
  ActiveCombatState,
  Combatant,
  CombatLogEntry,
  Encounter,
  PartyMember,
  CreatureTemplate,
  Condition,
  DiceSystem,
} from '../../types';
import { rollInitiativeForSystem } from '../../utils/dice';
import { sortCombatantsPreservingTurn } from '../../utils/combatUtils';
import { ConditionPickerModal } from './ConditionPickerModal';
import { HpAdjustModal } from './HpAdjustModal';
import { AddCombatantModal } from './AddCombatantModal';
import { PartySelectionModal } from './PartySelectionModal';
import { EditCombatantModal } from './EditCombatantModal';
import {
  Play,
  RotateCcw,
  Plus,
  SkipForward,
  SkipBack,
  Heart,
  Shield,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Scroll,
  Users,
  Dices,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Layers,
  FileText,
  Pencil,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  combatState: ActiveCombatState | null;
  onUpdateCombatState: (state: ActiveCombatState | null) => void;
  party: PartyMember[];
  templates: CreatureTemplate[];
  encounters: Encounter[];
}

export const CombatTrackerView: React.FC<Props> = ({
  combatState,
  onUpdateCombatState,
  party,
  templates,
  encounters,
}) => {
  // Modal states
  const [hpModalCombatant, setHpModalCombatant] = useState<Combatant | null>(null);
  const [conditionModalCombatant, setConditionModalCombatant] = useState<Combatant | null>(null);
  const [isAddCombatantOpen, setIsAddCombatantOpen] = useState(false);
  const [isLoadEncounterOpen, setIsLoadEncounterOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingCombatant, setEditingCombatant] = useState<Combatant | null>(null);

  // Inline initiative edit state
  const [inlineEditInitId, setInlineEditInitId] = useState<string | null>(null);
  const [inlineEditInitVal, setInlineEditInitVal] = useState<number>(0);

  // View preferences
  const [showDefeated, setShowDefeated] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Spacebar shortcut to advance turn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && combatState && combatState.isActive) {
        e.preventDefault();
        handleNextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Helper to add log message
  const addLog = (message: string, type: CombatLogEntry['type'] = 'system') => {
    if (!combatState) return;
    const newEntry: CombatLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round: combatState.round,
      message,
      type,
    };
    return [newEntry, ...combatState.log.slice(0, 49)];
  };

  // 1. Initialize a new combat state if none exists
  const ensureCombatState = (): ActiveCombatState => {
    if (combatState) return combatState;
    const newState: ActiveCombatState = {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: [],
      diceSystem: 'd20',
    };
    onUpdateCombatState(newState);
    return newState;
  };

  // Add specific party members into combat
  const handleAddPartyMembers = (membersToAdd: PartyMember[]) => {
    const state = ensureCombatState();
    const newCombatants: Combatant[] = [];

    membersToAdd.forEach((hero) => {
      newCombatants.push({
        id: `hero-${hero.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: hero.name,
        type: 'player',
        initiative: hero.initiativeModifier,
        initiativeModifier: hero.initiativeModifier,
        hp: {
          current: hero.currentHp,
          max: hero.maxHp,
          temp: 0,
        },
        armorClass: hero.armorClass,
        conditions: [],
        notes: hero.notes || '',
        isDefeated: hero.currentHp <= 0,
        isDelayed: false,
        sourcePartyMemberId: hero.id,
      });
    });

    if (newCombatants.length === 0) return;

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      [...state.combatants, ...newCombatants],
      state.currentTurnIndex,
      state.isActive
    );

    const heroNames = membersToAdd.map((m) => m.name).join(', ');
    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: state.round,
        message:
          membersToAdd.length === 1
            ? `Герой ${heroNames} добавлен в бой`
            : `Герои (${heroNames}) добавлены в бой`,
        type: 'system' as const,
      },
      ...state.log,
    ];

    onUpdateCombatState({
      ...state,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });
  };

  // Load pre-made encounter
  const handleLoadEncounter = (enc: Encounter) => {
    const state = ensureCombatState();
    const newCombatants: Combatant[] = [];

    enc.monsters.forEach((m) => {
      for (let i = 1; i <= m.count; i++) {
        const name = m.count > 1 ? `${m.name} ${i}` : m.name;
        const { total: initVal } = rollInitiativeForSystem(state.diceSystem, m.initiativeModifier);

        newCombatants.push({
          id: `enc-comb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          name,
          type: m.type,
          initiative: initVal,
          initiativeModifier: m.initiativeModifier,
          hp: {
            current: m.maxHp,
            max: m.maxHp,
            temp: 0,
          },
          armorClass: m.armorClass,
          conditions: [],
          notes: m.notes || '',
          isDefeated: false,
          isDelayed: false,
          templateId: m.templateId,
        });
      }
    });

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      [...state.combatants, ...newCombatants],
      state.currentTurnIndex,
      state.isActive
    );

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: state.round,
        message: `Загружен энкаунтер "${enc.title}" (${newCombatants.length} существ)`,
        type: 'system' as const,
      },
      ...state.log,
    ];

    onUpdateCombatState({
      ...state,
      encounterTitle: enc.title,
      encounterId: enc.id,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });
    setIsLoadEncounterOpen(false);
  };

  // Roll initiative for all NPCs
  const handleRollInitiativeNpc = () => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => {
      if (c.type !== 'player') {
        const { total } = rollInitiativeForSystem(combatState.diceSystem, c.initiativeModifier);
        return { ...c, initiative: total };
      }
      return c;
    });

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      updated,
      combatState.currentTurnIndex,
      combatState.isActive
    );

    onUpdateCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
    });
  };

  // Roll initiative for ALL combatants
  const handleRollInitiativeAll = () => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => {
      const { total } = rollInitiativeForSystem(combatState.diceSystem, c.initiativeModifier);
      return { ...c, initiative: total };
    });

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      updated,
      combatState.currentTurnIndex,
      combatState.isActive
    );

    onUpdateCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
    });
  };

  // Start Combat (sort by initiative descending)
  const handleStartCombat = () => {
    if (!combatState || combatState.combatants.length === 0) return;

    const { sortedCombatants } = sortCombatantsPreservingTurn(combatState.combatants, 0, false);

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: 1,
        message: `Бой начался! Раунд 1. Первый ходит: ${sortedCombatants[0].name} (инициатива ${sortedCombatants[0].initiative})`,
        type: 'round' as const,
      },
      ...combatState.log,
    ];

    onUpdateCombatState({
      ...combatState,
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      combatants: sortedCombatants,
      log: newLog,
    });
  };

  // Re-sort combatants by initiative descending, preserving active turn
  const handleSortByInitiative = () => {
    if (!combatState || combatState.combatants.length === 0) return;
    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      combatState.combatants,
      combatState.currentTurnIndex,
      combatState.isActive
    );

    const activeName = sortedCombatants[nextTurnIndex]?.name;
    const newLog =
      combatState.isActive && activeName
        ? [
            {
              id: String(Date.now()),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              round: combatState.round,
              message: `Порядок инициативы пересортирован. Текущий ход: ${activeName}`,
              type: 'system' as const,
            },
            ...combatState.log,
          ]
        : combatState.log;

    onUpdateCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });
  };

  const handleSaveCombatantEdit = (id: string, updates: Partial<Combatant>) => {
    if (!combatState) return;
    const oldC = combatState.combatants.find((c) => c.id === id);
    const updated = combatState.combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      updated,
      combatState.currentTurnIndex,
      combatState.isActive
    );

    const logEntries = [...combatState.log];
    if (oldC && updates.initiative !== undefined && oldC.initiative !== updates.initiative) {
      logEntries.unshift({
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: combatState.round,
        message: `Инициатива "${updates.name || oldC.name}" изменена: ${oldC.initiative} ➔ ${updates.initiative}. Порядок пересортирован.`,
        type: 'system',
      });
    }

    onUpdateCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: logEntries,
    });
  };

  // Next Turn
  const handleNextTurn = () => {
    if (!combatState || combatState.combatants.length === 0) return;

    let nextIndex = combatState.currentTurnIndex + 1;
    let nextRound = combatState.round;
    const activeCombatants = combatState.combatants;

    // Check if round finished
    let logMsg = '';
    if (nextIndex >= activeCombatants.length) {
      nextIndex = 0;
      nextRound += 1;
      logMsg = `--- НАЧАЛО РАУНДА ${nextRound} ---`;
    }

    // Decrement conditions for the combatant finishing their turn
    const currentCombatant = activeCombatants[combatState.currentTurnIndex];
    let updatedCombatants = [...activeCombatants];

    if (currentCombatant) {
      const updatedConditions = currentCombatant.conditions
        .map((cond) => {
          if (cond.roundsRemaining !== null) {
            return { ...cond, roundsRemaining: cond.roundsRemaining - 1 };
          }
          return cond;
        })
        .filter((cond) => cond.roundsRemaining === null || cond.roundsRemaining > 0);

      updatedCombatants = updatedCombatants.map((c, i) =>
        i === combatState.currentTurnIndex ? { ...c, conditions: updatedConditions } : c
      );
    }

    const nextCombatant = updatedCombatants[nextIndex];
    const turnMsg = `Ход перешел к: ${nextCombatant.name} (Инициатива ${nextCombatant.initiative})`;

    const logsToAdd: CombatLogEntry[] = [];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (logMsg) {
      logsToAdd.push({
        id: `round-${Date.now()}`,
        timestamp: timeStr,
        round: nextRound,
        message: logMsg,
        type: 'round',
      });
    }
    logsToAdd.push({
      id: `turn-${Date.now()}`,
      timestamp: timeStr,
      round: nextRound,
      message: turnMsg,
      type: 'turn',
    });

    onUpdateCombatState({
      ...combatState,
      round: nextRound,
      currentTurnIndex: nextIndex,
      combatants: updatedCombatants,
      log: [...logsToAdd, ...combatState.log.slice(0, 48)],
    });
  };

  // Prev Turn
  const handlePrevTurn = () => {
    if (!combatState || combatState.combatants.length === 0) return;

    let prevIndex = combatState.currentTurnIndex - 1;
    let prevRound = combatState.round;

    if (prevIndex < 0) {
      prevIndex = combatState.combatants.length - 1;
      prevRound = Math.max(1, prevRound - 1);
    }

    onUpdateCombatState({
      ...combatState,
      round: prevRound,
      currentTurnIndex: prevIndex,
    });
  };

  // Reset Combat
  const handleResetCombat = () => {
    if (confirm('Сбросить текущий бой и вернуть порядок в режим подготовки?')) {
      if (combatState) {
        onUpdateCombatState({
          ...combatState,
          isActive: false,
          round: 1,
          currentTurnIndex: 0,
        });
      }
    }
  };

  // Clear all combatants
  const handleClearCombatants = () => {
    if (confirm('Очистить список участников боя?')) {
      onUpdateCombatState(null);
    }
  };

  // Update specific combatant
  const handleUpdateCombatant = (
    id: string,
    updates: Partial<Combatant>,
    autoSort: boolean = false
  ) => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
    if (autoSort || ('initiative' in updates && combatState.isActive)) {
      const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
        updated,
        combatState.currentTurnIndex,
        combatState.isActive
      );
      onUpdateCombatState({
        ...combatState,
        combatants: sortedCombatants,
        currentTurnIndex: nextTurnIndex,
      });
    } else {
      onUpdateCombatState({ ...combatState, combatants: updated });
    }
  };

  // Remove combatant
  const handleRemoveCombatant = (id: string) => {
    if (!combatState) return;
    const idx = combatState.combatants.findIndex((c) => c.id === id);
    const updated = combatState.combatants.filter((c) => c.id !== id);

    let nextTurnIndex = combatState.currentTurnIndex;
    if (idx < combatState.currentTurnIndex) {
      nextTurnIndex = Math.max(0, nextTurnIndex - 1);
    } else if (nextTurnIndex >= updated.length) {
      nextTurnIndex = 0;
    }

    onUpdateCombatState({
      ...combatState,
      combatants: updated,
      currentTurnIndex: nextTurnIndex,
    });
  };

  // Move combatant up/down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (!combatState) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= combatState.combatants.length) return;

    const list = [...combatState.combatants];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    // Adjust turn index if current active was moved
    let newTurn = combatState.currentTurnIndex;
    if (combatState.currentTurnIndex === index) {
      newTurn = targetIndex;
    } else if (combatState.currentTurnIndex === targetIndex) {
      newTurn = index;
    }

    onUpdateCombatState({
      ...combatState,
      combatants: list,
      currentTurnIndex: newTurn,
    });
  };

  // Apply HP change from modal
  const handleApplyHpChange = (
    combatantId: string,
    newCurrentHp: number,
    newTempHp: number,
    logMsg: string
  ) => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => {
      if (c.id === combatantId) {
        return {
          ...c,
          hp: {
            ...c.hp,
            current: newCurrentHp,
            temp: newTempHp,
          },
          isDefeated: newCurrentHp <= 0,
        };
      }
      return c;
    });

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: combatState.round,
        message: logMsg,
        type: 'damage' as const,
      },
      ...combatState.log,
    ];

    onUpdateCombatState({
      ...combatState,
      combatants: updated,
      log: newLog,
    });

    setHpModalCombatant((prev) => {
      if (prev && prev.id === combatantId) {
        return updated.find((c) => c.id === combatantId) || prev;
      }
      return prev;
    });
  };

  const handleQuickInlineDamage = (combatant: Combatant, damage: number) => {
    let remaining = damage;
    let newTemp = combatant.hp.temp;
    let newHp = combatant.hp.current;
    if (newTemp > 0) {
      if (remaining >= newTemp) {
        remaining -= newTemp;
        newTemp = 0;
      } else {
        newTemp -= remaining;
        remaining = 0;
      }
    }
    newHp = Math.max(0, newHp - remaining);
    handleApplyHpChange(
      combatant.id,
      newHp,
      newTemp,
      `${combatant.name} -${damage} HP. HP: ${newHp}/${combatant.hp.max}`
    );
  };

  const handleQuickInlineHeal = (combatant: Combatant, heal: number) => {
    const newHp = Math.min(combatant.hp.max, combatant.hp.current + heal);
    handleApplyHpChange(
      combatant.id,
      newHp,
      combatant.hp.temp,
      `${combatant.name} +${heal} HP. HP: ${newHp}/${combatant.hp.max}`
    );
  };

  // Add condition
  const handleAddCondition = (combatantId: string, condition: Condition) => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => {
      if (c.id === combatantId) {
        return {
          ...c,
          conditions: [...c.conditions, condition],
        };
      }
      return c;
    });

    const cName = combatState.combatants.find((c) => c.id === combatantId)?.name;
    const durStr = condition.roundsRemaining ? ` (${condition.roundsRemaining} р.)` : '';
    const logMsg = `${cName} получил статус: "${condition.name}"${durStr}`;

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: combatState.round,
        message: logMsg,
        type: 'condition' as const,
      },
      ...combatState.log,
    ];

    onUpdateCombatState({
      ...combatState,
      combatants: updated,
      log: newLog,
    });
  };

  // Remove condition
  const handleRemoveCondition = (combatantId: string, condId: string) => {
    if (!combatState) return;
    const updated = combatState.combatants.map((c) => {
      if (c.id === combatantId) {
        return {
          ...c,
          conditions: c.conditions.filter((cond) => cond.id !== condId),
        };
      }
      return c;
    });
    onUpdateCombatState({ ...combatState, combatants: updated });
  };

  const combatants = combatState ? combatState.combatants : [];
  const currentActive =
    combatState && combatState.isActive && combatants.length > 0
      ? combatants[combatState.currentTurnIndex]
      : null;
  const nextOnDeck =
    combatState && combatState.isActive && combatants.length > 1
      ? combatants[(combatState.currentTurnIndex + 1) % combatants.length]
      : null;

  return (
    <div className="space-y-5">
      {/* Top Banner & Mode Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                combatState?.isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {combatState?.isActive ? '⚔️ ИДЁТ БОЙ' : '🛡️ ПОДГОТОВКА К БОЮ'}
            </span>
            {combatState?.encounterTitle && (
              <span className="text-xs text-slate-400 font-medium truncate max-w-[160px] sm:max-w-none">
                • {combatState.encounterTitle}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-rpg tracking-wide">
            Трекер Инициативы
          </h2>
        </div>

        {/* Quick Top Actions */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsPartyModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            title="Выбрать персонажей партии для добавления в бой"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Партия</span>
            <span className="hidden sm:inline">({party.length})</span>
          </button>

          <button
            onClick={() => setIsLoadEncounterOpen(true)}
            className="px-2.5 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            title="Загрузить заготовленный энкаунтер"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Сцена</span>
          </button>

          <button
            onClick={() => setIsAddCombatantOpen(true)}
            className="px-2.5 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            title="Добавить одиночного участника или подкрепление"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Участник</span>
          </button>

          {combatants.length > 0 && (
            <button
              onClick={handleClearCombatants}
              title="Очистить список боя"
              className="col-span-3 sm:col-span-1 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition flex items-center justify-center gap-1 text-xs sm:text-base"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sm:hidden text-xs">Очистить список боя</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Combat Stage */}
      {combatants.length === 0 ? (
        <div className="text-center py-12 sm:py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-4 sm:p-8 space-y-4">
          <Flame className="w-10 h-10 sm:w-14 sm:h-14 text-amber-500/40 mx-auto" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-200 font-rpg">Боевой стол пуст</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Начните бой: добавьте персонажей партии игроков, выберите заготовленный энкаунтер или введите участников вручную!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <Users className="w-4 h-4" /> Выбрать героев партии ({party.length})
            </button>
            <button
              onClick={() => setIsLoadEncounterOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <Scroll className="w-4 h-4" /> Выбрать энкаунтер
            </button>
          </div>
        </div>
      ) : !combatState?.isActive ? (
        /* PRE-COMBAT / INITIATIVE ROLLING PHASE */
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-rpg">
                Фаза инициативы ({combatants.length} участников)
              </h3>
              <p className="text-xs text-slate-400">
                Бросьте инициативу или введите броски игроков, затем начните бой
              </p>
            </div>

            {/* Dice System selection & Auto-roll */}
            <div className="grid grid-cols-1 sm:flex items-center gap-2">
              <select
                value={combatState?.diceSystem || 'd20'}
                onChange={(e) =>
                  onUpdateCombatState({
                    ...ensureCombatState(),
                    diceSystem: e.target.value as DiceSystem,
                  })
                }
                className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-2 sm:py-1.5"
                title="Кубик инициативы"
              >
                <option value="d20">Кубик: 1d20 (D&D / PF)</option>
                <option value="d10">Кубик: 1d10 (WoD / Cyberpunk)</option>
                <option value="2d6">Кубик: 2d6 (PbtA / Traveller)</option>
                <option value="3d6">Кубик: 3d6 (GURPS)</option>
                <option value="manual">Ручной ввод</option>
              </select>

              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <button
                  onClick={handleRollInitiativeNpc}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Бросить NPC
                </button>

                <button
                  onClick={handleRollInitiativeAll}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Бросить ВСЕМ
                </button>

                <button
                  onClick={handleSortByInitiative}
                  className="col-span-2 sm:col-span-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                  title="Упорядочить список по убыванию инициативы"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" /> Сортировать
                </button>
              </div>
            </div>
          </div>

          {/* Combatants Table for Initiative Entry */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {combatants.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      c.type === 'player'
                        ? 'bg-blue-400'
                        : c.type === 'enemy'
                        ? 'bg-red-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-sm font-bold text-white truncate">{c.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      HP: {c.hp.max} | КД: {c.armorClass} | Мод: {c.initiativeModifier >= 0 ? `+${c.initiativeModifier}` : c.initiativeModifier}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Иниц:</span>
                    <input
                      type="number"
                      value={c.initiative}
                      onChange={(e) =>
                        handleUpdateCombatant(c.id, { initiative: parseInt(e.target.value) || 0 }, false)
                      }
                      onBlur={() => handleSortByInitiative()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-10 sm:w-12 bg-transparent text-center font-bold text-white text-sm focus:outline-none focus:text-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveCombatant(c.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Start Combat Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={handleStartCombat}
              className="w-full sm:w-auto py-3 px-6 sm:px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm sm:text-base shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              НАЧАТЬ БОЙ (РАУНД 1)
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE COMBAT PHASE */
        <div className="space-y-4">
          {/* Active Combat Dashboard Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Round & Nav */}
            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-slate-950 rounded-xl font-rpg font-extrabold text-sm sm:text-lg shadow-md flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-xs sm:text-sm">РАУНД</span>
                <span className="text-lg sm:text-2xl">{combatState.round}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end sm:justify-start">
                <button
                  onClick={handlePrevTurn}
                  title="Предыдущий ход"
                  className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition shrink-0"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextTurn}
                  title="Следующий ход (клавиша Пробел)"
                  className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <SkipForward className="w-4 h-4 shrink-0" />
                  <span>След. ход</span>
                  <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">Space</span>
                </button>
              </div>
            </div>

            {/* Who's active & On Deck */}
            {currentActive && (
              <div className="px-3 sm:px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between sm:justify-start gap-3 text-xs w-full md:w-auto">
                <div className="truncate">
                  <span className="text-amber-400 font-bold block text-[10px]">СЕЙЧАС ХОДИТ:</span>
                  <span className="text-white font-bold text-xs sm:text-sm truncate block">{currentActive.name}</span>
                </div>
                {nextOnDeck && (
                  <div className="border-l border-slate-800 pl-3 truncate text-right sm:text-left">
                    <span className="text-slate-500 font-semibold block text-[10px]">СЛЕДУЮЩИЙ:</span>
                    <span className="text-slate-300 font-medium truncate block">{nextOnDeck.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional Combat Bar Tools */}
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
              <button
                onClick={() => setShowDefeated(!showDefeated)}
                className={`flex-1 md:flex-initial py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  showDefeated
                    ? 'border-slate-700 bg-slate-800 text-slate-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
                }`}
                title={showDefeated ? 'Скрыть поверженных' : 'Показать поверженных'}
              >
                {showDefeated ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Поверженные</span>
              </button>

              <button
                onClick={() => setShowLog(!showLog)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  showLog
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
                title="Лог боя"
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Лог</span>
              </button>

              <button
                onClick={handleSortByInitiative}
                className="py-1.5 px-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                title="Пересортировать всех участников по инициативе (текущий ход сохранится)"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Сортировать</span>
              </button>

              <button
                onClick={handleResetCombat}
                title="Сбросить бой к фазе подготовки"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Combatants List (Ordered by Turn / Initiative) */}
          <div className="space-y-2.5">
            {combatants.map((combatant, index) => {
              if (!showDefeated && combatant.isDefeated) return null;

              const isActive = index === combatState.currentTurnIndex;
              const isNext = index === (combatState.currentTurnIndex + 1) % combatants.length;
              const hpPercent = Math.max(
                0,
                Math.min(100, (combatant.hp.current / combatant.hp.max) * 100)
              );

              const getHpColor = () => {
                if (combatant.isDefeated) return 'bg-slate-700';
                if (hpPercent > 50) return 'bg-emerald-500';
                if (hpPercent > 20) return 'bg-amber-500';
                return 'bg-red-500';
              };

              return (
                <div
                  key={combatant.id}
                  className={`relative rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/10'
                      : combatant.isDefeated
                      ? 'bg-slate-950/60 border-slate-900 opacity-60'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  {/* Current Turn Badge */}
                  {isActive && (
                    <div className="absolute -top-3 left-6 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow">
                      ХОДИТ СЕЙЧАС
                    </div>
                  )}

                  <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Initiative, Name, AC, Badges */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                      {/* Initiative Badge with Up/Down buttons */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="text-slate-600 hover:text-slate-300 disabled:opacity-0 p-0.5"
                          title="Поднять выше в порядке"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        {inlineEditInitId === combatant.id ? (
                          <input
                            type="number"
                            autoFocus
                            value={inlineEditInitVal}
                            onChange={(e) => setInlineEditInitVal(parseInt(e.target.value) || 0)}
                            onBlur={() => {
                              handleSaveCombatantEdit(combatant.id, { initiative: inlineEditInitVal });
                              setInlineEditInitId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCombatantEdit(combatant.id, { initiative: inlineEditInitVal });
                                setInlineEditInitId(null);
                              } else if (e.key === 'Escape') {
                                setInlineEditInitId(null);
                              }
                            }}
                            className="w-9 h-8 sm:w-10 sm:h-9 bg-slate-900 border border-amber-500 rounded-xl text-center font-bold text-xs sm:text-sm text-white focus:outline-none shadow"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setInlineEditInitId(combatant.id);
                              setInlineEditInitVal(combatant.initiative);
                            }}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shadow transition hover:scale-105 ${
                              isActive
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 hover:border-amber-500/50'
                            }`}
                            title="Нажмите, чтобы быстро изменить инициативу (текущий ход сохранится)"
                          >
                            {combatant.initiative}
                          </button>
                        )}
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === combatants.length - 1}
                          className="text-slate-600 hover:text-slate-300 disabled:opacity-0 p-0.5"
                          title="Опустить ниже в порядке"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Name & Indicators */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className={`text-sm sm:text-base font-bold transition truncate ${
                              isActive
                                ? 'text-amber-300 font-rpg text-base sm:text-lg'
                                : combatant.isDefeated
                                ? 'text-slate-500 line-through'
                                : 'text-white'
                            }`}
                          >
                            {combatant.name}
                          </h4>
                          {isNext && (
                            <span className="text-[9px] sm:text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-semibold">
                              След.
                            </span>
                          )}
                          {combatant.isDelayed && (
                            <span className="text-[9px] sm:text-[10px] bg-purple-950 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                              Задержан
                            </span>
                          )}
                          {combatant.isDefeated && (
                            <span className="text-[9px] sm:text-[10px] bg-red-950 border border-red-800 text-red-400 px-1.5 py-0.2 rounded font-semibold">
                              Повержен
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold uppercase border ${
                              combatant.type === 'player'
                                ? 'border-blue-800/80 bg-blue-950/60 text-blue-300'
                                : combatant.type === 'enemy'
                                ? 'border-red-800/80 bg-red-950/60 text-red-300'
                                : 'border-emerald-800/80 bg-emerald-950/60 text-emerald-300'
                            }`}
                          >
                            {combatant.type === 'player'
                              ? 'Герой'
                              : combatant.type === 'enemy'
                              ? 'Враг'
                              : 'Союзник'}
                          </span>

                          <span className="flex items-center gap-1 font-semibold text-slate-300 text-xs">
                            <Shield className="w-3 h-3 text-blue-400" /> КД {combatant.armorClass}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Health (HP) bar & Quick Modifiers */}
                    <div className="w-full md:flex-1 md:max-w-sm">
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Heart className="w-3.5 h-3.5 text-rose-400" /> HP:
                        </span>
                        <button
                          onClick={() => setHpModalCombatant(combatant)}
                          className="font-bold text-xs sm:text-sm text-white hover:text-amber-400 transition"
                          title="Изменить здоровье"
                        >
                          {combatant.hp.current} / {combatant.hp.max}
                          {combatant.hp.temp > 0 && (
                            <span className="text-cyan-400 ml-1">+{combatant.hp.temp} темп</span>
                          )}
                        </button>
                      </div>

                      {/* Visual Bar */}
                      <div
                        onClick={() => setHpModalCombatant(combatant)}
                        className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 cursor-pointer"
                        title="Кликните для ввода урона или лечения"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${getHpColor()}`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>

                      {/* Quick inline buttons */}
                      <div className="grid grid-cols-4 sm:flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => handleQuickInlineDamage(combatant, 5)}
                          className="py-1 px-2 bg-slate-950 hover:bg-red-950 border border-slate-800 text-red-400 rounded-lg text-xs font-bold text-center active:scale-95 transition"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleQuickInlineDamage(combatant, 1)}
                          className="py-1 px-2 bg-slate-950 hover:bg-red-950 border border-slate-800 text-red-400 rounded-lg text-xs font-bold text-center active:scale-95 transition"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickInlineHeal(combatant, 5)}
                          className="py-1 px-2 bg-slate-950 hover:bg-emerald-950 border border-slate-800 text-emerald-400 rounded-lg text-xs font-bold text-center active:scale-95 transition"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => setHpModalCombatant(combatant)}
                          className="py-1 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold text-center whitespace-nowrap active:scale-95 transition"
                        >
                          Урон/Хил
                        </button>
                      </div>
                    </div>

                    {/* Right: Conditions, Toggles, Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      {/* Active Condition badges */}
                      <div className="flex flex-wrap gap-1 items-center flex-1 md:flex-initial">
                        {combatant.conditions.map((cond) => (
                          <span
                            key={cond.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] border font-medium"
                            style={{
                              borderColor: `${cond.color}60`,
                              backgroundColor: `${cond.color}20`,
                              color: cond.color || '#cbd5e1',
                            }}
                          >
                            <span>{cond.name}</span>
                            {cond.roundsRemaining !== null && (
                              <span className="font-bold text-[9px] bg-black/40 px-1 rounded">
                                {cond.roundsRemaining}р
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveCondition(combatant.id, cond.id)}
                              className="hover:text-red-400 ml-0.5 font-bold"
                              title="Снять статус"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        <button
                          onClick={() => setConditionModalCombatant(combatant)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3 text-amber-400" />
                          <span>Статус</span>
                        </button>
                      </div>

                      {/* Defeated & Delayed toggles */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            handleUpdateCombatant(combatant.id, { isDelayed: !combatant.isDelayed })
                          }
                          className={`p-2 rounded-lg text-xs transition ${
                            combatant.isDelayed
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'text-slate-500 hover:text-slate-300 bg-slate-900 sm:bg-transparent'
                          }`}
                          title="Задержать ход"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleUpdateCombatant(combatant.id, { isDefeated: !combatant.isDefeated })
                          }
                          className={`p-2 rounded-lg text-xs transition ${
                            combatant.isDefeated
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'text-slate-500 hover:text-slate-300 bg-slate-900 sm:bg-transparent'
                          }`}
                          title={combatant.isDefeated ? 'Воскресить / В сознании' : 'Отметить как повержен'}
                        >
                          💀
                        </button>

                        {combatant.notes && (
                          <button
                            onClick={() =>
                              setExpandedNotesId(
                                expandedNotesId === combatant.id ? null : combatant.id
                              )
                            }
                            className={`p-2 rounded-lg text-xs transition ${
                              expandedNotesId === combatant.id
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'text-slate-500 hover:text-slate-300 bg-slate-900 sm:bg-transparent'
                            }`}
                            title="Заметки"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setEditingCombatant(combatant)}
                          className="p-2 text-slate-500 hover:text-amber-400 rounded-lg transition bg-slate-900 sm:bg-transparent"
                          title="Редактировать участника (имя, инициатива, HP, КД, заметки)"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleRemoveCombatant(combatant.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition bg-slate-900 sm:bg-transparent"
                          title="Удалить из боя"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded notes/attacks */}
                  {expandedNotesId === combatant.id && combatant.notes && (
                    <div className="px-5 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 rounded-b-2xl text-xs text-slate-300 font-mono whitespace-pre-line">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Способности и заметки:
                      </span>
                      {combatant.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Combat Log Drawer */}
          {showLog && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scroll className="w-4 h-4 text-amber-400" /> Журнал боевых событий
                </span>
                <button
                  onClick={() =>
                    combatState && onUpdateCombatState({ ...combatState, log: [] })
                  }
                  className="text-[11px] text-slate-500 hover:text-red-400"
                >
                  Очистить журнал
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {combatState.log.length === 0 ? (
                  <div className="text-slate-500 text-center py-4">Журнал пока пуст</div>
                ) : (
                  combatState.log.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60 flex items-start gap-2"
                    >
                      <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">
                        [{entry.timestamp}]
                      </span>
                      <span
                        className={
                          entry.type === 'round'
                            ? 'text-amber-400 font-bold'
                            : entry.type === 'damage'
                            ? 'text-red-300'
                            : entry.type === 'heal'
                            ? 'text-emerald-300'
                            : entry.type === 'condition'
                            ? 'text-purple-300'
                            : 'text-slate-300'
                        }
                      >
                        {entry.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <HpAdjustModal
        isOpen={hpModalCombatant !== null}
        onClose={() => setHpModalCombatant(null)}
        combatant={
          hpModalCombatant
            ? combatState?.combatants.find((c) => c.id === hpModalCombatant.id) || hpModalCombatant
            : null
        }
        onApplyHpChange={handleApplyHpChange}
      />

      <ConditionPickerModal
        isOpen={conditionModalCombatant !== null}
        onClose={() => setConditionModalCombatant(null)}
        combatant={
          conditionModalCombatant
            ? combatState?.combatants.find((c) => c.id === conditionModalCombatant.id) || conditionModalCombatant
            : null
        }
        onAddCondition={handleAddCondition}
      />

      <AddCombatantModal
        isOpen={isAddCombatantOpen}
        onClose={() => setIsAddCombatantOpen(false)}
        templates={templates}
        party={party}
        diceSystem={combatState?.diceSystem || 'd20'}
        onAddCombatants={(newOnes) => {
          const state = ensureCombatState();
          const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
            [...state.combatants, ...newOnes],
            state.currentTurnIndex,
            state.isActive
          );
          onUpdateCombatState({
            ...state,
            combatants: sortedCombatants,
            currentTurnIndex: nextTurnIndex,
          });
        }}
      />

      <EditCombatantModal
        isOpen={editingCombatant !== null}
        onClose={() => setEditingCombatant(null)}
        combatant={
          editingCombatant
            ? combatState?.combatants.find((c) => c.id === editingCombatant.id) || editingCombatant
            : null
        }
        diceSystem={combatState?.diceSystem || 'd20'}
        onSave={handleSaveCombatantEdit}
      />

      <PartySelectionModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        party={party}
        combatants={combatState?.combatants || []}
        onAddPartyMembers={handleAddPartyMembers}
      />

      {/* Quick Load Encounter Modal */}
      {isLoadEncounterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-rpg">
                  Выберите энкаунтер для добавления
                </h3>
              </div>
              <button
                onClick={() => setIsLoadEncounterOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
                encounters.map((enc) => (
                  <button
                    key={enc.id}
                    type="button"
                    onClick={() => handleLoadEncounter(enc)}
                    className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white group-hover:text-amber-300 text-sm">
                        {enc.title}
                      </span>
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        + Добавить
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {enc.monsters.map((m) => `${m.name} ×${m.count}`).join(', ')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
