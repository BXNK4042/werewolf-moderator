"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/hooks/use-game";
import {
  addPlayer,
  movePlayer,
  removePlayer,
  renamePlayer,
  validateSetup,
} from "@/lib/game/setup";
import { RolePicker } from "./role-picker";

export function Lobby() {
  const { state, setState } = useGame();
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState(false);

  const { players, rolePool } = state;
  const { errors, warnings } = validateSetup(state);
  const canStart = errors.length === 0;

  const submitPlayer = () => {
    if (!draft.trim()) return;
    setState((s) => addPlayer(s, draft));
    setDraft("");
  };

  if (started && canStart) {
    // ponytail: P3 swaps this confirmation for the real deal + setup→night1.
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Setup complete</h1>
        <p className="text-sm text-muted-foreground">
          Players and roles are locked in and saved. Night 1 begins the game.
        </p>
        <Button variant="outline" onClick={() => setStarted(false)}>
          <ArrowLeft /> Back to setup
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-2")}
      >
        <ArrowLeft /> Home
      </Link>

      <section className="mb-6 flex flex-col gap-2">
        <h2 className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Users className="size-4" /> Players
          </span>
          <Badge variant="secondary">{players.length}</Badge>
        </h2>
        <div className="flex flex-col gap-1.5">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-1">
              <Input
                value={p.name}
                onChange={(e) =>
                  setState((s) => renamePlayer(s, p.id, e.target.value))
                }
                className="flex-1"
                aria-label={`Player ${i + 1} name`}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={i === 0}
                onClick={() => setState((s) => movePlayer(s, p.id, -1))}
                aria-label={`Move ${p.name} up`}
              >
                <ChevronUp />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={i === players.length - 1}
                onClick={() => setState((s) => movePlayer(s, p.id, 1))}
                aria-label={`Move ${p.name} down`}
              >
                <ChevronDown />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setState((s) => removePlayer(s, p.id))}
                aria-label={`Remove ${p.name}`}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPlayer();
            }}
            placeholder="Add player…"
            className="flex-1"
            aria-label="New player name"
          />
          <Button
            size="icon"
            onClick={submitPlayer}
            disabled={!draft.trim()}
            aria-label="Add player"
          >
            <Plus />
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <ScrollText className="size-4" /> Roles
          </span>
          <Badge variant="secondary">{rolePool.length}</Badge>
        </h2>
        <RolePicker />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm tabular-nums",
                players.length !== rolePool.length && "text-destructive",
              )}
            >
              {rolePool.length} roles / {players.length} players
            </span>
            <Button disabled={!canStart} onClick={() => setStarted(true)}>
              <Check /> Start
            </Button>
          </div>
          {errors.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-xs text-destructive">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Tip: official scenarios use ~1 wolf per 4–5 players (manual l.85-117).
          </p>
        </div>
      </div>
    </div>
  );
}
