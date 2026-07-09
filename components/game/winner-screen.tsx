"use client";

import { useRouter } from "next/navigation";
import {
  History as HistoryIcon,
  Home,
  Moon,
  RotateCcw,
  Settings,
  Skull,
  Sunrise,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/hooks/use-game";
import { getRole } from "@/lib/game/roles";
import { checkWinner } from "@/lib/game/win-conditions";
import { TEAM_DOT, TEAM_LABEL } from "@/lib/game/team-style";
import type { Phase, Team } from "@/lib/game/types";

const TEAM_TEXT: Record<Team, string> = {
  village: "text-emerald-500",
  werewolf: "text-red-500",
  vampire: "text-purple-500",
  cult: "text-amber-500",
  neutral: "text-zinc-400",
};

function LogGlyph({ phase }: { phase: Phase }) {
  const cls = "size-3 shrink-0 mt-0.5 text-muted-foreground";
  if (phase === "night") return <Moon className={cls} />;
  if (phase === "day") return <Sunrise className={cls} />;
  if (phase === "setup") return <Settings className={cls} />;
  return <HistoryIcon className={cls} />;
}

export function WinnerScreen() {
  const { state, dispatch } = useGame();
  const router = useRouter();
  const { winner, sideWins } = checkWinner(state);
  const alive = state.players.filter((p) => p.alive).length;
  const total = state.players.length;
  const tannerWon = sideWins.includes("tanner");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
      {/* Banner */}
      <section className="flex flex-col items-center gap-2 rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <Trophy
          className={cn(
            "size-10",
            winner ? TEAM_TEXT[winner] : "text-muted-foreground",
          )}
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          {winner ? (
            <>
              <span className={TEAM_TEXT[winner]}>{TEAM_LABEL[winner]}</span> win
            </>
          ) : (
            "Game over"
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.nightNumber === 1
            ? "Ended on Night 1"
            : `Ended on Night ${state.nightNumber}`}
        </p>
        {tannerWon && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-500">
            <Trophy className="size-3" /> Tanner also won
          </span>
        )}
      </section>

      {/* Summary */}
      <section className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Moon className="size-3.5" /> {state.nightNumber} night
          {state.nightNumber === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> {total} players
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1.5">
          <Skull className="size-3.5" /> {total - alive} dead
        </span>
      </section>

      {/* Final roster */}
      <section className="flex flex-col gap-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Final roster
        </h2>
        <ul className="flex flex-col gap-1">
          {state.players.map((p, i) => {
            const role = p.roleId ? getRole(p.roleId) : null;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 text-sm ring-1 ring-foreground/5",
                  !p.alive && "opacity-60",
                )}
              >
                <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                {role && (
                  <span
                    className={cn("size-2 shrink-0 rounded-full", TEAM_DOT[role.team])}
                  />
                )}
                <span
                  className={cn(
                    "flex-1 truncate font-medium",
                    !p.alive && "line-through",
                  )}
                >
                  {p.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {role?.name ?? "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Event log */}
      {state.log.length > 0 && (
        <details className="group rounded-lg bg-card px-3 py-2 ring-1 ring-foreground/5">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Event log ({state.log.length})
          </summary>
          <ol className="mt-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {state.log.map((e, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs">
                <LogGlyph phase={e.phase} />
                <span className="text-muted-foreground">{e.text}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {/* Actions */}
      <section className="flex flex-col gap-2">
        <Button onClick={() => dispatch({ type: "resetSetup" })}>
          <RotateCcw className="size-4" /> New game
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          <Home className="size-4" /> Home
        </Button>
      </section>
    </main>
  );
}
