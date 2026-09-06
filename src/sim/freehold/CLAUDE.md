# src/sim/freehold - Freeholds and Guildhalls (player housing)

Host-agnostic housing state and commands: the live freehold record, its load,
snapshot and evict lifecycle, and the command bodies the `IWorldHousing` facet
delegates into. The record is keyed by an OWNER key (D16) that never reaches
the wire; the public descriptor carries an opaque plot id only.

- `types.ts` owns the shared shapes (`FreeholdState`, the public
  `FreeholdView` and `FreeholdLayoutView`, the tier and visit-policy unions).
  Data only: no logic, no `SimContext`, so the server row mapper and the wire
  import the same names. Names may gain members later and are never renamed.
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
  members right after the farming block in `sim.ts`); the descriptors read null
  until 05 and 08a light them and `housingNowMs` is the `farmNowMs` clock base.
- The host opt-in is `SimConfig.freeholdsEnabled` (D85: optional, default
  false; the stock offline world and the headless env pass true, the server
  maps its realm env), read only as the `ctx.freeholdsEnabled` primitive.
  The editor viewport (`src/editor/3d/viewport.ts`) and custom editor
  play-test maps boot dark by design; only the stock offline world and the
  headless env opt in.
- Standing exception to the zero-consumer rule in `src/sim/CLAUDE.md`:
  `ctx.freeholdsEnabled` lands consumer-free by design and keeps its binding;
  its first consumers are the furnisher stock (03) and the Eastbrook gate
  prompt (06), which read it when they land.
- Parity obligation: every parity trace boots the flag false today, so the
  first behavioral read of `ctx.freeholdsEnabled` must add a parity scenario
  booting it true (or pin that parity covers only the dark arm) in the same
  change; `tests/freehold_module.test.ts` pins that a lit and a dark Sim on
  one seed agree until then.
- No store, ledger-service or ownership-service vocabulary anywhere in this
  directory: the sim is a game core, and everything that sells or transfers a
  plot stays outside `src/sim/`.
- Import the directory's public API through `src/sim/freehold/index.ts`
  (explicit re-export lists, never `export *`). A module that ever needs a
  runtime import from a package that imports this barrel stays out of the list
  and is imported by path, exactly as `pvp/index.ts` documents; none does yet.
- Design: `docs/prd/woc/freeholds-and-guildhalls-research.md` (the research
  and the decision record it cites).
- Cover changes in `tests/freehold_module.test.ts` (the dark-host pins: null
  descriptors, the shared clock base, every stub mutation-free and draw-free,
  the record round-trip, the vocabulary and purity source scan) and
  `tests/sim_context.test.ts` (the `freeholds` live view and the
  `freeholdsEnabled` read-through).
