"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { GameState } from "@/lib/game/types";
import { createInitialState } from "@/lib/game/setup";
import { loadGame, saveGame } from "@/lib/game/storage";
import { reducer, type Action } from "@/lib/game/reducer";

type GameContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Hydrate from localStorage after mount (not in the initializer — avoids
  // SSR hydration mismatch; server and first client render agree on empty).
  useEffect(() => {
    const saved = loadGame();
    if (saved) dispatch({ type: "hydrate", state: saved });
  }, []);

  // Autosave on every change.
  useEffect(() => {
    saveGame(state);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
