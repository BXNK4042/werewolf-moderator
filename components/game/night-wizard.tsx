"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/hooks/use-game";
import { getRole } from "@/lib/game/roles";
import { WOLVES, VAMPIRES } from "@/lib/game/engine";
import type { NightOutcome, NightStep, Player, RoleId } from "@/lib/game/types";

// ponytail: maps a step's role to the outcome picker UI. The night queue is
// moderator-driven and reorderable, so an imperfect kind never breaks a game —
// the mod can always override. `witch` is special: it can heal (protect) OR
// kill within the single-outcome-per-step model.
type StepKind = "kill" | "protect" | "convert" | "link" | "view" | "note" | "witch";
const STEP_KIND: Partial<Record<RoleId, StepKind>> = {
  werewolf: "kill",
  vampire: "kill",
  bodyguard: "protect",
  witch: "witch",
  "cult-leader": "convert",
  cupid: "link",
  seer: "view",
  "apprentice-seer": "view",
  "aura-seer": "view",
  sorcerer: "view",
  doppelganger: "view",
  cursed: "note",
  minion: "note",
  ghost: "note",
  hoodlum: "link",
};
const kindFor = (roleId: RoleId): StepKind => STEP_KIND[roleId] ?? "note";

export function NightWizard() {
  const { state } = useGame();
  const queue = state.nightQueue;

  if (!queue || queue.steps.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No night actions. Resolve dawn when ready.
      </p>
    );
  }

  return <Wizard steps={queue.steps} alive={state.players.filter((p) => p.alive)} />;
}

function Wizard({ steps, alive }: { steps: NightStep[]; alive: Player[] }) {
  const { dispatch } = useGame();
  const [view, setView] = useState(0);
  const idx = Math.max(0, Math.min(view, steps.length - 1));

  const pendingCount = steps.filter((s) => !s.outcome).length;
  const step = steps[idx];
  const done = pendingCount === 0;

  const goToNextPending = (from: number) => {
    let next = -1;
    for (let i = from + 1; i < steps.length; i++)
      if (!steps[i].outcome) {
        next = i;
        break;
      }
    if (next === -1)
      for (let i = 0; i <= from; i++)
        if (!steps[i].outcome) {
          next = i;
          break;
        }
    if (next !== -1) setView(next);
  };

  const record = (outcome: NightOutcome) => {
    dispatch({ type: "setNightOutcome", stepIndex: idx, outcome });
    if (outcome.kind !== "none") goToNextPending(idx);
  };

  const reorder = (dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= steps.length) return;
    dispatch({ type: "reorderNightStep", from: idx, to });
    setView(to);
  };

  return (
    <section className="mt-3 flex flex-col gap-3">
      <div
        className="flex items-center justify-between"
        role="status"
        aria-live="polite"
      >
        <Badge variant="secondary">
          Step {idx + 1} of {steps.length}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {done ? "All recorded" : `${pendingCount} pending`}
        </span>
      </div>

      <StepCard step={step} alive={alive} onRecord={record} />

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={idx === 0}
            onClick={() => setView((v) => Math.max(0, v - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={idx >= steps.length - 1}
            onClick={() => setView((v) => Math.min(steps.length - 1, v + 1))}
          >
            Next
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={idx === 0}
            aria-label="Move step up"
            onClick={() => reorder(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={idx === steps.length - 1}
            aria-label="Move step down"
            onClick={() => reorder(1)}
          >
            <ChevronDown />
          </Button>
        </div>
      </div>

      <AllSteps steps={steps} onJump={setView} current={idx} />

      {done && (
        <p className="rounded-lg bg-card p-3 text-center text-xs text-muted-foreground ring-1 ring-foreground/10">
          All actions recorded — resolve dawn below.
        </p>
      )}
    </section>
  );
}

function stepLabel(step: NightStep): string {
  const isGroup = step.playerId === WOLVES || step.playerId === VAMPIRES;
  if (isGroup) return step.roleId === "werewolf" ? "Werewolves" : "Vampires";
  return getRole(step.roleId).name;
}

function StepCard({
  step,
  alive,
  onRecord,
}: {
  step: NightStep;
  alive: Player[];
  onRecord: (o: NightOutcome) => void;
}) {
  const kind = kindFor(step.roleId);
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [note, setNote] = useState("");
  const [witchMode, setWitchMode] = useState<"heal" | "kill">("heal");

  const submit = () => {
    if (kind === "note") onRecord(note ? { kind: "note", text: note } : { kind: "none" });
    else if (kind === "link") {
      if (t1 && t2) onRecord({ kind: "link", targetIds: [t1, t2] });
    } else if (kind === "witch") {
      if (!t1) return;
      onRecord(
        witchMode === "heal"
          ? { kind: "protect", targetIds: [t1] }
          : { kind: "kill", targetIds: [t1] },
      );
    } else {
      if (t1)
        onRecord({ kind, targetIds: [t1] } as NightOutcome);
    }
  };

  const recorded = step.outcome && step.outcome.kind !== "none";

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{stepLabel(step)}</span>
        {step.outcome ? (
          <Badge variant={recorded ? "default" : "outline"}>
            {recorded ? "done" : "skipped"}
          </Badge>
        ) : (
          <Badge variant="secondary">pending</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{step.prompt}</p>

      {kind === "note" ? (
        <input
          className="rounded border border-border bg-background px-2 py-1 text-xs"
          placeholder="note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : kind === "link" ? (
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <TargetSelect alive={alive} value={t1} onChange={setT1} />
          <TargetSelect alive={alive} value={t2} onChange={setT2} />
        </div>
      ) : kind === "witch" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            <Button
              size="xs"
              variant={witchMode === "heal" ? "default" : "outline"}
              onClick={() => setWitchMode("heal")}
            >
              Heal
            </Button>
            <Button
              size="xs"
              variant={witchMode === "kill" ? "destructive" : "outline"}
              onClick={() => setWitchMode("kill")}
            >
              Kill
            </Button>
          </div>
          <TargetSelect alive={alive} value={t1} onChange={setT1} />
        </div>
      ) : (
        <TargetSelect alive={alive} value={t1} onChange={setT1} />
      )}

      <div className="flex gap-1.5">
        <Button size="sm" onClick={submit}>
          <Check className="size-3.5" /> Record
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRecord({ kind: "none" })}>
          <SkipForward className="size-3.5" /> Skip
        </Button>
      </div>
    </div>
  );
}

function TargetSelect({
  alive,
  value,
  onChange,
}: {
  alive: Player[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Target">
      {alive.map((p) => (
        <Button
          key={p.id}
          size="xs"
          variant={value === p.id ? "default" : "outline"}
          onClick={() => onChange(value === p.id ? "" : p.id)}
        >
          {p.name}
        </Button>
      ))}
    </div>
  );
}

function AllSteps({
  steps,
  current,
  onJump,
}: {
  steps: NightStep[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <details className="rounded-lg bg-card text-sm ring-1 ring-foreground/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-medium [&::-webkit-details-marker]:hidden">
        All steps
        <span className="text-xs text-muted-foreground">
          {steps.filter((s) => s.outcome).length}/{steps.length}
        </span>
      </summary>
      <ol className="flex flex-col border-t border-border">
        {steps.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              aria-current={i === current ? "step" : undefined}
              onClick={() => onJump(i)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left",
                i === current && "bg-muted",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                {stepLabel(s)}
              </span>
              <Badge variant={s.outcome ? (s.outcome.kind === "none" ? "outline" : "secondary") : "outline"}>
                {!s.outcome ? "pending" : s.outcome.kind === "none" ? "skip" : "done"}
              </Badge>
            </button>
          </li>
        ))}
      </ol>
    </details>
  );
}
