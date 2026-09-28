<!-- src/ui/hud/pet_bar/: the pet action bar under the pet frame.
     Presentation and input only. Don't repeat root / src/ui / src/ui/hud
     CLAUDE.md, reference them. -->

# src/ui/hud/pet_bar/: the pet action bar

The `#petbar` command and stance buttons a pet owner (hunter, mage, warlock)
drives the pet with, moved whole out of `hud.ts`: same markup, classes,
tooltips, ARIA, focus keys and press paths.

- `pet_bar_view.ts` is the pure core: `petBarFactsInto` derives one frame's
  facts and the repaint signature into a reused record, `petBarButtons` returns
  the ordered buttons with every caption resolved, and `bagsHoldPetFood` is the
  Heal Pet food check (a mirror of `Sim.feedPet`'s).
- `pet_bar_controller.ts` owns the nodes, the listeners (click, Shift+Enter,
  right-click and the touch-hold autocast flip), the focus carry across a
  rebuild and the stance-menu toggle. It takes the Hud as a typed
  `PetBarHost`.

## Load-bearing rules

- **One pet resolution per frame.** `Hud.update()` resolves the primary pet
  once for the pet frame and hands it to `render(pet)`; the controller falls
  back to a living Necromancy secondary itself (`../pet_bar_core.ts`), never a
  second roster walk of its own for the primary.
- **The signature is the whole per-frame gate.** A steady frame computes the
  facts and the signature and writes nothing past the display and body-class
  flags; a rebuild runs only when the signature moves or `invalidate()` cleared
  it. Anything a rebuild's buttons read joins the signature.
- **`pendingPetFeed` is the Hud's**, because the bags window reads and writes it
  too. The controller starts the mode and the Hud's `cancelPetFeed` ends it;
  both invalidate the bar.
- **A language switch invalidates, it does not rebuild in place.** The
  coordinator arm (`relocalizeCoordinatorMemos`) calls `invalidate()`, and the
  next frame rebuilds every caption (`tests/language_fanout_registry.test.ts`).
- **The mover chrome survives every rebuild.** The bar is a movable frame, so a
  rebuild and the hide path remove only the `.petbar-group` children.

Tests: `tests/pet_bar_view.test.ts` (the core) and
`tests/pet_bar_controller.test.ts` (the DOM, the presses and the focus carry).
