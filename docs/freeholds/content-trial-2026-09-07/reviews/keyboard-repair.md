# Freehold vendor keyboard regression

The real browser failure came from an omitted panel registration. `#vendor-window` was absent from `CHROME_GUARDED_PANELS` in `src/ui/chrome_focus_wiring.ts`, so focused purchase buttons did not receive the existing native button key guard. Enter bubbled into the real `Input` handler and opened chat; Space reached gameplay jump handling and lost its native button activation.

The fix registers the vendor panel with the existing chrome focus wiring. It preserves the established Enter/Space propagation guard and native browser activation, including focus restoration after the vendor repaints. No changes were needed in Input, main, Hud, or the shared key guard.

Changed files:

- `src/ui/chrome_focus_wiring.ts`: enroll `#vendor-window`.
- `tests/chrome_focus_wiring.test.ts`: update the literal panel registry expectation.
- `tests/browser/vendor_keyboard.browser.test.ts`: new trusted Chromium keyboard regressions using the real Input, chrome wiring, vendor painter, and lit Sim purchase path.

Red-first evidence:

`npm run test:browser -- tests/browser/vendor_keyboard.browser.test.ts`

Before the fix, two of three tests failed: Enter opened chat instead of buying, and Space failed to buy. The world Enter control passed. Log: `/tmp/freehold-vendor-keyboard-red.log`.

Green evidence:

- The same browser command passed all three tests after the fix. Enter and Space each buy exactly one actual Timber Bed for 250 copper, leave chat closed, and retain focus on the replacement button after repaint. World Enter still opens chat, typing stays in the composer, and no purchase occurs. Log: `/tmp/freehold-vendor-keyboard-green.log`.
- `npx vitest run tests/chrome_focus_wiring.test.ts tests/panel_key_guard.test.ts tests/pointer_blur.test.ts tests/input.test.ts`: four files, 163 tests passed. Log: `/tmp/freehold-vendor-keyboard-related.log`.
- `npx @biomejs/biome check --write src/ui/chrome_focus_wiring.ts tests/chrome_focus_wiring.test.ts tests/browser/vendor_keyboard.browser.test.ts`: no errors; one existing-style non-null assertion warning in the new test. Log: `/tmp/freehold-vendor-keyboard-biome.log`.
- `git diff --check -- src/ui/chrome_focus_wiring.ts tests/chrome_focus_wiring.test.ts tests/browser/vendor_keyboard.browser.test.ts`: passed.

Parent and the read-only frontend finishing reviewer were notified. Parent owns the real-world capture retry, integration gate, and commits. This agent did not stage or commit these changes.
