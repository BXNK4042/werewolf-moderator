"use client";

import { History as HistoryIcon, Moon, Settings, Sunrise } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGame } from "@/lib/hooks/use-game";
import type { Phase } from "@/lib/game/types";

function PhaseGlyph({ phase }: { phase: Phase }) {
  const cls = "size-3.5 shrink-0 text-muted-foreground";
  if (phase === "night") return <Moon className={cls} />;
  if (phase === "day") return <Sunrise className={cls} />;
  if (phase === "setup") return <Settings className={cls} />;
  return <HistoryIcon className={cls} />;
}

function phaseLabel(phase: Phase, nightNumber: number): string {
  switch (phase) {
    case "setup":
      return "Setup";
    case "night":
      return `Night ${nightNumber}`;
    case "day":
      return `Day ${nightNumber}`;
    case "gameover":
      return "Game over";
  }
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function TimelineDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useGame();
  const reversed = [...state.past].reverse();
  const aliveNow = state.players.filter((p) => p.alive).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
          <SheetDescription>
            {state.past.length === 0
              ? "No actions yet"
              : `${state.past.length} action${state.past.length === 1 ? "" : "s"} recorded`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <ol className="flex flex-col gap-0.5">
            {reversed.map((snap, i) => {
              const alive = snap.state.players.filter((p) => p.alive).length;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({
                        type: "rollback",
                        to: state.past.length - 1 - i,
                      });
                      onOpenChange(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <PhaseGlyph phase={snap.state.phase} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {snap.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {phaseLabel(snap.state.phase, snap.state.nightNumber)}
                        {" \u00b7 "}
                        {alive} alive
                        {" \u00b7 "}
                        {timeAgo(snap.at)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}

            <li className="mt-1 flex items-start gap-2 rounded-lg bg-muted/60 px-2 py-1.5">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">Current</span>
                <span className="text-xs text-muted-foreground">
                  {phaseLabel(state.phase, state.nightNumber)}
                  {" \u00b7 "}
                  {aliveNow} alive
                </span>
              </span>
            </li>
          </ol>

          {state.future.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {state.future.length} action
              {state.future.length === 1 ? "" : "s"} available to redo
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
