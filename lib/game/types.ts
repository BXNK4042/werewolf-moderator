export type Phase = "setup" | "night" | "day" | "gameover";

export type Team = "village" | "werewolf" | "vampire" | "cult" | "neutral";

// ponytail: minimal role/effect shapes — full powers/team/night-order encoded in P1.
export type RoleId = string;

export interface Effect {
  type: string;
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
