"use client";

import { Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRole } from "@/lib/game/roles";
import { TEAM_DOT } from "@/lib/game/team-style";
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
        "flex w-full cursor-pointer flex-col gap-1 rounded-lg bg-card p-2.5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !player.alive && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1.5 min-w-0">
          {role && (
            <span className={cn("size-2 shrink-0 rounded-full", TEAM_DOT[role.team])} />
          )}
          <span className={cn("truncate text-sm font-medium", !player.alive && "line-through")}>
            {player.name}
          </span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {seat}
        </span>
      </div>

      <span className="truncate text-xs text-muted-foreground">
        {role?.name ?? "—"}
      </span>

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

      {!player.alive && player.diedAt && (
        <span className="text-[0.65rem] text-muted-foreground">
          d. N{player.diedAt.night} · {player.diedAt.cause}
        </span>
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
