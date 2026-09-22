import { useCallback, useSyncExternalStore } from "react";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import type { BBOX } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A serializable recent-imagery entry persisted to localStorage. */
export type RecentImageryEntry = {
  /** Unique key: OAM item id, or a hash of the tile URL for custom imagery. */
  id: string;
  /** Human-readable name (OAM title or reverse-geocoded place name). */
  title: string;
  /** Display label for the imagery source, e.g. "OpenAerialMap" or "TMS". */
  sourceLabel: string;
  /** Country name from reverse-geocode, or empty string. */
  country: string;
  /** ISO 3166-1 alpha-2 code (lower-cased), or empty string. */
  countryCode: string;
  /** XYZ tile URL template. */
  tileUrl: string;
  /** Imagery extent, or null for custom TMS without known bounds. */
  bounds: BBOX | null;
  /** The full ImagerySelection for re-applying this imagery. */
  selection: ImagerySelection;
  /** OAM thumbnail URL, if available. */
  thumbnailUrl: string | null;
  /** ISO timestamp when the entry was added/updated. */
  addedAt: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fair:recent-imageries";
const MAX_ENTRIES = 5;

// ── External-store plumbing ───────────────────────────────────────────────────

/**
 * We use `useSyncExternalStore` so that any component consuming this hook
 * re-renders when localStorage changes — including from other tabs via the
 * `storage` event.
 */

/** In-memory snapshot; updated on every write so React sees a new reference. */
let snapshot: RecentImageryEntry[] = readFromStorage();

function readFromStorage(): RecentImageryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries: RecentImageryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or disabled — silently ignore.
  }
}

/** Listeners registered by useSyncExternalStore. */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  // Cross-tab sync: another tab wrote to the same key.
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      snapshot = readFromStorage();
      listeners.forEach((fn) => fn());
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): RecentImageryEntry[] {
  return snapshot;
}

function emitChange(next: RecentImageryEntry[]): void {
  snapshot = next;
  writeToStorage(next);
  listeners.forEach((fn) => fn());
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages a list of recently selected imageries in localStorage (max 5).
 *
 * - Duplicates (matched by `id`) are moved to the end.
 * - When the list exceeds 5, the oldest (first) item is dropped.
 * - Stays in sync across tabs via the `storage` event.
 */
export const useRecentImageries = () => {
  const recentImageries = useSyncExternalStore(subscribe, getSnapshot);

  const addRecentImagery = useCallback((entry: RecentImageryEntry) => {
    const current = getSnapshot();
    // Remove duplicate if it already exists (matched by id).
    const filtered = current.filter((e) => e.id !== entry.id);
    // Append the new entry at the end.
    const updated = [
      ...filtered,
      { ...entry, addedAt: new Date().toISOString() },
    ];
    // Trim to max entries — drop the oldest (first) item.
    const trimmed =
      updated.length > MAX_ENTRIES ? updated.slice(-MAX_ENTRIES) : updated;
    emitChange(trimmed);
  }, []);

  return { recentImageries, addRecentImagery } as const;
};
