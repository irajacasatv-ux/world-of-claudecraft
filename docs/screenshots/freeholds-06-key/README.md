# Hearth Key UI evidence

Run the supplemental capture against the task's local dev server:

```sh
GAME_URL=http://localhost:5186 node scripts/freehold_key_capture.mjs
```

The accepted run on 2026-09-08 used
`GAME_URL=http://127.0.0.1:5186 KEY_SHOTS_DIR=/tmp/freeholds-06-key-shots-settled node scripts/freehold_key_capture.mjs`
and exited 0. Both variants passed, producing four images each. The report and
images here preserve those producer bytes. Desktop retains five console HTTP 502
diagnostics and compact retains three; both page-error arrays are empty.

`scripts/freehold_key_capture.mjs` boots a fresh offline warrior for each viewport
through the shared entry helper. It walks through real keyboard input, enters the
physical Freeholds gate, and observes the authoritative offline grant of one key.
Every `window.__game` access is read-only. The script seeds only graphics and theme
preferences and emulates touch presentation for the compact viewport.

The desktop run uses native HTML drag to action slot four and a mouse click to use
the key. The compact run uses a held touch drag to the fourth action-ring slot and
a touch tap to use it. Both observe unchanged entry state during drag, an actual
home arrival on activation, one remaining permanent key, and a travel deadline.
Bag and personal-bank screenshots use the shipping item art and tooltip. Compact
tooltips use automated DOM focus to invoke the shipping focus handler in the
emulated touch layout. They do not demonstrate keyboard navigation, a phone
software keyboard or a touch-only tooltip gesture.

`evidence.json` records source hashes, viewport dimensions, observed grant,
placement, bank withdrawal and use state, screenshot paths, and browser errors.
A run is complete only when every variant has `passed: true`. A failure preserves
its error and diagnostic screenshot. The bank round trip uses Bursar Fernando's
supported personal-bank UI, including real deposit and withdrawal inputs.

These supplemental offline screenshots are separate from the canonical interior
capture registry. They do not establish online entitlement, cross-realm cooldown,
or vendor, mail, equipment, or real-device behavior.
