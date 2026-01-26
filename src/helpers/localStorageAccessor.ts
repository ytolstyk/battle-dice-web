/**
 * Lightweight safe wrapper around window.localStorage
 * - guards against SSR (window undefined)
 * - serializes/deserializes JSON
 * - catches and logs errors (quota, malformed JSON)
 */

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const isAvailable = (): boolean => {
  if (!isBrowser) return false;

  try {
    const testKey = "__ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export function getItem<T = unknown>(key: string, fallback?: T): T | null {
  if (!isAvailable()) return fallback ?? null;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback ?? null;
    return JSON.parse(raw) as T;
  } catch (err) {
    // JSON.parse or other errors
    // Keep behavior safe: return fallback and log for debugging

    console.warn(`localStorage.getItem("${key}") failed:`, err);
    return fallback ?? null;
  }
}

export function setItem<T = unknown>(key: string, value: T): void {
  if (!isAvailable()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // quota exceeded or other errors

    console.warn(`localStorage.setItem("${key}") failed:`, err);
  }
}

export function removeItem(key: string): void {
  if (!isAvailable()) return;

  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`localStorage.removeItem("${key}") failed:`, err);
  }
}

export function clear(): void {
  if (!isAvailable()) return;

  try {
    window.localStorage.clear();
  } catch (err) {
    console.warn("localStorage.clear() failed:", err);
  }
}

export function keys(): string[] {
  if (!isAvailable()) return [];

  try {
    const ls = window.localStorage;
    const result: string[] = [];

    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);

      if (k !== null) result.push(k);
    }

    return result;
  } catch {
    return [];
  }
}

export function hasItem(key: string): boolean {
  if (!isAvailable()) return false;

  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export default {
  isAvailable,
  getItem,
  setItem,
  removeItem,
  clear,
  keys,
  hasItem,
};
