const CREATURE_TYPES = ['enemy', 'player', 'ally', 'neutral', 'hazard'];
const DICE_SYSTEMS = ['d20', 'd10', '2d6', '3d6', 'manual'];
const LOG_TYPES = ['damage', 'heal', 'turn', 'round', 'condition', 'system', 'roll'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'deadly', 'custom'];
const EDITIONS = ['5e14', '5e24', 'custom'];

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isArmorClass(value: unknown): value is string | number {
  return isString(value) || isFiniteNumber(value);
}

function pushError(errors: string[], path: string, message: string): void {
  errors.push(`${path}: ${message}`);
}

function requireString(value: unknown, path: string, errors: string[]): void {
  if (!isString(value)) pushError(errors, path, 'ожидалась строка');
}

function optionalString(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined && !isString(value)) pushError(errors, path, 'ожидалась строка');
}

function validateTemplates(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, 'templates', 'ожидался массив');
    return;
  }

  value.forEach((item, index) => {
    const path = `templates[${index}]`;
    if (!isObject(item)) {
      pushError(errors, path, 'ожидался объект');
      return;
    }

    requireString(item.id, `${path}.id`, errors);
    requireString(item.name, `${path}.name`, errors);
    requireString(item.notes, `${path}.notes`, errors);
    if (!CREATURE_TYPES.includes(item.type as string)) {
      pushError(errors, `${path}.type`, 'недопустимый тип существа');
    }
    if (!isFiniteNumber(item.maxHp) || item.maxHp <= 0) {
      pushError(errors, `${path}.maxHp`, 'ожидалось положительное число');
    }
    if (!isArmorClass(item.armorClass)) {
      pushError(errors, `${path}.armorClass`, 'ожидалась строка или число');
    }
    if (!isFiniteNumber(item.initiativeModifier)) {
      pushError(errors, `${path}.initiativeModifier`, 'ожидалось число');
    }
    if (!isStringArray(item.tags)) {
      pushError(errors, `${path}.tags`, 'ожидался массив строк');
    }
    if (!isFiniteNumber(item.createdAt)) {
      pushError(errors, `${path}.createdAt`, 'ожидалось число');
    }
    optionalString(item.englishName, `${path}.englishName`, errors);
    optionalString(item.cr, `${path}.cr`, errors);
    optionalString(item.sourceUrl, `${path}.sourceUrl`, errors);
    if (
      isString(item.sourceUrl) &&
      item.sourceUrl.trim() !== '' &&
      !/^https?:\/\//i.test(item.sourceUrl)
    ) {
      pushError(errors, `${path}.sourceUrl`, 'ожидалась http(s)-ссылка');
    }
    optionalString(item.sourceLabel, `${path}.sourceLabel`, errors);
    if (item.edition !== undefined && !EDITIONS.includes(item.edition as string)) {
      pushError(errors, `${path}.edition`, 'недопустимое издание');
    }
  });
}

function validateParty(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, 'party', 'ожидался массив');
    return;
  }

  value.forEach((item, index) => {
    const path = `party[${index}]`;
    if (!isObject(item)) {
      pushError(errors, path, 'ожидался объект');
      return;
    }

    requireString(item.id, `${path}.id`, errors);
    requireString(item.name, `${path}.name`, errors);
    if (!isFiniteNumber(item.maxHp) || item.maxHp <= 0) {
      pushError(errors, `${path}.maxHp`, 'ожидалось положительное число');
    }
    if (!isFiniteNumber(item.currentHp)) {
      pushError(errors, `${path}.currentHp`, 'ожидалось число');
    }
    if (!isArmorClass(item.armorClass)) {
      pushError(errors, `${path}.armorClass`, 'ожидалась строка или число');
    }
    if (!isFiniteNumber(item.initiativeModifier)) {
      pushError(errors, `${path}.initiativeModifier`, 'ожидалось число');
    }
    optionalString(item.playerName, `${path}.playerName`, errors);
    optionalString(item.notes, `${path}.notes`, errors);
    optionalString(item.color, `${path}.color`, errors);
    if (
      item.passivePerception !== undefined &&
      !isString(item.passivePerception) &&
      !isFiniteNumber(item.passivePerception)
    ) {
      pushError(errors, `${path}.passivePerception`, 'ожидалась строка или число');
    }
  });
}

function validateEncounters(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, 'encounters', 'ожидался массив');
    return;
  }

  value.forEach((item, index) => {
    const path = `encounters[${index}]`;
    if (!isObject(item)) {
      pushError(errors, path, 'ожидался объект');
      return;
    }

    requireString(item.id, `${path}.id`, errors);
    requireString(item.title, `${path}.title`, errors);
    if (!isStringArray(item.tags)) {
      pushError(errors, `${path}.tags`, 'ожидался массив строк');
    }
    if (!isFiniteNumber(item.createdAt)) {
      pushError(errors, `${path}.createdAt`, 'ожидалось число');
    }
    if (!isFiniteNumber(item.updatedAt)) {
      pushError(errors, `${path}.updatedAt`, 'ожидалось число');
    }
    optionalString(item.description, `${path}.description`, errors);
    optionalString(item.location, `${path}.location`, errors);
    if (item.difficulty !== undefined && !DIFFICULTIES.includes(item.difficulty as string)) {
      pushError(errors, `${path}.difficulty`, 'недопустимая сложность');
    }

    if (!Array.isArray(item.monsters)) {
      pushError(errors, `${path}.monsters`, 'ожидался массив');
      return;
    }

    item.monsters.forEach((monster, monsterIndex) => {
      const monsterPath = `${path}.monsters[${monsterIndex}]`;
      if (!isObject(monster)) {
        pushError(errors, monsterPath, 'ожидался объект');
        return;
      }

      requireString(monster.id, `${monsterPath}.id`, errors);
      requireString(monster.name, `${monsterPath}.name`, errors);
      if (!CREATURE_TYPES.includes(monster.type as string)) {
        pushError(errors, `${monsterPath}.type`, 'недопустимый тип существа');
      }
      if (!isFiniteNumber(monster.count) || monster.count < 1) {
        pushError(errors, `${monsterPath}.count`, 'ожидалось число не меньше 1');
      }
      if (!isFiniteNumber(monster.maxHp) || monster.maxHp <= 0) {
        pushError(errors, `${monsterPath}.maxHp`, 'ожидалось положительное число');
      }
      if (!isArmorClass(monster.armorClass)) {
        pushError(errors, `${monsterPath}.armorClass`, 'ожидалась строка или число');
      }
      if (!isFiniteNumber(monster.initiativeModifier)) {
        pushError(errors, `${monsterPath}.initiativeModifier`, 'ожидалось число');
      }
      optionalString(monster.templateId, `${monsterPath}.templateId`, errors);
      optionalString(monster.notes, `${monsterPath}.notes`, errors);
    });
  });
}

function validateConditions(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, path, 'ожидался массив');
    return;
  }

  value.forEach((condition, index) => {
    const conditionPath = `${path}[${index}]`;
    if (!isObject(condition)) {
      pushError(errors, conditionPath, 'ожидался объект');
      return;
    }
    requireString(condition.id, `${conditionPath}.id`, errors);
    requireString(condition.name, `${conditionPath}.name`, errors);
    if (condition.roundsRemaining !== null && !isFiniteNumber(condition.roundsRemaining)) {
      pushError(errors, `${conditionPath}.roundsRemaining`, 'ожидалось число или null');
    }
    optionalString(condition.color, `${conditionPath}.color`, errors);
    optionalString(condition.notes, `${conditionPath}.notes`, errors);
  });
}

function validateLog(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, 'activeCombat.log', 'ожидался массив');
    return;
  }

  value.forEach((entry, index) => {
    const path = `activeCombat.log[${index}]`;
    if (!isObject(entry)) {
      pushError(errors, path, 'ожидался объект');
      return;
    }
    requireString(entry.id, `${path}.id`, errors);
    requireString(entry.timestamp, `${path}.timestamp`, errors);
    requireString(entry.message, `${path}.message`, errors);
    if (!isFiniteNumber(entry.round)) {
      pushError(errors, `${path}.round`, 'ожидалось число');
    }
    if (!LOG_TYPES.includes(entry.type as string)) {
      pushError(errors, `${path}.type`, 'недопустимый тип записи');
    }
  });
}

function validateCombatants(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    pushError(errors, 'activeCombat.combatants', 'ожидался массив');
    return;
  }

  value.forEach((combatant, index) => {
    const path = `activeCombat.combatants[${index}]`;
    if (!isObject(combatant)) {
      pushError(errors, path, 'ожидался объект');
      return;
    }

    requireString(combatant.id, `${path}.id`, errors);
    requireString(combatant.name, `${path}.name`, errors);
    if (!CREATURE_TYPES.includes(combatant.type as string)) {
      pushError(errors, `${path}.type`, 'недопустимый тип существа');
    }
    if (!isFiniteNumber(combatant.initiative)) {
      pushError(errors, `${path}.initiative`, 'ожидалось число');
    }
    if (!isFiniteNumber(combatant.initiativeModifier)) {
      pushError(errors, `${path}.initiativeModifier`, 'ожидалось число');
    }
    if (!isArmorClass(combatant.armorClass)) {
      pushError(errors, `${path}.armorClass`, 'ожидалась строка или число');
    }
    requireString(combatant.notes, `${path}.notes`, errors);
    if (typeof combatant.isDefeated !== 'boolean') {
      pushError(errors, `${path}.isDefeated`, 'ожидалось boolean');
    }
    if (typeof combatant.isDelayed !== 'boolean') {
      pushError(errors, `${path}.isDelayed`, 'ожидалось boolean');
    }
    optionalString(combatant.templateId, `${path}.templateId`, errors);
    optionalString(combatant.sourcePartyMemberId, `${path}.sourcePartyMemberId`, errors);

    if (!isObject(combatant.hp)) {
      pushError(errors, `${path}.hp`, 'ожидался объект');
    } else {
      if (!isFiniteNumber(combatant.hp.current)) {
        pushError(errors, `${path}.hp.current`, 'ожидалось число');
      }
      if (!isFiniteNumber(combatant.hp.max) || combatant.hp.max <= 0) {
        pushError(errors, `${path}.hp.max`, 'ожидалось положительное число');
      }
      if (!isFiniteNumber(combatant.hp.temp)) {
        pushError(errors, `${path}.hp.temp`, 'ожидалось число');
      }
    }

    validateConditions(combatant.conditions, `${path}.conditions`, errors);
  });
}

function validateActiveCombat(value: unknown, errors: string[]): void {
  if (!isObject(value)) {
    pushError(errors, 'activeCombat', 'ожидался объект');
    return;
  }

  if (typeof value.isActive !== 'boolean') {
    pushError(errors, 'activeCombat.isActive', 'ожидалось boolean');
  }
  if (!isFiniteNumber(value.round)) {
    pushError(errors, 'activeCombat.round', 'ожидалось число');
  }
  if (!isFiniteNumber(value.currentTurnIndex)) {
    pushError(errors, 'activeCombat.currentTurnIndex', 'ожидалось число');
  }
  if (!DICE_SYSTEMS.includes(value.diceSystem as string)) {
    pushError(errors, 'activeCombat.diceSystem', 'недопустимая система броска');
  }
  optionalString(value.encounterTitle, 'activeCombat.encounterTitle', errors);
  optionalString(value.encounterId, 'activeCombat.encounterId', errors);
  validateCombatants(value.combatants, errors);
  validateLog(value.log, errors);
}

/**
 * Validates an imported backup before anything is written to localStorage.
 * Returns a list of human-readable errors; an empty list means the data is safe
 * for the current renderers.
 */
export function validateImportData(value: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(value)) {
    return ['Корень файла должен быть объектом'];
  }

  if ('templates' in value) validateTemplates(value.templates, errors);
  if ('party' in value) validateParty(value.party, errors);
  if ('encounters' in value) validateEncounters(value.encounters, errors);
  if ('activeCombat' in value && value.activeCombat !== null) {
    validateActiveCombat(value.activeCombat, errors);
  }

  return errors;
}
