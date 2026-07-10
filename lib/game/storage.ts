import type { GameState } from "./types";

const KEY = "werewolf-mod:active-game";

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ponytail: best-effort — private mode / quota just means no autosave.
  }
}

export function clearGame(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("werewolf-mod:active-game");
    window.localStorage.removeItem("werewolf-mod:history");
  } catch {
    // ignore
  }
}
