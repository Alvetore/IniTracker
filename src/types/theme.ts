export type ThemeId = 'fantasy' | 'grimdark' | 'cyberpunk' | 'eldritch' | 'parchment';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  genre: string;
  description: string;
  badge: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  isDark: boolean;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'fantasy',
    name: 'Золото Дракона',
    genre: 'Классическое Фэнтези',
    description: 'Тёплые янтарные акценты, благородный сланцевый фон. Идеально для D&D 5e и Pathfinder.',
    badge: '🐉 Фэнтези',
    accentColor: '#f59e0b',
    bgColor: '#020617',
    borderColor: '#334155',
    isDark: true,
  },
  {
    id: 'grimdark',
    name: 'Кровь и Пепел',
    genre: 'Тёмное Фэнтези / Гримдарк',
    description: 'Угольно-чёрный фон, рубиново-кровавые акценты. Отлично для Warhammer, Mörk Borg, Ведьмака.',
    badge: '🩸 Гримдарк',
    accentColor: '#e11d48',
    bgColor: '#0c0709',
    borderColor: '#4c1d24',
    isDark: true,
  },
  {
    id: 'cyberpunk',
    name: 'Кибер-Неон',
    genre: 'Киберпанк / Sci-Fi',
    description: 'Неоновый циан и фуксия на ультратёмном синем фоне. Для Cyberpunk RED, Shadowrun, Mothership.',
    badge: '⚡ Sci-Fi',
    accentColor: '#06b6d4',
    bgColor: '#030712',
    borderColor: '#1e293b',
    isDark: true,
  },
  {
    id: 'eldritch',
    name: 'Зов Ктулху',
    genre: 'Мистика / Лавкрафтовский ужас',
    description: 'Зловещая глубина океана и потустороннее изумрудное свечение. Для Call of Cthulhu, Delta Green.',
    badge: '🐙 Мистика',
    accentColor: '#10b981',
    bgColor: '#040d09',
    borderColor: '#064e3b',
    isDark: true,
  },
  {
    id: 'parchment',
    name: 'Старинный Пергамент',
    genre: 'Светлая тема / Манускрипт',
    description: 'Эстетика потёртого листа пергамента и тёмных чернил. Комфортна при ярком свете.',
    badge: '📜 Пергамент',
    accentColor: '#b45309',
    bgColor: '#f5efe6',
    borderColor: '#d6c7b2',
    isDark: false,
  },
];
