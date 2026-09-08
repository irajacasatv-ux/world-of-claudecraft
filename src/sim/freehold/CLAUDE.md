# src/sim/freehold - Freeholds and Guildhalls (player housing)

Host-agnostic housing state and commands: the live freehold record, its load,
snapshot and evict lifecycle, the owner-keyed claim on the dungeon slot pool,
and the command bodies the `IWorldHousing` facet delegates into. The record is
keyed by an OWNER key (D16) that never reaches the wire; the public descriptor
carries an opaque plot id only.

- `owner_key.ts` owns the OWNER KEY (D15): `freeholdOwnerKeyOfMeta` (the host
  stamp `meta.freeholdOwnerKey`, `account:<id>` online, else the `entity:<pid>`
  fallback resolved AT READ TIME) and `freeholdKeyFor(ctx, pid)` over the live
  roster. The `entity:<pid>` key is stable within ONE Sim only: the offline
  pid is minted after the world roster, so any content change that spawns an
  entity before the player shifts it. The persistence slice must never key a
  durable row on it (the online key is the account id; an offline durable
  identity, if one is ever wanted, needs a `character:<id>` arm like
  `instanceKeyFor`'s `solo:char:<id>`). A LEAF with type-only imports, and
  deliberately so:
  `instances/dungeons.ts` resolves an owner claim's key from here, never from
  `instance.ts`, so the dungeon module's import graph never pulls this
  directory's runtime modules in.
- `instance.ts` owns the claim: `enterFreehold` (dead, in combat, no record
  or an unusable one, then a full pool answer `dead` / `combat` /
  `no_freehold` / `busy` as exactly one text-free `freeholdDenied` each, with
  nothing moved, claimed or drawn; `busy` is decided HERE, before the dungeon
  module is asked, so its English "instances are busy" error can never fire
  for a freehold). THE CORPSE RUN is `dead`'s one exception, the dungeon
  idiom: a released ghost whose corpse is bound (corpseInstanceId) to the
  caller's OWN live claim of the record's current tier is admitted and
  resurrects at the entrance; a fresh corpse, a ghost bound elsewhere or to a
  room the reaper already freed, and a ghost with no record refuse `dead`.
  A record whose tier is outside the union (a corrupt or forward-version row)
  answers `no_freehold`, never a throw. `leaveFreehold` is false and silent
  unless the caller stands inside a live owner claim (a leave from anywhere
  else is a no-op, not a denial: D10 covers denials of an entry or a
  mutation), and ANY player inside a live owner claim may leave, not only
  its owner (the room's exit is the one way out for a sibling, a later guest
  or a body a dead relog placed there). `freeholdDefForTier` is the
  tier-to-room map, exhaustive over the tier union (the four later tiers
  alias the Cottage until their rooms land), and `freeholdDescriptorFor` a
  VALUE COPY with no owner key in it, exported for the descriptor emit of a
  later slice and reached by tests only until then. It reaches the dungeon machinery ONLY through the seam
  (`ctx.enterDungeon` / `ctx.leaveDungeon` / `ctx.instanceClaimIdAt`) and
  reads the rooms from `content/freehold`, never from `instances/dungeons.ts`
  or `data.ts`. That is the seam rule itself (a system module talks to another
  system through `SimContext`, not by import), and the import graph makes it a
  near-cycle besides: `instances/heroic_vendor.ts` and three `professions/`
  modules import this directory's barrel, so a freehold -> `instances/dungeons`
  edge would sit one import away from a loop through the barrel (the
  `pvp/index.ts` rule).
- THE TIER-CHANGE RULE lives in `instances/dungeons.ts`, not here: once an
  owner has arrived in the room of its current tier, `enterDungeon` frees every
  other owner-keyed room still claimed under the same owner key unless a
  player stands inside it (pinned in `tests/freehold_instance.test.ts`). The
  guard is the room's `claimKey`, never the key string, so party and solo
  claims are untouched.
- THE LIGHTING RULING: the claim slice adds no proximity, cast, cooldown or
  position-context gate (an out-of-combat player anywhere, including inside
  another dungeon claim, a delve, a rift, a battleground, an arena, a duel
  or a jail visit, could enter and leave to the Eastbrook quay, and an enter
  from inside another instance runs none of that instance's detach
  bookkeeping), so `FREEHOLDS_ENABLED` stays dark on the realm until the
  interiors slice lands the Eastbrook gate proximity confirm (also the
  position-context guard, in the SIM on both hosts: the gate stands on open
  overworld ground), the Hearth Key context refusals and the enter cooldown
  that bounds the interest-set churn each cross-band teleport costs every
  nearby viewer. The offline host is lit today, single-player only.
- `dev_grant.ts` owns `/dev freehold <tier>` (D24/D81): `devGrantFreeholdTier`
  needs BOTH `ctx.devCommands` AND `ctx.freeholdDevGrantEnabled` (else
  `unauthorized`, nothing written), validates the tier through the content
  tier table (`bad_tier` for an unknown id and for a not-yet-authored tier
  alike) and writes through the one tier writer. `dev_commands.ts` keeps only
  the thin chat arm and its `[dev]` dev-channel text.
- THE ONE-WRITER RULES: `state.ts` is the only file that writes
  `ctx.freeholds` (`loadFreehold`, `ensureFreeholdRecord`, `evictFreehold` and
  the join/leave hooks over them) or a record's `tier` (`setFreeholdTier`,
  pinned by a source scan in `tests/freehold_dev_grant.test.ts`), and
  `applyFreeholdOwnerStamp` there is the only writer of the host owner stamp
  on `PlayerMeta` (called once, from `addPlayer`, through
  `seedFreeholdOnJoin`). Every later grant, upgrade or load goes through
  those, never through a second assignment site.
- THE FLAG RULING (recorded in `commands.ts`): the server dispatch gate is the
  ONE gate; no command body re-checks `ctx.freeholdsEnabled`. The sim honors
  the flag in one place, the two record INSERTERS in `state.ts`
  (`loadFreehold`, `ensureFreeholdRecord`): both insert nothing on a dark
  host, so neither the `addPlayer` seed today nor a persistence loader later
  can seed a dark realm, every dark enter answers `no_freehold`, and there is
  no second gate to drift. `seedFreeholdOnJoin` still applies the host stamp
  on a dark host, so a later lit read sees the right key.
- RETENTION: `seedFreeholdOnJoin` is the first record inserter, and
  `releaseFreeholdOnLeave` (from `removePlayer`, while the leaver is still on
  the roster) is its paired evict: the record goes ONLY when no other live
  player shares the owner key (two characters of one account share one
  record; the last session out evicts). The roster walk there is a pure
  existence check, so its iteration order cannot matter; the Map iteration
  rule below still binds anything that walks `ctx.freeholds` itself. On a lit
  host every leave walks the roster once (every joining player holds a
  record, bots and RL agents included, which `ctx.freeholds.size` counts);
  an owner-key to live-session-count index kept by the same two hooks is the
  named O(1) shape for the persistence slice, which reshapes both hooks. The
  server's linkdead displacement seeds the replacement BEFORE the evict of
  the displaced session runs (its leave awaits twice before removePlayer),
  and the evict is a no-op only because the sibling scan finds the new
  session; persistence must not inherit that ordering.

- `types.ts` owns the shared shapes (`FreeholdState`, the public
  `FreeholdView` and `FreeholdLayoutView`, the tier and visit-policy unions).
  Data only: no logic, no `SimContext`, so the server row mapper and the wire
  import the same names. Names may gain members later and are never renamed.
- `should_spawn_npc.ts` owns surface NPC admission: dynamic definitions stay
  excluded, and the furnisher requires the host opt-in. It reads no live state
  and draws nothing; `surface_npc_bootstrap.ts` applies it during construction.
- `crafted_availability.ts` owns `isFreeholdCraftAvailable`, the content-identity
  predicate used by recipe acquisition, training, crafting, vendor admission and
  presentation. It receives the host opt-in as a value and reads no live world,
  so catalog identities and saved ownership remain available on a dark host.
- `state.ts` owns the record lifecycle over the live `ctx.freeholds` map on
  the `guild_bank.ts` idiom: `defaultFreeholdState` (every account's tier-0
  Inn Room), `loadFreehold` (the ONE load path, load-once, an empty owner key
  ignored), `serializeFreehold` (a value copy, null when nothing is loaded so
  the persistence caller skips the write) and `evictFreehold` (the sanctioned
  drop). It must stay pure: no SQL, no rng, no clock; the server owns rows.
  Retention: the map is keyed by owner and grows with every load, so the
  first `loadFreehold` caller pairs with `evictFreehold` at account or
  character unload in the same change, and the table's prune registers in
  `server/retention_sweep.ts` when its DDL lands.
  DETERMINISM, before anyone iterates it: `ctx.freeholds` is a `Map`, so it
  walks in INSERTION order, and once 07 feeds it that order is host-dependent
  (server: per-account login arrival; offline: one record; headless: whatever
  the env seeds). Sim code that iterates the map MUST sort by owner key first.
  Relying on Map order forks the three hosts on one seed, and it is the kind
  of fork the parity gate only catches once a record actually exists.
- `commands.ts` owns one exported body per wire command, shaped
  `(ctx, pid, ...args)`. Each resolves the caller in-module through
  `ctx.resolve(pid)` the way `professions/enchanting.ts`,
  `professions/gathering.ts` and `mounts_training.ts` do (not
  `professions/farming.ts`: its Sim delegate resolves the caller first) and
  then returns. `freeholdEnter` and `freeholdLeave` are LIT and delegate
  whole to `instance.ts`; for the eight others the numbered later work named
  on each body puts the real decision there, re-validating the payload shape
  in the module so the offline host enforces what the server guard enforces.
  None of those eight may mutate state, emit an event or draw rng until its
  owner lands it, so a host that runs them is indistinguishable from one that
  does not.
- `Sim` keeps thin same-named delegates for the facet (the `IWorldHousing`
  members right after the farming block in `sim.ts`). TWELVE of the thirteen
  delegate into this directory, the two descriptors included, so lighting those
  at 05/08a is an edit HERE and never a growing body inside the zero-slack
  `sim.ts` coordinator. The thirteenth, `housingNowMs`, deliberately has no
  module counterpart: it is a one-line alias for the host clock the coordinator
  already owns, and it stays that way. If it ever needs a decision, it moves
  into this directory first rather than growing a body on the coordinator.
- `housingNowMs` is the `farmNowMs` clock base, and it must NEVER be read from
  inside `tick()`. On the authoritative server `cfg.lockoutNowMs` is a real wall
  clock, so a housing pass that sampled it per tick (a condition decay or a
  ledger-due sweep at 13 are the obvious candidates) would fork the world off
  its seed. It is a COSMETIC base for a consumer comparing one housing timestamp
  against "now", nothing more; the authoritative facts stay descriptor fields.
- `ClientWorld.buildPresenceSeq` (the online half, `src/net/online.ts`) is
  RESERVED for C03 and carries two properties later work must not overread. No
  server-side ordering or drop logic exists yet: `server/freehold_wire.ts`
  type-guards the field and discards it, so nothing is reordered or dropped
  today. And it is advisory rather than dense: the counter advances even when
  the frame is not actually sent (spectating, or a closed socket), so C03 must
  treat it as monotonic-WITH-GAPS and never as a contiguous count.
- The host opt-in is `SimConfig.freeholdsEnabled` (D85: optional, default
  false; the stock offline world and the headless env pass true, the server
  maps its realm env), read only as the `ctx.freeholdsEnabled` primitive.
  The editor viewport (`src/editor/3d/viewport.ts`) and custom editor
  play-test maps boot dark by design; only the stock offline world and the
  headless env opt in.
- `ctx.freeholdsEnabled` gates the furnisher through surface NPC construction
  and new crafted-furnishing acquisition through `isFreeholdCraftAvailable`.
  The Eastbrook gate prompt reads it when its owner lands.
- Golden parity traces cover the dark arm, pinned by the source boundary in
  `tests/freehold_npc_spawn.test.ts`. That suite pins the unchanged dark
  construction fingerprint, full geometry, and deterministic lit construction;
  `tests/freehold_module.test.ts` proves inert commands on each configuration
  and the dark-host inserters.
- No store, ledger-service or ownership-service vocabulary anywhere in this
  directory: the sim is a game core, and everything that sells or transfers a
  plot stays outside `src/sim/`.
- Import the directory's public API through `src/sim/freehold/index.ts`
  (explicit re-export lists, never `export *`). A module that ever needs a
  runtime import from a package that imports this barrel stays out of the list
  and is imported by path, exactly as `pvp/index.ts` documents; none does yet.
  ONE STANDING EXCEPTION, and it is the majority of the importers: a consumer
  that wants nothing but TYPES imports `./types` (or `.../freehold/types`)
  directly rather than the barrel. `src/sim/sim_context.ts` does, to keep the
  seam out of a barrel cycle it does not need: the type-only import would
  compile, since types are erased, but the directory's own modules import back
  through it, so this is a convention worth keeping rather than a compiler
  compulsion. `src/world_api/housing.ts`,
  `src/net/freehold_snapshot_wire.ts` and `server/freehold_wire.ts` do because
  the seam, the wire and the server should pull in no runtime value from the
  sim package at all. Runtime consumers use the barrel, including `sim.ts`,
  recipe acquisition and profession training/crafting, the Heroic Quartermaster
  and the pure presentation consumers of `isFreeholdCraftAvailable`.
- Design: `docs/prd/woc/freeholds-and-guildhalls-research.md` (the research
  and the decision record it cites).
- Cover changes in `tests/freehold_module.test.ts` (the dark-host pins: null
  descriptors, the shared clock base, every stub mutation-free and draw-free,
  the lit pair's text-free dark refusal, the record round-trip, the vocabulary
  and purity source scan), `tests/freehold_instance.test.ts` (the claim, the
  refusals, the reap, the relog, the busy pool, determinism),
  `tests/freehold_offline_default.test.ts` (the default record, the dark host,
  the save, the paired evict), `tests/freehold_dev_grant.test.ts` (the
  permission matrix, the chat arm, the one tier writer), the `freehold_claim`
  parity scenario, and `tests/sim_context.test.ts` (the `freeholds` live view
  and the `freeholdsEnabled` / `freeholdDevGrantEnabled` read-throughs).
