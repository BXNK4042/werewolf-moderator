"use client";

import { Check, Minus } from "lucide-react";
import { ROLE_LIST, getRole } from "@/lib/game/roles";
import type { RoleId, Team } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { countRole } from "@/lib/game/setup";
import { useGame } from "@/lib/hooks/use-game";
import {
  TEAM_ORDER,
  TEAM_LABEL,
  TEAM_DOT,
  TEAM_RING,
} from "@/lib/game/team-style";
import { roleArt } from "@/lib/game/role-art";

export function RolePicker() {
  return (
    <div className="flex flex-col gap-3">
      {TEAM_ORDER.map((team) => {
        const roleIds = ROLE_LIST.filter((r) => r.team === team).map(
          (r) => r.id,
        );
        return <TeamSection key={team} team={team} roleIds={roleIds} />;
      })}
    </div>
  );
}

function TeamSection({
  team,
  roleIds,
}: {
  team: Team;
  roleIds: RoleId[];
}) {
  const { state } = useGame();
  const teamCount = roleIds.reduce(
    (sum, id) => sum + countRole(state, id),
    0,
  );
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="sticky top-0 z-[1] flex items-center justify-between bg-background/95 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", TEAM_DOT[team])} />
          {TEAM_LABEL[team]}
        </span>
        <Badge variant="secondary">{teamCount}</Badge>
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {roleIds.map((id) => (
          <RoleTile key={id} roleId={id} team={team} />
        ))}
      </div>
    </section>
  );
}

function RoleTile({ roleId, team }: { roleId: RoleId; team: Team }) {
  const { state, dispatch } = useGame();
  const count = countRole(state, roleId);
  const role = getRole(roleId);
  const art = roleArt(roleId);
  const selected = count > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      title={role.description}
      aria-label={`${role.name}, count ${count}, tap to add`}
      onClick={() => dispatch({ type: "addRole", roleId })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dispatch({ type: "addRole", roleId });
        }
      }}
      className={cn(
        "group relative aspect-[3/4] cursor-pointer select-none overflow-hidden rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? cn("shadow-glow ring-2", TEAM_RING[team])
          : "shadow-elevated ring-1 ring-foreground/10 hover:-translate-y-0.5 hover:ring-foreground/30",
      )}
    >
      {art ? (
        // ponytail: native <img> over next/image — local-only tool, 26 small
        // PNGs, no loader config; swap if bundle/optimization ever matters.
        <img
          src={art}
          alt={role.name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-2xl font-semibold text-muted-foreground">
            {role.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-1.5 pb-1 pt-4">
        <span className="line-clamp-1 text-xs font-medium text-white">
          {role.name}
        </span>
      </div>

      {selected && (
        <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-primary-foreground shadow">
          <Check className="size-2.5" /> {count}
        </span>
      )}

      <Button
        size="icon-xs"
        variant="secondary"
        disabled={count === 0}
        aria-label={`Remove ${role.name}`}
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: "removeRole", roleId });
        }}
        className={cn(
          "absolute bottom-1 right-1 size-9 rounded-full shadow transition-opacity",
          count > 0 ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Minus />
      </Button>
    </div>
  );
}
