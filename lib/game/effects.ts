import type { Effect, EffectType, Player } from "./types";

export function hasEffect(p: Player, type: EffectType): boolean {
  return p.effects.some((e) => e.type === type);
}

export function addEffect(
  p: Player,
  type: EffectType,
  nightApplied: number,
  source?: string,
): Player {
  if (hasEffect(p, type)) return p; // idempotent
  return { ...p, effects: [...p.effects, { type, nightApplied, source }] };
}

export function removeEffect(p: Player, type: EffectType): Player {
  if (!hasEffect(p, type)) return p;
  return { ...p, effects: p.effects.filter((e) => e.type !== type) };
}

// ponytail: clears one-shot nightly protections (Bodyguard "not the same target
// two nights"). We drop `protected` each dawn; per-night-repeat rules therefore
// rely on the moderator, not on multi-night history — upgrade if it bites.
export function clearNightProtections(p: Player): Player {
  return removeEffect(p, "protected");
}

export function effectAt(p: Player, type: EffectType): Effect | undefined {
  return p.effects.find((e) => e.type === type);
}

function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("effects selfCheck failed: " + msg);
  };
  let p: Player = {
    id: "a",
    name: "A",
    roleId: "villager",
    alive: true,
    effects: [],
  };

  assert(!hasEffect(p, "protected"), "empty → no effect");
  p = addEffect(p, "protected", 1);
  assert(hasEffect(p, "protected"), "added");
  p = addEffect(p, "protected", 2); // idempotent
  assert(p.effects.length === 1, "idempotent add");
  p = removeEffect(p, "cult"); // absent → no-op
  assert(hasEffect(p, "protected"), "unrelated remove is no-op");
  p = clearNightProtections(p);
  assert(!hasEffect(p, "protected"), "cleared protection");
  p = addEffect(p, "cult", 3, "cult-leader");
  assert(effectAt(p, "cult")?.source === "cult-leader", "source preserved");

  console.log("[effects] selfCheck ok");
}

if (process.env.NODE_ENV !== "production") selfCheck();
