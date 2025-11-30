import type { TutorialPersistedState, TutorialVariant } from "./types";

const STORAGE_KEY = "principal-dashboard-v3-tutorial";
const COMPLETION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d
const SKIP_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14d

export function loadPersistedState(): TutorialPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TutorialPersistedState;
  } catch {
    // Ignore parse errors
    return null;
  }
}

export function savePersistedState(state: TutorialPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function shouldAutoStart(variant: TutorialVariant): boolean {
  const state = loadPersistedState();
  if (!state) return true;

  const age = Date.now() - state.updatedAt;
  if (state.status === "completed" && age < COMPLETION_TTL_MS) {
    return false;
  }
  if (state.status === "skipped" && age < SKIP_COOLDOWN_MS) {
    return false;
  }

  // Variant changed or TTL expired; allow restart
  return true;
}
