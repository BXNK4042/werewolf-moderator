"use client";

import { HeartPulse, RotateCcw, Skull, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/hooks/use-game";
import { getRole, ROLE_LIST } from "@/lib/game/roles";
import { TEAM_DOT, TEAM_LABEL, TEAM_ORDER } from "@/lib/game/team-style";
import type { EffectType, Player, RoleId } from "@/lib/game/types";

const ALL_EFFECTS: EffectType[] = [
  "protected",
  "diseased",
  "cursed",
  "amulet",
  "lover-link",
  "cult",
  "witch-heal-used",
  "witch-kill-used",
];

export function PlayerSheet({
  player,
  open,
  onOpenChange,
}: {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] gap-0">
        {player && <Body key={player.id} player={player} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ player }: { player: Player }) {
  const { state, dispatch } = useGame();
  // Re-read the live player so overrides update the sheet instantly.
  const live = state.players.find((p) => p.id === player.id) ?? player;
  const role = live.roleId ? getRole(live.roleId) : null;

  return (
    <div className="flex flex-col overflow-y-auto">
      <SheetHeader className="flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <SheetTitle className="flex items-center gap-1.5">
            {role && (
              <span className={cn("size-2.5 rounded-full", TEAM_DOT[role.team])} />
            )}
            <span className={!live.alive ? "line-through opacity-60" : ""}>
              {live.name}
            </span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {role ? `${role.name} · ${TEAM_LABEL[role.team]}` : "No role"}
            {!live.alive && live.diedAt && ` · died N${live.diedAt.night} (${live.diedAt.cause})`}
          </p>
        </div>
        <Badge variant={live.alive ? "secondary" : "outline"}>
          {live.alive ? "Alive" : "Dead"}
        </Badge>
      </SheetHeader>

      {role && (
        <p className="px-4 pb-2 text-xs leading-relaxed text-muted-foreground">
          {role.description}
        </p>
      )}

      {/* Effects */}
      <Section title="Effects">
        {live.effects.length === 0 ? (
          <p className="text-xs text-muted-foreground">None.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {live.effects.map((e, i) => (
              <Badge key={i} variant="secondary" className="gap-1 capitalize">
                {e.type.replace(/-/g, " ")}
                <button
                  type="button"
                  className="opacity-60 hover:opacity-100"
                  aria-label={`Remove ${e.type}`}
                  onClick={() =>
                    dispatch({ type: "removeEffect", targetId: live.id, effect: e.type })
                  }
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <label className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          Add:
          <select
            className="flex-1 rounded border border-border bg-background px-1.5 py-1 text-xs"
            value=""
            onChange={(e) => {
              if (e.target.value)
                dispatch({
                  type: "addEffect",
                  targetId: live.id,
                  effect: e.target.value as EffectType,
                });
            }}
          >
            <option value="">— select —</option>
            {ALL_EFFECTS.map((e) => (
              <option key={e} value={e} className="capitalize">
                {e.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </Section>

      {/* Role change */}
      <Section title="Role">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <select
            className="flex-1 rounded border border-border bg-background px-1.5 py-1 text-xs"
            value={live.roleId ?? ""}
            onChange={(e) =>
              dispatch({
                type: "setRole",
                targetId: live.id,
                roleId: e.target.value as RoleId,
              })
            }
          >
            {!live.roleId && <option value="">— none —</option>}
            {TEAM_ORDER.map((team) => (
              <optgroup key={team} label={TEAM_LABEL[team]}>
                {ROLE_LIST.filter((r) => r.team === team).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </Section>

      {/* Life overrides */}
      <Section title="Override">
        <div className="flex gap-1.5">
          {live.alive ? (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() =>
                dispatch({ type: "killPlayer", targetId: live.id, cause: "override" })
              }
            >
              <Skull className="size-3.5" /> Kill
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => dispatch({ type: "revivePlayer", targetId: live.id })}
            >
              <HeartPulse className="size-3.5" /> Revive
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              dispatch({
                type: "removeEffect",
                targetId: live.id,
                effect: "diseased",
              })
            }
            title="Clear protections"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border px-4 py-3">
      <h3 className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
