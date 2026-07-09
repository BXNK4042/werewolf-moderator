"use client";

import { useState } from "react";
import { History, Moon, Redo2, Skull, Sparkles, Sunrise, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/hooks/use-game";
import { TimelineDrawer } from "@/components/game/timeline-drawer";
import { getRole } from "@/lib/game/roles";
import { checkWinner } from "@/lib/game/win-conditions";
import { TEAM_DOT, TEAM_LABEL, TEAM_ORDER } from "@/lib/game/team-style";
import type { EffectType, GameState, Team } from "@/lib/game/types";

const teamOf = (roleId: GameState["players"][number]["roleId"]): Team | undefined =>
  roleId ? getRole(roleId).team : undefined;

// Effects that actually persist on players during play (others — `protected`,
// `cursed`, `amulet`, witch flags — are defined but not yet wired into the
// engine). ponytail: expand the surfaced set as the engine grows.
const SURFACED_EFFECTS: { type: EffectType; label: string }[] = [
  { type: "cult", label: "Cult" },
  { type: "diseased", label: "Diseased" },
  { type: "lover-link", label: "Soulmates" },
];

function winReadout(state: GameState) {
  const alive = state.players.filter((p) => p.alive);
  if (alive.length === 0) return null;
  const counts = new Map<Team, number>();
  for (const p of alive) {
    const t = teamOf(p.roleId);
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const wolves = counts.get("werewolf") ?? 0;
  const vamps = counts.get("vampire") ?? 0;
  const nonWolves = alive.length - wolves;

  let hint: { text: string; tone: "warn" } | null = null;
  if (wolves > 0 && vamps === 0 && wolves >= nonWolves)
    hint = { text: "Werewolves at parity", tone: "warn" };
  else if (wolves > 0 && vamps === 0 && wolves === nonWolves - 1)
    hint = { text: "Werewolves 1 from parity", tone: "warn" };
  else if (vamps > 0 && wolves === 0 && vamps >= alive.length - vamps)
    hint = { text: "Vampires at parity", tone: "warn" };

  return { counts, hint };
}

export function StatusBar() {
  const { state, dispatch } = useGame();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const isNight = state.phase === "night";
  const alive = state.players.filter((p) => p.alive).length;
  const total = state.players.length;

  const pending = state.nightQueue
    ? state.nightQueue.steps.filter((s) => !s.outcome).length
    : 0;

  const effectCounts = SURFACED_EFFECTS.map((e) => ({
    ...e,
    count: state.players.filter((p) =>
      p.effects.some((fx) => fx.type === e.type),
    ).length,
  })).filter((e) => e.count > 0);

  const readout = winReadout(state);
  const tannerWon = checkWinner(state).sideWins.includes("tanner");

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border backdrop-blur",
        isNight ? "bg-night-tint/60" : "bg-day-tint/60",
      )}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-1.5 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {isNight ? <Moon className="size-4" /> : <Sunrise className="size-4" />}
            {isNight ? "Night" : "Day"} {state.nightNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={state.past.length === 0}
              onClick={() => dispatch({ type: "undo" })}
              aria-label="Undo"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={state.future.length === 0}
              onClick={() => dispatch({ type: "redo" })}
              aria-label="Redo"
            >
              <Redo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTimelineOpen(true)}
              aria-label="History"
            >
              <History className="size-4" />
            </Button>
            {isNight && pending > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" /> {pending} pending
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Skull className="size-3" /> {total - alive}/{total}
            </Badge>
          </div>
        </div>

        {readout && (
          <div className="flex flex-wrap items-center gap-1.5">
            {TEAM_ORDER.filter((t) => (readout.counts.get(t) ?? 0) > 0).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-background/60 px-1.5 py-0.5 text-xs"
              >
                <span className={cn("size-2 rounded-full", TEAM_DOT[t])} />
                {TEAM_LABEL[t]} {readout.counts.get(t)}
              </span>
            ))}
            {tannerWon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-1.5 py-0.5 text-xs text-amber-400">
                Tanner has won
              </span>
            )}
            {readout.hint && (
              <span className="inline-flex items-center rounded-full bg-destructive/20 px-1.5 py-0.5 text-xs text-destructive">
                {readout.hint.text}
              </span>
            )}
          </div>
        )}

        {effectCounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {effectCounts.map((e) => (
              <span
                key={e.type}
                className="inline-flex items-center rounded-full bg-background/60 px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {e.label} {e.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
    <TimelineDrawer open={timelineOpen} onOpenChange={setTimelineOpen} />
    </>
  );
}
