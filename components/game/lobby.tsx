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
import { validateSetup } from "@/lib/game/setup";
import { RolePicker } from "./role-picker";

export function Lobby() {
  const { state, dispatch } = useGame();
  const [draft, setDraft] = useState("");

  const { players, rolePool } = state;
  const { errors, warnings } = validateSetup(state);
  const canStart = errors.length === 0;

  const submitPlayer = () => {
    if (!draft.trim()) return;
    dispatch({ type: "addPlayer", name: draft });
    setDraft("");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-4">
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
                  dispatch({ type: "renamePlayer", id: p.id, name: e.target.value })
                }
                className="flex-1"
                aria-label={`Player ${i + 1} name`}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={i === 0}
                onClick={() => dispatch({ type: "movePlayer", id: p.id, dir: -1 })}
                aria-label={`Move ${p.name} up`}
              >
                <ChevronUp />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={i === players.length - 1}
                onClick={() => dispatch({ type: "movePlayer", id: p.id, dir: 1 })}
                aria-label={`Move ${p.name} down`}
              >
                <ChevronDown />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => dispatch({ type: "removePlayer", id: p.id })}
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

      <section className="mb-12 flex flex-col gap-2">
        <h2 className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <ScrollText className="size-4" /> Roles
          </span>
          <Badge variant="secondary">{rolePool.length}</Badge>
        </h2>
        <RolePicker />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm tabular-nums",
                players.length !== rolePool.length && "text-destructive",
              )}
            >
              {rolePool.length} roles / {players.length} players
            </span>
            <Button disabled={!canStart} onClick={() => dispatch({ type: "startGame" })}>
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
