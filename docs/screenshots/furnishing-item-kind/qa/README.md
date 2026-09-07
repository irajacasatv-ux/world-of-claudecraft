# Furnishing paired QA visual evidence

Scope: accepted initial card/cell captures cover `041fd790ce..ce0e25ec85`.
Accepted late captures cover Exchange, WorldMarket Collect and paperdoll repairs
in `ce0e25ec85..ff738f61a1`. Later commits through final source seal
`d386635394` change tests, provenance fingerprints and comments, leaving those
rendered UI behaviors unchanged. The final frontend and fresh source reviewers
verified the evidence. Screenshots alone do not establish the overall QA verdict.

The same synthetic copy is shown before and after the furnishing repairs. The
original card and cell incorrectly advertise a forged legendary identity,
Masterwork, Perfecting, stats and Rift progression. The repaired card and cell
retain the authored rare furnishing identity, actual placement data, escaped
maker, lock and live party-trade deadline. They show no equipment power or
instruction to equip a furnishing.

| View | Before | After |
|---|---|---|
| Desktop, native mouse hover | [Full viewport](before/desktop.png), [card](before/desktop-card.png) | [Full viewport](after/desktop.png), [card](after/desktop-card.png) |
| Mobile landscape, native touch long press | [Full viewport](before/mobile-landscape.png), [card](before/mobile-landscape-card.png) | [Full viewport](after/mobile-landscape.png), [card](after/mobile-landscape-card.png) |

Both accepted runs captured two of two variants with zero assertion failures and
zero page errors. Each recorded 23 retained HTTP/console diagnostics described
below. No tooltip was clipped. The coordinator and frontend reviewer inspected
the full viewport images, and the frontend reviewer also inspected the card
crops. The fresh independent source reviewer inspected the equivalent frozen
source captures and verified their source-tree identity.

The [before manifest](before/manifest.json) and [after manifest](after/manifest.json)
record the native events, complete card rows, visible and accessible cell name,
icon class and decoded size, live deadline, viewport and card bounds. The
accepted [before log](before/capture.log.txt) and [after log](after/capture.log.txt)
preserve the actual assertions and progress diagnostics.

## Initial sources and fixture

- Before: dependency merge `041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`, archived at
  `/tmp/freeholds-02-qa-before` and served at `http://127.0.0.1:5188`.
- After: frozen source `b1d7e9627674845e4be17b4e7a5dd431800261ea`, served at
  `http://127.0.0.1:5189`. The amended source fix is
  `ce0e25ec8593605d8f609074c4854fec56a811b2`. Both have tree
  `7ad83845a4cf7f48631bbbf0cf152e07c11e18ab`; only the commit body changed.
- Browser: the repository's Chrome resolver, headless SwiftShader. Desktop is
  1600 by 900 CSS pixels; mobile landscape is 844 by 390, with iPhone user agent,
  touch emulation and device scale factor 2. Every page seeds graphics preset 1
  and `graphicsDefaultApplied` before navigation and uses the shared GPU-notice
  dismissal and offline-entry helpers.

The browser-only definition is `probe_furnishing_qa_tooltip`, named
`Screenshot Test Furnishing`, with rare quality, soulbound status, a 2 by 3 cell
footprint, radius zero, decor cost 7 and floor surface. Its copy has signer
`<Maker & Co>`, an item lock, a live party-trade deadline and the recipe marker
`test_furnishing_recipe`. Deliberately malformed copied power includes the name
`Forged Power Name`, legendary rolled quality, Strength and Stamina, an enchant,
Masterwork, Perfecting and Rift progression. These fields exercise presentation
refusal; they do not add shipping content.

The fixture is installed into the actual loaded `ITEMS` modules, including Vite
timestamped module URLs, and the offline Market collection. The harness moves
the player to a real Merchant and opens the real Collect tab. This panel retains
the full owned-copy payload. Browse deliberately projects away locks and party
trade, so a Browse fixture cannot verify those custody lines. The fixture issues
no listing, trade, purchase or collection command. No tooltip composer is mocked
or called directly.

The deadline is stamped from the real offline simulation clock at 90 minutes
ahead. The actual `partyTradeMsRemaining` result stays within the range that the
existing duration formatter displays as one hour. No clock or duration helper is
stubbed. The card states:

> You may trade this item to players who shared its drop for the next 1 hour.

The remaining final rows are the authored title and `Rare Furnishing`, Soulbound,
Locked, the three approved placement rows and `Made by <Maker & Co>.`. The four
housing rows retain their approved text and resolved source values. The maker
appears once as literal text, with escaped HTML and no interpreted maker element.

## Initial native interaction and assertions

Each variant first presses the Market header through native mouse or touch and
requires the shared tooltip to be hidden. Document capture listeners then record
events whose actual composed path includes the current Collect row. This survives
normal row rebuilds. Desktop requires trusted `mouseenter`; mobile requires
trusted `pointerdown` with `pointerType: touch`, held until the real long-press
handler shows the tooltip. Hidden-to-visible transition and the native event are
both required before capture.

The baseline has 18 card rows and the forged legendary cell/rim. The repaired
card has exactly nine rows, the authored visible/accessibility name and a
`q-rare` icon rim. It must contain no forged name, promoted rarity, stats,
Masterwork, Perfecting, Rift, use or equip claim. Each final line and the full
card must fit in the viewport and card bounds without scroll clipping. The
existing procedural crate icon decodes at 96 by 96; no image URL or new art is
introduced. Manifests omit the long icon data URL while retaining its source
classification, dimensions, class and screenshot pixels.

## Initial reproduction and accepted commands

The exact current runner is archived as [capture.mjs.txt](capture.mjs.txt). Restore
it to its original ignored location so its repository helper imports resolve:

```sh
mkdir -p tmp
cp docs/screenshots/furnishing-item-kind/qa/capture.mjs.txt tmp/freeholds-02-qa-tooltip-capture.mjs
```

With the two recorded source versions served locally, the accepted commands were:

```sh
GAME_URL=http://127.0.0.1:5188 QA_EXPECT_FIXED=0 SHOTS_DIR=/tmp/freeholds-02-audit/tooltip-before-verified node tmp/freeholds-02-qa-tooltip-capture.mjs
GAME_URL=http://127.0.0.1:5189 QA_EXPECT_FIXED=1 SHOTS_DIR=/tmp/freeholds-02-audit/tooltip-after-accepted node tmp/freeholds-02-qa-tooltip-capture.mjs
```

Both commands completed with exit 0. `node --check` also passed for the runner.
The final runner closes the browser and writes the complete manifest before
exiting with its computed assertion status. `SHOT_VARIANT=desktop` or
`SHOT_VARIANT=mobile-landscape` selects one variant for diagnosis; the accepted
runs above included both. These are emulated Chromium captures, not physical
device or WebKit proof.

## Initial rejected setup attempts and diagnostics

The following attempts are not accepted screenshots and remain outside this
directory:

- The first character name had 17 characters, exceeding the existing 16-character
  limit. The validation screenshot identified the setup error; the corrected
  harness uses `Testmaker`. No game validation was changed.
- An early mobile attempt lost its per-row native-event listener during a normal
  Collect-row rebuild. The harness now records at document capture and requires
  the hidden-to-visible transition. The native trust requirement was preserved.
- A development hot reload removed `window.__game` during an after capture.
  The accepted after run uses a frozen source archive while generators and shared
  validation continue in the worktree.
- One complete frozen run wrote successful images and its manifest but left an
  idle driver timer alive. The runner now exits with its computed result only
  after browser closure and manifest persistence. The accepted after rerun
  completed normally with exit 0; no assertion was removed.

Both accepted runs retain local API proxy failures and existing character/preload
console diagnostics in their manifests. These were also present in the earlier
implementation captures and affect the background environment, not the asserted
furnishing card or decoded icon. There were no page-error events. Diagnostics
are disclosed rather than removed from the evidence.

## Accepted late comparison

Both late commands completed with exit 0. Each source has 32 accepted PNGs:
eight surfaces, two viewports, and full/detail images per surface. Each viewport
completed all eight captures with zero assertion failures. Each manifest retains
27 background HTTP/console diagnostics and zero page errors. The frontend
reviewer inspected every paired surface; the independent fresh reviewer also
inspected the late evidence and confirmed Q20 resolved.

| Surface | Desktop before / after | Mobile landscape before / after |
|---|---|---|
| Exchange Browse row | [Before](late-before/desktop-exchange-browse.png) / [After](late-after/desktop-exchange-browse.png) | [Before](late-before/mobile-landscape-exchange-browse.png) / [After](late-after/mobile-landscape-exchange-browse.png) |
| Exchange Sell row | [Before](late-before/desktop-exchange-sell.png) / [After](late-after/desktop-exchange-sell.png) | [Before](late-before/mobile-landscape-exchange-sell.png) / [After](late-after/mobile-landscape-exchange-sell.png) |
| Exchange furnishing card | [Before](late-before/desktop-exchange-furnishing-card.png) / [After](late-after/desktop-exchange-furnishing-card.png) | [Before](late-before/mobile-landscape-exchange-furnishing-card.png) / [After](late-after/mobile-landscape-exchange-furnishing-card.png) |
| WorldMarket Collect row | [Before](late-before/desktop-market-collect.png) / [After](late-after/desktop-market-collect.png) | [Before](late-before/mobile-landscape-market-collect.png) / [After](late-after/mobile-landscape-market-collect.png) |
| Paperdoll cap readout | [Before](late-before/desktop-paperdoll-cap.png) / [After](late-after/desktop-paperdoll-cap.png) | [Before](late-before/mobile-landscape-paperdoll-cap.png) / [After](late-after/mobile-landscape-paperdoll-cap.png) |
| Paperdoll chest marker | [Before](late-before/desktop-paperdoll-chest.png) / [After](late-after/desktop-paperdoll-chest.png) | [Before](late-before/mobile-landscape-paperdoll-chest.png) / [After](late-after/mobile-landscape-paperdoll-chest.png) |
| Paperdoll furnishing card | [Before](late-before/desktop-paperdoll-furnishing-card.png) / [After](late-after/desktop-paperdoll-furnishing-card.png) | [Before](late-before/mobile-landscape-paperdoll-furnishing-card.png) / [After](late-after/mobile-landscape-paperdoll-furnishing-card.png) |
| Eligible weapon control card | [Before](late-before/desktop-paperdoll-control-card.png) / [After](late-after/desktop-paperdoll-control-card.png) | [Before](late-before/mobile-landscape-paperdoll-control-card.png) / [After](late-after/mobile-landscape-paperdoll-control-card.png) |

Each linked full image has a corresponding `-detail.png` beside it. The
[before manifest](late-before/manifest.json) and [after manifest](late-after/manifest.json)
record source URLs, native trusted input, actual text, bounds, capture attempts,
assertions and diagnostics. The [before log](late-before/capture.log.txt) and
[after log](late-after/capture.log.txt) preserve the completed commands' output.

The frozen before source is `ce0e25ec85`, served at port 5189; the frozen after
source is `ff738f61a1`, served at port 5190. Desktop uses 1600 by 900 CSS pixels;
mobile landscape uses 844 by 390 with touch emulation and scale factor 2. These
are native mouse/touch gestures in emulated Chromium, not physical-device proof.
Real painters and the shared tooltip compose every captured surface.

The late browser-only item `probe_furnishing_qa_late_ui` has authored name
`Screenshot Test Furnishing`, rare quality, sell value 25, a 2 by 3 footprint,
radius zero, decor cost 7 and floor placement. Hostile copy fields include
`Forged Furnishing Name`, legendary quality, Strength 999, Masterwork, Perfecting,
an enchant and signer `Testmaker`. A real `duskforged_warblade` copy named
`Control Blade` supplies the eligible legendary weapon control. Fixtures are
installed only in memory. Read fixtures feed the actual Exchange painter;
wallet signing throws if requested. No remote trade or market write is issued.

The accepted after images show authored rare furnishing identity in Exchange,
authored identity in sale history, no furnishing chest diamond and a cap count
reduced from 2/2 to 1/2. The furnishing card keeps the authored placement, maker
and vendor values without gear power. The weapon control retains its diamond
and legitimate power claims. Native furnishing-card bounds assertions pass.

The exact runner is archived as [late-capture.mjs.txt](late-capture.mjs.txt).
Restore it to `tmp/freeholds-02-qa-late-ui-capture.mjs` before reproducing these
accepted commands against the two frozen source servers:

```sh
GAME_URL=http://127.0.0.1:5189 QA_EXPECT_FIXED=0 SHOTS_DIR=tmp/freeholds-02-audit/late-ui-before-retry node tmp/freeholds-02-qa-late-ui-capture.mjs
GAME_URL=http://127.0.0.1:5190 QA_EXPECT_FIXED=1 SHOTS_DIR=tmp/freeholds-02-audit/late-ui-after-retry node tmp/freeholds-02-qa-late-ui-capture.mjs
```

The first desktop Collect frame in each run raced the existing GPU notice.
The harness retained that frame as
`desktop-market-collect-rejected-1-full.png`, dismissed the notice using its
native button, and accepted the second attempt only after the same visibility
assertions passed. These two rejected PNGs are retained as diagnostics and are
excluded from the 32 accepted images per source. Mobile passed its first attempt.
No visibility, trust or content assertion was removed to accept the retry.

This visual record resolves the furnishing card/cell and late-surface screenshot finding. The
[QA validation report](../../../freeholds/furnishing-item-kind-qa-validation.md)
separately tracks the shared gate, final reviewer evidence and contribution
verdict. No model, texture, reference image, icon or sampled asset was generated.
