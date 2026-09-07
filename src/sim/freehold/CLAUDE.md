# src/sim/freehold - Freeholds and Guildhalls (player housing)

Host-agnostic housing state and commands: the live freehold record, its load,
snapshot and evict lifecycle, and the command bodies the `IWorldHousing` facet
delegates into. The record is keyed by an OWNER key (D16) that never reaches
the wire; the public descriptor carries an opaque plot id only.

- `types.ts` owns the shared shapes (`FreeholdState`, the public
  `FreeholdView` and `FreeholdLayoutView`, the tier and visit-policy unions).
  Data only: no logic, no `SimContext`, so the server row mapper and the wire
  import the same names. Names may gain members later and are never renamed.
- `should_spawn_npc.ts` owns surface NPC admission: dynamic definitions stay
  excluded, and the furnisher requires the host opt-in. It reads no live state
  and draws nothing; `surface_npc_bootstrap.ts` applies it during construction.
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
  then returns; the numbered later work named on each body puts the real
  decision there, re-validating the payload shape in the module so the
  offline host enforces what the server guard enforces. None may mutate
  state, emit an event or draw rng until its owner lands it, so a host that
  runs them is indistinguishable from one that does not.
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
- `ctx.freeholdsEnabled` gates the furnisher through surface NPC construction.
  The Eastbrook gate prompt reads it when its owner lands.
- Golden parity traces cover the dark arm, pinned by the source boundary in
  `tests/freehold_npc_spawn.test.ts`. That suite pins the unchanged dark
  construction fingerprint, full geometry, and deterministic lit construction;
  `tests/freehold_module.test.ts` proves inert commands on each configuration.
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
  sim package at all. Runtime consumers (today `src/sim/sim.ts`) use the barrel.
- Design: `docs/prd/woc/freeholds-and-guildhalls-research.md` (the research
  and the decision record it cites).
- Cover changes in `tests/freehold_module.test.ts` (the dark-host pins: null
  descriptors, the shared clock base, every stub mutation-free and draw-free,
  the record round-trip, the vocabulary and purity source scan) and
  `tests/sim_context.test.ts` (the `freeholds` live view and the
  `freeholdsEnabled` read-through).
