/**
 * Safe array utilities to prevent "t.map is not a function" errors
 */

/**
 * Safely map over an array-like value
 * Returns empty array if input is not a valid array
 */
export function safeMap<T, R>(
  value: unknown,
  mapFunction: (item: T, index: number, array: T[]) => R
): R[] {
  if (!Array.isArray(value)) {
    console.warn('safeMap: Expected array but got:', typeof value, value);
    return [];
  }
  
  try {
    return value.map(mapFunction);
  } catch (error) {
    console.error('safeMap: Error during mapping:', error);
    return [];
  }
}

/**
 * Ensures a value is an array
 * Returns the value if it's already an array, otherwise returns empty array
 */
export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return [];
  }
  
  console.warn('ensureArray: Converting non-array value to empty array:', typeof value, value);
  return [];
}

/**
 * Safely filter an array-like value
 * Returns empty array if input is not a valid array
 */
export function safeFilter<T>(
  value: unknown,
  filterFunction: (item: T, index: number, array: T[]) => boolean
): T[] {
  const arr = ensureArray<T>(value);
  
  try {
    return arr.filter(filterFunction);
  } catch (error) {
    console.error('safeFilter: Error during filtering:', error);
    return [];
  }
}

/**
 * Safely reduce an array-like value
 * Returns initial value if input is not a valid array
 */
export function safeReduce<T, R>(
  value: unknown,
  reduceFunction: (accumulator: R, currentValue: T, currentIndex: number, array: T[]) => R,
  initialValue: R
): R {
  const arr = ensureArray<T>(value);
  
  try {
    return arr.reduce(reduceFunction, initialValue);
  } catch (error) {
    console.error('safeReduce: Error during reduction:', error);
    return initialValue;
  }
}

/**
 * Safely get array length
 * Returns 0 if input is not a valid array
 */
export function safeLength(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  return 0;
}

/**
 * Safely slice an array-like value
 * Returns empty array if input is not a valid array
 */
export function safeSlice<T>(
  value: unknown,
  start?: number,
  end?: number
): T[] {
  const arr = ensureArray<T>(value);
  
  try {
    return arr.slice(start, end);
  } catch (error) {
    console.error('safeSlice: Error during slicing:', error);
    return [];
  }
}

/**
 * Type guard to check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
} 