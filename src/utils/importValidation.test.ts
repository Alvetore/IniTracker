import { describe, expect, it } from 'vitest';
import { validateImportData } from './importValidation';

const validPayload = {
  templates: [
    {
      id: 'tpl-1',
      name: 'Гоблин',
      type: 'enemy',
      maxHp: 7,
      armorClass: 15,
      initiativeModifier: 2,
      tags: ['Гоблиноид'],
      notes: 'Скимитар',
      sourceUrl: 'https://next.dnd.su/bestiary/1-goblin/',
      createdAt: 1,
    },
  ],
  party: [
    {
      id: 'hero-1',
      name: 'Герой',
      maxHp: 20,
      currentHp: 12,
      armorClass: 16,
      initiativeModifier: 1,
    },
  ],
  encounters: [
    {
      id: 'enc-1',
      title: 'Засада',
      tags: ['Лес'],
      createdAt: 1,
      updatedAt: 2,
      monsters: [
        {
          id: 'em-1',
          name: 'Гоблин',
          type: 'enemy',
          count: 2,
          maxHp: 7,
          armorClass: 15,
          initiativeModifier: 2,
        },
      ],
    },
  ],
  activeCombat: {
    isActive: true,
    round: 1,
    currentTurnIndex: 0,
    diceSystem: 'd20',
    combatants: [
      {
        id: 'c-1',
        name: 'Гоблин',
        type: 'enemy',
        initiative: 15,
        initiativeModifier: 2,
        hp: { current: 7, max: 7, temp: 0 },
        armorClass: 15,
        conditions: [],
        notes: '',
        isDefeated: false,
        isDelayed: false,
      },
    ],
    log: [],
    turnHistory: [] as Array<{
      fromCombatantId?: string;
      toCombatantId: string;
      fromRound: number;
      toRound: number;
      conditionsBefore: unknown[];
      delayedClearedId?: string;
    }>,
  },
};

describe('validateImportData', () => {
  it('accepts a complete valid payload', () => {
    expect(validateImportData(validPayload)).toEqual([]);
  });

  it('accepts an empty array and an explicitly empty combat', () => {
    expect(validateImportData({ templates: [], activeCombat: null })).toEqual([]);
  });

  it('rejects a template without tags and notes', () => {
    const errors = validateImportData({ templates: [{}] });
    expect(errors).toContain('templates[0].tags: ожидался массив строк');
    expect(errors).toContain('templates[0].notes: ожидалась строка');
  });

  it('rejects a malformed combatant', () => {
    const payload = structuredClone(validPayload);
    payload.activeCombat.combatants[0].hp = { current: 5, max: 0, temp: 0 } as never;
    const errors = validateImportData(payload);
    expect(errors).toContain('activeCombat.combatants[0].hp.max: ожидалось положительное число');
  });

  it('rejects a non-http source URL', () => {
    const payload = structuredClone(validPayload);
    payload.templates[0].sourceUrl = 'javascript:alert(1)';
    const errors = validateImportData(payload);
    expect(errors).toContain('templates[0].sourceUrl: ожидалась http(s)-ссылка');
  });

  it('validates persisted turn history', () => {
    const valid = structuredClone(validPayload);
    valid.activeCombat.turnHistory = [
      {
        fromCombatantId: 'c-1',
        toCombatantId: 'c-1',
        fromRound: 1,
        toRound: 2,
        conditionsBefore: [],
      },
    ];
    expect(validateImportData(valid)).toEqual([]);

    const invalid = structuredClone(valid);
    invalid.activeCombat.turnHistory = [
      {
        fromCombatantId: 'c-1',
        toCombatantId: 'c-1',
        fromRound: 1,
        toRound: 2,
        conditionsBefore: 'not-an-array' as never,
      },
    ];
    expect(validateImportData(invalid)).toContain(
      'activeCombat.turnHistory[0].conditionsBefore: ожидался массив'
    );
  });

  it('accepts custom condition library entries with icons and durations', () => {
    expect(
      validateImportData({
        customConditions: [
          {
            id: 'saved-1',
            name: 'Горит',
            color: '#ef4444',
            icon: '🔥',
            defaultDuration: 2,
            notes: '1d4 огня',
            createdAt: 1,
          },
        ],
      })
    ).toEqual([]);

    expect(
      validateImportData({
        customConditions: [{ id: 'saved-1', name: 'Горит', createdAt: 1 }],
      })
    ).toContain('customConditions[0].color: ожидалась строка');
  });

  it('validates the notes visibility flag', () => {
    expect(
      validateImportData({ templates: [{ notesVisibleByDefault: true }] })
    ).not.toContain('templates[0].notesVisibleByDefault: ожидалось boolean');

    expect(
      validateImportData({ templates: [{ notesVisibleByDefault: 'yes' }] })
    ).toContain('templates[0].notesVisibleByDefault: ожидалось boolean');
  });

  it('rejects a non-object root', () => {
    expect(validateImportData([])).toEqual(['Корень файла должен быть объектом']);
  });
});
