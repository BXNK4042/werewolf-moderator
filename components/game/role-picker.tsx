"use client";

import { Minus, Plus } from "lucide-react";
import { ROLE_LIST, getRole } from "@/lib/game/roles";
import type { RoleId, Team } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { countRole } from "@/lib/game/setup";
import { useGame } from "@/lib/hooks/use-game";
import { TEAM_ORDER, TEAM_LABEL, TEAM_DOT } from "@/lib/game/team-style";

export function RolePicker() {
  return (
    <div className="flex flex-col gap-2">
      {TEAM_ORDER.map((team) => {
        const roles = ROLE_LIST.filter((r) => r.team === team);
        return <TeamGroup key={team} team={team} roles={roles.map((r) => r.id)} />;
      })}
    </div>
  );
}

function TeamGroup({ team, roles }: { team: Team; roles: RoleId[] }) {
  const { state } = useGame();
  const teamCount = roles.reduce((sum, id) => sum + countRole(state, id), 0);
  return (
    // ponytail: native <details> — free toggle, keyboard, a11y; no JS lib.
    <details open={team === "village" || team === "werewolf"} className="rounded-lg bg-card ring-1 ring-foreground/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", TEAM_DOT[team])} />
          {TEAM_LABEL[team]}
        </span>
        <Badge variant="secondary">{teamCount}</Badge>
      </summary>
      <div className="flex flex-col border-t border-border">
        {roles.map((id) => (
          <RoleRow key={id} roleId={id} />
        ))}
      </div>
    </details>
  );
}

function RoleRow({ roleId }: { roleId: RoleId }) {
  const { state, dispatch } = useGame();
  const count = countRole(state, roleId);
  const role = getRole(roleId);
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5">
      <span className="truncate text-sm" title={role.description}>
        {role.name}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Remove ${role.name}`}
          disabled={count === 0}
          onClick={() => dispatch({ type: "removeRole", roleId })}
        >
          <Minus />
        </Button>
        <span className="w-5 text-center text-sm tabular-nums">{count}</span>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Add ${role.name}`}
          onClick={() => dispatch({ type: "addRole", roleId })}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
