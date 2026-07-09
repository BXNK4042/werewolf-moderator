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
  | "protected" | "diseased" | "cursed" | "amulet" | "lover-link" | "cult";

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
}
