<!-- src/ui/hud/revive/: the two ways a dead player is offered life back.
     Presentation and input only. Don't repeat root / src/ui / src/ui/hud
     CLAUDE.md, reference them. -->

# src/ui/hud/revive/: resurrection offers and the Pale Keeper

Both flows moved whole out of `hud.ts`; same markup, keys and command timing.

- `resurrection_prompt.ts` shows another player's resurrection offer on the
  shared `#prompt-stack` (`showStackPrompt`) and closes it once the player is
  alive again. Hud routes the event here and builds it lazily over itself as a
  typed `ResurrectionPromptHost`.
- `keeper_revive_dialog.ts` runs the Pale Keeper's two-step revive over the
  shared confirm dialog (`../dialog`); `keeper_revive_dialog_core.ts` is its
  pure half, the level-aware keys (a `UI_PURE_CORES` member).

## Load-bearing rules

- **Only the second OK sends the revive.** Cancel or Escape at either step sends
  nothing; the command is read at that OK, never earlier
  (`tests/keeper_revive_dialog.test.ts`).
- **The Toll is worded for the live level**, read at each step, since a level
  can change between the two dialogs.
