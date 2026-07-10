"use client";

import { Skull, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRole } from "@/lib/game/roles";
import { TEAM_DOT } from "@/lib/game/team-style";
import { roleArt } from "@/lib/game/role-art";
import type { EffectType, Player } from "@/lib/game/types";

const EFFECT_BADGE: Partial<Record<EffectType, string>> = {
  cult: "text-amber-400",
  diseased: "text-lime-400",
  "lover-link": "text-pink-400",
  cursed: "text-red-400",
  amulet: "text-sky-400",
  "witch-heal-used": "text-emerald-400",
  "witch-kill-used": "text-red-400",
};

export function PlayerCard({
  player,
  seat,
  dayMode,
  onTap,
  onEliminate,
}: {
  player: Player;
  seat: number;
  dayMode?: boolean;
  onTap: (p: Player) => void;
  onEliminate?: (p: Player) => void;
}) {
  const role = player.roleId ? getRole(player.roleId) : null;
  const effects = player.effects.filter((e) => EFFECT_BADGE[e.type]);
  const art = player.roleId ? roleArt(player.roleId) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(player)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap(player);
        }
      }}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-2 rounded-lg bg-card p-2.5 text-left shadow-elevated ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-elevated-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !player.alive && "opacity-50",
      )}
    >
      <div className="flex gap-2.5">
        <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10 shadow-sm">
          {role && art ? (
            <img src={art} alt={role.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-2xl font-semibold text-muted-foreground">
                {role?.name.charAt(0) ?? player.name.charAt(0)}
              </span>
            </div>
          )}
          {!player.alive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <X className="size-8 text-destructive" strokeWidth={3} />
            </div>
          )}
          {role && (
            <span className="absolute left-1 top-1 flex size-3 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <span className={cn("size-2 rounded-full", TEAM_DOT[role.team])} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className={cn("truncate text-sm font-medium", !player.alive && "line-through")}>
                {player.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {seat}
              </span>
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {role?.name ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {effects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {effects.map((e, i) => (
            <span
              key={i}
              className={cn(
                "rounded bg-background/60 px-1 py-0.5 text-[0.65rem] leading-none",
                EFFECT_BADGE[e.type],
              )}
            >
              {e.type.replace(/-/g, " ").replace("used", "✓")}
            </span>
          ))}
        </div>
      )}

      {dayMode && player.alive && onEliminate && (
        <Button
          size="xs"
          variant="outline"
          className="mt-0.5 w-full"
          onClick={(e) => {
            e.stopPropagation();
            onEliminate(player);
          }}
        >
          <Skull className="size-3" /> Eliminate
        </Button>
      )}
    </div>
  );
}
