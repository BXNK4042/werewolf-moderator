export type Phase = "setup" | "night" | "day" | "gameover";

export type Team = "village" | "werewolf" | "vampire" | "cult" | "neutral";

export type RoleId =
  | "villager" | "werewolf" | "seer" | "apprentice-seer" | "aura-seer"
  | "beholder" | "bodyguard" | "cupid" | "the-count" | "diseased"
  | "fruit-brute" | "ghost" | "hunter" | "village-idiot" | "insomniac"
  | "lycan" | "wolf-man" | "martyr" | "tough-guy" | "troublemaker"
  | "white-wolf" | "thing" | "witch" | "sorcerer" | "minion" | "wolf-cub"
  | "dream-wolf" | "cursed" | "doppelganger" | "drunk" | "cult-leader"
  | "hoodlum" | "tanner" | "lone-wolf" | "vampire" | "little-girl"
  | "wild-child" | "sasquatch" | "leprechaun" | "bloody-mary" | "chupacabra"
  | "nostradamus" | "dire-wolf" | "fortune-teller" | "black-wolf" | "big-bad-wolf";
// ponytail: 46 roles here; MASTER_PLAN §9 lists 47 names — the Amulet of
// Protection is modeled as an Effect (type "amulet"), not a Role. ~20 roles are
// stubbed pending the Deluxe rulebook (see roles.ts).

export interface NightAction {
  defaultOrder: number; // ponytail: authored, not from the manual — it gives no
  // night-order table, only "e.g. Werewolves before Witch" (manual l.51). Queue
  // is freely reorderable at runtime; these are just a sane default.
  prompt: string;
  firstNightOnly?: boolean;
}

export interface Role {
  id: RoleId;
  name: string;
  team: Team;
  description: string;
  nightAction?: NightAction;
}

export type EffectType =
  | "protected" | "diseased" | "cursed" | "amulet" | "lover-link" | "cult"
  // once-per-game usage flags (live on the acting player):
  | "witch-heal-used" | "witch-kill-used";

export interface Effect {
  type: EffectType;
  source?: string;
  nightApplied: number;
}

export interface Player {
  id: string;
  name: string;
  roleId: RoleId | null;
  alive: boolean;
  effects: Effect[];
  diedAt?: { night: number; cause: string };
}

export interface LogEntry {
  night: number;
  phase: Phase;
  text: string;
  at: number;
}

export interface Snapshot {
  label: string;
  state: GameState;
  at: number;
}

export interface GameState {
  players: Player[];
  rolePool: RoleId[];
  phase: Phase;
  nightNumber: number;
  log: LogEntry[];
  past: Snapshot[];
  future: Snapshot[];
  winner?: Team;
  // Present only during phase==="night". Lives in state so a mid-night refresh
  // survives autosave and undo reaches inside a night.
  nightQueue?: NightQueue;
}

// A recorded outcome for one night-queue step. Mechanical kinds carry a list of
// target ids (wolves kill 1, or 2 if a Wolf Cub died; cupid links 2). `view` is
// a targeted info-only look (Seer/Sorcerer/Aura point at someone; the moderator
// announces the result aloud — nothing changes at dawn). `note` is free text
// for info with no target (Ghost message, Minion reveal, Cursed learn-if-turned).
export type NightOutcome =
  | { kind: "none" }
  | { kind: "kill"; targetIds: string[] }
  | { kind: "protect"; targetIds: string[] }
  | { kind: "convert"; targetIds: string[] }
  | { kind: "link"; targetIds: [string, string] }
  | { kind: "view"; targetIds: string[] }
  | { kind: "note"; text: string };

export interface NightStep {
  playerId: string; // real player id, or a synthetic group id ("__wolves")
  roleId: RoleId; // the role whose prompt this step shows
  prompt: string;
  outcome?: NightOutcome; // undefined until the moderator records it
}

export interface NightQueue {
  steps: NightStep[]; // ordered, freely reorderable
  cursor: number; // index of the current step
}
