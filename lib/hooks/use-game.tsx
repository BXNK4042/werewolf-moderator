"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { GameState } from "@/lib/game/types";
import { createInitialState } from "@/lib/game/setup";
import { loadGame, saveGame } from "@/lib/game/storage";
import { archiveGame } from "@/lib/game/history";
import { reducer, type Action } from "@/lib/game/reducer";

type GameContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const archivedRef = useRef(false);

  // Hydrate from localStorage after mount (not in the initializer — avoids
  // SSR hydration mismatch; server and first client render agree on empty).
  useEffect(() => {
    const saved = loadGame();
    if (saved) dispatch({ type: "hydrate", state: saved });
    // A gameover state restored on refresh was already archived before the
    // reload — don't archive it again.
    if (saved?.phase === "gameover") archivedRef.current = true;
  }, []);

  // Autosave on every change; archive the game once when it ends.
  useEffect(() => {
    saveGame(state);
    if (state.phase === "gameover") {
      if (!archivedRef.current) {
        archiveGame(state);
        archivedRef.current = true;
      }
    } else {
      archivedRef.current = false;
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
