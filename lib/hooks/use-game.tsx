"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { GameState } from "@/lib/game/types";

const initialState: GameState = {
  players: [],
  rolePool: [],
  phase: "setup",
  nightNumber: 0,
  log: [],
  past: [],
  future: [],
};

type GameContextValue = {
  state: GameState;
  // ponytail: real reducer/autosave/undo land in P3; placeholder setter keeps the shell live.
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
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
