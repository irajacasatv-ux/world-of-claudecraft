// #100 — the social presence dot is colored purely by a CSS class derived from
// the player's status ('online' | 'combat' | 'dungeon' | 'dead'). A regression
// once shipped where the green rule was named `.soc-dot.on` while the client
// emitted `soc-dot online`, so every online player showed a grey dot. This
// guards the JS<->CSS contract: every status the client can render must have a
// matching `.soc-dot.<status>` rule.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// The social window CSS (the `.soc-dot.<status>` rules) moved out of index.html's
// inline <style> into src/styles/components.css, loaded by both game entries via the
// barrel. The JS<->CSS contract guarded below now reads the module.
const componentsCss = readFileSync(join(root, 'src/styles/components.css'), 'utf8');
// The social list rendering moved out of hud.ts into the social window painter,
// so the dot-class contract now lives there.
const socialWindow = readFileSync(join(root, 'src/ui/social_window.ts'), 'utf8');

// the online presence statuses the server sends and the client turns into a dot class
const ONLINE_STATUSES = ['online', 'combat', 'dungeon', 'freehold', 'dead', 'afk'];

// A real rule, not a mention: comments are stripped, and the selector has to stand alone
// in a rule's selector list whose block sets a background. A renamed rule (the #100 bug,
// `.soc-dot.on`) or a stray mention in a comment cannot satisfy it; before 2026-09-27 a
// bare substring check passed on a comment, and a tombstone case carried the #100 proof.
const cssRules = [
  ...componentsCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g),
].map(([, selectors, body]) => ({ selectors: selectors.split(',').map((s) => s.trim()), body }));

describe('social presence dot styling (#100)', () => {
  it('every online status has a matching .soc-dot CSS color rule', () => {
    for (const status of ONLINE_STATUSES) {
      const rule = cssRules.find((r) => r.selectors.includes(`.soc-dot.${status}`));
      expect(rule, `missing CSS rule .soc-dot.${status}`).toBeDefined();
      expect(rule?.body, `.soc-dot.${status} sets no background`).toMatch(/\bbackground\s*:/);
    }
  });

  it('the client still renders the dot class from the status value (offline => no status class)', () => {
    // guards the source line that builds the class, so the contract above stays meaningful
    expect(socialWindow).toContain("=== 'off' ? '' :");
  });
});
