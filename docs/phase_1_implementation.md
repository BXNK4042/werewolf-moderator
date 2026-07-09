# Phase 1 · Domain — Implementation Record

Status: **complete**. Commit `826c06e`. `npm run typecheck` and `npm run build` both clean.

P1 delivered the pure domain layer (no React, no engine): the role registry, the
typed data model, and the win-condition matrix. Everything below is sourced and
verifiable from the working tree.

---

## 1. Critical finding that shaped this phase

`docs/ultimate_werewolf_manual.txt` is the **base *Ultimate Werewolf* manual**, not
the *Ultimate Deluxe Edition*. It describes only ~26 of the 45(ish) Deluxe roles
(it even includes base-game roles Deluxe dropped: Masons, Mayor, Old Hag, Pacifist,
Paranormal Investigator, Priest, Prince, Spellcaster, Sorceress). The committed PDF
was removed and the text renamed to lowercase — that rename is still **uncommitted**
(`docs/Ultimate-Werewolf-Manual.{pdf,txt}` deleted, `docs/ultimate_werewolf_manual.txt`
untracked) and should be committed separately.

Consequence: ~20 Deluxe roles have **no authoritative text in-repo**. Per the agreed
decision, those are stubbed (team only) and `ponytail:`-tagged so P2/P3 can proceed.
They get upgraded to verified powers only when the real Deluxe rulebook is added to
`docs/`.

---

## 2. Files

| File | Change | Purpose |
|---|---|---|
| `lib/game/types.ts` | modified | `RoleId` literal union (46); `Role` + `NightAction` interfaces; `Effect.type` → `EffectType` union |
| `lib/game/roles.ts` | new | The 46-role registry + helpers |
| `lib/game/win-conditions.ts` | new | `checkWinner()` matrix + dev self-check |
| `package.json` | modified | `npm run typecheck` (`tsc --noEmit`) |
| `AGENTS.md` | modified | recorded the `typecheck` command |

Deliberately **not** created in P1 (they are P3/P5, YAGNI): `engine.ts`, `effects.ts`,
`reducer.ts`, `history.ts`, `storage.ts`.

---

## 3. Data model (`lib/game/types.ts`)

```ts
type RoleId = /* 46 kebab-case ids, e.g. "apprentice-seer" */;

interface NightAction {
  defaultOrder: number;   // authored — manual gives no night-order table
  prompt: string;
  firstNightOnly?: boolean;
}

interface Role {
  id: RoleId; name: string; team: Team;
  description: string;
  nightAction?: NightAction;
}

type EffectType = "protected" | "diseased" | "cursed" | "amulet" | "lover-link" | "cult";
```

The `RoleId` union is the single source of truth. The registry is checked against it
at compile time via `as const satisfies Record<RoleId, Role>` in `roles.ts`, so a
missing, extra, or misspelled role is a hard type error — that is the real P1 gate.

---

## 4. Role registry (`lib/game/roles.ts`)

46 roles. Roster reconciliation: `MASTER_PLAN.md` §9 lists **47** names; the **Amulet
of Protection** is an item (modeled as `EffectType "amulet"`), not a role → **46
roles + 1 item**. "Sorcerer" is the manual's "Sorceress"; "Vampire" is the manual's
"Vampires" (Deluxe renames).

### Sourced (26) — full description + team from the manual

| Team | Roles |
|---|---|
| village (18) | Villager, Seer, Apprentice Seer, Aura Seer, Bodyguard, Cupid, Diseased, Ghost, Hunter, Village Idiot, Lycan, Tough Guy, Troublemaker, Witch, Hoodlum, Doppelgänger, Drunk, Cursed |
| werewolf (5) | Werewolf, Sorcerer, Minion, Wolf Cub, Lone Wolf |
| cult (1) | Cult Leader |
| neutral (1) | Tanner |
| vampire (1) | Vampire |

### Stubbed (20) — team from stable canon, `ponytail:` placeholder description

| Team | Roles |
|---|---|
| village (6) | Beholder, Insomniac, Martyr, Little Girl, Wild Child, Fortune Teller |
| werewolf (7) | Fruit Brute, Wolf Man, White Wolf, Dream Wolf, Dire Wolf, Black Wolf, Big Bad Wolf |
| vampire (3) | The Count, Bloody Mary, Chupacabra |
| neutral (4) | Thing, Sasquatch, Leprechaun, Nostradamus |

Every stub carries `// ponytail: stub — team/description unverified, pending Deluxe
rulebook.` Teams are best-known canon so P2 setup validation works, but powers are
unverified.

### Exports

```ts
export const ROLES;                 // Record<RoleId, Role>
export const ROLE_LIST: Role[];     // Object.values(ROLES)
export const getRole(id): Role;
export const rolesByTeam(team): Role[];
```

### Night order

The manual lists **no** night-order table — only "e.g. Werewolves before Witch"
(`ultimate_werewolf_manual.txt` l.51). `defaultOrder` numbers are authored by us into
sensible tiers and the queue is freely reorderable at runtime (P3). Tagged
`ponytail:` in `types.ts`. Tier scheme:

| Range | Phase roles |
|---|---|
| 10–19 | first-night identity/link (Doppelgänger 10, Cupid 12, Hoodlum 14, Minion 16) |
| 20–29 | nightly info (Cursed 20) |
| 40–49 | werewolf pack + Vampire kills (Wolf Cub 40, Lone Wolf 41, Werewolf 42, Vampire 43) |
| 50–59 | seeing roles (Seer 50, Sorcerer 51, Aura Seer 52, Apprentice Seer 53) |
| 60–69 | conversion (Cult Leader 60) |
| 70–79 | misc powers (Troublemaker 70) |
| 80–89 | reveals (Drunk 80) |
| 90–99 | protection/resolution (Bodyguard 90, Witch 95, Ghost 98) |

19 roles carry a `nightAction`. The 7 passive/reactive sourced roles (Villager,
Diseased, Hunter, Village Idiot, Lycan, Tough Guy, Tanner) and all 20 stubs have none.

---

## 5. Win-condition matrix (`lib/game/win-conditions.ts`)

```ts
export interface WinResult { winner?: Team; sideWins: RoleId[] }
export function checkWinner(state: GameState): WinResult
```

Pure function, no React. Conditions implemented (all sourced from the manual):

| Condition | Source | Rule |
|---|---|---|
| Village | l.7 | no alive Werewolf **and** no alive Vampire |
| Werewolves | l.7, l.189 | wolves ≥ non-wolves **and** no alive Vampire (3-team: must clear rival predator) |
| Vampires | l.189 | vamps ≥ non-vamps **and** no alive Werewolf |
| Cult | l.139 | every surviving player is in the cult (role or `cult` effect) |
| Tanner | l.183 | dead Tanner → `sideWins` includes `"tanner"`; **game continues** |

`sideWins` exists specifically because the Tanner wins on death without ending the
game — the matrix must report a side-win that does not set `winner`.

### Deferred to P3 (need first-night target / effect data not yet wired)

| Override | Source | Why deferred |
|---|---|---|
| Lone Wolf | l.157 | last-standing / parity-1 needs the lone-wolf identity tracked across resolutions |
| Hoodlum | l.153 | needs the two first-night marks stored per player |
| Cupid soulmates | l.141 | needs `lover-link` effect + team-of-each-soulmate; different-team pair wins as last two, overriding other conditions |

All three are tagged `ponytail:` at the fallback return in `checkWinner`.

### Self-check

A `selfCheck()` exercises 5 fixtures (village win, werewolf parity, rival-predator
no-winner, cult growth, dead-Tanner side-win alongside a team win). It runs on import
when `NODE_ENV !== "production"`, so it fires under `next dev` and is a no-op in
`next build`/production. (Raw `node` can't run it directly because the repo uses
bundler-style extensionless imports — same convention as the rest of the app.)

---

## 6. Verification

- `npm run typecheck` — clean. This is the P1 gate; `satisfies Record<RoleId, Role>`
  guarantees the registry matches the `RoleId` union exactly.
- `npm run build` — clean (Next 16, Turbopack).
- Structural counts confirmed: 46 role entries, 20 stubs (→ 26 sourced), 19 night
  actions, no duplicate ids.

---

## 7. What unblocks / what's next

- **P2 (Setup flow)** can consume `ROLE_LIST` / `rolesByTeam` / `getRole` for the
  role picker, and `Team` for grouping. Validation (players == roles, sane wolf
  count) works now even on stubbed roles since teams are assigned.
- **P3 (Engine)** will wire `nightAction.defaultOrder` into the guided queue and
  implement the three deferred win overrides once target/effect state exists.
- **Upgrading the 20 stubs** requires only dropping the real Deluxe rulebook into
  `docs/` and filling `description` / `team` / `nightAction` per role, removing each
  `ponytail: stub` tag.
