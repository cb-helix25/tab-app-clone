/**
 * Opponent Data Tracker
 * Manages the distinction between placeholder and real user data
 */

export interface OpponentDataStatus {
  fieldName: string;
  isPlaceholder: boolean;
  lastUpdated: Date;
  value: string;
}

export interface OpponentDataSheet {
  matterId?: string;
  fields: { [fieldName: string]: OpponentDataStatus };
}

/**
 * Default placeholder indicators - these values indicate placeholder data
 */
export const PLACEHOLDER_INDICATORS = new Set([
  'Pending',
  'Data Entry',
  'Awaiting details',
  'Pending entry',
  'TBD',
  'Awaiting Company Details',
  'Awaiting Solicitor Details',
  'pending-solicitor@awaiting-details.temp'
]);

/**
 * Check if a value appears to be placeholder data
 */
export function isPlaceholderValue(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return PLACEHOLDER_INDICATORS.has(value.trim());
}

/**
 * Create a new data sheet for tracking opponent information
 */
export function createOpponentDataSheet(matterId?: string): OpponentDataSheet {
  return {
    matterId,
    fields: {}
  };
}

/**
 * Mark a field as containing placeholder data
 */
export function markFieldAsPlaceholder(
  sheet: OpponentDataSheet, 
  fieldName: string, 
  value: string
): OpponentDataSheet {
  return {
    ...sheet,
    fields: {
      ...sheet.fields,
      [fieldName]: {
        fieldName,
        isPlaceholder: true,
        lastUpdated: new Date(),
        value
      }
    }
  };
}

/**
 * Mark a field as containing real user data
 */
export function markFieldAsRealData(
  sheet: OpponentDataSheet,
  fieldName: string,
  value: string
): OpponentDataSheet {
  return {
    ...sheet,
    fields: {
      ...sheet.fields,
      [fieldName]: {
        fieldName,
        isPlaceholder: false,
        lastUpdated: new Date(),
        value
      }
    }
  };
}

/**
 * Get all fields that contain placeholder data
 */
export function getPlaceholderFields(sheet: OpponentDataSheet): string[] {
  return Object.values(sheet.fields)
    .filter(field => field.isPlaceholder)
    .map(field => field.fieldName);
}

/**
 * Get all fields that contain real user data
 */
export function getRealDataFields(sheet: OpponentDataSheet): string[] {
  return Object.values(sheet.fields)
    .filter(field => !field.isPlaceholder)
    .map(field => field.fieldName);
}

/**
 * Get only the real data for API submission
 */
export function getRealDataForSubmission(
  sheet: OpponentDataSheet,
  allFieldData: { [key: string]: any }
): { [key: string]: any } {
  const realFields = getRealDataFields(sheet);
  const realData: { [key: string]: any } = {};

  realFields.forEach(fieldName => {
    if (allFieldData[fieldName] && allFieldData[fieldName].trim()) {
      realData[fieldName] = allFieldData[fieldName];
    }
  });

  return realData;
}

/**
 * Serialize sheet for storage
 */
export function serializeDataSheet(sheet: OpponentDataSheet): string {
  return JSON.stringify(sheet);
}

/**
 * Deserialize sheet from storage
 */
export function deserializeDataSheet(data: string): OpponentDataSheet {
  try {
    return JSON.parse(data);
  } catch {
    return createOpponentDataSheet();
  }
}

/**
 * Save data sheet to localStorage (for persistence across sessions)
 */
export function saveDataSheetToStorage(sheet: OpponentDataSheet, key: string = 'opponentDataSheet'): void {
  try {
    localStorage.setItem(key, serializeDataSheet(sheet));
  } catch (error) {
    console.warn('Failed to save opponent data sheet to localStorage:', error);
  }
}

/**
 * Load data sheet from localStorage
 */
export function loadDataSheetFromStorage(key: string = 'opponentDataSheet'): OpponentDataSheet {
  try {
    const stored = localStorage.getItem(key);
    return stored ? deserializeDataSheet(stored) : createOpponentDataSheet();
  } catch (error) {
    console.warn('Failed to load opponent data sheet from localStorage:', error);
    return createOpponentDataSheet();
  }
}