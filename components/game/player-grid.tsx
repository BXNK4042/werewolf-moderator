"use client";

import { useState } from "react";
import { PlayerCard } from "./player-card";
import { PlayerSheet } from "./player-sheet";
import { useGame } from "@/lib/hooks/use-game";
import type { Player } from "@/lib/game/types";

export function PlayerGrid({ dayMode }: { dayMode?: boolean }) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<Player | null>(null);

  // Keep the open sheet in sync with live state so overrides update the view.
  const live =
    selected && state.players.find((p) => p.id === selected.id);
  const open = Boolean(live);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {state.players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            seat={i + 1}
            dayMode={dayMode}
            onTap={setSelected}
            onEliminate={
              dayMode
                ? (target) =>
                    dispatch({
                      type: "recordDayDeath",
                      targetId: target.id,
                      cause: "lynched",
                    })
                : undefined
            }
          />
        ))}
      </div>

      <PlayerSheet
        player={live ?? null}
        open={open}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      />
    </>
  );
}
