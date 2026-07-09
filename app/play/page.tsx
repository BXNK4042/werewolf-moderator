"use client";

import { useState } from "react";
import { Lobby } from "@/components/game/lobby";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/lib/hooks/use-game";
import { getRole } from "@/lib/game/roles";
import type { NightOutcome, NightStep, Player, RoleId } from "@/lib/game/types";
import { WOLVES } from "@/lib/game/engine";

// ponytail: temporary dev board so the P3 engine is drivable end-to-end. The
// polished moderator board (status bar, player grid, night wizard, override
// panel) lands in P4 and replaces this whole file's non-setup branches.

const STEP_KIND: Partial<Record<RoleId, "kill" | "protect" | "convert" | "link" | "note">> = {
  werewolf: "kill", // grouped pack step
  vampire: "kill", // grouped vampire step
  bodyguard: "protect",
  witch: "protect",
  "cult-leader": "convert",
  cupid: "link",
};
const kindFor = (roleId: RoleId) => STEP_KIND[roleId] ?? "note";

export default function PlayPage() {
  const { state } = useGame();
  if (state.phase === "setup") return <Lobby />;
  if (state.phase === "gameover") return <GameOver />;
  if (state.phase === "night") return <NightBoard />;
  return <DayBoard />;
}

function PhaseHeader({ title, sub }: { title: string; sub: string }) {
  const { state } = useGame();
  const alive = state.players.filter((p) => p.alive).length;
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Badge variant="secondary">
        Night {state.nightNumber} · {alive} alive
      </Badge>
    </div>
  );
}

function NightBoard() {
  const { state, dispatch } = useGame();
  const queue = state.nightQueue;
  const alive = state.players.filter((p) => p.alive);
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
      <PhaseHeader title="Night" sub="DEV board — walk each prompt, then resolve dawn." />
      {!queue || queue.steps.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No night actions.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-2">
          {queue.steps.map((step, i) => (
            <NightStepRow
              key={i}
              index={i}
              step={step}
              alive={alive}
              onRecord={(o) => dispatch({ type: "setNightOutcome", stepIndex: i, outcome: o })}
            />
          ))}
        </ol>
      )}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground">All outcomes recorded? Then:</span>
          <Button onClick={() => dispatch({ type: "advancePhase" })}>Resolve dawn →</Button>
        </div>
      </div>
    </main>
  );
}

function NightStepRow({
  index,
  step,
  alive,
  onRecord,
}: {
  index: number;
  step: NightStep;
  alive: Player[];
  onRecord: (o: NightOutcome) => void;
}) {
  const kind = kindFor(step.roleId);
  const isGroup = step.playerId === WOLVES || step.playerId === "__vampires";
  const label = isGroup
    ? step.roleId === "werewolf"
      ? "Werewolves"
      : "Vampires"
    : getRole(step.roleId).name;
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [note, setNote] = useState("");

  const record = () => {
    if (kind === "note") onRecord(note ? { kind: "note", text: note } : { kind: "none" });
    else if (kind === "link")
      t1 && t2 && onRecord({ kind: "link", targetIds: [t1, t2] });
    else t1 && onRecord({ kind, targetIds: [t1] } as NightOutcome);
  };

  const done = step.outcome && step.outcome.kind !== "none"
    ? step.outcome.kind === "note"
      ? `noted`
      : `${step.outcome.kind}: ${("targetIds" in step.outcome ? step.outcome.targetIds : []).map((id) => alive.find((p) => p.id === id)?.name ?? id).join(", ")}`
    : step.outcome?.kind === "none"
      ? "skipped"
      : undefined;

  return (
    <li className="flex flex-col gap-1.5 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {index + 1}. {label}
        </span>
        {done && <Badge variant="outline">{done}</Badge>}
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
        <div className="flex gap-1.5">
          <TargetSelect alive={alive} value={t1} onChange={setT1} />
          <TargetSelect alive={alive} value={t2} onChange={setT2} />
        </div>
      ) : (
        <TargetSelect alive={alive} value={t1} onChange={setT1} />
      )}
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={record}>
          Record
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRecord({ kind: "none" })}>
          Skip
        </Button>
      </div>
    </li>
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
    <select
      className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— target —</option>
      {alive.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function DayBoard() {
  const { state, dispatch } = useGame();
  const alive = state.players.filter((p) => p.alive);
  const day1 = state.nightNumber === 1;
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
      <PhaseHeader
        title={`Day ${state.nightNumber}`}
        sub={day1 ? "DEV board — day 1 is discussion only (no vote)." : "DEV board — record eliminations, then advance."}
      />
      {!day1 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {alive.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10">
              <span>{p.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch({ type: "recordDayDeath", targetId: p.id, cause: "lynched" })}
              >
                Eliminate
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-end px-4 py-3">
          <Button onClick={() => dispatch({ type: "advancePhase" })}>
            {day1 ? "Begin Night 2 →" : "Begin next night →"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function GameOver() {
  const { state, dispatch } = useGame();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">
        {state.winner ? `${state.winner[0].toUpperCase()}${state.winner.slice(1)} team wins` : "Game over"}
      </h1>
      {/* ponytail: winner screen UI is P6; this is a placeholder. */}
      <Button variant="outline" onClick={() => dispatch({ type: "resetSetup" })}>
        New game
      </Button>
    </main>
  );
}
