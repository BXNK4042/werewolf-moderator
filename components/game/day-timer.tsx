"use client";

import { useEffect, useState } from "react";
import { BellRing, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS = [1, 2, 5, 10];

type Status = "idle" | "running" | "paused" | "done";

// ponytail: synthesized beep via Web Audio — no asset file or dependency. Swap
// for public/*.mp3 if a richer sound is wanted.
function beep(times = 3) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const t = ctx.currentTime + i * 0.45;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t);
      o.stop(t + 0.36);
    }
    setTimeout(() => ctx.close(), times * 450 + 200);
  } catch {
    // AudioContext unavailable — visual "done" state still fires.
  }
}

function fmt(totalMs: number) {
  const s = Math.max(0, Math.ceil(totalMs / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function DayTimer() {
  const [status, setStatus] = useState<Status>("idle");
  const [durationMin, setDurationMin] = useState(2);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [leftoverMs, setLeftoverMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const durationMs = durationMin * 60_000;

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const remainingMs =
    status === "running" && endAt != null
      ? endAt - now
      : status === "done"
        ? 0
        : (leftoverMs ?? durationMs);

  useEffect(() => {
    if (status === "running" && remainingMs <= 0) {
      setStatus("done");
      setEndAt(null);
      setLeftoverMs(null);
      beep();
    }
  }, [status, remainingMs]);

  const start = () => {
    const base = leftoverMs ?? durationMs;
    setEndAt(Date.now() + base);
    setLeftoverMs(null);
    setStatus("running");
  };
  const pause = () => {
    if (endAt == null) return;
    setLeftoverMs(Math.max(0, endAt - Date.now()));
    setEndAt(null);
    setStatus("paused");
  };
  const reset = () => {
    setEndAt(null);
    setLeftoverMs(null);
    setStatus("idle");
  };

  const pct = Math.max(0, Math.min(1, remainingMs / durationMs));

  return (
    <div
      className={cn(
        "mb-2 rounded-xl border bg-card p-3 shadow-elevated",
        status === "done" ? "animate-pulse border-destructive/60" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span
            className={cn(
              "font-mono text-3xl leading-none tabular-nums",
              status === "done" ? "text-destructive" : "text-foreground",
            )}
          >
            {fmt(remainingMs)}
          </span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {status === "done" ? (
              <span className="text-destructive">
                <BellRing className="size-3" /> Time&apos;s up — advance when ready
              </span>
            ) : status === "paused" ? (
              "Paused"
            ) : (
              "Discussion timer"
            )}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {status === "idle" && (
            <Button onClick={start}>
              <Play className="size-4" /> Start
            </Button>
          )}
          {status === "running" && (
            <Button variant="secondary" onClick={pause}>
              <Pause className="size-4" /> Pause
            </Button>
          )}
          {status === "paused" && (
            <>
              <Button onClick={start}>
                <Play className="size-4" /> Resume
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={reset}
                aria-label="Reset timer"
              >
                <RotateCcw className="size-4" />
              </Button>
            </>
          )}
          {status === "done" && (
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          )}
        </div>
      </div>

      {status !== "idle" && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200 ease-linear",
              status === "done" ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}

      {status === "idle" && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {PRESETS.map((m) => (
            <Button
              key={m}
              variant={durationMin === m ? "default" : "outline"}
              size="sm"
              onClick={() => setDurationMin(m)}
            >
              {m} min
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={60}
              value={durationMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= 60) setDurationMin(v);
              }}
              className="h-7 w-16 text-center"
              aria-label="Custom minutes"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      )}
    </div>
  );
}
