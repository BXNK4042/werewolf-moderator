"use client";

import { ChevronRight } from "lucide-react";
import { Lobby } from "@/components/game/lobby";
import { StatusBar } from "@/components/game/status-bar";
import { PlayerGrid } from "@/components/game/player-grid";
import { DayTimer } from "@/components/game/day-timer";
import { NightWizard } from "@/components/game/night-wizard";
import { WinnerScreen } from "@/components/game/winner-screen";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/hooks/use-game";

export default function PlayPage() {
  const { state } = useGame();
  if (state.phase === "setup") return <Lobby />;
  if (state.phase === "gameover") return <WinnerScreen />;
  if (state.phase === "night") return <NightBoard />;
  return <DayBoard />;
}

function NightBoard() {
  const { dispatch } = useGame();
  return (
    <>
      <StatusBar />
      <main className="mx-auto w-full max-w-2xl animate-in fade-in duration-300 px-3 pb-28 pt-4">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground">
          Night actions
        </h2>
        <NightWizard />
        <h2 className="mt-5 mb-2 text-xs font-medium tracking-wide text-muted-foreground">
          Players
        </h2>
        <PlayerGrid />
      </main>
      <BottomBar
        label="Resolve dawn"
        sub="All actions recorded? Then resolve."
        onAdvance={() => dispatch({ type: "advancePhase" })}
      />
    </>
  );
}

function DayBoard() {
  const { state, dispatch } = useGame();
  const day1 = state.nightNumber === 1;
  return (
    <>
      <StatusBar />
      <main className="mx-auto w-full max-w-2xl animate-in fade-in duration-300 px-3 pb-28 pt-4">
        <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
          {day1 ? "Day 1 — discussion (no vote)" : "Players — tap to eliminate"}
        </h2>
        <DayTimer />
        <PlayerGrid dayMode={!day1} />
      </main>
      <BottomBar
        label={day1 ? "Begin Night 2" : "Begin next night"}
        sub={day1 ? "No vote on day 1." : undefined}
        onAdvance={() => dispatch({ type: "advancePhase" })}
      />
    </>
  );
}

function BottomBar({
  label,
  sub,
  onAdvance,
}: {
  label: string;
  sub?: string;
  onAdvance: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-3">
        {sub ? (
          <span className="text-xs text-muted-foreground">{sub}</span>
        ) : (
          <span />
        )}
        <Button onClick={onAdvance}>
          {label} <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
