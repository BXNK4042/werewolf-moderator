import type { Team } from "./types";

export const TEAM_ORDER: Team[] = [
  "village",
  "werewolf",
  "vampire",
  "cult",
  "neutral",
];

export const TEAM_LABEL: Record<Team, string> = {
  village: "Village",
  werewolf: "Werewolves",
  vampire: "Vampires",
  cult: "Cult",
  neutral: "Neutral",
};

export const TEAM_DOT: Record<Team, string> = {
  village: "bg-emerald-500",
  werewolf: "bg-red-500",
  vampire: "bg-purple-500",
  cult: "bg-amber-500",
  neutral: "bg-zinc-400",
};
