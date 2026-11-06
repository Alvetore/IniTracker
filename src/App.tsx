import React, { lazy, Suspense, useState, useEffect } from 'react';
import {
  CreatureTemplate,
  PartyMember,
  Encounter,
  ActiveCombatState,
  Combatant,
} from './types';
import { Storage } from './utils/storage';
import { rollInitiativeForSystem } from './utils/dice';
import { Header, ActiveTab } from './components/common/Header';
import { DiceRollerModal } from './components/common/DiceRollerModal';
import { DataManagementModal } from './components/common/DataManagementModal';
import { ThemePickerModal } from './components/common/ThemePickerModal';
import { AddToCombatOptions } from './components/combat/AddToCombatModal';
import { CatalogMonster } from './types/bestiary';
import { convertCatalogMonsterToTemplate } from './utils/catalogToTemplate';
import { sortCombatantsPreservingTurn } from './utils/combatUtils';
import { syncPartyHpWithCombat } from './utils/partySync';
import { THEMES, ThemeId } from './types/theme';

const TemplatesView = lazy(() =>
  import('./components/templates/TemplatesView').then((module) => ({ default: module.TemplatesView }))
);
const PartyView = lazy(() =>
  import('./components/party/PartyView').then((module) => ({ default: module.PartyView }))
);
const EncountersView = lazy(() =>
  import('./components/encounters/EncountersView').then((module) => ({
    default: module.EncountersView,
  }))
);
const CombatTrackerView = lazy(() =>
  import('./components/combat/CombatTrackerView').then((module) => ({
    default: module.CombatTrackerView,
  }))
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('combat');
  const [templates, setTemplates] = useState<CreatureTemplate[]>([]);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [combatState, setCombatState] = useState<ActiveCombatState | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('ttrpg_theme_v1') as ThemeId) || 'fantasy';
  });
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Global modals
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'parchment') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
    localStorage.setItem('ttrpg_theme_v1', currentTheme);
  }, [currentTheme]);

  // Load initial data
  const loadAllData = () => {
    setTemplates(Storage.getTemplates());
    setParty(Storage.getParty());
    setEncounters(Storage.getEncounters());
    setCombatState(Storage.getCombatState());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Keep multiple open tabs in sync. The storage event is only fired in other tabs.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'ttrpg_theme_v1' && event.newValue) {
        if (THEMES.some((theme) => theme.id === event.newValue)) {
          setCurrentTheme((previous) =>
            previous === event.newValue ? previous : (event.newValue as ThemeId)
          );
        }
        return;
      }

      if (!event.key || !event.key.startsWith('dnd_init_')) return;

      setTemplates(Storage.getTemplates());
      setParty(Storage.getParty());
      setEncounters(Storage.getEncounters());
      setCombatState(Storage.getCombatState());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync to Storage on changes
  const handleSaveTemplates = (newTemplates: CreatureTemplate[]) => {
    setTemplates(newTemplates);
    Storage.saveTemplates(newTemplates);
  };

  const handleSaveParty = (newParty: PartyMember[]) => {
    setParty(newParty);
    Storage.saveParty(newParty);
  };

  const handleSaveEncounters = (newEncounters: Encounter[]) => {
    setEncounters(newEncounters);
    Storage.saveEncounters(newEncounters);
  };

  const handleUpdateCombatState = (newState: ActiveCombatState | null) => {
    // Keep the journal bounded: every HP click rewrites the whole combat state to localStorage.
    const normalizedState = newState
      ? { ...newState, log: newState.log.slice(0, 200) }
      : null;
    setCombatState(normalizedState);
    Storage.saveCombatState(normalizedState);

    // A party member's card follows the HP of its combatant instances.
    if (normalizedState) {
      setParty((currentParty) => {
        const updatedParty = syncPartyHpWithCombat(currentParty, normalizedState.combatants);
        if (!updatedParty) return currentParty;
        Storage.saveParty(updatedParty);
        return updatedParty;
      });
    }
  };

  // --- Templates Actions ---
  const handleSaveSingleTemplate = (tpl: CreatureTemplate) => {
    const existingIndex = templates.findIndex((t) => t.id === tpl.id);
    let updated: CreatureTemplate[];
    if (existingIndex !== -1) {
      updated = templates.map((t) => (t.id === tpl.id ? tpl : t));
    } else {
      updated = [tpl, ...templates];
    }
    handleSaveTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    handleSaveTemplates(templates.filter((t) => t.id !== id));
  };

  const handleDuplicateTemplate = (tpl: CreatureTemplate) => {
    const duplicated: CreatureTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${tpl.name} (Копия)`,
      tags: [...tpl.tags],
      createdAt: Date.now(),
    };
    handleSaveTemplates([duplicated, ...templates]);
  };

  // --- Party Actions ---
  const handleSavePartyMember = (member: PartyMember) => {
    const existingIndex = party.findIndex((p) => p.id === member.id);
    let updated: PartyMember[];
    if (existingIndex !== -1) {
      updated = party.map((p) => (p.id === member.id ? member : p));
    } else {
      updated = [...party, member];
    }
    handleSaveParty(updated);
  };

  const handleDeletePartyMember = (id: string) => {
    handleSaveParty(party.filter((p) => p.id !== id));
  };

  const handleHealAllParty = () => {
    const healed = party.map((p) => ({ ...p, currentHp: p.maxHp }));
    handleSaveParty(healed);

    if (!combatState) return;

    const healedById = new Map(healed.map((member) => [member.id, member]));
    let changed = false;
    const updatedCombatants = combatState.combatants.map((combatant) => {
      if (!combatant.sourcePartyMemberId) return combatant;
      const member = healedById.get(combatant.sourcePartyMemberId);
      if (!member) return combatant;
      if (combatant.hp.current === member.maxHp && combatant.hp.temp === 0 && !combatant.isDefeated) {
        return combatant;
      }
      changed = true;
      return {
        ...combatant,
        hp: { ...combatant.hp, current: member.maxHp, temp: 0 },
        isDefeated: false,
      };
    });

    if (!changed) return;

    handleUpdateCombatState({
      ...combatState,
      combatants: updatedCombatants,
      log: [
        {
          id: `heal-all-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          round: combatState.round,
          message: 'Долгий отдых: партия восстановила здоровье',
          type: 'heal',
        },
        ...combatState.log,
      ],
    });
  };

  // --- Encounters Actions ---
  const handleSaveSingleEncounter = (enc: Encounter) => {
    const existingIndex = encounters.findIndex((e) => e.id === enc.id);
    let updated: Encounter[];
    if (existingIndex !== -1) {
      updated = encounters.map((e) => (e.id === enc.id ? enc : e));
    } else {
      updated = [enc, ...encounters];
    }
    handleSaveEncounters(updated);
  };

  const handleDeleteEncounter = (id: string) => {
    handleSaveEncounters(encounters.filter((e) => e.id !== id));
  };

  const handleDuplicateEncounter = (enc: Encounter) => {
    const duplicated: Encounter = {
      ...enc,
      id: `enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${enc.title} (Копия)`,
      tags: [...enc.tags],
      monsters: enc.monsters.map((monster) => ({ ...monster })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    handleSaveEncounters([duplicated, ...encounters]);
  };

  // Launch Encounter: adds Party + Monsters from encounter, switches to Combat tab
  const handleStartCombatFromEncounter = (enc: Encounter) => {
    if (combatState && combatState.combatants.length > 0) {
      const warning = combatState.isActive
        ? 'Сейчас идёт активный бой. Запуск нового энкаунтера заменит текущий бой (HP, статусы и журнал будут потеряны). Продолжить?'
        : 'В подготовке уже есть участники. Запуск энкаунтера заменит их. Продолжить?';
      if (!window.confirm(warning)) return;
    }

    const combatants: Combatant[] = [];
    const diceSystem = combatState?.diceSystem || 'd20';

    // 1. Add Party members if available
    party.forEach((hero) => {
      combatants.push({
        id: `hero-${hero.id}-${Date.now()}`,
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

    // 2. Add Monsters from Encounter
    enc.monsters.forEach((m) => {
      for (let i = 1; i <= m.count; i++) {
        const name = m.count > 1 ? `${m.name} ${i}` : m.name;
        const { total: initVal } = rollInitiativeForSystem(diceSystem, m.initiativeModifier);

        combatants.push({
          id: `enc-m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
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

    const newCombatState: ActiveCombatState = {
      isActive: false, // Pre-combat phase so GM can review initiative rolls
      round: 1,
      currentTurnIndex: 0,
      combatants,
      log: [
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          round: 1,
          message: `Подготовлен энкаунтер: "${enc.title}". Партия (${party.length}) + Противники (${enc.monsters.reduce((acc, m) => acc + m.count, 0)})`,
          type: 'system',
        },
      ],
      diceSystem,
      encounterTitle: enc.title,
      encounterId: enc.id,
      turnHistory: [],
    };

    handleUpdateCombatState(newCombatState);
    setActiveTab('combat');
  };

  // Add Encounter as Reinforcements to ongoing combat
  const handleAddAsReinforcement = (enc: Encounter) => {
    if (!combatState) return;

    const newCombatants: Combatant[] = [];
    enc.monsters.forEach((m) => {
      for (let i = 1; i <= m.count; i++) {
        const name = m.count > 1 ? `${m.name} ${i}` : m.name;
        const { total: initVal } = rollInitiativeForSystem(combatState.diceSystem, m.initiativeModifier);

        newCombatants.push({
          id: `reinf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
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
      [...combatState.combatants, ...newCombatants],
      combatState.currentTurnIndex,
      combatState.isActive
    );

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: combatState.round,
        message: `Подкрепление: прибыл энкаунтер "${enc.title}" (+${newCombatants.length} существ)!`,
        type: 'system' as const,
      },
      ...combatState.log,
    ];

    handleUpdateCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });
    setActiveTab('combat');
  };

  const combatantPartyIds = new Set(
    (combatState?.combatants || []).map((c) => c.sourcePartyMemberId).filter(Boolean) as string[]
  );

  const handleAddHeroToCombat = (hero: PartyMember) => {
    const state = combatState || {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: [],
      diceSystem: 'd20',
    };

    const newCombatant: Combatant = {
      id: `hero-${hero.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: hero.name,
      type: 'player',
      initiative:
        state.isActive && state.diceSystem !== 'manual'
          ? rollInitiativeForSystem(state.diceSystem, hero.initiativeModifier).total
          : hero.initiativeModifier,
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
    };

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      [...state.combatants, newCombatant],
      state.currentTurnIndex,
      state.isActive
    );

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: state.round,
        message: `Герой ${hero.name} добавлен в бой из вкладки партии`,
        type: 'system' as const,
      },
      ...state.log,
    ];

    handleUpdateCombatState({
      ...state,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });
    setActiveTab('combat');
  };

  const handleAddCreatureToCombatWithOptions = (options: AddToCombatOptions) => {
    const diceSystem = combatState?.diceSystem || 'd20';
    const state = combatState || {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: [],
      diceSystem,
    };

    const tpl: CreatureTemplate =
      'stats' in options.creature
        ? convertCatalogMonsterToTemplate(options.creature as CatalogMonster)
        : (options.creature as CreatureTemplate);

    const count = Math.min(50, Math.max(1, options.count));
    const newCombatants: Combatant[] = [];
    const baseName = tpl.name.trim();
    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingNamePattern = new RegExp(`^${escapedBaseName}(?:\\s+(\\d+))?$`, 'i');
    let maxExistingNumber = 0;
    state.combatants.forEach((combatant) => {
      const match = combatant.name.trim().match(existingNamePattern);
      if (!match) return;
      const number = match[1] ? parseInt(match[1], 10) : 1;
      if (Number.isFinite(number)) maxExistingNumber = Math.max(maxExistingNumber, number);
    });

    // Calculate group roll in advance if in auto mode
    let groupRollVal: number;
    if (options.initiativeMode === 'manual') {
      groupRollVal = options.manualInitiative;
    } else if (typeof options.previewInitiative === 'number') {
      groupRollVal = options.previewInitiative;
    } else {
      const { total } = rollInitiativeForSystem(diceSystem, tpl.initiativeModifier);
      groupRollVal = total;
    }

    for (let i = 1; i <= count; i++) {
      const num = maxExistingNumber + i;
      const name = maxExistingNumber > 0 || count > 1 ? `${baseName} ${num}` : baseName;

      let initVal: number;
      if (options.initiativeMode === 'manual') {
        initVal = options.manualInitiative;
      } else if (options.groupInitiative) {
        initVal = groupRollVal;
      } else {
        const { total } = rollInitiativeForSystem(diceSystem, tpl.initiativeModifier);
        initVal = total;
      }

      newCombatants.push({
        id: `combatant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
        name,
        type: tpl.type,
        initiative: initVal,
        initiativeModifier: tpl.initiativeModifier,
        hp: {
          current: tpl.maxHp,
          max: tpl.maxHp,
          temp: 0,
        },
        armorClass:
          typeof tpl.armorClass === 'number'
            ? tpl.armorClass
            : parseInt(String(tpl.armorClass)) || 10,
        conditions: [],
        notes: tpl.notes || '',
        isDefeated: false,
        isDelayed: false,
        templateId: tpl.id,
      });
    }

    const { sortedCombatants, nextTurnIndex } = sortCombatantsPreservingTurn(
      [...state.combatants, ...newCombatants],
      state.currentTurnIndex,
      state.isActive
    );

    const modeText =
      options.initiativeMode === 'manual'
        ? `ручная иниц. ${options.manualInitiative}`
        : `авто-бросок (${options.groupInitiative ? 'общий' : 'раздельный'})`;

    const newLog = [
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: state.round,
        message: `Существо "${tpl.name}" добавлено в бой из бестиария (+${count}, ${modeText})`,
        type: 'system' as const,
      },
      ...state.log,
    ];

    handleUpdateCombatState({
      ...state,
      combatants: sortedCombatants,
      currentTurnIndex: nextTurnIndex,
      log: newLog,
    });

    if (options.navigateNow) {
      setActiveTab('combat');
    }
  };

  const handleAddCreatureToCombat = (tpl: CreatureTemplate, count: number = 1) => {
    handleAddCreatureToCombatWithOptions({
      creature: tpl,
      count,
      initiativeMode: 'auto',
      groupInitiative: true,
      manualInitiative: 10,
      navigateNow: false,
    });
  };

  return (
    <div
      data-theme={currentTheme}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300"
    >
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCombatActive={combatState?.isActive || false}
        encounterCount={encounters.length}
        templateCount={templates.length}
        partyCount={party.length}
        onOpenDiceRoller={() => setIsDiceOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenThemeModal={() => setIsThemeOpen(true)}
        currentThemeBadge={THEMES.find((t) => t.id === currentTheme)?.badge}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              Загрузка раздела…
            </div>
          }
        >
          {activeTab === 'combat' && (
            <CombatTrackerView
              combatState={combatState}
              onUpdateCombatState={handleUpdateCombatState}
              party={party}
              templates={templates}
              encounters={encounters}
            />
          )}

          {activeTab === 'encounters' && (
            <EncountersView
              encounters={encounters}
              templates={templates}
              isCombatActive={combatState?.isActive || false}
              onSaveEncounter={handleSaveSingleEncounter}
              onDeleteEncounter={handleDeleteEncounter}
              onDuplicateEncounter={handleDuplicateEncounter}
              onStartCombat={handleStartCombatFromEncounter}
              onAddAsReinforcement={handleAddAsReinforcement}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView
              templates={templates}
              onSaveTemplate={handleSaveSingleTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onAddToCombat={handleAddCreatureToCombat}
              onAddToCombatWithOptions={handleAddCreatureToCombatWithOptions}
              onNavigateToCombat={() => setActiveTab('combat')}
              diceSystem={combatState?.diceSystem || 'd20'}
            />
          )}

          {activeTab === 'party' && (
            <PartyView
              party={party}
              onSaveMember={handleSavePartyMember}
              onDeleteMember={handleDeletePartyMember}
              onHealAll={handleHealAllParty}
              onAddToCombat={handleAddHeroToCombat}
              combatantPartyIds={combatantPartyIds}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          НРИ Трекер Инициативы & Энкаунтеров • Развернуто для GitHub Pages • Все данные сохраняются локально в вашем браузере
        </p>
      </footer>

      {/* Global Modals */}
      <ThemePickerModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      <DiceRollerModal
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataReloaded={loadAllData}
      />
    </div>
  );
};

export default App;
