import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindShiftClear } from '../src/ui/hud/action_bar/action_bar_clear';

/** Slice one function's body out of a source string, bounded at ITS OWN closing
 *  brace via a depth count rather than to end-of-file: a function appended
 *  after the target in a later change must not silently satisfy a pin meant
 *  for this one. */
function sliceFunctionBody(source: string, startIndex: number): string {
  const braceStart = source.indexOf('{', startIndex);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
  }
  throw new Error('sliceFunctionBody: unbalanced braces from the given start index');
}

afterEach(() => vi.unstubAllGlobals());

// The Hud's one coordinator case here, applying the form-sync outcome to its own
// fields (syncActiveHotbarForm), lives in tests/hud_window_coordination.test.ts;
// the decision itself is tests/action_bar_form_sync_core.test.ts.
describe('Hud action-bar facade', () => {
  it('routes both configurable slot paths through the Shift-only clear gesture', () => {
    const source = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
    const buildStart = source.indexOf('private buildActionBar(): void');
    const configurableStart = source.indexOf('if (slot >= 1) {', buildStart);
    const attackSlotStart = source.indexOf('// Slot 0 (Attack).', configurableStart);
    const configurableSlots = source.slice(configurableStart, attackSlotStart);

    expect(configurableSlots).toContain('bindShiftClear(btn, clearSlot);');
    expect(configurableSlots).toContain(
      'this.hotbarActions = clearHotbarSlot(this.hotbarActions, slot - 1);',
    );
    expect(configurableSlots).toContain('this.saveSlotMap();');

    const actionBarBuild = source.slice(
      buildStart,
      source.indexOf('private buildCastBar()', buildStart),
    );
    // Only the attack slot (slot 0) still calls the two handlers directly; every
    // configurable slot routes through bindShiftClear instead (checked above).
    expect(actionBarBuild.match(/handleShiftClearContextMenu\(/g)).toHaveLength(1);
    expect(actionBarBuild.match(/handleShiftClearKeydown\(/g)).toHaveLength(1);
    expect(actionBarBuild).toContain('handleShiftClearContextMenu(e, clearAttackSlotAction);');
    expect(actionBarBuild).toContain('this.attackSlotAction = null;');
    expect(actionBarBuild).toContain('this.saveAttackSlotAction();');

    // bindShiftClear is the one place that knows a slot surface must offer BOTH
    // desktop clear affordances; pin that its body still registers the pair, so a
    // future surface cannot ship contextmenu without keydown (or vice versa).
    const clearSource = readFileSync(
      new URL('../src/ui/hud/action_bar/action_bar_clear.ts', import.meta.url),
      'utf8',
    );
    const bindStart = clearSource.indexOf('export function bindShiftClear');
    expect(bindStart).toBeGreaterThan(-1);
    // Bounded at bindShiftClear's OWN closing brace, not end-of-file: a
    // function appended after it in a later change must not be able to
    // satisfy this pair from outside the function under test.
    const bindBody = sliceFunctionBody(clearSource, bindStart);
    expect(bindBody).toContain("btn.addEventListener('contextmenu'");
    expect(bindBody).toContain("btn.addEventListener('keydown'");
  });

  it('bindShiftClear actually WIRES both handlers: shift+contextmenu and shift+Delete clear; a plain contextmenu does not', () => {
    const handlers: Record<string, (e: unknown) => void> = {};
    const btn = {
      addEventListener: (type: string, handler: (e: unknown) => void) => {
        handlers[type] = handler;
      },
    } as unknown as HTMLElement;
    let clears = 0;
    bindShiftClear(btn, () => {
      clears++;
    });

    handlers.contextmenu({ shiftKey: false, preventDefault: () => {} });
    expect(clears).toBe(0);

    handlers.contextmenu({ shiftKey: true, preventDefault: () => {} });
    expect(clears).toBe(1);

    handlers.keydown({
      shiftKey: true,
      key: 'Delete',
      preventDefault: () => {},
      stopPropagation: () => {},
    });
    expect(clears).toBe(2);

    handlers.keydown({
      shiftKey: false,
      key: 'Delete',
      preventDefault: () => {},
      stopPropagation: () => {},
    });
    expect(clears).toBe(2);
  });

  it('checks drag eligibility before every drop and the touch bar editor place', () => {
    // Four desktop drag/drop sites plus the bar editor's placeAbility, the touch
    // binding path: it takes the SAME eligibility gate the desktop drop takes,
    // so a passive or unknown ability cannot reach a slot through the overlay.
    const source = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
    expect(source.match(/actionBarController\.isAssignableAction\(/g)).toHaveLength(5);
    expect(source).toContain(
      "if (!this.actionBarController.isAssignableAction({ type: 'ability', id: abilityId })) return;",
    );
  });

  it("cancels a focused slot's native Space activation without blocking the jump key", () => {
    // tests/browser/action_bar_space_jump.browser.test.ts pins the live
    // behavior; this source pin keeps buildActionBar from regressing back to
    // stopPropagation, which would swallow the keydown before Input's
    // window-level jump handler sees it.
    const source = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
    const buildStart = source.indexOf('private buildActionBar(): void');
    const keydownStart = source.indexOf("btn.addEventListener('keydown'", buildStart);
    const keydownEnd = source.indexOf('});', keydownStart);
    const keydownBlock = source.slice(keydownStart, keydownEnd);

    expect(keydownBlock).toContain('e.preventDefault();');
    expect(keydownBlock).not.toContain('e.stopPropagation();');
  });

  it('leaves no touch long-press rearrange path on the action bar', () => {
    const source = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
    for (const token of [
      'mobileHotbarDrag',
      'bindMobileActionDrag',
      'bindMobileRingDrag',
      'mobile-hotbar-dragging',
    ]) {
      expect(source, `${token} must not survive the removal`).not.toContain(token);
    }
    // The desktop HTML5 path is untouched: both halves still there.
    expect(source).toContain("btn.addEventListener('dragstart', (e) => {");
    expect(source).toContain("btn.addEventListener('dragover', (e) => {");
  });
});
