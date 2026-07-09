import type { Role, RoleId } from "./types";

// Source: docs/ultimate_werewolf_manual.txt (base Ultimate Werewolf manual).
// ponytail: the committed manual is the BASE set, not Ultimate Deluxe Edition —
// it describes ~26 of these 46 roles. The other ~20 are stubbed (team only,
// placeholder description) pending the real Deluxe rulebook; each is tagged
// below. Team is assigned from stable canon so setup/validation works, but
// powers remain unverified. "Sorcerer" ← manual "Sorceress"; "Vampire" ←
// manual "Vampires" (Deluxe renames). The Amulet of Protection is an item —
// see EffectType "amulet", not a role here.

export const ROLES = {
  villager: {
    id: "villager",
    name: "Villager",
    team: "village",
    description:
      "No special powers. Find and eliminate the Werewolves.",
  },
  werewolf: {
    id: "werewolf",
    name: "Werewolf",
    team: "werewolf",
    description:
      "Knows the other Werewolves from night 1. Each night after, the pack agrees on one victim; may not target another Werewolf.",
    nightAction: {
      defaultOrder: 42,
      prompt: "Werewolves: agree on one victim (not another Werewolf).",
    },
  },
  seer: {
    id: "seer",
    name: "Seer",
    team: "village",
    description:
      "Each night, point at a player to learn if they are a Villager or a Werewolf.",
    nightAction: {
      defaultOrder: 50,
      prompt: "Seer: point at a player to learn if they are a Villager or Werewolf.",
    },
  },
  "apprentice-seer": {
    id: "apprentice-seer",
    name: "Apprentice Seer",
    team: "village",
    description:
      "Becomes the Seer if the Seer is eliminated (Moderator taps you when the Seer is called).",
    nightAction: {
      defaultOrder: 53,
      prompt:
        "Apprentice Seer: if the Seer is dead, you are now the Seer — choose a target to view.",
    },
  },
  "aura-seer": {
    id: "aura-seer",
    name: "Aura Seer",
    team: "village",
    description:
      "Each night, learn whether a target has a special role (not a plain Villager or Werewolf).",
    nightAction: {
      defaultOrder: 52,
      prompt: "Aura Seer: point at a player to learn if they have a special role.",
    },
  },
  beholder: {
    id: "beholder",
    name: "Beholder",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  bodyguard: {
    id: "bodyguard",
    name: "Bodyguard",
    team: "village",
    description:
      "Each night, protect a different player from elimination — not the same as last night, never yourself.",
    nightAction: {
      defaultOrder: 90,
      prompt: "Bodyguard: protect a player (not the same as last night, never yourself).",
    },
  },
  cupid: {
    id: "cupid",
    name: "Cupid",
    team: "village",
    description:
      "First night, choose two players to become Soulmates. If one dies, the other dies instantly. Soulmates on different teams form their own team and win as the last two; this overrides other win conditions.",
    nightAction: {
      defaultOrder: 12,
      firstNightOnly: true,
      prompt: "Cupid: choose two players to become Soulmates.",
    },
  },
  "the-count": {
    id: "the-count",
    name: "The Count",
    team: "vampire",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  diseased: {
    id: "diseased",
    name: "Diseased",
    team: "village",
    description:
      "If the Werewolves eliminate you, they are sick and skip killing the following night.",
  },
  "fruit-brute": {
    id: "fruit-brute",
    name: "Fruit Brute",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  ghost: {
    id: "ghost",
    name: "Ghost",
    team: "village",
    description:
      "Eliminated the first night. Leave a 10-letter message, revealed one letter per day. May not name players or use initials.",
    nightAction: {
      defaultOrder: 98,
      firstNightOnly: true,
      prompt: "Ghost: write a 10-letter message (no player names or initials).",
    },
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    team: "village",
    description:
      "When eliminated (day or night), immediately point at a player to eliminate them, or fire into the air for no extra kill. If killed at night, choose the next morning.",
  },
  "village-idiot": {
    id: "village-idiot",
    name: "Village Idiot",
    team: "village",
    description:
      "Your vote always counts as a 'stay' (against elimination). Add at random so its presence is uncertain.",
  },
  insomniac: {
    id: "insomniac",
    name: "Insomniac",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  lycan: {
    id: "lycan",
    name: "Lycan",
    team: "village",
    description:
      "Appears as a Werewolf to the Seer despite being on the Village team. Add at random.",
  },
  "wolf-man": {
    id: "wolf-man",
    name: "Wolf Man",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  martyr: {
    id: "martyr",
    name: "Martyr",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "tough-guy": {
    id: "tough-guy",
    name: "Tough Guy",
    team: "village",
    description:
      "If targeted by Werewolves, you die the following night instead. Players are told no one died the night you were targeted. Woken night 1 so the Moderator can track this.",
  },
  troublemaker: {
    id: "troublemaker",
    name: "Troublemaker",
    team: "village",
    description:
      "Once per game, call for two eliminations the following day. Woken each night until used.",
    nightAction: {
      defaultOrder: 70,
      prompt:
        "Troublemaker: use your once-per-game power to call for two eliminations tomorrow? (Yes/No)",
    },
  },
  "white-wolf": {
    id: "white-wolf",
    name: "White Wolf",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  thing: {
    id: "thing",
    name: "Thing",
    team: "neutral",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  witch: {
    id: "witch",
    name: "Witch",
    team: "village",
    description:
      "Has one save (prevent a night kill) and one kill (eliminate any player), each usable once per game. Called every night; may use either or both.",
    nightAction: {
      defaultOrder: 95,
      prompt: "Witch: use your save and/or your kill? (Each usable once per game.)",
    },
  },
  sorcerer: {
    id: "sorcerer",
    name: "Sorcerer",
    team: "werewolf",
    description:
      "Each night, look for the Seer (Moderator confirms if your target is the Seer). Werewolf-team, but unknown to the Werewolves.",
    // ponytail: manual names this role "Sorceress"; Deluxe renames to "Sorcerer".
    nightAction: {
      defaultOrder: 51,
      prompt: "Sorcerer: point at a player — learn if they are the Seer.",
    },
  },
  minion: {
    id: "minion",
    name: "Minion",
    team: "werewolf",
    description:
      "First night, join the Werewolf team and learn who the Werewolves are (you don't wake with them). Seer sees you as a Villager.",
    nightAction: {
      defaultOrder: 16,
      firstNightOnly: true,
      prompt:
        "Minion: learn who the Werewolves are (you join their team, but don't wake with them).",
    },
  },
  "wolf-cub": {
    id: "wolf-cub",
    name: "Wolf Cub",
    team: "werewolf",
    description:
      "A Werewolf; wakes with the pack each night. If you die, Werewolves kill two players the next night.",
    nightAction: {
      defaultOrder: 40,
      prompt: "Wolf Cub: wake with the Werewolves and choose a victim.",
    },
  },
  "dream-wolf": {
    id: "dream-wolf",
    name: "Dream Wolf",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  cursed: {
    id: "cursed",
    name: "Cursed",
    team: "village",
    description:
      "Village team, unless targeted by Werewolves — then you join the Werewolves instead of dying. Woken each night to learn if you turned.",
    nightAction: {
      defaultOrder: 20,
      prompt: "Cursed: wake to learn whether you've been turned to the Werewolf team.",
    },
  },
  doppelganger: {
    id: "doppelganger",
    name: "Doppelgänger",
    team: "village",
    description:
      "First night, choose a player. If they die, you secretly become their role. Village team until then; if you become a Werewolf, you join that team.",
    nightAction: {
      defaultOrder: 10,
      firstNightOnly: true,
      prompt:
        "Doppelgänger: choose a player. If they die, you become their role.",
    },
  },
  drunk: {
    id: "drunk",
    name: "Drunk",
    team: "village",
    description:
      "Thinks they're a Villager for two days. On night 3, the Moderator reveals your real (pre-set) role. Seer sees your real role throughout.",
    nightAction: {
      defaultOrder: 80,
      prompt: "Night 3: wake the Drunk and reveal their real role.",
    },
  },
  "cult-leader": {
    id: "cult-leader",
    name: "Cult Leader",
    team: "cult",
    description:
      "Each night, add a player to the cult (they don't know). You win only if all surviving players are in the cult. Other teams' win conditions still apply.",
    nightAction: {
      defaultOrder: 60,
      prompt: "Cult Leader: choose a player to add to the cult.",
    },
  },
  hoodlum: {
    id: "hoodlum",
    name: "Hoodlum",
    team: "village",
    description:
      "First night, mark two players. You win only if both are eliminated by game's end and you're still alive (you still need the Village to win).",
    nightAction: {
      defaultOrder: 14,
      firstNightOnly: true,
      prompt:
        "Hoodlum: choose two players — you win only if both are eliminated while you survive.",
    },
  },
  tanner: {
    id: "tanner",
    name: "Tanner",
    team: "neutral",
    description:
      "You win only if you are eliminated. Other win conditions still apply; the game continues after you win.",
  },
  "lone-wolf": {
    id: "lone-wolf",
    name: "Lone Wolf",
    team: "werewolf",
    description:
      "Werewolf who wakes with the pack each night. You only win if you're the last player standing (or at parity with one non-Werewolf). Add at random.",
    nightAction: {
      defaultOrder: 41,
      prompt: "Lone Wolf: wake with the Werewolves and choose a victim.",
    },
  },
  vampire: {
    id: "vampire",
    name: "Vampire",
    team: "vampire",
    description:
      "Third team. Each night, choose a victim (revealed only when an accusation occurs). Can't be killed by Werewolves. Must eliminate the other two teams to win.",
    // ponytail: manual names this role "Vampires"; Deluxe renames to "Vampire".
    nightAction: {
      defaultOrder: 43,
      prompt: "Vampires: choose a victim (eliminated when next accused).",
    },
  },
  "little-girl": {
    id: "little-girl",
    name: "Little Girl",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "wild-child": {
    id: "wild-child",
    name: "Wild Child",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  sasquatch: {
    id: "sasquatch",
    name: "Sasquatch",
    team: "neutral",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  leprechaun: {
    id: "leprechaun",
    name: "Leprechaun",
    team: "neutral",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "bloody-mary": {
    id: "bloody-mary",
    name: "Bloody Mary",
    team: "vampire",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  chupacabra: {
    id: "chupacabra",
    name: "Chupacabra",
    team: "vampire",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  nostradamus: {
    id: "nostradamus",
    name: "Nostradamus",
    team: "neutral",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "dire-wolf": {
    id: "dire-wolf",
    name: "Dire Wolf",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "fortune-teller": {
    id: "fortune-teller",
    name: "Fortune Teller",
    team: "village",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "black-wolf": {
    id: "black-wolf",
    name: "Black Wolf",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
  "big-bad-wolf": {
    id: "big-bad-wolf",
    name: "Big Bad Wolf",
    team: "werewolf",
    description: "Pending Deluxe rulebook review.",
    // ponytail: stub — team/description unverified, pending Deluxe rulebook.
  },
} as const satisfies Record<RoleId, Role>;

export const ROLE_LIST: Role[] = Object.values(ROLES);

export const getRole = (id: RoleId): Role => ROLES[id];

export const rolesByTeam = (team: Role["team"]): Role[] =>
  ROLE_LIST.filter((r) => r.team === team);
