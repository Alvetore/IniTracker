import React from 'react';
import {
  Swords,
  Scroll,
  Skull,
  Users,
  Dices,
  Save,
  Flame,
  Palette,
} from 'lucide-react';

export type ActiveTab = 'combat' | 'encounters' | 'templates' | 'party';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isCombatActive: boolean;
  encounterCount: number;
  templateCount: number;
  partyCount: number;
  onOpenDiceRoller: () => void;
  onOpenDataModal: () => void;
  onOpenThemeModal: () => void;
  currentThemeBadge?: string;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  isCombatActive,
  encounterCount,
  templateCount,
  partyCount,
  onOpenDiceRoller,
  onOpenDataModal,
  onOpenThemeModal,
  currentThemeBadge,
}) => {
  const tabs = [
    {
      id: 'combat' as ActiveTab,
      label: 'Бой',
      icon: Swords,
      badge: isCombatActive ? 'АКТИВЕН' : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      id: 'encounters' as ActiveTab,
      label: 'Энкаунтеры',
      icon: Scroll,
      badge: String(encounterCount),
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'templates' as ActiveTab,
      label: 'Бестиарий',
      icon: Skull,
      badge: String(templateCount),
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'party' as ActiveTab,
      label: 'Партия',
      icon: Users,
      badge: String(partyCount),
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white font-rpg tracking-wide flex items-center gap-2">
                Initiative Tracker
                <span className="text-[10px] font-sans font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded hidden sm:inline-block">
                  TTRPG
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                Универсальный трекер инициативы и энкаунтеров
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 sm:gap-2 relative ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                        isActive
                          ? 'bg-slate-950 text-amber-300 border-slate-800'
                          : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Fast Utility Actions: Theme, Dice & Data */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenThemeModal}
              className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
              title="Выбрать визуальную тему оформления"
            >
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">{currentThemeBadge || 'Тема'}</span>
            </button>

            <button
              onClick={onOpenDiceRoller}
              className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
              title="Открыть дайс-роллер"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden md:inline">Кубики</span>
            </button>

            <button
              onClick={onOpenDataModal}
              className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
              title="Экспорт, импорт и резервная копия"
            >
              <Save className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Бэкап</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
