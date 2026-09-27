// The per-frame action-bar form sync's decision (extracted from
// Hud.syncActiveHotbarForm): run the controller's three syncs in their order
// and say what the frame owes the HUD. A surface flip (Interface Mode) or a
// spec switch reloads the bars, so the spellbook's hotbar controls re-read
// them AND the page is re-clamped; only then does the form sync NOT run (the
// reload already loaded the resolved form). Otherwise a form swap re-clamps
// the page, and an unchanged frame owes nothing.
//
// Pure and allocation-free (it runs every frame): the answer is a string
// literal, never an object. Hud applies it: 'rebuilt' refreshes the spellbook
// controls, and both non-'unchanged' outcomes drop the desktop drag and
// re-clamp the ring page, which are Hud's own fields.

/** The three syncs, called in this order on the live controller. */
export interface HotbarFormSyncSources {
  syncProfile(): boolean;
  syncSpec(): boolean;
  syncActiveForm(): boolean;
}

export type HotbarSyncOutcome = 'unchanged' | 'formSwapped' | 'rebuilt';

export function hotbarSyncOutcome(sources: HotbarFormSyncSources): HotbarSyncOutcome {
  const profileSwitched = sources.syncProfile();
  const specSwitched = sources.syncSpec();
  if (profileSwitched || specSwitched) return 'rebuilt';
  return sources.syncActiveForm() ? 'formSwapped' : 'unchanged';
}
