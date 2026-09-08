# Simulation architecture review and closure

Parent transcription of the read-only simulation architecture specialist's report. The reviewer performed no tests, generators or file mutations. Scope: the specified crafted producer and historical repair commits, then current repair `0932963250..69ffdab561`.

Initial review identified one P3, high-confidence continuation of HN1: `src/sim/content/recipes.ts:53` still imported `FURNISHING_RECIPES` from `./freehold/furnishing_recipes`. The content directory requires the public barrel, which already exported the symbol; no cycle justified the bypass. This is the same HN1 boundary finding, not a fourth distinct defect. The coordinator changed the import to `./freehold` in `69ffdab561`.

**Closure supplement: source review PASS. HN1 fully resolved; zero remaining findings, nits or source uncertainties.** The specialist inspected the one-line repair: the barrel re-exports the same leaf binding, preserving catalog identity and registration order; its graph remains acyclic. A complete sim import scan finds no remaining runtime bypass, only the documented type-only FreeholdState exception. The independent fresh reviewer separately repeated this scan through the TypeScript AST.

Verified claims:

1. Training extraction preserves the previous available-content sequence: death check, player resolution, validator, successful fee subtraction, acquisition, result assignment and personal event. The intentional added denial precedes validation and spending.
2. No SimContext callback declaration or binding changes. Station access and live event emission remain faithful; the facade forwards both arguments and retains void return behavior.
3. Tick phases, entity iteration and RNG sites are unchanged. Recipe registration appends records; dark presentation filtering preserves surviving order.
4. Predicate and denial guards draw no RNG. Disabled acquisition/start/completion/count refuse before spending or output draws. Successful crafting retains the Jack variance draw followed by the unconditional masterwork draw, one ordinary or two Jack draws.
5. New behavior leaves contain no browser dependency, wall clock or Math.random. The availability Set derives from immutable IDs; the projection cache stores catalog data rather than player/world state.
6. The relocation retains mutation of the resolved live metadata. Pattern rollback Set replacement predates this producer; its earlier diff changed commentary.
7. Furnishing content leaves import types only. Ledger schedule-to-trial is a runtime edge, with a reverse type-only edge. Internal leaf imports and re-exports are legitimate; external runtime consumers now use barrels.
8. Reviewed actual same-seed ordinary/Jack event/save/RNG continuation tests, all-ten zero-draw denials and identity/cache invalidation tests. Coordinator evidence reports six suites/291 passed and decisive knowledge/round-trip mutations. The final HN1 completion also passed four suites/172 tests.

No determinism, purity, callback, mutation-order or extraction defect found. Pending shared execution remains coordinator-owned and is not a source-review defect.
