import type { RoleId } from "./types";

// Roles with shipped art at /public/characters/<id>.png. Filenames were
// normalized to RoleId slugs on move (Sorceress→sorcerer, Vampires→vampire,
// Villagers→villager). 8 images (Masons, Mayor, …) await their roles.ts
// entries; 20 slug-roles have no art yet and fall back to a team monogram.
export const HAS_ART: ReadonlySet<RoleId> = new Set<RoleId>([
  "apprentice-seer", "aura-seer", "bodyguard", "cult-leader", "cupid",
  "cursed", "diseased", "doppelganger", "drunk", "ghost", "hoodlum", "hunter",
  "lone-wolf", "lycan", "minion", "seer", "sorcerer", "tanner", "tough-guy",
  "troublemaker", "vampire", "village-idiot", "villager", "werewolf", "witch",
  "wolf-cub",
]);

export const roleArt = (id: RoleId): string | null =>
  HAS_ART.has(id) ? `/characters/${id}.png` : null;
