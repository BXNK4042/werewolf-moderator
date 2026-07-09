"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { GameState } from "@/lib/game/types";
import { createInitialState } from "@/lib/game/setup";
import { loadGame, saveGame } from "@/lib/game/storage";

type GameContextValue = {
  state: GameState;
  // ponytail: real reducer + undo/redo snapshots land in P3; setup uses
  // useState + pure transitions from setup.ts (a P3 reducer wraps them verbatim).
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);

  // Hydrate from localStorage after mount (not in the initializer — avoids
  // SSR hydration mismatch; server and first client render agree on empty).
  useEffect(() => {
    const saved = loadGame();
    if (saved) setState(saved);
  }, []);

  // Autosave on every change.
  useEffect(() => {
    saveGame(state);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, setState }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
