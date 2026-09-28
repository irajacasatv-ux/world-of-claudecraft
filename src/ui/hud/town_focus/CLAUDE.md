<!-- src/ui/hud/town_focus/: the Town Focus allocation panel (#1143).
     Presentation and input only. Don't repeat root / src/ui / src/ui/hud
     CLAUDE.md, reference them. -->

# src/ui/hud/town_focus/: the Town Focus panel

The per-player harvest-component focus panel, moved whole out of `hud.ts`.

- `town_focus_view.ts` is the pure core (a `UI_PURE_CORES` member): rows,
  step rules, the remaining points and the repaint signature.
- `town_focus_window.ts` is the thin painter of `#town-focus-window`.
- `town_focus_controller.ts` owns the draft, the re-spec tier, the repaint
  latch and the open/paint/close lifecycle over a typed `TownFocusHost`; Hud
  keeps `toggleTownFocus` and `townFocusOpen` as its entry points and drives
  `refreshIfChanged` from the slow band of `update()`.

## Load-bearing rules

- **The town gate here is cosmetic.** The real gate is server-side in
  `Sim.setTownFocus`; the panel still shows the allocation out of town.
- **The repaint signature is the only per-frame work**
  (`tests/town_focus_repaint_gate.test.ts`).
