# Freeholds and Guildhalls: interface and experience specification

Status: approved, UNBUILT design. Fernando approved R01 through R46 on
2026-09-06, with the final Codex artwork closeout and legal-team handoff additions.
D76 to D93 (ruling-sheet R47 to R64) are propagated here as the round-2 settled
dispositions recorded in state.md "Settlement round 2", approved by Fernando on 2026-09-06.
[state.md](state.md) owns the locked decisions; [ruling-sheet.md](ruling-sheet.md)
records the answered questions. Implementation, measured calibration, final asset
approval and external sign-offs remain the concrete producing files' deliverables
and release gates. Approval of this packet does not claim those gates have passed.

This is the durable source for housing's presentation and interactions. The game
is not implemented and no screenshots or audio evidence are claimed here. Each
owning implementation file and its QA pair carry the acceptance requirements and
capture targets below. A future authorized packet teardown must first preserve
this specification and its decision/contract links under docs/prd/woc.

## 1. Intent, sources and completion bar

A player should recognize their home before opening a panel. Eastbrook's timber,
plaster, cloth and warm hearth create the setting; belongings and accomplishments
make it personal. The free Inn Room receives the same authored finish as the
Cottage. Its smaller footprint is a coherent intimate room, never unfinished art
or a storefront waiting room. Quiet cool window light separates silhouettes from
the hearth warmth. The doorway, walking path and useful objects stay readable.

The room occupies the center of the screen. Bronze edges, cream text, painted
item art and restrained dark panels frame it. Decorative gold appears at selected
edges, never as a solid purchasing banner. Housing does not compete with the
world's action bar or bring its own HUD theme, typography system, window manager,
animation scheduler, item-grid implementation or sound engine.

Controlling sources are [state](state.md), the adopted [design standard](../../DESIGN.md),
the [proposal](../prd/woc/freeholds-and-guildhalls-research.md), the
[player deck](../prd/woc/freeholds-and-guildhalls-deck.html), and the
[tooltip standard](../design/tooltip-writing.md). The adopted rulings and later
numbered decisions take precedence over older proposal/deck wording. Every new
player-facing string is an English catalog entry under hudChrome.housing. Existing
item, title, deed, page, mark, mount, station, character and entity names come from
their existing localized selectors. Numeric placeholders use the live view model
and shared locale formatters, never literal balance copied into prose.

The desktop design references are the actual
[style render](../design/design-language/desktop-style-reference.png) and
[approved layout render](../design/design-language/desktop-approved-layout-reference.png).
Both show a warm Eastbrook village with teal and red roofs, timber/plaster,
greenery and inviting light pools. Near-black panels, bronze chamfered edges,
subtle inner highlights, cream text and painted icons sit at the edges. The
approved layout's right rail holds map, reward card, tracker and launcher grid;
its center remains open for moving and meeting friends. Reference text is
illustrative, never a string or gameplay promise to copy.

Shipped quality bars: bank/bags for owned-copy identity and inventory density;
the plant sheet for an understandable pending transaction; the action bar for
truthful live input glyphs and stable hot painting; the map for semantic markers;
the Reliquary for collection art, ownership, spoiler-safe sources and accessible
grids. A housing screen must look intentional at LOW, with no blur or ambient
chrome motion. A high-preset screenshot alone is insufficient.

All numeric design references in this specification are imported into state
"Content numbers" under the named UX rows in section 2. Gameplay quantities use
its tier, condition, prepay, rotation, visitor and later layout rows. Measured
room geometry comes from the content/art manifest and is recorded there before
use. A missing measurement cannot be replaced with an invented balance value.

Completion bar for this specification's inventories: the key tables below carry
557 exact hudChrome.housing.* keys, each with one owning phase, and the
section 11 registry expands to 742 screenshot variants, of which the
seven wave A targets hold 339 (file 20 verifies that wave A union) and
the later producers register the rest in their own changes. ux-key-manifest.json
and ux-shot-manifest.json are regenerated from these tables and this registry in
the same change as any row change (D92).

## 2. Shared tokens, windows, painters and input ownership

### 2.1 Current tree versus adopted design

DESIGN.md is adopted, but the inspected tree still has the previous foundation.
Implementing file 11 verifies the shared foundation/chrome rollout before using
new tokens. Until the coordinated rollout lands, consume the current shared
family and its actual tokens; after it lands, consume the adopted shared tokens.
Do not introduce housing-local fallbacks with copied target colors or restyle the
game from this packet. This explicit migration condition is recorded in state.
The reverted window_frame.ts is absent; the leftover .window-frame selectors in
src/styles/components.css and src/ui/perf_ornament_svg.ts are not a dependency.

| Role | Verified current family | Adopted target | Content numbers source row |
|---|---|---|---|
| Accent/border/panel | theme.ts classic #ffd100 / #6f5a2a / #15151f | #d8a645 / #926321 / #12232c through shared theme variables | UX current and adopted colors |
| Text/muted | #f0ebd8 / #998d6a | #fff4d9 / #c4b590 through shared theme variables | UX current and adopted colors |
| Display/UI/reading fonts | Existing --font-display remains Cinzel; all remaining font roles use shipped shared tokens | Alegreya 700 / Alegreya Sans 400,500,700 / Alegreya 400; labels Alegreya Sans SC 700; Cinzel only brand/shell | UX typography |
| Type size/line height | Existing shared window and control selectors | Window title 17/22px, panel title 15/20px, button 14/17px, body 14/19px, metadata 12/15px; body floor 12px | UX typography |
| Spacing and scale | --spacing-xs 4px, --spacing-sm 8px, --spacing-md 16px, --spacing-lg 24px; existing --ui-scale | Same spacing; shell pad 12px, body pad 12 to 16px; only one scale at authored scale 1. The release widened UI scale to 0.75 to 2 (`UI_SCALE_MIN`/`UI_SCALE_MAX`, src/ui/ui_scale.ts), so compact-viewport fit checks cover that whole range, not only scale 1 | UX shared spacing and scale |
| Header/close/tabs | Actual .window.panel shared shell and controls | Header 44px, icon 24 to 28px, close 34px with expanded touch target; tabs 32px visually with full touch target | UX window and item geometry |
| Item cells/radius | Bags-family cells, --radius-sm 4px and --radius-md 8px | Cells 48px with 4px gap; --radius-slot 5px, --radius-button 7px, --radius-window 10px | UX window and item geometry |
| Touch | Existing body.mobile-touch, safe-area and input rules | Every target at least 40x40px; visible input, select and textarea text at least 16px | UX touch targets; UX typography |
| Motion | --transition-speed 0.25s and --transition-ease cubic-bezier(0.4,0,0.2,1) | --dur-fast 90ms, --dur-press 60ms, --dur-panel 160ms, --dur-frame 120ms, close about 120ms | UX motion |
| Tooltips | Actual shared #tooltip and attachTooltip | Strong fill, 10px pad, max 320px, hover delay about 250ms and immediate keyboard-focus presentation | UX tooltip |
| Readable states | themeCssVars contrast repair and shared semantic hooks | Normal text 4.5:1; large text/accent 3:1; error text stays --color-text-error #ff8f85 | UX contrast |

The shipped guaranteed-dark ramp is --color-gold-900 through --color-gold-300
(declared in src/styles/tokens.css); the DESIGN.md ink ramp --color-ink-1000
through --color-ink-800 is a target only, with exact values in state "UX current
and adopted colors". Housing CSS never reads --color-ink-* before tokens.css
declares it (the fallback-free token guard fails an undeclared name); the shipped
gold ramp may ornament guaranteed-dark surfaces. Readable text,
selected borders and focus on themed surfaces use the theme-derived variables:
--color-accent-hover, --color-border-focus, --color-accent-glint,
--color-text-secondary, --color-text-faint and --panel-fill-strong when shipped.
Do not force dark ink/gold literals onto parchment. Success/warning/danger/info
use the shared semantic roles; item rarity uses the existing quality hooks.

### 2.2 Exact composition contracts

Reuse the `.window.panel` composition (`.window` from src/styles/layout.css and
`.panel` from src/styles/base.css) and the existing window drag and resize
installers. Every NEW housing window id receives an explicit mobile pin,
size and transform rule or a reviewed mobile exception. Wave A housing window
ids: steward-window (16) and trophy-case-window (17), each with a mobile-sheet pin
in src/styles/hud.mobile.css. CSS remains flat:
src/styles/components.css for bodies, src/styles/hud.css for chrome and
src/styles/hud.mobile.css for touch layout, respecting their layer contracts.

The NEW domain src/ui/hud/housing/ has a local CLAUDE.md and index.ts public
barrel. Every view/core is DOM-free and registered in UI_PURE_CORES. Thin DOM
adapters and their host interaction are registered in UI_DOM_MODULES where the
existing guards require it. Components consume IWorld's housing facet, never a
concrete Sim or ClientWorld. PainterHostPresentation provides itemIcon,
moneyHtml, itemTooltip and attachTooltip; PainterHostWriters supplies the shared
setText/setDisplay/setTransform/setWidth/setStyleProp/toggleClass/setAttr writers.
No private duplicate per-frame cache or two single-slot writers share an element.
A hot build painter joins the existing perf bucket; every polled signature-gated
window joins hud_update_drive. Cold event-driven windows do not gain timers.

Every signature-gated rebuild has relocalize fan-out, a freshly latched signature
and one rebuild. Preserve active tab, selected copy, scroll, search and form draft
through focus_restore and form_draft helpers. Changes to live affordability and
authority must invalidate the view even while the player has not moved.

The palette is intended as a bank-style nontrapping world companion, but the
existing pad composition does not provide that behavior for an ordinary panel.
A visible .window.panel or dialog wins dpad_focus_nav's activeRoot selection,
and the HUD's window-open projection puts gamepad into pointer mode. Adding
`data-pad-nav-root` alone does not change either fact. File 11 therefore owns a
NEW scoped companion/window-input arbitration seam in the housing controller
and src/game/build_mode_wiring.ts, with the small NEW pure housing input core
src/ui/hud/housing/build_input_core.ts.
It classifies the active context as ordinary blocking window, housing palette
focus, housing placement, or normal world. This is a planned extension, not an
existing public API. The default remains the shipped behavior for every existing
window; no global .window.panel exception or span-all-windows mode is introduced.

An ordinary modal/confirmation window takes precedence and suspends housing
world input. With only the companion visible, explicit placement mode keeps
camera/ghost input active without sending avatar movement, ground-aim casts,
cross-hotbar actions or combat. Explicit palette focus instead owns d-pad
navigation and confirm. The existing focus-cycle action returns from placement
to the selected palette cell; selecting a piece returns to placement. Close,
reconnect, authority loss and plot change release that ownership once and
restore the normal window/input projection. The actual HUD/window-open and
pad pointer-mode consumers must use the same scoped classification. Tests drive
the composed input path with palette open, not only the pure classifier or DOM
attribute, and verify ordinary window precedence and no combat dispatch.

Steward, the full
trophy case and gate/visit prompts are ordinary standalone windows with
FocusManager registration through the shared HUD. `markDialogRoot` sets one
accessible name and defaults aria-modal=false. Only a true blocking confirmation
uses `installPromptDialog`, inerts its owner and always clears inert state using
the returned dismiss on close, rebuild and force-close. No ordinary housing
window falsely claims the entire game page is inert.

Keyboard open records the opener and enters the designated first control. Pointer
open follows pointer_blur/chrome_focus_wiring and does not force a button focus
ring. Focus restoration uses captureFocusKey, focusedWithin and
restoreFirstEnabled, preserving a valid choice and skipping disabled actions.
Tab is trapped only when focus is already inside a registered trapped root; world
Tab targeting remains available outside it. Escape travels through the existing
HUD close chain; a pending edit can consume the first cancellation before its
window closes, without rebinding Escape globally.

Tabs use tabStripModel/tabStripHtml with wireTabStrip/focusActiveTab: selection
follows arrow focus, Home/End works and only the selected tab is a Tab stop.
Reliquary/bags item choices keep the family's explicit roving navigation;
rovingTarget's linear both-axis behavior must not be mistaken for geometric grid
navigation. The selected cell is the single grid Tab stop. Associate the visible
build.collectionHelp or trophies.collectionHelp with its grid through the shared
assistive-description contract; instructions survive relocalize and input-mode
changes. The content and controller must agree on arrow behavior. Gamepad uses
the shared dpad_focus_nav and followDomFocus. The palette/placement strip may use
`data-pad-nav-root` for focusable-root identification, while the NEW scoped arbitration above owns whether placement
or window navigation receives input. A hardware glyph always comes from live
binding helpers and the active pad family, never hardcoded controller lettering.

Compact uses a mobile sheet with stationary heading/actions and one scrolling
body. The palette can collapse to its selected-item strip. Tablet uses the same
reading/focus order in a wider side panel. Respect every safe-area inset and
body.mobile-touch in landscape, not just a narrow-width media query. Preserve the
existing portrait rotation gate. All features have a tap-only route honoring
touchTapMenus. Coordinate conversion between authored UI and physical pointer
pixels happens once; finger offset derives the actual visible hit target, never
an unexplained world-space distance.

### 2.3 Common state vocabulary and strings

All tables below name NEW English catalog entries, not existing code anchors.
Use the listed keys for visible labels, accessible names, tooltips, validation,
status and error surfaces. Placeholders are escaped and locale-formatted. Values
such as {item}, {deed}, {page}, {mark}, {station} and {title} are already localized
through their owning selectors, including custom noun settings. Player-entered
names are escaped data. Never concatenate a raw noun, count or date in a painter.

Every section explicitly includes empty, loading, error, locked, visitor, owner,
pending and reconnect behavior. The common table applies to all of them. A
status message appears once in a polite live region when its semantic state
changes, never each paint. A forced removal/refusal uses the existing error
announcement priority. Decorative icons have empty alt text; meaningful art gets
the same item/source name available to sighted players. Errors carry a stable
reason through the sole planned freeholdDeniedLineKey(reason) in housing_view.ts
and the hudChrome.housing.denied namespace. Success uses the separately planned
freeholdGrantedLineKey, correlated by operation, target plot and request identity.
An unrelated event must not close/rearm a window or play its success cue.

hudChrome.housing.* is the only housing key family (D92): charter.* carries the
Store card, fee, tax and Purchase Terms rows and steward.manageWebsite carries
website management; no store.*, service.* or eligibility.* family exists, and the
docs/prd/woc drafts adopt the ids in these tables. Window-title, tab and button
keys use title case per DESIGN.md 5.4; status, description, radio and aria keys
use sentence case. Every key has exactly one owning phase, shown in the Owner
column of every table and in the owner field of ux-key-manifest.json; that phase
names the keys it adds with their exact English in its own file (the wave A base
rows are named here and cited by namespace in their owner files) and regenerates
both manifests in the same change. Namespace owners, with the rows other phases
own in the same namespace (14 ships its two steward rows before 16 opens the
namespace; every other listed phase appends after the base owner):

| Namespace | Base owner | Rows owned by other phases |
|---|---|---|
| common | 06 | none |
| denied | 06 (unavailable, busy, permission, condition, dead, combat, cooldown, instanced, match) | 11 (placement rows, bagsFull, changed, ownershipChanged), 16 (materials, offlinePurchase), 17, 21, 25, 28, 34, 38, 40, 41, 41a, 42 |
| granted | 11 (placed, moved, removed) | 16 (ledgerPaid, prepaid, call), 21 (upgradeComplete) |
| gate | 06 | none |
| arrival | 09 | none |
| hearthKey | 06 (tooltip, destination) | 42 (tooltipShared) |
| interior | 09 (door, hearth, plinth, emptyPlinth, amenityPaused, preparing) | 12 (Strongbox and station rows) |
| build | 11 | 25 (surface, freeRotate, movesChildren) |
| furnishing | 02 (item tooltip leaves) | 25 (typed surface rows when they land) |
| steward | 16 | 14 (manageWebsite, manageWebsiteAria), 21 (upgrade rows), 40 (requirement and overflow rows), 42 (primaryTab, secondTab, secondBillNote) |
| charter | 16 (card, quote, fee, tax, Terms, section, reference and support rows) | 29 (guildhall rows), 37 (serviceUnavailable, eligibilityUnconfirmed, supportPointer; 38 reuses serviceUnavailable for the deed service), 42 (second-home rows) |
| trophies | 17 | 23 (finish and form rows) |
| visit | 18 | 26 (Open Houses rows) |
| garden | 24 | none |
| guild | 28 (title, fund, projects, contributions, warTable, noRecords, officerRequired, ownPlinth) | 29 (fund form rows), 30 (amenity refusals), 30a (board rows), 31 (firstKillRow) |
| ward | 34 (title and roster rows) | 35 (endeavors, favor and Endeavor rows) |
| showcase | 36 | none |
| guestBook | 36 | none |
| layouts | 41a | none |
| dyes | 41 | none |
| deed | 38 | none |

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.common.close | Close | 06 |
| hudChrome.housing.common.cancel | Cancel | 06 |
| hudChrome.housing.common.back | Back | 06 |
| hudChrome.housing.common.retry | Try Again | 06 |
| hudChrome.housing.common.loading | Loading your home... | 06 |
| hudChrome.housing.common.pending | Waiting for confirmation... | 06 |
| hudChrome.housing.common.reconnecting | Reconnecting. Your saved home is safe. | 06 |
| hudChrome.housing.common.readOnly | Read only | 06 |
| hudChrome.housing.common.unavailable | This is unavailable right now. | 06 |
| hudChrome.housing.common.unknown | Unknown | 06 |
| hudChrome.housing.common.selected | Selected: {name} | 06 |
| hudChrome.housing.common.closeAria | Close {window} | 06 |
| hudChrome.housing.denied.unavailable | This home is unavailable right now. Try again later. | 06 |
| hudChrome.housing.denied.busy | This home is active elsewhere or still opening. Try again shortly. | 06 |
| hudChrome.housing.denied.permission | You cannot use this here. | 06 |
| hudChrome.housing.denied.ownershipChanged | Your access changed. Your last confirmed changes are saved. | 11 |
| hudChrome.housing.denied.changed | Your home changed before this action finished. Review it and try again. | 11 |
| hudChrome.housing.denied.materials | You do not have enough materials in the selected source. | 16 |
| hudChrome.housing.denied.bagsFull | Make room in your bags before removing this furnishing. | 11 |
| hudChrome.housing.denied.condition | Restore your home's condition to use this amenity. | 06 |
| hudChrome.housing.denied.offlinePurchase | Purchases need an online connection. | 16 |
| hudChrome.housing.denied.dead | You cannot do that while dead. | 06 |
| hudChrome.housing.denied.combat | You cannot do that in combat. | 06 |
| hudChrome.housing.denied.cooldown | Your Hearth Key is still cooling down. | 06 |
| hudChrome.housing.denied.instanced | You cannot use this inside an instance. | 06 |
| hudChrome.housing.denied.match | You cannot use this during a match. | 06 |
| hudChrome.housing.granted.placed | {item} placed. | 11 |
| hudChrome.housing.granted.moved | {item} moved. | 11 |
| hudChrome.housing.granted.removed | {item} returned to your bags. | 11 |
| hudChrome.housing.granted.ledgerPaid | Your Ledger is paid. | 16 |
| hudChrome.housing.granted.prepaid | Your Ledger is paid through {date}. | 16 |
| hudChrome.housing.granted.call | Your home's condition is restored. | 16 |

freeholdDeniedLineKey (06) maps the sim reasons as they stand after 06:
no_freehold to denied.unavailable, busy to denied.busy, locked to
denied.condition, and visitors_full and not_friend to denied.permission until 18
adds their rows; dead, combat, cooldown, instanced and match have their own rows
above. Later phases append rows to that one selector and never add a second.

### 2.4 Account lifecycle, calendar and presentation authority

The account-shared Hearth cooldown has one online authority. File 07 owns NEW
server/freehold_hearth_db.ts with FREEHOLD_HEARTH_SCHEMA, loadFreeholdHearth and
advanceFreeholdHearthOnClient over account_freehold_hearth. The private UI receives
a committed mirror; transferable plot storage and cached ready indicators never
authorize entry. File 07a atomically checks/advances the account row with accepted
remote Hearth entry using the authoritative nonregressing transaction clock.
Refusal, already-home no-op and physical-gate entry do not advance it. File 42's
second destination uses that same account row. Transfer neither copies nor clears
either account's cooldown; character deletion preserves it. Offline/headless
fixtures use isolated injected host-clock state and the existing approved duration.
Possessing a Hearth Key is inventory usability, never an authorization credential.

These are approved engineering acceptance contracts outside the player flow.
Every housing-specific module, field and helper below is NEW implementation work,
not an existing shipped API.
The UI consumes explicit safe projections, never server records or authority
ledgers. Do not expose database keys, operator evidence, internal authority
revisions/digests, generation-registration facts, raw account lifecycle history,
private diagnostics or secret-route details in labels, tooltips, aria text,
errors, owner-private snapshots or public guest descriptors. Owner-private is
still player-visible. File 13a's NEW server-only
FreeholdUpkeepAuthoritySuspension in server/freehold_db.ts is distinct from
file 13's safe sim FreeholdUpkeepSuspension, whose allowed calendar facts are
calendarId/startMs/endMs/reasonCode. Self/public builders explicitly allowlist
what their viewer needs; they never serialize either complete server or sim
record. Calendar identity needed by deterministic interpretation does not become
a player-facing identifier. Safe timestamps, display timezone and reason codes
are selected separately for UI. Sentinel tests exercise the actual encoders,
including owner-private paths, to prove evidence never reaches any player.

File 07b owns NEW server/freehold_lifecycle_db.ts, FREEHOLD_LIFECYCLE_SCHEMA,
loadFreeholdLifecycle and advanceFreeholdLifecycleOnClient for one account
lifecycle authority. All plots, characters and realms consume its committed
presence/return/grace history; the UI cannot infer a new grace period from its
own login, home entry or current character. Preserve exact protection across
multiple absence/return cycles of a dormant second plot, using retained history
or proven lossless summaries rather than only the latest transition. Union
account absence/grace protection with service outage suspension before elapsed
wear/credit evaluation; overlapping protection is not added/subtracted twice.
Sale does not transfer another account's grace, and a new plot does not restart
it. Character deletion preserves account history; account deactivation is not
hard deletion. No presentation completion, frame update or snapshot writes
arrival/lifecycle authority or requests per-player SQL.

Calendar meaning is stable across realm takeover, restart and transfer. The
core/persistence owners retain original source calendar/schema/reset-policy
meaning and immutable credit/checkpoint dependencies. Serving a plot from a
different realm cannot silently rebind old history or reinterpret civil days as
fixed-duration intervals. A truly pre-upkeep unbound record can bind only through
the accepted prospective migration; unsupported or ambiguous stored history is
preserved read-only, never treated as missing history, a fresh Inn or new grace.
The UI receives an unavailable state instead of attempting that conversion.

Durable condition checkpoints, elapsed bill classification and prepaid-credit
consumption require irrevocable finalized facts through every historical
dependency. Merely covered but revisable history cannot authorize those effects.
Keep their last acknowledged display while the affected operation awaits the
needed facts. Purchasing future prepay requires the valid published bill
schedule and current prerequisites, not finality for future time. Immutable
future credit purchase and eventual historical credit consumption are separate
operations. Do not predict a missed push as chargeable active time or an expired
credit, and do not let a partial/long outage erase protected future credits.

Each installed view is internally consistent and nonregressing for its current
process/connection generation. An older asynchronous load or duplicate cannot
replace a newer committed projection, regress a finalized boundary or revive an
old grace state. Current duplicate, superseded duplicate and conflicting input
remain backend distinctions; the player sees the appropriate current safe
status. Bounded private delivery/ACK, pre-body admission, history retention,
locking and finality guard implementations belong to their server/core owners;
no HUD polling, operator route, raw authority payload or new listener is added
to accomplish them. Consumer tests cover old-load-after-new-install and history
changes between display and attempted commit, with the same deterministic
injected calendar facts in offline/headless hosts. Rollout requires a named
minimum capable release or explicitly compatible staged deployment before
enablement. Untouched normalized tables do not mean an older binary can
interpret lifecycle/calendar or recovery state. An unsupported client/host
preserves data and reports unavailability; it never silently reconstructs a
fresh home. Root's rollout/persistence owners specify quiescence and recovery
before rollback, outside the player flow.

Guest-book daily rate authority survives visible entry removal. File 36's NEW
freehold_guest_book_daily_claims uses unique (account_id, plot_id, realm_day_id),
where realm_day_id is the realm day resetDay (03:00 in the realm reset zone, D84)
and the globally stable day identity preserves the CAL-SOCIAL calendar/reset
binding (a named unsigned gate until its signature artifact is on file) across
revisions. Calendar/reset references do not create alternate
uniqueness identities. Appending and deterministic visible pruning share the
conflict-safe daily-claim transaction; failure rolls back all effects. Pruning,
owner/moderation deletion and restart do not reset the allowance. Closed-day cleanup
requires the nonregressing authority watermark to exclude every supported delayed,
retry, restart and rolling-release admission path; absent proof retains the claim.
The UI never derives eligibility from the visible list length or client date. These
internal fields and authority watermarks never enter player text or public rows.

The account source reader is shared. File 17 owns NEW
server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage and
server/freehold_account_sources.ts::createFreeholdAccountSourceLoader; file 24
extends its static farm extraction, bounded cache, admission and invalidation
(premise changed at the v0.44.0 sync: the release's account ledger,
src/sim/account_ledger.ts, now carries most of these sources; re-planned in
phase-17-trophies.md item 2; farm plots are not in the ledger, so 24 keeps its farm
source seam even if 17 drops its loader).
There is no separate HUD poller. The internal account union distinguishes
character and bed, but the public Kitchen Garden projection explicitly selects
only opaque visualId, bedId, cropId, stage, status and truthful sourceFreshness.
Never serialize raw source-character/account/realm identity, timestamps/countdowns,
skill, survivalRoll, yieldSeed, hidden flags or the complete FarmPlotView.

The freshness discriminator distinguishes live, saved and unavailable sources.
Only a current-generation local authoritative Sim farm-and-skill slice is live;
it replaces that character's entire saved slice, including a confirmed empty
slice. A remote or nonlocal committed farm-and-skill snapshot remains saved even
when the host deterministically derives a newer stage at its authoritative farm
clock. It does not prove remote unflushed changes or authorize client timer
prediction. Incomplete coverage or unavailable data cannot become a no-farms,
ready-to-harvest or live claim. Mixed-source aggregation retains enough safe
freshness/coverage metadata to present every component truthfully. The owner's
Journal action still opens only the current character's private Harvest Journal;
a visitor sees the owner's safe tableau, never an alt identity or Journal action.

## 3. The first moment: Eastbrook gate, door and arrival

### Player goal and flow

Find a home naturally in Eastbrook and enter feeling oriented, welcomed and free
to explore. The gate is a world interactable with the normal semantic map marker
(the freehold-gate MapMarkerSemantic arm, its art, layer and accessibility tokens,
produced by 06 and pinned in tests/map_marker_semantics.test.ts,
tests/map_semantic_accessibility_core.test.ts and tests/minimap_markers.test.ts).
The proximity hint and the actual interact press share the same resolved target;
merely walking near it never teleports. Gate choice offers the account's own
home and friend-by-character-name. The free Inn Room is a normal destination and
has no purchase nag at its door.

Flow: interact at the Eastbrook Freehold Gate, choose destination, activate entry,
receive authoritative acceptance, prepare the destination behind the existing
arrival curtain, reveal a safe doorway pose facing the hearth, apply the
per-arrival presentation table below, and resume exploration. Returning outdoors
uses the remembered safe gate. Home choice retains the previous valid selection
for the visit; later second-home selection uses the same control, not another
entry prompt.

Own-home entry and friend lookup are separate actions. The own tab selects an
owned destination and enables Enter when current admission allows it. The friend
tab starts with a character-name input and Find home, with Enter absent until a
matching authorized result exists. Enter while editing the name invokes lookup,
not entry. After a successful lookup, focus its named result heading, announce
the result, and let Tab reach Enter. Editing the name invalidates the prior
result/entry capability immediately and shows gate.lookupChanged. Every lookup
carries a request identity and normalized queried name; a late response for an
older name cannot display/authorize the current draft. Failed lookup retains the
name with retry through Find home. Only explicit Enter submits the matching
current destination; its server admission check repeats all authority.

Gate view uses the plant-sheet decision-window contract and NEW housing_view.ts,
with the visit_prompt_view.ts composition extending it when friend visiting
lands. The map marker reuses the existing map_window_view/map_window_painter
semantic marker path and existing art cache. No new canvas framework or secondary
GL context is introduced for a destination thumbnail.

Arrival goes through src/game/teleport_camera.ts's facing-reset contract, including
pending camera-driven facing and keyboard-turn reset before movement sampling.
Use the existing arrival_warmup/arrival_cover presentation gate and preparation
scheduler. Structural room, safe arrival/collision data and readable actionable
representations must be ready before reveal. Ordinary online arrivals have no
additional cosmetic settle wait: arrivalRevealSettleMaxMs returns zero online.
The bounded offline wait also does not guarantee that every cosmetic is ready.
Late optional furnishings use prepared readable stand-ins through their reveal
gates; neither housing nor a fixture may generalize the special first-spawn
establishing-shot wait. No housing-only curtain delay is added.

First-tier hearth framing borrows src/render/camera_director_core.ts's
envelope (state "UX arrival camera") with a path derived from the approved
room's safe bounds and camera collision. The optional hearth view is the NEW
'hearthView' CameraDirectiveKind in src/render/camera_director_core.ts (09),
beside the existing 'vista' and 'deathDrift' kinds. Any movement, look, confirm or cancel
resumes ordinary input immediately and invokes the existing cancel path. That
path blends its camera offset out over DIRECTOR_RELEASE_TIME; it does not
instantly restore the pose. Keep the blend camera-safe while input resumes.
Reduced motion never starts the directive, so it has no automatic offset to
blend away. An unsafe path also uses the static safe arrival pose. Distinct
immediate-offset clearing would be NEW behavior and is not assumed here.

The doorway view frames the hearth off the travel path, an inviting seat or bed
and an honest first plinth. A known first qualifying trophy may be backfilled;
an account without an achievement receives an empty plinth, never a false feat.
The Inn Room shows a bed, warm fabric, practical storage dressing and a clear
walking route. Cottage expands the same material language with breathing room
for the player's first furniture arrangement. Realm daylight changes the window
appearance while leaving navigation and item identity legible.

File 09 owns NEW public GameAudio.playHousingArrival, delegating to sampled personal
feedback and honoring interfaceSfx, and its NEW housing_arrival cue authored through
scripts/sfx/sfx_prompts.mjs, gain/speed maps, manifest generation and SFX conformance;
private GameAudio.play/playFeedback are not public extension APIs. Existing
amb_campfire remains spatial hearth ambience through the existing audio graph.
Door/body sound belongs to positional SFX. No new AudioContext or housing music
system. Welcome text survives mute, a missing clip and blocked AudioContext.
The ordinary welcome feedback runs once when the client receives a
NEW accepted arrival transition, as R15 specifies. It is separate from
optional first-tier presentation. Preserve acceptedTransitionId, the destination
public plot identity and confirmed dungeonEntrySeq through the private arrival
result. File 08a's exact NEW nullable field is freshArrivalPresentation,
with NEW type FreeholdArrivalPresentation = { acceptedTransitionId,
playWelcomeCue: true, firstTierViewEligible: boolean }. A new accepted owner or
visitor transition may carry this value; only the committed newly inserted
owner tier may set firstTierViewEligible true. Snapshot/resume/replay carry
freshArrivalPresentation null, while retaining historical firstTierAtAdmission
and transition/plot/dungeonEntrySeq context. The consumer checks the directive's
acceptedTransitionId matches the current accepted transition and deduplicates
its consumed identity across repeated paints/events.

A replay/resume is explicitly an already accepted transition, including on a
newly started client; it does not become new because the local seen set is empty.
Neither replay nor resume remints ordinary welcome or optional first-tier
presentation. The consumer uses freshArrivalPresentation and its explicit
firstTierViewEligible field, never reconstructs either from positive history.

File 07c owns NEW server/freehold_arrival_db.ts with FREEHOLD_ARRIVAL_SCHEMA,
loadFreeholdArrivalTiers and markFreeholdArrivalTierOnClient. The private
account_freehold_arrival_tiers account+tier mark is inserted conflict-safely
inside file 07a's accepted owner-entry transaction. Only the committed
insert winner on a newly accepted owner transition may receive
freshArrivalPresentation with firstTierViewEligible true from 08a. Historical
firstTierAtAdmission is immutable admission context, not permission to start a
camera/cue. Guests,
rejected entries, ordinary confirmed-seen returns, periodic saves, renderer
completion and snapshots do not create first-tier marks. The private Sim set is
a mirror outside plot serialization; second plots, different alts and realms
do not each own independent first-tier marks. Sale/transfer does not copy or
clear account presentation history; character deletion preserves it.

The normalized mark controls only firstTierViewEligible, the optional
first-tier presentation permission. playWelcomeCue is scoped to the new arrival. Ordinary
return/guest welcome feedback remains scoped to a NEW accepted arrival and
requires no permanent routine-entry receipt table. Delivery is best effort:
commit-before-ACK failure can cause the optional view or welcome feedback to be
skipped after recovery. This is at-most-once eligibility, not exactly-once
visible or audible output. Do not create a new mark/directive or replay a cue to
make up for an unobserved presentation. Offline/headless fixtures use their
isolated nonpersisted account identity and explicit transition provenance, not
online DB marks. Tests cover two plots/realms racing for one tier, rollback,
new-versus-replay on a fresh client, commit-before-ACK recovery and mute.

| Presentation event | Camera | Copy and sampled feedback |
|---|---|---|
| New accepted owner Inn Room transition with the committed first-tier mark and fresh directive | Automatically start the safe short hearth view if the directive is delivered; visible Skip and movement/look cancel it; reduced motion stays static | arrival.welcome and ordinary welcome feedback for this new delivered transition |
| New accepted owner Cottage transition with the committed first-tier mark and fresh directive | Same optional first-tier safe view, without locking input; historical eligibility alone cannot start it | arrival.welcome and ordinary feedback for this new delivered transition; purchase receipt stays separate |
| New accepted ordinary own-home return | Static safe arrival pose; no first-tier directive or new account-tier mark | arrival.welcome and one ordinary cue for this new delivered transition |
| New accepted visitor entry | Static safe arrival pose; no account-tier mark or first-tier directive | arrival.visitor and one ordinary cue for this new delivered transition, without ownership/grant celebration |
| Reconnect, replay or resume of an already accepted entry, even on a fresh client | Resume authoritative location, never start a new first-tier view from historical eligibility | Connection recovery text when appropriate; no new welcome cue or fresh directive, including after commit-before-ACK failure |
| Rejected entry | Remain at safe source location | Stable refusal only; no welcome text, cue or camera directive |

The short first-tier view is automatic and skippable only when its fresh
directive is delivered. It is not a separate opt-in or a replayable historical
entitlement. Reduced motion is the existing preference controlling its static
alternative; an additional housing-camera preference is outside this packet.

### States and input

| State | Required presentation and recovery |
|---|---|
| Empty | No paid tier still shows Inn Room; no visits field value shows its label and localized prompt. No invented friend suggestions or private occupancy. |
| Loading | Preserve gate geometry and selections, set aria-busy, show gate.loading; keep close reachable before a committed transition. The arrival curtain owns actual scene preparation. |
| Error | Preserve the selected destination/name, show the stable reason and retry; a denied lookup reveals no hidden owner/occupancy facts. No arrival cue or camera move. |
| Locked | Physical gate admission uses its own authoritative living/combat/jail/access rules. Hearth Key cooldown belongs only to remote Hearth Key use and cannot block an otherwise permitted physical gate entry. No purchase suggestion solves an entry restriction. |
| Visitor | Owner name and public occupancy appear only after authorized lookup; arrival gets guest context and Leave, without Build/Steward spending controls. |
| Owner | Own home selection, ordinary entry and first-home welcome. Do not automatically open a panel after arrival. |
| Pending | One request is in flight; Enter cannot send again. Close marks the UI generation stale but reconciles an accepted entry; no duplicate enter from a late reply. |
| Reconnect | Show common.reconnecting over the last safe state; resolve authoritative location before revealing movement. If entry never committed, restore the gate form. If it committed, finish arrival without replaying the grant cue. |

Focus order on own tab: selected tab, home choice, Enter, Close. On friend tab:
selected tab, name input, Find home, authorized result heading/choice, Enter,
Close. Result/entry controls are absent until a current matching lookup succeeds.
Successful entry returns to world input rather than a removed gate control. Error
focus stays on the failing field/action and the reason is announced. Keyboard and
pad select through the shared tab/radio and confirmation conventions. Touch has
full targets and safe-area margins. Skip remains reachable throughout the view;
reduced motion does not auto-rotate the camera or slide the welcome line.

```text
+---------------- gate window ----------------+
| {gate.title}                    {common.close}|
| [ {gate.own} ] [ {gate.visit} ]               |
| selected owned home OR {gate.name}: [       ]|
| friend tab: [ {gate.lookup} ]                |
| matching authorized result / refusal reason |
| result ready:                  [ {gate.enter}]|
+---------------------------------------------+
                  authoritative entry
                           |
           preparation curtain -> safe reveal
                           |
+--------------------- world ------------------+
|  door / clear path        cool window edge   |
|                  hearth / inviting furniture|
|      {arrival.welcome}       {arrival.skip}  |
+---------------------------------------------+
```

Braced diagram labels are catalog suffixes under hudChrome.housing, expanded in
the tables; other diagram words describe world composition, not screen copy.

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.gate.title | Choose a Home | 06 |
| hudChrome.housing.gate.own | My Home | 06 |
| hudChrome.housing.gate.visit | Visit a Friend | 06 |
| hudChrome.housing.gate.name | Character name | 06 |
| hudChrome.housing.gate.namePlaceholder | Enter a character name | 06 |
| hudChrome.housing.gate.nameRequired | Enter a character name to visit. | 06 |
| hudChrome.housing.gate.homeChoice | Choose your home | 06 |
| hudChrome.housing.gate.lookup | Find Home | 06 |
| hudChrome.housing.gate.lookupPending | Finding your friend's home... | 06 |
| hudChrome.housing.gate.lookupChanged | Find this character's home before entering. | 06 |
| hudChrome.housing.gate.result | Home belonging to {name} | 06 |
| hudChrome.housing.gate.enter | Enter | 06 |
| hudChrome.housing.gate.loading | Opening the door... | 06 |
| hudChrome.housing.gate.marker | Freeholds gate | 06 |
| hudChrome.housing.gate.interact | Choose a home | 06 |
| hudChrome.housing.arrival.welcome | Welcome home, {name}. | 09 |
| hudChrome.housing.arrival.visitor | Welcome to {name}'s home. | 09 |
| hudChrome.housing.arrival.skip | Skip Arrival View | 09 |
| hudChrome.housing.arrival.ready | Your home is ready to explore. | 09 |
| hudChrome.housing.hearthKey.tooltip | Return to your home. You cannot use this while in combat, dead, in jail, inside an instance or during a match. | 06 |
| hudChrome.housing.hearthKey.destination | Destination: {home} | 06 |
| hudChrome.housing.hearthKey.tooltipShared | Return to your selected home. You cannot use this while in combat, dead, in jail, inside an instance or during a match. Your homes share its cooldown. | 42 |

Hearth Key metadata shows the live cooldown (state Hearth Key row), without
repeating it in the tooltip sentence. hearthKey.tooltip is the Wave A English 06
ships; 42 rewords the key to the shared-destination sentence recorded above as
hearthKey.tooltipShared when the second home lands, as a listed key change, never
a silent reword. gate.interact is the world prompt verb and gate.title the window
title; they are distinct sinks. No tooltip may ship a future restriction or
feature before its handler exists.

## 4. Build mode: a world companion with deliberate placement

### Player goal, family and composition

Make the room personal while seeing the exact copy, space and capacity involved
before committing. NEW build_mode_view.ts, build_mode_controller.ts and
build_mode_painter.ts compose with furnishing_palette_view.ts and
furnishing_palette_window.ts in src/ui/hud/housing/. NEW src/game/build_mode_wiring.ts
owns input composition, with NEW src/game/freehold_build_camera.ts owning the
bounded camera behavior. NEW src/render/freehold/furnishing_ghost_visual.ts consumes
a pure footprint/placement projection and the normal GPU preparation lifecycle.
This is a housing-specific footprint visual: GroundAimReticleVisual is circular,
color-dependent and has no reduced-motion argument, so it is not copied as the
finished furniture ghost. GroundAimController, pad ground aim and touch_router
provide the lifecycle/arbitration precedent, not furniture validation authority.

Reuse bags cells, icon helpers, rarity/instance/grade/bound/signed marks and copy
identity. The pure palette filters to owned furnishings and a Trophies tab. The
Amenities tab shows installable station choices when supported; built-in services
are described separately. The selected item preview uses item art, not an extra
GL preview context. Search and categories operate on localized names but retain
the original instance/slot identity. Failing art uses the shared item fallback
without losing the label, marks, budget or selection. Use build.selectedCopy only
when marks are present; the complete build.selectedCopyNoMarks arm supplies the
empty-mark case without dangling punctuation.

The palette sits beside the world without a scrim or trap. A compact header and
steady footer carry live decor/plinth/amenity meters from the initial build
release, painted from the NEW src/ui/hud/housing/capacity_meter_view.ts (11).
Meters show actual used and limit, including truthful over-capacity numbers;
clamp only drawn fill, with build.meterFull at used equals limit, build.meterOver
for the truthful excess and build.meterAria as each meter's aria-valuetext.
They do not invent bank near-full thresholds.
The placement strip stays adjacent to the world selection and above existing
action/touch controls. Compact collapses palette content after choosing a piece,
leaving its selected-copy chip and reopen control. Tablet keeps a wider side
panel. Do not reserve so much screen that the ghost cannot be inspected.

### Flow and transaction truth

Enter through the owner's Build action. Save the current camera/focus context and
switch to a detached, bounded build camera; the avatar does not walk as the ghost
moves. Select an exact owned furnishing or display record, aim within the shared
room bounds, rotate/nudge, inspect the footprint and reason, then explicitly
confirm. No pointer release, tap release, pinch or unrelated interact key spends
a copy accidentally. Confirm proposes a command through IWorld; only the matching
authoritative success changes the displayed committed layout and history.

A valid ghost shows recognizable furnishing silhouette, anchored floor footprint,
surface orientation and selected-copy identity. A blocked ghost shows the same
silhouette plus hatched footprint, crossing/edge geometry and a textual reason;
red is supplemental. Offscreen or occluded obstruction still has a reason in the
strip. Pending replaces the confirm affordance with status and cannot resend.
Success acknowledges briefly through existing personal feedback and leaves the
mode ready. Refusal retains the proposal if still meaningful and shows the
current authority's reason. A missing owned copy clears the invalid proposal.

Initial snap/nudge uses the authored room grid pitch and yaw step from state;
rotation is 15 degrees (state rotation row). No separate guessed nudge distance.
Room edge, transformed model bounds, rugs' explicit walk-through status, protected
doorway/arrival route and player collision occupancy come from the sim placement
core. The client predicts for feedback; the sim checks again. An accepted
placement cannot entomb an admitted visitor or cover the required exit route.

Undo/redo is a placement-only session journal from the initial build release.
Its bound derives the approved maximum legal placement-row capacity, not an
arbitrary history literal. Records preserve exact copy, prior/next transform and
revision preconditions. Undo removes/moves/restores only if the inverse still
matches; refuse stale inverse atomically. Rejection does not advance history.
New confirmed editing after undo drops redo. Plot/session change or incompatible
external revision clears unusable history with build.historyChanged. Payments,
Ledger, sales, grants and completed upgrades are outside this journal.

Finish building cancels an unsent ghost, retains every confirmed edit and
restores the prior safe camera/control context. A pending operation remains
reconcilable after the palette closes; the late reply cannot reopen it or alter
another plot's UI generation. If authority is lost, close editing safely and
retain read-only room presentation. Do not offer discard-all when there is no
unsaved layout transaction.

Later advanced mode (25) adds bounded planar translation/free yaw and typed
floor/wall/table/fixed-ceiling anchors, with parent movement and children applied
atomically. The snapped mode stays available: build.snap is the placement mode
toggle (checked: fifteen-degree snapped yaw and grid; unchecked: bounded free
planar translation and free yaw), and the free-yaw input per device is the held
Rotate binding with a sideways pointer drag, the held rotate bumper with the right
stick's horizontal axis, and the touch build.freeRotate handle in the tap-only
action panel. There is no arbitrary scale,
full-axis gimbal or collision-leniency mode in this packet. Save/load/share is a
later release as recorded in state, not an initial promise or disabled teaser tab.

### Selecting, moving and removing placed objects

Build presence is a separate ephemeral authority contract. File 11 sends NEW
setFreeholdBuildPresence(active: boolean), serialized as set_freehold_build_presence
with acknowledged opaque plotId, acceptedTransitionId, monotonic buildPresenceSeq
and active. Those context fields reject stale messages; they are not credentials.
File 08's NEW src/sim/freehold/build_presence.ts::setFreeholdBuildPresence binds the
operation to authenticated session, current edit authority and current plot/claim
generation. File 08a publishes only freeholdState.isDecorating. File 18 selects
visit.ownerBuilding only from that boolean.

The host privately aggregates current authorized editor sessions. Closing build
mode, leaving, disconnecting or losing permission/claim clears that session without
a grace period or persisted row. A stale start cannot restore presence; a superseded
close cannot clear a newer session. The boolean stays true while another eligible
editor remains. No ghost, inventory, history, camera, actor or account identity
accompanies it. Three-host/two-world parity and actual two-client start/close/leave/
disconnect/revocation/stale/multiple-session tests prove this behavior. The existing
visit-owner-building capture observes this public result; it remains the single
guest-observer identity under the later visiting target.

The owner can select a placed furnishing by pointer pick or touch tap while no
mutation is pending. Keyboard/pad can open the build.placedObjects list from the
palette and use its named roving rows; Enter/confirm selects the actual public
placement-row identity. Both routes highlight the same placed object and open
a small contextual action strip. Fixed structural dressing is inspectable with
build.fixed and never shows Move/Return to bags. The placed-object list is a
selection route into the same controller, not another editable layout model.

An ordinary movable furnishing offers Move furnishing and Return to bags.
Move enters the placement root with an exact-copy transform proposal, preserving
the original committed row/collider until matching success. Cancel removes only
the proposal and restores focus to the selected row/action. Selecting another
object or inventory copy while an unsent proposal exists explicitly cancels it,
announces build.proposalReplaced and selects the new item; it never commits the
old proposal. While a mutation is pending, new selection/mutation is disabled
with build.selectionPending, while inspection and safe window close remain.

Return to bags shows the exact copy and bag-space consequence through the shared
small confirmation prompt. Confirm sends one removal; success returns that copy
and restores focus to its resulting bag/palette row, or the next valid placed
row if the copy is outside the active filter. Refusal keeps the original selected
object and focus; insufficient space never removes it visually. A closed palette
stays closed when the result arrives. Normal removal history uses the confirmed
copy and revision, subject to the same stale inverse rules.

An occupied trophy plinth offers Replace trophy and Clear plinth instead of
Return to bags. Replace opens the same eligible trophy chooser (the record-only
src/ui/hud/housing/trophy_case_view.ts::eligibleTrophyChooser, opened through
TrophyCaseWindow.openForPlinth(plinthKey) and wired by 17; 11 ships the Replace
trophy and Clear plinth affordances as a disabled shell), then stages the
selected record on that exact plinth through placeTrophy; no inventory copy is
created. Cancel
returns to the plinth's current display. Clear confirms removal of the display
only, preserving unlock/provenance. An empty plinth offers the trophy chooser.
Success focuses the plinth's new/current record or its empty-plinth row; refusal
preserves the committed display and chosen proposal when still eligible.

Every proposal starts with focus on the named world placement root and its
current selected-object description, so keyboard/pad nudge/confirm controls are
available immediately. When the selected row disappears due to another accepted
revision, cancel the obsolete proposal and choose the next valid same-list row,
then its list heading if empty. Focus restoration does not jump to another
player's object or a hidden control. These transitions are exercised through
real keyboard, touch and composed pad input, including a pending operation and
an external row removal.

### Input arbitration and focus

Keyboard opening focuses the palette's selected tab. Order is selected tab,
search, category choice, selected roving cell, placement controls, history,
capacity details and Finish. Enter/Space activates the focused control. With the
world placement root focused, arrows nudge on the authored grid; the existing
world movement bindings may drive the detached view only while the build
controller owns them. Mouse position/drag moves the proposal, standard camera
look orbits within room bounds, and the visible Rotate controls are always
keyboard reachable. Do not steal text-editing shortcuts while search has focus.
Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z invoke placement undo/redo only when the housing
world context owns input; otherwise native text undo remains intact. They are the
undoPlacement and redoPlacement BindActions with defaults ['Ctrl+KeyZ', 'Meta+KeyZ']
and ['Ctrl+Shift+KeyZ', 'Meta+Shift+KeyZ'] (two codes each; makeCombo emits a
separate Meta part for Cmd); toggleBuildMode,
rotateFurnishingLeft and rotateFurnishingRight default to 'Shift+KeyB', 'Comma'
and 'Period', all unclaimed in BIND_ACTIONS today, and tests/keybinds.test.ts pins
the five rows. Their options-window labels are keybind label rows outside the
housing family: hud_chrome catalog rows in the existing hudChrome.keybinds.* family
(beside categoryPet and dive), consumed by src/ui/options_window.ts
BIND_CATEGORY_LABEL_KEYS and BIND_ACTION_LABEL_KEYS, owned by 11 and NOT part of
ux-key-manifest.json's housing inventory:

| Catalog key (hudChrome.keybinds.*) | English value | Owner |
|---|---|---|
| hudChrome.keybinds.categoryHousing | Housing | 11 |
| hudChrome.keybinds.toggleBuildMode | Toggle Build Mode | 11 |
| hudChrome.keybinds.rotateFurnishingLeft | Rotate Furnishing Left | 11 |
| hudChrome.keybinds.rotateFurnishingRight | Rotate Furnishing Right | 11 |
| hudChrome.keybinds.undoPlacement | Undo Placement | 11 |
| hudChrome.keybinds.redoPlacement | Redo Placement | 11 |
 Existing
Escape routing first cancels the proposal, then exits the mode on the next
unconsumed close request. Every hint derives the active binding; new optional
bindings are registered through the existing keybind seam without changing
unrelated defaults.

Gamepad has two explicit ownership states. In palette focus, d-pad/sticks navigate
through the shared focus system and confirm selects. In placement focus, the left
stick moves the ghost camera-relative and the right stick orbits the bounded
camera, using the existing ground-aim response curve. Left/right bumper actions
rotate counterclockwise/clockwise by the state snap step; d-pad nudges by one
measured grid cell. Confirm places and Cancel cancels the unsent proposal. The
existing focus-navigation action returns to the palette. While placement owns pad
input, build_mode_wiring.ts suspends exactly this set: GAMEPAD_CYCLE_SET on RB (RB
rotates clockwise instead), the LB slot (rotates counterclockwise), 'jump' on Y,
'autorun' on L3, the bare d-pad focus navigation (the d-pad nudges one cell) and
every cross-hotbar trigger action; GAMEPAD_CYCLE_HUD stays live only as the
return-to-palette action, so one press cannot decorate and cast. Housing pad verbs
are a fixed context overlay on the ground-aim precedent, not remappable
GamepadActionIds; glyphs come from the active pad family, including when the
device changes mid-session. The composed-pad test asserts an RB press in placement
rotates the ghost, never calls toggleCrossHotbarSet and never casts.

Touch routes each pointer through touch_router's ownership ledger. Dragging a
selected piece previews it; dragging unoccupied world area controls the bounded
camera, and UI touches stay UI-owned. Pinch controls camera only. Confirm,
Rotate and Cancel remain separate visible targets at least 40x40px (state UX
touch targets), with reverse-rotate and nudge reachable by the tap-only action
panel, one strip_gesture_controller instantiation with anchorRole 'toggle'
honouring settings.touchTapMenus (never a fourth tap dialect); in advanced mode
(25) the build.freeRotate handle lives in the same panel. A finger-offset preview
derives the selected control's actual hitbox and
screen projection; the footprint marks the real placement, not the finger.
Moving over a panel or safe-area edge never confirms or switches touch owner.

Motion uses the shared token envelope. Selection/focus/blocked geometry updates
immediately at every tier; optional opacity or chrome transitions never delay
validity. Reduced motion uses a stable footprint and static selected outline,
with no pulsing, bobbing, auto-orbit or animated hatch. Camera moves only from
player input. A successful placement is readable without particles, sound or
motion.

### States

| State | Required presentation and recovery |
|---|---|
| Empty | Empty inventory explains acquisition through ordinary vendors/crafting; no store steering. An empty search offers Clear search. Empty trophy tab uses the trophy source rules. |
| Loading | Palette has stable placeholders; prepared ghost uses a recognizable stand-in until the real mesh is safe. Confirm remains unavailable until the view can make a truthful prediction. |
| Error | Stable keyed placement reason, retained copy/transform where safe and retry through a new explicit confirm. Bags-full removal never makes the object disappear. |
| Locked | At any home condition the owner can enter, move, place, remove and undo. A locked amenity is labeled but does not lock build. Lost edit authority exits safely. |
| Visitor | Guest sees only accepted public layout revisions and visit.ownerBuilding. No owner's ghost, palette, history, private counts, camera or refusal text is transmitted. |
| Owner | Selected copy, live transform and budget cost visible; confirms only a valid owned operation. Built-in structural dressing has no misleading pickup affordance. |
| Pending | Freeze repeated mutation for that operation; keep Cancel/Finish's UI semantics honest. Reconcile result by operation and plot after close, without another send. |
| Reconnect | Show last authoritative layout and common.reconnecting; suspend edits until the revision and ownership are refreshed. Explain any history reset, never silently replay commands. |

```text
+ palette ----------------+---------------- world -------------------+
| {build.title}          X|  clear room / bounded camera              |
| {build.furnishings}     |                                           |
| {build.trophies}        |             selected silhouette           |
| {build.search}: [      ]|             + footprint + hatch           |
| [art] [art] [art]       |                                           |
| selected copy + marks  |     {build.placementReason}                |
| {build.decor}          | [confirm] [rotate] [cancel] [nudge]         |
| {build.plinths}        |                                           |
| {build.amenities}      | [undo] [redo]           [build.leave]       |
+------------------------+-------------------------------------------+
Compact: collapsed selected-copy chip, world, stable touch action strip.
```

The diagram X uses common.close; other action shorthand expands to build keys.

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.build.title | Build Mode | 11 |
| hudChrome.housing.build.enter | Build | 11 |
| hudChrome.housing.build.leave | Finish Building | 11 |
| hudChrome.housing.build.furnishings | Furnishings | 11 |
| hudChrome.housing.build.trophies | Trophies | 11 |
| hudChrome.housing.build.amenityTab | Amenities | 11 |
| hudChrome.housing.build.search | Search furnishings | 11 |
| hudChrome.housing.build.searchPlaceholder | Search by name | 11 |
| hudChrome.housing.build.clearSearch | Clear Search | 11 |
| hudChrome.housing.build.category | Furnishing category | 11 |
| hudChrome.housing.build.palette | Choose a furnishing | 11 |
| hudChrome.housing.build.collectionHelp | Use the arrow keys to move between furnishings. Press Enter to select one. | 11 |
| hudChrome.housing.build.placedObjects | Placed furnishings | 11 |
| hudChrome.housing.build.selectPlaced | Select {item} | 11 |
| hudChrome.housing.build.selectedPlaced | Selected placed furnishing: {item}. | 11 |
| hudChrome.housing.build.moveSelected | Move Furnishing | 11 |
| hudChrome.housing.build.replaceTrophy | Replace Trophy | 11 |
| hudChrome.housing.build.clearTrophy | Clear Plinth | 11 |
| hudChrome.housing.build.returnTooltip | Return this exact furnishing to your bags. You need enough bag space. | 11 |
| hudChrome.housing.build.proposalReplaced | Previous placement preview cancelled. {item} is selected. | 11 |
| hudChrome.housing.build.selectionPending | Wait for this placement to finish before changing selection. | 11 |
| hudChrome.housing.build.surfaceFloor | Floor | 11 |
| hudChrome.housing.build.surfaceWall | Wall | 11 |
| hudChrome.housing.build.surfaceTabletop | Tabletop | 11 |
| hudChrome.housing.build.surfaceCeiling | Ceiling | 11 |
| hudChrome.housing.build.paletteOpen | Open Furnishing Palette | 11 |
| hudChrome.housing.build.empty | Find furnishings at vendors or make them with crafting recipes. | 11 |
| hudChrome.housing.build.noResults | No furnishings match your search. | 11 |
| hudChrome.housing.build.selectedCopy | {item}, {marks}, {count} available | 11 |
| hudChrome.housing.build.selectedCopyNoMarks | {item}, {count} available | 11 |
| hudChrome.housing.build.confirm | Place | 11 |
| hudChrome.housing.build.confirmMove | Move | 11 |
| hudChrome.housing.build.remove | Return to Bags | 11 |
| hudChrome.housing.build.rotate | Rotate Clockwise | 11 |
| hudChrome.housing.build.rotateBack | Rotate Counterclockwise | 11 |
| hudChrome.housing.build.cancel | Cancel Placement | 11 |
| hudChrome.housing.build.nudge | Nudge | 11 |
| hudChrome.housing.build.nudgeForward | Nudge Forward | 11 |
| hudChrome.housing.build.nudgeBack | Nudge Backward | 11 |
| hudChrome.housing.build.nudgeLeft | Nudge Left | 11 |
| hudChrome.housing.build.nudgeRight | Nudge Right | 11 |
| hudChrome.housing.build.snap | Snap to Grid | 11 |
| hudChrome.housing.build.undo | Undo | 11 |
| hudChrome.housing.build.redo | Redo | 11 |
| hudChrome.housing.build.undoEmpty | There are no placement changes to undo. | 11 |
| hudChrome.housing.build.redoEmpty | There are no placement changes to redo. | 11 |
| hudChrome.housing.build.historyChanged | Your home changed. Placement history has been reset. | 11 |
| hudChrome.housing.build.historyTooltip | Undo confirmed placement changes from this building session. Payments and purchases are not included. | 11 |
| hudChrome.housing.build.saving | Saving placement... | 11 |
| hudChrome.housing.build.preparing | Preparing furnishing preview... | 11 |
| hudChrome.housing.build.valid | Ready to place. | 11 |
| hudChrome.housing.build.placementReason | Placement: {reason} | 11 |
| hudChrome.housing.build.decor | Decor: {used} of {limit} | 11 |
| hudChrome.housing.build.plinths | Plinths: {used} of {limit} | 11 |
| hudChrome.housing.build.amenities | Amenities: {used} of {limit} | 11 |
| hudChrome.housing.build.meterFull | At capacity | 11 |
| hudChrome.housing.build.meterOver | Over capacity by {excess} | 11 |
| hudChrome.housing.build.meterAria | {meter}: {used} of {limit} in use | 11 |
| hudChrome.housing.build.decorTooltip | This furnishing uses {cost} decor. You have {remaining} decor available. | 11 |
| hudChrome.housing.furnishing.footprint | Footprint: {width} by {depth} cells. | 02 |
| hudChrome.housing.furnishing.decorCost | Decor cost: {cost}. | 02 |
| hudChrome.housing.furnishing.surfaceFloor | Placed on the floor. | 02 |
| hudChrome.housing.furnishing.maker | Made by {maker}. | 02 |
| hudChrome.housing.build.plinthTooltip | Display trophies on your home's plinths. {used} of {limit} are in use. | 11 |
| hudChrome.housing.build.amenityTooltip | Installed stations use amenity slots. Your built-in Strongbox does not use a slot. | 11 |
| hudChrome.housing.build.camera | Build Camera | 11 |
| hudChrome.housing.build.cameraHint | Move the view to inspect your placement. | 11 |
| hudChrome.housing.build.controlsAria | Placement controls for {item} | 11 |
| hudChrome.housing.build.fixed | This is part of your home and cannot be moved. | 11 |
| hudChrome.housing.build.surface | Surface: {surface} | 25 |
| hudChrome.housing.build.freeRotate | Rotate Freely | 25 |
| hudChrome.housing.build.movesChildren | Attached furnishings move with this piece. | 25 |
| hudChrome.housing.denied.placementBlocked | Something is in the way. | 11 |
| hudChrome.housing.denied.outsideRoom | Place this inside the room. | 11 |
| hudChrome.housing.denied.doorway | Keep the doorway and arrival path clear. | 11 |
| hudChrome.housing.denied.occupied | Someone is standing in that space. | 11 |
| hudChrome.housing.denied.decorFull | This needs {needed} decor. You have {remaining} available. | 11 |
| hudChrome.housing.denied.plinthFull | Every plinth is in use. | 11 |
| hudChrome.housing.denied.amenityFull | Every amenity slot is in use. | 11 |
| hudChrome.housing.denied.wrongSurface | This furnishing needs a {surface} surface. | 11 |
| hudChrome.housing.denied.copyMissing | This furnishing is no longer available. | 11 |
| hudChrome.housing.denied.childrenPresent | Move the furnishings on this piece before removing it. | 11 |
| hudChrome.housing.denied.supportFull | There is no room left on this surface. | 25 |
| hudChrome.housing.denied.invalidTransform | That placement could not be applied. Try again. | 25 |
| hudChrome.housing.denied.trophyUnavailable | That trophy is not available to display. | 17 |

Surface names use the explicit build.surfaceFloor/build.surfaceWall/
build.surfaceTabletop/build.surfaceCeiling keys when those mechanics land (11
renders Floor; the other three feed 25's typed surfaces). Every enum added to
freeholdDeniedLineKey has an exhaustive key mapping and mechanism fixture. The
English acceptance text is reconciled to the implemented handler before shipping.
The four furnishing.* rows are the item tooltip leaves 02 ships for the furnishing
item kind (resolved values from the def; maker only when the copy carries a signer);
25 adds its own furnishing.surface* rows when typed surfaces land, while
build.decorTooltip (11) and build.surface (25) remain build-mode sinks.
Deny enums added by 25 map exhaustively: host_occupied to denied.childrenPresent;
support_full to denied.supportFull; anchor_missing to denied.wrongSurface;
host_cycle, host_foreign and transform_nonfinite to denied.invalidTransform; a
stale inverse to build.historyChanged. 17's trophy_unavailable maps to
denied.trophyUnavailable and no_plinth to denied.plinthFull.

## 5. Steward: a welcoming household ledger

### Player goal and layout

Understand the home's condition, see the next bill, and choose exactly which
materials to spend without fearing loss. The Steward is a standalone .window.panel
following PlantSheetWindow/buildPlantSheetView for a cold decision flow, live
affordability, aria-busy and operation-correlated pending state. Its NEW housing
view/window modules consume authoritative housing and inventory projections.
The fireplace-shaped condition meter is a small readable emblem, not an animated
monetization gauge. It is a procedural src/ui/ui_icons.ts svgIcon recipe owned by 16
(deliberately final SVG art; no art-brief reference board; 44a records the explicit
final-art verdict). Beside it, show condition, amenity availability and next due
date; below it, put the itemized Ledger and material sources. The primary visual
weight belongs to materials the player can gather or buy through ordinary play.

The first row gives condition with its live number and a clear textual state.
At condition 30 amenities work; below 30 they pause. These values come from the
state condition row. The home, stored property, visiting, entry and placement
are not restricted by condition, including 0. Independent entry/access rules still apply. No eviction countdown, loss
language, flashing payment warning, pulsing red frame or pay-or-lose implication.
A low hearth retains enough ambient readability and is accompanied by text;
the flame alone never communicates a gameplay boundary.

The UI receives authoritative safe timestamps and the intended realm display
timezone, not rendered server text or private authority records. The client
formats the due date with shared locale formatters and that timezone. It never computes a due date from its own wall
clock. Every has-the-day-rolled-over fact the panel shows (due, paid-through,
prepay coverage, condition day) is a realm-day key resetDay (03:00 in the realm
reset zone) with the Tuesday week anchor for bills and prepaid weeks, produced by
the server through resetDayKey(ms, REALM_RESET_TIME_ZONE) per D84; epoch-ms wire
fields are display-only, and the Endeavor month is the UTC calendar month.
The same contract applies to paid-through, suspension/resumption and
provenance dates. If prepaid, show the covered-through date and the next uncovered bill.
A confirmed outage/absence/return-grace protection state gets a calm explanation
and safe resume/end date where known. These protections combine without counting
overlap twice, and the same account history applies to all its homes. No catch-up
debt is created for protected time. If the needed household history is still
being updated, show steward.refreshing, keep acknowledged condition/bill rows
readable and mark their status busy. Affected deductions, credit consumption or
condition updates wait; the client does not guess wear or silently expire a
credit. Unsupported or binding-required household state uses common.unavailable.
common.reconnecting is reserved for actual connection recovery. Unknown history
must not display outagePause as though an outage were confirmed.

This status explains only what the player can rely on. Never mention database
finality, source authority, operator evidence, internal revision, account-history
records or reset-policy ids in the flow. Do not disable unrelated ordinary entry
or decoration because historical upkeep facts are unavailable. The Inn Room
instead states no upkeep and has no blank or disabled pay controls. Do not
render a zero-cost purchase model to mimic this state.

### Material source and payment flow

Each row shows localized item art/name, amount needed, amount in bags and amount
in the personal Materials Vault. Values are independently labeled; a combined
have/need number may summarize them only alongside the split. Unavailable vault
facts show unavailable, never a fabricated zero. Grade/bound restrictions follow
the same authoritative deduction planner as the command. Bills exclude protected
Masterwrought inputs and use the approved published schedule from state.

Source choice is explicit: bags only, vault only, or automatic bags then vault.
The selected mode controls affordability, highlighted deductions, confirmation
and the actual atomic payment. A bags-only action never takes vault materials.
Show Pay from bags and Pay from vault on wide surfaces; the compact source
radiogroup and one source-named action represent the same modes and reading
order. Automatic payment states its order plainly. No hidden fallback changes
source after a refusal.

Flow: inspect due bill, choose source, review exact deduction, confirm once,
wait for the matching authoritative payment result, update condition/paid-through
status and announce success once. Prepay uses the same source choice and
planner, with a bounded week choice up to state prepay capacity. The review shows
the entire immutable batch of weekly bills, covered dates and total material
quantities before sending; it does not multiply this week's bill by a guessed
future price. The valid published schedule can authorize buying future weeks
without waiting for those future periods to finish. Later application of
elapsed coverage or consumption/carry of credits waits for irrevocable facts
through the historical dependencies. Show only the confirmed paid-through
projection; a provisional date cannot pretend to be an acknowledged result. First release permits four weeks, later twelve, as state records.
The initial cap accepts the fourth and refuses the fifth; the later cap accepts
the twelfth and refuses the thirteenth. Exact numeric copy is runtime placeholders.

The Master Builder's Call exists only where the distribution capability permits
that purchase and all three money gates are open. Its visible service quote
states whether it pays the current bill and restores condition, or is repair-only
because that bill is already paid. A Call does not add future prepay or consume
future credits. Purchase intent and receipt correlation include account, plot,
SKU/operation and revision. An ambiguous charge stays pending/reconciling;
closing the window never offers a new charge as a recovery path. An unaffordable
Call reuses the shipped store affordability family (hudChrome.wocStore.needMoreBody
with CharterRow.affordable and shortfall): this is the one deliberate reuse of a
non-housing key, recorded here as the exception to the housing-only family rule;
no charter.* shortfall row is added.

Website management is a separate capability: the HudFeatures row
freeholdManageOnWebsite defaults off on every distribution row, browser web and
website desktop included, and turns on only through the independently approved
management outcome (14). Only an approved complete destination and flow can show
steward.manageWebsite. Denied native/storefront surfaces default to no CTA,
including hidden links, fetched purchase catalog, error text or aria labels. A
merely renamed purchase link is not neutral. These surfaces keep material
controls and honest household state. Housing use itself remains behind the
accepted entitlement-model release gate recorded in state: the server entitlement
gate read through the housing facet, never a HudFeatures row (D91).

### Upgrade to Lodge (21)

Flow: the Steward gains an Upgrade tab (steward.upgradeTab) showing the upgrade
bill per leg through steward.haveNeed, the fee status, the source-mode radiogroup
reusing steward.bagsOnly and steward.vaultOnly (the existing
steward-vault-unavailable state when the vault arm is not authorized in this
instance band; the contribute command carries that explicit source mode per D89),
a Contribute action for the selected leg, a Finish Upgrade action that re-runs the
overflow preflight when the fee was the last leg and bags were full (never a
second fee), the overflow preview, and completion. States: no project
(steward.upgradeNoProject), partial, fee due (steward.upgradeFeeDue), ready
(steward.upgradeReady with steward.upgradeOverflow), pending (common.pending),
refused (denied.upgradeNoProject, denied.upgradeFeeDue, denied.bagsFull,
denied.permission), reconnect (common.reconnecting), complete
(granted.upgradeComplete). No price, burn or peg is rendered; the fee purchase
itself stays on the Charter store surface. The tab and buttons are title case,
the rest sentence case.

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.steward.upgradeTab | Upgrade | 21 |
| hudChrome.housing.steward.upgradeTitle | Upgrade to Lodge | 21 |
| hudChrome.housing.steward.upgradeIntro | Contribute the materials below and pay the upgrade fee once, in either order. Nothing is spent until you confirm. | 21 |
| hudChrome.housing.steward.upgradeNoProject | No upgrade is in progress. | 21 |
| hudChrome.housing.steward.upgradeFeePaid | Upgrade fee paid. | 21 |
| hudChrome.housing.steward.upgradeFeeDue | Upgrade fee not yet paid. | 21 |
| hudChrome.housing.steward.upgradeReady | Everything is in. Finish the upgrade when your bags have room for anything that will not fit. | 21 |
| hudChrome.housing.steward.upgradeOverflow | Placed items that will return to your bags: {count} | 21 |
| hudChrome.housing.steward.upgradeContribute | Contribute | 21 |
| hudChrome.housing.steward.upgradeFinish | Finish Upgrade | 21 |
| hudChrome.housing.steward.upgradeRowAria | Upgrade material {item}: {have} of {need} contributed | 21 |
| hudChrome.housing.granted.upgradeComplete | Your home is now a Lodge. | 21 |
| hudChrome.housing.denied.upgradeNoProject | There is no upgrade to finish. | 21 |
| hudChrome.housing.denied.upgradeFeeDue | Pay the upgrade fee before finishing the upgrade. | 21 |

Keep and Citadel upgrades (40) add read-only requirement rows and the overflow
destination confirmation to the same tab, and the second home (42) adds the
Primary Home and Second Home tabs above it; their rows are in the table below.

### States, focus and motion

| State | Required presentation and recovery |
|---|---|
| Empty | Inn Room shows no upkeep. A paid Ledger with no future due bill shows its actual paid-through state. Empty material rows are never interpreted as permission to pay. |
| Loading | Keep stable meter/ledger shape with steward.refreshing and busy semantics. Acknowledged condition/bill rows remain readable; stale or revisable historical facts cannot authorize affected durable updates. |
| Error | Refusal appears beside the relevant source/bill and preserves source/prepay draft. Unsupported or unbound household history uses common.unavailable. Re-enable only after a matching refusal or safe internally consistent refresh, never an older asynchronous result. |
| Locked | Below the condition boundary, explain paused amenities and unchanged home/property access. A refused payment capability removes only the prohibited action. |
| Visitor | Steward spending window is not offered. Interacting with an owner's service gives read-only owner/amenity context without private due date, inventory or payment UI. |
| Owner | Receives their live condition, bill and source choices. An authorized alt sees the same shared result. |
| Pending | Exactly one send; pending confirmation can close visually while durable intent reconciles. An operation waiting for irrevocable historical facts uses steward.refreshing and keeps its original identity. Unrelated placement, station, visitor or provisional-history events do not rearm it. |
| Reconnect | common.reconnecting accompanies actual connection recovery. Refresh safe material/condition/bill/result state consistently for the current generation; if connected but historical facts remain unavailable, switch to steward.refreshing or common.unavailable instead of falsely remaining disconnected. Future prepay still needs only its valid schedule/current prerequisites. |

Focus order: heading/condition help, Ledger rows as a readable list, selected
source radio, prepay choice, source-named payment, eligible Call review, eligible
website management, Close. Item tips are reachable from each row without making
every decorative icon a Tab stop. Confirmation uses installPromptDialog: summary,
confirm, Cancel; Cancel returns to its opener and clears inert on every exit.
A denial leaves focus at the action with reason announced. Pad follows the same
order. Compact retains condition header and payment footer while the ledger
scrolls. No nested scrolling around week choices. Shared tokens govern opening
and hover; reduced motion makes the hearth emblem static and updates its number
immediately. Payment success uses existing feedback amplitude, not confetti.

```text
+-------------------- Steward ---------------------+
| {steward.title}                      {common.close}|
| hearth icon  {steward.condition}                   |
|              {steward.amenitiesReady/Paused}       |
| {steward.nextDue} / {steward.coveredThrough}        |
| item art/name | needed | bags | vault             |
| item art/name | needed | bags | vault             |
| source: [bags] [vault] [automatic]                 |
| prepay: [week choice]   [source-named payment]     |
| eligible service quote / approved management only |
+--------------------------------------------------+
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.steward.title | Steward | 16 |
| hudChrome.housing.steward.householdTab | Household | 16 |
| hudChrome.housing.steward.visitorsTab | Visitors | 16 |
| hudChrome.housing.steward.condition | Condition: {condition} of {maximum} | 16 |
| hudChrome.housing.steward.conditionTooltip | Amenities work at {threshold} condition or higher. Below that, amenities pause. Low condition does not prevent entry or decoration. Upkeep never removes your home or belongings. | 16 |
| hudChrome.housing.steward.amenitiesReady | Amenities are available. | 16 |
| hudChrome.housing.steward.amenitiesPaused | Amenities are paused until your home's condition is restored. | 16 |
| hudChrome.housing.steward.nextDue | Next Ledger due: {date} | 16 |
| hudChrome.housing.steward.coveredThrough | Ledger paid through {date}. | 16 |
| hudChrome.housing.steward.noUpkeep | Your Inn Room has no upkeep. | 16 |
| hudChrome.housing.steward.currentPaid | This week's Ledger is paid. | 16 |
| hudChrome.housing.steward.ledger | Weekly Ledger | 16 |
| hudChrome.housing.steward.needed | Needed | 16 |
| hudChrome.housing.steward.bags | Bags | 16 |
| hudChrome.housing.steward.vault | Materials Vault | 16 |
| hudChrome.housing.steward.rowAria | {item}: need {needed}; {bags} in bags; {vault} in Materials Vault. | 16 |
| hudChrome.housing.steward.rowUnavailableAria | {item}: need {needed}; {bags} in bags; Materials Vault balance is unavailable. | 16 |
| hudChrome.housing.steward.haveNeed | Have {have} of {need}. | 16 |
| hudChrome.housing.steward.source | Pay using | 16 |
| hudChrome.housing.steward.bagsOnly | Bags only | 16 |
| hudChrome.housing.steward.vaultOnly | Materials Vault only | 16 |
| hudChrome.housing.steward.automatic | Bags, then Materials Vault | 16 |
| hudChrome.housing.steward.payBags | Pay From Bags | 16 |
| hudChrome.housing.steward.payVault | Pay From Vault | 16 |
| hudChrome.housing.steward.payAutomatic | Pay From Bags and Vault | 16 |
| hudChrome.housing.steward.sourceTooltip | Automatic payment takes matching materials from your bags first, then your Materials Vault. Review the listed amounts before confirming. | 16 |
| hudChrome.housing.steward.prepay | Prepay Ledger | 16 |
| hudChrome.housing.steward.prepayWeeks | Weeks to cover: {weeks} | 16 |
| hudChrome.housing.steward.prepayLimit | You can cover up to {limit} weeks. | 16 |
| hudChrome.housing.steward.review | Review Material Payment | 16 |
| hudChrome.housing.steward.reviewThrough | Cover your Ledger through {date} using {source}. | 16 |
| hudChrome.housing.steward.confirm | Confirm Material Payment | 16 |
| hudChrome.housing.steward.pending | Confirming your Ledger payment... | 16 |
| hudChrome.housing.steward.refreshing | Updating your Ledger and material balances... | 16 |
| hudChrome.housing.steward.outagePause | Upkeep is paused while the market service is unavailable. No missed upkeep will be added later. | 16 |
| hudChrome.housing.steward.absencePause | Wear is paused while you are away. | 16 |
| hudChrome.housing.steward.returnGrace | Wear is paused until {date} while you settle back in. | 16 |
| hudChrome.housing.steward.call | Master Builder's Call | 16 |
| hudChrome.housing.steward.callCurrentTooltip | Pay the current unpaid Ledger and restore condition to {maximum}. Future prepaid weeks stay unchanged. | 16 |
| hudChrome.housing.steward.callRepairTooltip | Restore condition to {maximum}. Your current Ledger is already paid. Future prepaid weeks stay unchanged. | 16 |
| hudChrome.housing.steward.reviewCall | Review Master Builder's Call | 16 |
| hudChrome.housing.steward.manageWebsite | Manage on the Website | 14 |
| hudChrome.housing.steward.manageWebsiteAria | Open approved home management on the website | 14 |
| hudChrome.housing.steward.visitor | Only the owner can manage this home's Ledger. | 16 |
| hudChrome.housing.steward.hearthDestination | Hearth Key destination | 16 |
| hudChrome.housing.steward.upgradeRequirements | Upgrade Requirements | 40 |
| hudChrome.housing.steward.prestigeAny | Earn any one of these on this account: | 40 |
| hudChrome.housing.steward.prestigeGuildAny | Your guild must have recorded one of these clears: | 40 |
| hudChrome.housing.steward.requirementMet | Earned | 40 |
| hudChrome.housing.steward.requirementUnmet | Not yet earned | 40 |
| hudChrome.housing.steward.requirementRowAria | {requirement}: {status} | 40 |
| hudChrome.housing.steward.prestigeTooltip | Once earned, this stays met. Losing an item, a rank or a guild member later never removes an upgrade. | 40 |
| hudChrome.housing.steward.overflowReview | {count} placed furnishings will not fit the new layout. They go to {destination}. Nothing is lost. | 40 |
| hudChrome.housing.steward.overflowNone | Everything placed fits the new layout. | 40 |
| hudChrome.housing.steward.confirmUpgrade | Confirm Upgrade | 40 |
| hudChrome.housing.denied.prestige | This tier needs an accomplishment this account has not earned yet. | 40 |
| hudChrome.housing.denied.guildClear | Your guild has not recorded a qualifying clear yet. | 40 |
| hudChrome.housing.steward.primaryTab | Primary Home | 42 |
| hudChrome.housing.steward.secondTab | Second Home | 42 |
| hudChrome.housing.steward.secondBillNote | A second home's upkeep and upgrade lines are one and a half times the primary schedule, rounded up. | 42 |
| hudChrome.housing.denied.secondHomeCap | You already have two homes. | 42 |

## 6. Trophy case, public provenance and plinth placement

### Player goal and flow

See what their adventures have made available, choose a display and share the
truth of that accomplishment. Reuse ReliquaryWindow/reliquary_view,
reliquary_cell_art, reliquary_labels and reliquary_i18n for shelf navigation,
collection art, silhouettes, source hints and scroll/focus preservation. The NEW
trophy_tooltip_view.ts produces a pure public provenance model. NEW
src/ui/hud/housing/trophy_case_view.ts (pure) and trophy_case_window.ts (painter)
ship the standalone trophy case under window id trophy-case-window; it opens from
the palette Trophies tab's open-case action and from a plinth interact, and
TrophyCaseWindow.openForPlinth(plinthKey) is the record-only chooser 11's Replace
trophy/Clear plinth affordance calls. Placement rides the IWorldHousing members
placeTrophy(plinthKey, trophyId) and clearPlinth(plinthKey) (commands place_trophy
and clear_plinth); a raw command carrying an unearned, unknown or other-account
trophy id refuses denied.trophyUnavailable and changes no layout row, and
provenance fields are written server-side from the unlock record only. The build
palette's Trophies tab uses the same eligibility and selected record; it must
not maintain another account trophy catalog with divergent ownership.

Flow: open trophy case, browse the selected shelf/source, inspect owned display
or safe unearned silhouette, choose Place on a plinth, return to build mode with
the record selected, preview the valid plinth and confirm authoritatively. A
visitor can inspect the same public provenance from the placed object without
seeing the owner's unrelated unearned collection, bags or paid entitlement.
Trophies are account unlock records, never transferable items. Placing/removing
a display never mints, consumes or trades a trophy inventory copy. A furnished-plot
sale (38) transfers placed furnishings by its manifest, never account trophy
unlocks: the seller keeps every unlock on a fresh tier-0 record at index 0 and the
buyer's retained displays preview to a safe destination by the same manifest rule
(D80).

Initial eligibility covers the promised deed, Reliquary page, slain mark, item,
mount, weapon skin, title, profession specimen, curator rank and Perfected source
classes. Account-wide source aggregation includes
alts and live achievement changes with idempotent event-driven refresh. A new
qualifying feat can appear while the player is already home. Every initial
qualifying source has a truthful generic display; later specialized armor/weapon
stands, full statues, mount displays and silver/gilded forms are identified as
later content in the deck rather than presented as already shipped art.

The tooltip's visual hierarchy is display title, source deed/item/page/mark,
known achieving character and known source date, then precise eligibility or
possession limit. Dates are original source dates, not the current entrance or
unlock-reconciliation day. If historical day or character is unknown, explicitly
show the corresponding unknown key. Do not synthesize either. For the Legend
Stand the only recorded day is the owning character's prog_legendmaker deed day; a
promoted copy without it shows trophies.dateUnknown. Owner and guest
see the same public source facts. Personal maker signature/custom item name
uses existing sanitized/localized item rendering and marks.

Discovery tests include normally acquired vendor freehold_timber_bed and market
freehold_low_stool as positive item-completion controls. Paid entitlement proof,
pattern records and trophy records are independent negative shelf/completion
controls; they do not justify excluding the normally obtained furnishing copies.

The source-to-display matrix is exhaustive for the packet's promised source
families. These are semantic content families, not invented current enum values;
file 17's catalog supplies an exhaustive real source-discriminant map and tests.
Every numerical requirement is a live catalog/view value. A generic deed sentence
is never reused for a different source predicate; trophies.requireDeed is the
one deed arm (the former trophies.unearned duplicate is dropped). The one English
value two keys share is deliberate and sink-specific: denied.plinthFull is the sim
deny line and trophies.plinthFull the case explanation.

| Source family | Initial truthful display and source facts | Requirement/availability key arm |
|---|---|---|
| Completed deed, including title-reward deed | Generic deed/title display; localized deed/title, achieving character and original date where recorded | trophies.requireDeed or trophies.requireTitle |
| Illuminated Reliquary page | Generic collection display; localized page and completion provenance | trophies.requirePage |
| Slain mark | Generic mounted-head/display family; actual source creature and kill evidence | trophies.requireSlain with membership-checked localized creature |
| Armor-set completion | Generic set stand/display; localized set and source collection evidence, never a falsely fully equipped render | trophies.requireSet |
| Item acquisition unlock | Truthful item display tied to recorded acquisition predicate; use actual item art/model availability | trophies.requireItemAcquired |
| Current item possession | Generic item/weapon display active only while the qualifying copy is owned; no permanent possession claim | trophies.requireItemOwned; inactive arm when possession ceases |
| Owned mount | Generic mount display/marker until the later full model; localized mount source | trophies.requireMount |
| Owned weapon skin | Source-aware relief plaque initially and cosmetic appearance rack later; use the actual localized source and account skin ownership, never mint a weapon | Existing localized skin/source selectors and trophies.ownedAria or trophies.unearnedAria; the actual catalogued acquisition predicate supplies its existing requirement arm, never an item-possession claim for a skin |
| Profession specimen | Source-aware specimen plaque initially and cabinet later; use the actual item acquisition/possession or mark predicate for that catalogued specimen | trophies.requireItemAcquired, trophies.requireItemOwned or the exact gathering/specimen predicate below according to the actual source |
| Curator rank | Generic rank display; actual localized rank and collection/source identity | trophies.requireRank |
| Personally named Perfected item and maker provenance | Generic item display initially; later specialized stand shows sanitized custom name, actual maker signature/marks and active possession predicate | trophies.requirePerfected; missing/unknown maker/history arms when evidence lacks them |

The mark requirement map is exhaustive over the current catalog's slaying,
Masterwork and field-note families. A slain source resolves its validated mob ID
through ownEntry(MOBS, id), then tEntity({ kind: 'mob', id, field: 'name' }) from
src/ui/entity_i18n.ts. The public source label can still use
reliquaryRelicDisplayName, but its localized Slain prefix is never passed as the
creature parameter. Missing/unrecognized identity selects unknownSource; never
strip or humanize an ID into a name.

masterwork:first selects requireMasterwork; a catalogued per-craft Masterwork mark
selects requireMasterworkCraft with the normal localized craft name. The pristine
vein, ancient heartwood and moonlit bloom field notes select requireGatherEvent
with their localized mark-find and Mining/Logging/Herbalism selectors. Golden
harvest and perfect specimen select their dedicated predicate keys. Source
membership/discriminants, not display-name substrings, select these arms. There is
no generic Complete-mark fallback.

| Concrete English rendered fixture | Required key and actual source |
|---|---|
| Defeat Mogger to display this trophy. | trophies.requireSlain; catalogued slain:mogger and localized mob name, never Complete Slain: Mogger |
| Craft a Masterwork item to display this trophy. | trophies.requireMasterwork; masterwork:first |
| Craft a Masterwork item with Weaponcrafting to display this trophy. | trophies.requireMasterworkCraft; masterwork:weaponcrafting |
| Find Pristine Vein through Mining to display this trophy. | trophies.requireGatherEvent; gather_event:pristine_vein |
| Gather a golden harvest from a farm bed to display this trophy. | trophies.requireGoldenHarvest; gather_event:golden_harvest |
| Harvest a perfect specimen from a fallen creature to display this trophy. | trophies.requirePerfectSpecimen; gather_event:perfect_specimen |

These fixture sentences are rendered results of the keyed rows below, not extra
unkeyed copy. File 17 asserts concrete text, localized injected nouns, unknown
source fallback and every catalogued mark arm in its tooltip tests.

Maker signature, custom name, source character and source date are distinct facts.
Show each only from its owning sanitized record. Unknown historical maker/name
is explicit where a provenance field is required; do not borrow the current
character's name or reconstruct a past date from reconciliation. Source dates
are authoritative safe timestamps formatted by the client in the intended
realm display timezone; internal calendar authority identifiers and lifecycle
history are not tooltip fields. When a possession-gated item leaves the account, the
placed display switches to a truthful inactive/static silhouette and the
possessionRequired/inactive keys; it does not retain an active owned-item model
or erase the permanent source history. Owner and visitor see the same public
active/inactive result. Known achievement-unlock trophies are not accidentally
converted to possession-gated trophies by this rule.

Hidden/unrevealed source content uses the existing spoiler rules. An unearned
silhouette must not reveal a hidden boss/title/loot name in a tooltip, aria-label,
search index or image alt while hiding only its visible caption. Ordinary known
unearned content may say which deed to complete. Paid entitlement proof and
records excluded as unobtainable do not become character-completion credit through
the NEW Hearth shelf. Normally obtainable furnishings bought from the gold vendor
or acquired through the market retain ordinary item discovery and collection
completion under D49; the payment route alone does not exclude an item. Patterns and trophy
records are outside that shelf's furnishing-item completion inventory; its new
catalog/nav/order/source and completion obligations belong to the content work.

### States, focus, tokens and motion

| State | Required presentation and recovery |
|---|---|
| Empty | Explain that adventure accomplishments appear here; do not award an invented first head. Empty search offers clear. |
| Loading | Stable shelf/grid skeleton with normal art fallback, no transient unearned claim before account eligibility loads. |
| Error | Failed eligibility refresh keeps known public records labeled with trophies.refreshing and disables new placement until authority is current. Tooltip art failure leaves readable facts. |
| Locked | Known unearned silhouette shows actual requirement; hidden source stays generic. Full plinth budget explains why placement is unavailable, without a store upsell. |
| Visitor | Public placed display inspection only; no placement, private progress, ownership mutation or hidden source disclosure. |
| Owner | Full eligible case and permitted spoiler-safe unearned discovery; shared account sources and true provenance. |
| Pending | Selected plinth placement waits for matching acknowledgement; no optimistic record consumption or history advance. |
| Reconnect | Keep last confirmed display/provenance, suspend mutation and reconcile account unlocks plus layout revision on resume. |

Use shared window/panel/item tokens, never gold-only ownership distinction. Owned
art, unowned silhouette, selection border and textual source all remain readable
in highContrast/parchment/forced colors. No rotating display in the tooltip. If
a future specialized model animates cosmetically, reduced motion and LOW use
its recognizable static pose. Tooltip appears immediately on keyboard focus and
uses shared hover timing when pointer-triggered.

Focus order: selected shelf tab, search/filter, selected roving grid cell, source
detail link where available, Place on a plinth when permitted, Close. Source
links use the existing Reliquary/Deeds deep-link-to-header focus contract and
return to the case opener. Touch uses tap-to-inspect before choosing placement;
no hover-only facts. Gamepad follows the same item/tooltip/action sequence.

```text
+---------------- trophy case ---------------------+
| {trophies.title}                    {common.close}|
| shelf tabs / search                              |
| [owned art] [silhouette] [owned art]              |
| selected title and source                        |
| {trophies.achievedBy}   {trophies.achievedOn}       |
| {trophies.page} / {trophies.mark}                  |
|                              [{trophies.place}]  |
+--------------------------------------------------+
             plinth selection -> ghost -> confirm
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.trophies.title | Trophy Case | 17 |
| hudChrome.housing.trophies.search | Search trophies | 17 |
| hudChrome.housing.trophies.collectionHelp | Use the arrow keys to move between trophies. Press Enter to inspect one. | 17 |
| hudChrome.housing.trophies.refreshing | Updating your trophy collection... | 17 |
| hudChrome.housing.trophies.empty | Your adventures will fill these shelves. | 17 |
| hudChrome.housing.trophies.noResults | No trophies match your search. | 17 |
| hudChrome.housing.trophies.achievedBy | Achieved by {name} | 17 |
| hudChrome.housing.trophies.achievedOn | Achieved on {date} | 17 |
| hudChrome.housing.trophies.characterUnknown | Original character unknown. | 17 |
| hudChrome.housing.trophies.dateUnknown | Original date unknown. | 17 |
| hudChrome.housing.trophies.deed | {deedLabel}: {deed} | 17 |
| hudChrome.housing.trophies.page | {pageLabel}: {page} | 17 |
| hudChrome.housing.trophies.mark | {markLabel}: {mark} | 17 |
| hudChrome.housing.trophies.item | Displayed item: {item} | 17 |
| hudChrome.housing.trophies.titleSource | Title: {title} | 17 |
| hudChrome.housing.trophies.mountSource | Mount: {mount} | 17 |
| hudChrome.housing.trophies.requireDeed | Complete {deed} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireTitle | Unlock {title} to display this trophy. | 17 |
| hudChrome.housing.trophies.requirePage | Complete {page} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireSlain | Defeat {creature} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireMasterwork | Craft a Masterwork item to display this trophy. | 17 |
| hudChrome.housing.trophies.requireMasterworkCraft | Craft a Masterwork item with {craft} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireGatherEvent | Find {find} through {profession} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireGoldenHarvest | Gather a golden harvest from a farm bed to display this trophy. | 17 |
| hudChrome.housing.trophies.requirePerfectSpecimen | Harvest a perfect specimen from a fallen creature to display this trophy. | 17 |
| hudChrome.housing.trophies.requireSet | Complete the {set} collection to display this trophy. | 17 |
| hudChrome.housing.trophies.requireItemAcquired | Find {item} to unlock this trophy. | 17 |
| hudChrome.housing.trophies.requireItemOwned | Own {item} to activate this display. | 17 |
| hudChrome.housing.trophies.requireMount | Collect {mount} to display this trophy. | 17 |
| hudChrome.housing.trophies.requireRank | Reach {rank} in {collection} to display this trophy. | 17 |
| hudChrome.housing.trophies.requirePerfected | Own a qualifying named Perfected item to activate this display. | 17 |
| hudChrome.housing.trophies.setSource | Armor set: {set} | 17 |
| hudChrome.housing.trophies.rankSource | {collection}: {rank} | 17 |
| hudChrome.housing.trophies.maker | Made by {maker} | 17 |
| hudChrome.housing.trophies.namedItem | Named item: {name} | 17 |
| hudChrome.housing.trophies.makerUnknown | Original maker unknown. | 17 |
| hudChrome.housing.trophies.nameUnknown | Original item name unknown. | 17 |
| hudChrome.housing.trophies.inactive | This display is inactive because its required item is no longer owned. | 17 |
| hudChrome.housing.trophies.hidden | A trophy for an undiscovered accomplishment. | 17 |
| hudChrome.housing.trophies.unknownSource | This trophy's original source is unknown. | 17 |
| hudChrome.housing.trophies.place | Place on a Plinth | 17 |
| hudChrome.housing.trophies.choosePlinth | Choose a plinth for {trophy}. | 17 |
| hudChrome.housing.trophies.plinthFull | Every plinth is in use. | 17 |
| hudChrome.housing.trophies.ownedAria | {trophy}. Available to display. {source}. | 17 |
| hudChrome.housing.trophies.unearnedAria | {trophy}. Not yet available. {requirement}. | 17 |
| hudChrome.housing.trophies.hiddenAria | Undiscovered trophy. | 17 |
| hudChrome.housing.trophies.inspectAria | Inspect {trophy} | 17 |
| hudChrome.housing.trophies.placeTooltip | Display this accomplishment on a free plinth. Removing the display keeps your trophy unlocked. | 17 |
| hudChrome.housing.trophies.possessionRequired | This display is active while you own {item}. | 17 |
| hudChrome.housing.trophies.finish | Finish: {finish} | 23 |
| hudChrome.housing.trophies.finishBronze | Bronze | 23 |
| hudChrome.housing.trophies.finishSilver | Silver | 23 |
| hudChrome.housing.trophies.finishGilded | Gilded | 23 |
| hudChrome.housing.trophies.finishSource | Silver needs the heroic clear; gilded needs an S-rank rift clear. | 23 |
| hudChrome.housing.trophies.dulled | Finishes look dull while your home's condition is below 30. | 23 |
| hudChrome.housing.trophies.formStatue | {source} statue | 23 |
| hudChrome.housing.trophies.formHead | {source} mounted head | 23 |
| hudChrome.housing.trophies.formBanner | {title} banner | 23 |
| hudChrome.housing.trophies.formPaddock | {mount} paddock | 23 |
| hudChrome.housing.trophies.formItemStand | {item} armor display | 23 |
| hudChrome.housing.trophies.formWeaponRack | {item} weapon rack | 23 |
| hudChrome.housing.trophies.formSpecimenCabinet | Specimen cabinet | 23 |
| hudChrome.housing.trophies.formHarvestSheaf | Harvest sheaf | 23 |
| hudChrome.housing.trophies.formHarvestMarker | {region} first-harvest marker | 23 |
| hudChrome.housing.trophies.formAnglersDisplay | Angler's display | 23 |
| hudChrome.housing.trophies.formRiftObelisk | Rift obelisk | 23 |
| hudChrome.housing.trophies.formLegendStand | Legend Stand | 23 |
| hudChrome.housing.trophies.formRankDisplay | {collection} rank display | 23 |

## 7. Visiting: a friend's door and an honest guest role

### Player goal, flow and family

Find a friend's home, know whether entry is possible and feel welcome without
mistaking their controls for the owner's. Gate and NEW visit_prompt_view.ts /
visit_prompt_window.ts reuse the same plant-sheet standalone decision family.
Initial policy is private/friends; guild/public discovery arrives in the later
visiting work. The friend admission fact is D76: the named owner character's
outgoing friend list contains the visitor's character, read by the server in the
bounded on-open lookup and rechecked at entry; the visitor's own friend list is
never an admission input, a block row on either side refuses, friendAdd,
friendRemove and blockAdd bust the visitor projection through a NEW mutation-site
hook and trigger the ejection recheck, and a name that resolves to an alt resolves
to that account's plot with only the named character's friend list consulted.
Friend-by-name uses server normalization and a bounded authorized
lookup, never client account IDs, unbounded autocomplete or per-result SQL from
a painter. An unknown/private/blocked destination gets a privacy-safe refusal.

Flow: open gate, choose Visit a friend, enter character name, activate Find home,
inspect the matching authorized home/occupancy result, explicitly activate Enter, view guest context and who-is-home,
inspect belongings, leave through the visible door. Offline owner is not itself
a refusal: authorized homes can load lazily through the global ownership fence.
Runtime saturation or an active foreign-realm claim yields truthful busy/retry,
never loss of entitlement, a sale rush or an ownership waitlist.

The live cap displays admitted visitors, excluding every owner-account session;
source is the state visitor row and current authoritative roster. The initial
Inn and Cottage cap is the adopted R24 value in state Content numbers, not a
client literal. Who-is-home names only authorized present characters using public entity
identity. Escape each name and format the list through locale-aware list
formatting before interpolating visit.home; never join with a hardcoded comma.
An empty other-player roster says no one else is home. The independent
owner-away line appears only when the owner is absent; an empty guest roster
does not itself imply owner absence. Every admitted entity remains
visible at every preset; a light/performance setting cannot silently cull guests.

While the owner builds, guests see accepted layout revisions and a small
visit.ownerBuilding line. The owner's ghost, camera and private payment facts
stay private. Current admission authority is checked on entry and mutation.
Changing to private prevents new entry while existing guests may finish; End
visit removes a selected guest safely. A block, revoked relationship/membership
or explicit End visit ejects immediately to the remembered safe gate. Cache TTL
is not permission to retain revoked access. Explain removal generically without
revealing a block or private social policy.

### Owner privacy and guest roster surface

File 18 adds a Visitors tab to the owner-only Steward window, using shared tabs
beside its household Ledger tab. Its heading opens from the ordinary Steward
entry, with a direct owner guest-status affordance selecting that same tab.
Only the policies supported by the current wave appear: Private/Friends at
first, Guild/Public when the later visiting work lands. There are no disabled
future-policy teasers. For a guild-owned plot (28) the policy is set by the
leader or an officer and accepts only guild, public or private; friends is
refused with denied.guildPolicy, current members are admitted always, non-members
enter as guests under the ejection rules, and public admission is capped by the
tier column, the Meeting Hall using the Cottage row until 32 (D77).
The tab contains confirmed policy, policy radiogroup,
Apply visiting policy, current guest list and each guest's End visit action.

Selecting a radio changes a draft only. Show visit.policyConfirmed separately
from visit.policyDraft until Apply succeeds. Apply submits the selected policy
with operation/plot/revision identity; pending disables repeated policy submits
while preserving the confirmed status. Matching success updates that status,
matching refusal preserves the draft and reason, and reconnect refreshes policy
before re-enabling Apply. An unrelated guest-entry/placement event cannot mark a
policy change complete. Private's explanation states that existing admitted
guests may finish unless explicitly ended; current social revocation still
immediately ejects through authority.

The guest list has its own read-only loading/empty/error/reconnect states and
uses the current authorized roster, not the requested policy's speculative
roster. End visit opens the shared owner-inert confirmation naming that guest.
Matching pending/success/refusal uses endPending/endSucceeded or a stable deny,
never visit.pending's entry wording. A guest who leaves before confirmation
resolves to the fresh roster without another ejection; retain focus on the next
valid guest row, then roster heading when empty. Closing the window does not
cancel a committed policy/removal or allow its late response to reopen it.

Focus order: selected Steward tab, confirmed policy help, selected policy radio,
Apply, guest-roster heading/list and named End visit controls, Close. Pointer,
touch and pad follow the shared radio/list/dialog contracts. A visiting account
never receives this owner-management tab or another owner's policy draft.

### States, focus and feedback

| State | Required presentation and recovery |
|---|---|
| Empty | Empty name asks for a character; nobody present uses visit.quiet. No private roster is fetched to fill an empty UI. |
| Loading | Name/selection persists, aria-busy and one lookup/entry request. No fake occupancy. |
| Error | Generic unavailable for private/unknown/blocked; explicit full only after authorized lookup; busy/retry for runtime capacity. |
| Locked | Owner policy/relationship decides admission. Guests cannot use personal Strongbox, paid services or owner station rights. No gray purchase buttons. |
| Visitor | Guest context, authorized who-is-home, read-only inspection and Leave. No build cursor or accidental spend affordance. |
| Owner | Own-home actions plus current guest roster and explicit End visit action. Confirmation names the selected visible guest only. |
| Pending | Entry/removal waits for its matching authoritative result. A refreshed full home can refuse previously ready entry without losing typed name. |
| Reconnect | Restore authoritative room/guest status; if access is revoked, return safely with visit.ended. Never replay admission from a cached public list. |

Focus order is own/friend tabs, name, Find home, matching authorized home
result/choice if required, Enter, Back/Close; in the room the guest status is readable but does not steal focus.
Door/Leave is always reachable through existing interact and keyboard/pad access.
Owner's roster uses a list with named End visit buttons. Blocking confirmation
inerts only its owning window and returns to the guest row or next valid row.
Shared window motion only, no forced camera turn on a friend's join/leave.
Reduced motion updates names/state statically. Compact uses the same sheet and
keeps Leave away from placement/action overlap.

```text
+--------------- visit choice ----------------+
| {visit.title}                 {common.close}|
| {gate.name}: [                            ] |
| [ {gate.lookup} ]                           |
| matching home art / owner / occupancy       |
| result ready: [ {gate.enter} ]              |
+---------------------------------------------+
+-------------- guest world ------------------+
| {visit.guest}         {visit.home/quiet}     |
|                  {visit.ownerBuilding}      |
| room, readable guests and public trophies   |
| door -> {visit.leave}                       |
+---------------------------------------------+
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.visit.title | Visit a Home | 18 |
| hudChrome.housing.visit.occupancy | Visitors: {count} of {limit} | 18 |
| hudChrome.housing.visit.occupancyTooltip | The visitor limit does not count characters on the owner's account. | 18 |
| hudChrome.housing.visit.home | At home: {names} | 18 |
| hudChrome.housing.visit.quiet | No one else is home. | 18 |
| hudChrome.housing.visit.full | This home is full. Try again later. | 18 |
| hudChrome.housing.visit.unavailable | This home is not available to visit. | 18 |
| hudChrome.housing.visit.ownerAway | The owner is away. You are welcome to visit. | 18 |
| hudChrome.housing.visit.guest | You are visiting {name}. | 18 |
| hudChrome.housing.visit.leave | Leave Home | 18 |
| hudChrome.housing.visit.ownerBuilding | {name} is decorating. | 18 |
| hudChrome.housing.visit.policy | Who can visit | 18 |
| hudChrome.housing.visit.private | Private | 18 |
| hudChrome.housing.visit.friends | Friends | 18 |
| hudChrome.housing.visit.guild | Guild | 18 |
| hudChrome.housing.visit.public | Public | 18 |
| hudChrome.housing.visit.endVisit | End Visit | 18 |
| hudChrome.housing.visit.endVisitAria | End {name}'s visit | 18 |
| hudChrome.housing.visit.endConfirm | Return {name} to the gate? | 18 |
| hudChrome.housing.visit.ended | Your visit has ended. You have returned to the gate. | 18 |
| hudChrome.housing.visit.pending | Confirming entry... | 18 |
| hudChrome.housing.visit.endPending | Ending {name}'s visit... | 18 |
| hudChrome.housing.visit.endSucceeded | {name}'s visit has ended. | 18 |
| hudChrome.housing.visit.policyPending | Updating who can visit... | 18 |
| hudChrome.housing.visit.policySaved | Visiting policy updated. | 18 |
| hudChrome.housing.visit.policyConfirmed | Current policy: {policy} | 18 |
| hudChrome.housing.visit.policyDraft | Selected policy: {policy} | 18 |
| hudChrome.housing.visit.applyPolicy | Apply Visiting Policy | 18 |
| hudChrome.housing.visit.roster | Guests at home | 18 |
| hudChrome.housing.visit.rosterEmpty | No guests are here. | 18 |
| hudChrome.housing.visit.privateExisting | Current guests may stay until they leave or you end their visit. | 18 |
| hudChrome.housing.visit.readOnlyTooltip | Inspect this home's furnishings and trophies. Only the owner can change them. | 18 |
| hudChrome.housing.visit.ownerService | This service is for the home's owner. | 18 |
| hudChrome.housing.visit.openHouses | Open Houses | 26 |
| hudChrome.housing.visit.openHousesEmpty | No friends or guildmates have an open house right now. | 26 |
| hudChrome.housing.visit.openHousesLoading | Finding open houses... | 26 |
| hudChrome.housing.visit.openHousesError | Open houses could not be loaded. Try again. | 26 |
| hudChrome.housing.visit.refreshList | Refresh | 26 |
| hudChrome.housing.visit.listEntry | {name}'s {tier} | 26 |
| hudChrome.housing.visit.listEntryAria | {name}'s {tier}, open to {policy}, {count} of {limit} visitors | 26 |
| hudChrome.housing.visit.openTo | Open to {policy} | 26 |
| hudChrome.housing.visit.knock | Knock | 26 |
| hudChrome.housing.visit.knockAria | Knock on {name}'s door | 26 |
| hudChrome.housing.visit.knockSent | You knocked on {name}'s door. | 26 |
| hudChrome.housing.visit.knockWait | Wait a moment before knocking there again. | 26 |
| hudChrome.housing.visit.knockRefused | You cannot knock there right now. | 26 |
| hudChrome.housing.visit.knockHeard | {name} is knocking at the door. | 26 |
| hudChrome.housing.visit.entryWait | Too many visits in a short time. Try again shortly. | 26 |

Open Houses (file 26): the visit prompt gains an Open Houses tab listing the open
houses of friends and guildmates with owner name, tier, policy and occupancy;
states empty, loading, error and ready; a Knock button per row (rate-limited one
per account+plot per 10 seconds, refused with the generic denial when a block row
exists on either side) and Enter; a refused knock, a full house and a busy entry
reuse visit.unavailable, visit.full and denied.busy. Focus order: tab, list rows,
the row's Knock then Enter, Refresh, Close. The owner-side notice is
visit.knockHeard. 26 also enables the existing visit.guild and visit.public radios
on the Steward policy picker.

## 8. Freehold Charter: permitted WOC Store purchase

### Player goal, scope and family

Understand exactly what a cosmetic home grants before spending. Only browser
web and website-distributed desktop can expose the Charter or Call purchase
surface, and only after counsel, published Terms and accepted economy-service
contract gates pass. Seeker is use-only unless a later explicit ruling changes
the surface map (a named unsigned gate until its signature artifact is on file).
Native iOS, Google Play Android, Steam and Epic do not
receive the housing purchase submodel. A phone browser is still web, not native;
a phone user agent cannot stand in for an authoritative distribution verdict.
Unknown distribution fails closed. An existing wallet capability does not
independently authorize housing purchase or deed functionality.

Use woc_store_view.ts and the store composition in daily_rewards_window.ts,
extended by the planned src/ui/charter_store_view.ts (the existing
tests/charter_store_view.test.ts exercises the shipped storage-charter helpers; 16
extends its integration arms without erasing them and adds focused tests for the
housing module). charter.section is the Store section heading beside Strongbox
Charters (the h3 pattern of charter_card_view.ts). The same catalog card,
review, durable purchase intent and receipt family serves website desktop and
browser web. Show painted Cottage art with the same finish as the actual room,
exact grant summary, current service availability and service-formatted price.
Do not put an invented dollar amount, conversion, burn percentage, multiplier,
discount or future resale price in the card. A price is a current versioned
service quote; expired/unavailable quotes disable review with a plain reason.
Expiry alone uses charter.quoteExpired. charter.priceChanged is selected only
when a valid comparison actually proves the quoted amount changed. An unaffordable
Charter (balance below the current quote) reuses hudChrome.wocStore.needMoreBody
with CharterRow.affordable and shortfall, the one non-housing key section 5 records
for the Call; review stays disabled with that line and no charter.* shortfall row
exists.

The product is cosmetic, convenience and access, with no combat/XP/drop bonus.
State the free Inn Room on the permitted product detail so players can make an
informed choice. Purchase-benefit text never says earn, income, investment,
appreciation, yield, passive return or profit. Trophy accomplishments have their
own collection language and are never a paid-benefit claim. The optional later
on-chain deed/trading flow is not a launch-purchase promise.

Later holder flair is independently gated by the approved deed capability before
renderer/material, DOM, tooltip or accessibility projection, even when the cosmetic
ID is valid and known. A denied distribution receives no holder appearance; unknown
IDs also yield none. The same ID has affirmative web/website and independent denied
controls. Preserve D9: no distribution label reaches the game server and no per-viewer
service lookup is added. Ordinary localized Book of Deeds achievements and first-kill
sources remain valid gameplay; lexical guards target prohibited housing purchase and
on-chain-deed contexts rather than banning the ordinary achievement noun.

Denied distributions have no housing token/wallet/on-chain deed words in visible
copy, tooltip, aria/alt, errors, network catalog or hidden DOM. Absence is a
runtime contract (D86): no DOM node, handler, request, fetched catalog, error copy
or accessible text; the purchase code and its English keys ship dormant in every
bundle under the runtime capability, and review notes say "not rendered or
reachable", never "absent from the bundle". The existing Book
of Deeds gameplay noun continues through its localized selector; do not confuse
ordinary achievement naming with on-chain marketing. No disabled Charter tile,
store badge, deep link, click handler or fallback wallet error remains behind
CSS. Approved neutral management, if any, is independently capability-gated as
section 5 specifies. Exactly two HudFeatures rows exist, freeholdPurchaseEnabled
and freeholdManageOnWebsite (D91); deed surfaces come from 14's deedSurfaces source
pin consumed by 38, never a HudFeatures row.
Purchase authority is independently enforced by the economy service's NEW
signed contract. Existing account authentication, Origin/UA/JSON, linked platform
accounts and desktop capability probes do not establish an authenticated
checkout channel. Preserve D9's game-server ignorance of distribution through
service-owned verification and opaque account/purpose/SKU/policy/quote/operation-
bound authorization. The game receives only the validated effect through its
narrow host boundary. Do not invent a trusted game-server channel label or claim
the current tree already has that issuer/verifier. Unknown eligibility refuses
new spend; confirmed payments retain recovery under their original identity.
The signed service artifact must name the exact fact its authorization proves.

### Flow, states and focus

Flow: enter the permitted WOC Store, choose Charter card, inspect exact grant and
service quote, review the purchase, confirm through the existing checkout rail,
observe pending, then reconcile the authoritative account entitlement and show
the ready destination. The receipt action is charter.showGate: open the existing
map window, select/highlight the actual Eastbrook housing-gate marker from
content and focus its readable marker detail. It provides directions and never
teleports, invokes the Hearth Key, clears cooldown or bypasses entry restrictions.
File 16 owns that narrow map-selection composition and a focused action test.
If the map/marker is unavailable, retain the receipt and show the keyed map
failure with retry. The player's normal gate/Hearth action remains independent. Cancellation before settlement returns to review with no
grant. Ambiguous settlement keeps the original durable intent and reconciles;
it does not invite another purchase. Closing/reopening, reconnect and another
character session find that original result. Purchase confirmation never
optimistically opens a paid Cottage before the server grants it.

| State | Required presentation and recovery |
|---|---|
| Empty | No eligible product/catalog result shows the ordinary permitted-store empty state; denied distributions have no purchase component at all. |
| Loading | Stable card outline and explicit catalog/quote loading; art may load independently, price never defaults to zero. |
| Error | A stable service/refusal outcome keeps intent identity and explains retry/reconciliation; charter.reference shows the saved opaque request reference and charter.supportReview the support-review outcome. Sanitized housing copy, never an upstream stack/error dump. |
| Locked | Owned/not eligible/counsel-gated/Terms-gated/service-gated product cannot submit. Native denies are absence, not a grayed-up sell. |
| Unaffordable | Balance below the current quote shows hudChrome.wocStore.needMoreBody with the live shortfall (the shared store family, section 5); review stays disabled, the quote and card stay readable, and no charter.* shortfall line exists. |
| Visitor | Visiting another home does not expose the owner's purchase state. Allowed account Store remains their own account context outside the visit flow. |
| Owner | Exact owned tier and permitted next action; duplicate initial entitlement is not a second buy button. |
| Pending | Match durable operation/quote/account/plot; one confirmation and recoverable status. Distinguish interrupted checkout from confirmed purchase. |
| Reconnect | Read the original intent/receipt and server grant; either finish ready state, remain reconciling, show confirmed refusal, or show charter.supportReview with charter.reference. No second debit. |

Focus order: Store category/tab, selected Charter card, details, review action,
terms/receipt links where permitted, Close. The actual checkout confirmation
inherits its existing blocking prompt and focus/inert cleanup. A cancelled
external handoff restores the review opener; a completed one focuses the receipt
heading. Touch and pad use the same family and reading order. Shared theme tokens
and restrained motion keep the room art as focal point. Reduced motion uses a
static receipt state, with no purchase celebration required to understand the
result. Website product copy uses this catalog contract and the website's
approved shell/brand typography, never a separate invented housing style.

```text
+---------------- permitted WOC Store ----------------+
| existing Store navigation                close     |
| Cottage painted art  {charter.title}                |
|                      {charter.summary}              |
|                      {charter.boundary}             |
|                      {charter.freeRoom}             |
| current service price     [ {charter.review} ]      |
| review: {charter.feeDetails} / {charter.quoteExpiry} |
|         [ {charter.terms} ]   [ {charter.confirm} ]  |
+----------------------------------------------------+
        review -> original intent -> receipt -> home
Denied surface: this entire purchase component is absent.
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.charter.title | Freehold Charter | 16 |
| hudChrome.housing.charter.summary | Open a Cottage to furnish, display your trophies and welcome friends. | 16 |
| hudChrome.housing.charter.boundary | A cosmetic home with convenience and access features. It grants no combat power. | 16 |
| hudChrome.housing.charter.freeRoom | An Inn Room is free for every account. | 16 |
| hudChrome.housing.charter.artAria | Cottage interior with a hearth and space for your furnishings | 16 |
| hudChrome.housing.charter.review | Review Purchase | 16 |
| hudChrome.housing.charter.price | Price: {price} | 16 |
| hudChrome.housing.charter.feeDetails | Fees and taxes: {feeDetails} | 16 |
| hudChrome.housing.charter.quoteExpiry | Price valid until {expiresAt}. | 16 |
| hudChrome.housing.charter.terms | Purchase Terms | 16 |
| hudChrome.housing.charter.section | Freeholds | 16 |
| hudChrome.housing.charter.reference | Request reference: {operationId} | 16 |
| hudChrome.housing.charter.supportReview | This request needs a support review. Your request reference is saved. | 16 |
| hudChrome.housing.charter.serviceUnavailable | This service is unavailable for this account or location. | 37 |
| hudChrome.housing.charter.eligibilityUnconfirmed | Eligibility could not be confirmed. Please try again later. | 37 |
| hudChrome.housing.charter.supportPointer | Contact support with your saved request reference. | 37 |
| hudChrome.housing.charter.quoteLoading | Loading current price... | 16 |
| hudChrome.housing.charter.quoteExpired | This quote has expired. Review the current quote before confirming. | 16 |
| hudChrome.housing.charter.priceChanged | The price has changed. Review the new price before confirming. | 16 |
| hudChrome.housing.charter.confirm | Confirm Purchase | 16 |
| hudChrome.housing.charter.pending | Your purchase is being confirmed. | 16 |
| hudChrome.housing.charter.reconciling | Checking your original purchase. You do not need to buy again. | 16 |
| hudChrome.housing.charter.received | Your Cottage is ready. | 16 |
| hudChrome.housing.charter.owned | This account already has a Cottage or a larger home. | 16 |
| hudChrome.housing.charter.cancelled | Purchase cancelled. | 16 |
| hudChrome.housing.charter.unavailable | This purchase is unavailable right now. | 16 |
| hudChrome.housing.charter.receipt | Purchase Confirmation | 16 |
| hudChrome.housing.charter.mapUnavailable | The gate could not be shown on the map. Try again. | 16 |
| hudChrome.housing.charter.showGate | Show Gate on Map | 16 |
| hudChrome.housing.charter.guildhallTitle | Guildhall Charter | 29 |
| hudChrome.housing.charter.guildhallSummary | Open a Meeting Hall for your guild, paid from the Hall Fund. | 29 |
| hudChrome.housing.charter.guildhallOfficerOnly | A guild officer can complete this purchase for the guild. | 29 |
| hudChrome.housing.charter.guildhallReceived | Your guild's Meeting Hall is ready. | 29 |
| hudChrome.housing.charter.guildhallOwned | Your guild already has a hall. | 29 |
| hudChrome.housing.charter.secondTitle | Second Freehold Charter | 42 |
| hudChrome.housing.charter.secondSummary | Open a second Cottage with its own upkeep, visitors and ward slot. | 42 |
| hudChrome.housing.charter.secondRequiresPrimary | You need a Cottage or larger primary home before buying a second home. | 42 |
| hudChrome.housing.charter.secondOwned | This account already has a second home. | 42 |
| hudChrome.housing.charter.secondReceived | Your second home is ready. | 42 |

The review step shows the item, its effect, the total price, charter.feeDetails
(service-authored keyed structured fields), charter.quoteExpiry and the
charter.terms link before charter.confirm; expiresAt is formatted with
formatDateTime and no service amount goes through formatMoney. The Call card
uses the existing steward.call, steward.callCurrentTooltip,
steward.callRepairTooltip and steward.reviewCall rows. The Guildhall Charter (29)
and the Second Freehold Charter (42) reuse the same card, review, intent and
receipt flow with their own title, summary, refusal and receipt rows above.

## 9. Interior art, light, sound and graphics fairness

### Player goal and authored room composition

Enjoy a place that feels inhabited and peaceful on the lowest supported phone.
The interior itself, not the spending panel, is the reward. New art must follow
[the art brief](art-brief.md) and measured content manifest. These packet artifacts
are specification sources, not claims that models or reference sheets already
exist. Final models arrive through the repo's image-to-glb intake, export,
optimization, fingerprint and in-game proof pipeline, before the owning wave
ships. Stand-ins during implementation do not satisfy art closeout.

Inn Room: bed, warm woven cloth, timber/plaster, hearth and clear door route,
with three honest plinth sites and room for its decor budget. Cottage: the same
finished material quality, a broader furniture area, four plinths, built-in
Strongbox and one station amenity slot. Values come from the state tier rows,
not the composition sketch. Structural hearth, doorway and room dressing have
explicit fixed-versus-movable identity so an apparent chair/cup does not promise
pickup if it is baked scenery. Avoid unearned trophy dressing. Negative space
leaves a camera-safe place to inspect a chosen furnishing from each legal side.
The door, Strongbox, station and meaningful display silhouettes are visually
different through shape and placement, not tint alone.

The Cottage's built-in Strongbox is personal-bank access without extra storage
capacity or amenity-slot cost. An installed crafting station uses its slot; access
still respects recipe/station/training permissions. Remote personal vault draws
for permitted crafting follow the dedicated authorization, not a general banker
proximity flag. Direct Materials Vault chest is a later Manor unlock (D47: Manor
only; no hall tier adds a personal-vault chest). Guest
geometry does not confer permission to owner services. Guild chest and hall
station routing remain separate later service identities.

### Rendering and lights

NEW src/render/freehold/interior_dressing.ts and freehold_light_grade.ts (a basename
distinct from the existing src/render/interior_light_rig.ts; its test is
tests/freehold_light_grade.test.ts) compose through the existing renderer seams. The
room uses the existing sun/hemi/env/rim rig and a housing grade, not new
directional/hemisphere producers. The verified Last Keep warm family is the reference
for plaster, warm hearth and cool edges; any changed coefficients are measured/tuning
rows before use, not copied numbers from a screenshot. LOW's current interior branch
skips the richer state light rig, so the housing renderer must explicitly implement a
readable LOW grade or fallback and prove it. surfaceMat's LOW Lambert path is a
first-class target.

The proposal's three authored room point emitters are a ceiling, not three
guaranteed contributing lights. State "Housing authored and effective lights"
records the existing iOS limit of two and the pressure case of one. FireLightSink,
createFireLightAdopter, reparentStrandedLightsToScene and applyPointLightBudget
own all point registration, ranking and visibility; preserve fixed light-count
padding and preparation assumptions. Placing many lamps does not allocate a
point light per lamp or change the global budget. Ornamental emitters may lose
a slot while texture, ambient grade and material silhouette keep the hearth,
floor and belongings intentionally visible.

Meshes and material variants use attachSceneGroupGated, background_gpu_queue,
compile_gate and texture_prep_lane preparation contracts. New gated entities
name their stand-in and corresponding tests. Camera-wall occlusion follows the
existing occluder_fade preparation convention, including reduced motion and no
cold transparent-program flip. No thumbnail creates a second GL context.
Arrival/room leave disposes or releases resources through the owning lifecycle;
visiting several homes must not ratchet lights, materials (including per-prop
tint material variants, 41), audio loops or listeners.

Condition changes the hearth's decorative flame/coal appearance using the
existing truthful condition model. The accessible numeric meter and exact
amenity threshold are authoritative; a fancy flame curve never defines new
condition bands. Realm daylight is continuous with the outdoor world, while
room readability has a floor at every time. Sound is ordinary spatial hearth
ambience and prepared door/arrival feedback through section 3's sanctioned
pipeline. There is no special housing soundtrack or extra sound settings panel.

### All-tier and all-state acceptance

| State | Required room treatment |
|---|---|
| Empty | Intentionally dressed starter room, honest empty plinths and clear free floor; no unfinished void or false reward. |
| Loading | Structural safety preparation uses the existing arrival cover. Online cosmetic settle remains zero; prepared readable stand-ins preserve actionable identity/location while optional art finishes. The offline wait stays bounded. |
| Error | Missing optional art/audio uses shared fallback; missing essential safe room data refuses reveal with recoverable entry reason. |
| Locked | A paused amenity has readable text/shape feedback. The home remains warm enough to navigate, with no ominous eviction treatment. |
| Visitor | Same public room and trophy quality, all admitted guests visible, no private layout preview. |
| Owner | Full approved owned room, selected edit identity and capacity feedback unchanged by preset. |
| Pending | Last accepted world stays stable while a placement/material action resolves; private proposal remains an overlay, not an optimistic collision change. |
| Reconnect | Last authoritative room plus connection state; no guessed edits or inherited stale permissions. |

Ghost footprint, blocked hatch/reason, floor/surface snap, selected furnishing,
room bounds, capacity, authoritative failure, identity, entry/full/access state
and every admitted player are actionable and identical at all tiers. No FPS
governor/effectsTier throttle removes or delays them. LOW may shed bloom,
embers, soft shadows, reflective complexity, optional emitter richness and UI
shimmer. Structural silhouette, door, plinth and furniture identity remain.
Forced colors preserves DOM state; reduced motion removes pulsing/flame motion
without erasing the hearth's static condition cue. Audio mute changes no text.

Interior inspection uses world movement/look and existing interact ordering;
no autonomous panel focus or camera movement surprises a visitor. Every
interactable has its localized name and purpose available to keyboard, pad and
touch. Compact placement screenshots include the actual touch controls against
the room, so the composition is judged with the player's real usable viewport.

```text
+----------------- room composition ----------------+
| quiet cool window edge       safe camera look     |
| bed / seat                  personal display      |
|                                                   |
| door ===== protected walking/arrival path =====   |
|                        hearth as visual destination|
| personal bank/station reached off the travel path |
+---------------------------------------------------+
Art direction schematic, not an unmeasured room-dimension promise.
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.interior.door | Home door | 09 |
| hudChrome.housing.interior.hearth | Hearth | 09 |
| hudChrome.housing.interior.strongbox | Strongbox | 12 |
| hudChrome.housing.interior.strongboxTooltip | Open your personal bank here. This does not add storage space. | 12 |
| hudChrome.housing.interior.stationTooltip | Use this home's {station}. Recipes keep their normal skill and training requirements. | 12 |
| hudChrome.housing.interior.strongboxVisitorTooltip | This Strongbox opens the owner's personal bank. Guests cannot use it. | 12 |
| hudChrome.housing.interior.strongboxPausedTooltip | This Strongbox is paused by the home's condition. The owner can restore condition to use it. | 12 |
| hudChrome.housing.interior.stationVisitorTooltip | This station is for the home's authorized users. | 12 |
| hudChrome.housing.interior.stationPausedTooltip | This station is paused by the home's condition. The owner can restore condition to use it. | 12 |
| hudChrome.housing.interior.plinth | Trophy plinth | 09 |
| hudChrome.housing.interior.emptyPlinth | An empty plinth for one of your trophies. | 09 |
| hudChrome.housing.interior.amenityPaused | This amenity is paused. The owner can restore the home's condition. | 09 |
| hudChrome.housing.interior.preparing | Preparing the room... | 09 |

Interior tooltip selection follows the live service authorization/condition
model. Owner-ready Strongbox/station gets its action tooltip; guest-denied gets
the visitor arm; a condition-paused service gets its paused arm only when that
specific service is actually condition-gated. A bound service never promises
owner access to a visitor. The Strongbox's built-in slot exemption does not
by itself decide its condition gate; the authoritative amenities contract does.

## 10. Later waves: compatible outlines without speculative controllers

The following are presentation acceptance outlines for their owning later files.
They inherit section 2's tokens, motion, focus and state vocabulary. Do not add
unavailable teaser tabs or build their controllers during the initial wave.

| Surface and player goal | Flow, reused family and input order | States and limits |
|---|---|---|
| Guildhall boards: understand shared plans and contributions | Existing plant-sheet/list/ledger window and shared tabs; select board/tab, read authorized project or raid-lockout/first-kill list, choose permitted contribution/project action, review, confirm, return. War table is a real authorized projection, not a generic standings redirect: the War table lockout tab shows one row per lockout key the live model stamps (eleven: the five heroic five-man keys and the plain and heroic keys of nythraxis_boss_arena, ignivar_raid_arena and ignivar_inner_crucible), each counting online members whose lockout is live by the isRaidLocked expiry rule, plus the viewer's own lockouts; no other member is named and no week anchor is read (30a), and its first-kill tab reaches the client through 30a's bounded sibling read (the guildHallBoards facet member; 31 adds no facet member, D82) with keyed ready and empty states. guild.* is the only Guildhall family; no housing.hall.* namespace exists. The Hall Fund form (29) carries donation, cap, contribution-ledger and the officer-plus Withdraw to Guild Bank rows (D78). | Empty board explains no records; loading/error/reconnect preserve known state without authorizing spending; locked shows role/condition reason; visitor sees only approved public facts (a non-member enters as a guest under the public policy, D77); member can manage assigned personal plinths; officer owns layout/projects. Pending contribution follows durable service/material result. No timed construction wait or new combat benefit; guild-clear recording capacity never refuses join, dungeon entry or a respawn, and a not-captured clear shows no player-facing text (D83). |
| Kitchen Garden: remember an existing harvest | Existing plant-sheet/list family and localized crop/Journal selectors; inspect the account-owner tableau, then owner may open the current character's private Harvest Journal. Guests inspect only safe owner-derived decor. No new beds, remote tending, harvest or growth benefit. | Empty requires a complete successful no-plots source. Loading/error/unavailable cannot imply an empty garden or ready crop. Current local authority can be live; remote/nonlocal committed snapshots remain visibly saved, with truthful mixed-source coverage. Reconnect preserves honest known source state. Selection is read-only; no spending/harvest mutation or pending duplicate action. |
| Wards: find neighbors without losing a quiet home | Existing map marker/list family, bounded public roster and gate prompt; select marker, inspect authorized owner/occupancy, choose visit, then ordinary admission. The roster reads the myWard facet member and the owner-only Move Here action sends moveWard(wardId) (34); physical ward travel and plot-entry permissions remain separate. | Empty plots are scenery, not a ownership scarcity offer; loading/error/busy has retry; private/blocked facts stay private; owner/member and visitor get actual rights. Pending assignment is server-authorized. Reconnect never trusts cached capacity. Every admitted occupant is visible at LOW. Ward Favor capacity awards are properties of the stable plot ID and travel with the plot on a sale; a seller's fresh record starts at the base budget (D80). |
| Showcases: exhibit a home intentionally | Reliquary-style cards, ordinary opt-in prompt and public source detail; select entry, inspect, visit if allowed, cast eligible account vote, receive acknowledgement. Owner explicitly opts in. | Empty/locked season explains dates/eligibility; loading/error/reconnect preserves vote identity; visitor sees consented public entries; owner cannot vote for their own entry. Pending vote cannot double-submit. Season results/rewards are durable and cosmetic; changing wards does not reset the account vote. |
| Guest books: leave a friendly reaction | Existing compact list and selected reaction radiogroup opened from the existing gate-door interactable (the D4 object entity 06 spawns, whose prompt 26's knock extends; 36 places no new entity); read public entries, select wave/cheer/admire, confirm, return. Same touch/pad sequence and shared prompt. | Empty book invites an allowed reaction; loading/error/reconnect cannot duplicate it; closed/blocked denies privately; owner can use normal moderation tools; guest never writes free text. Live per-account limit and retained-entry cap come from state. |
| Advanced layout and dyes: refine an owned arrangement | Extend the existing build palette and plant-sheet confirmation family when live; choose typed surface/snap mode, preview parent/child move, confirm. The dye picker is enabled by the home station amenity of type apothecary (D90: no separate station object, amenity kind, slot or station GLB) and selects the permitted channel/dye, then atomic consumption. Layouts select save/load/share, preview exact-copy shortfalls and changes, confirm. | Empty saves/dyes explain normal acquisition; loading/error leaves current layout; a locked dye picker follows the apothecary amenity's condition and proximity while ordinary placement stays available. Visitor read-only. Pending/reconnect preserves original operation. Import never grants missing furnishings, includes private names or bypasses bounds. Every changed imported tint uses the canonical dye admission/consumption transaction, current apothecary station/proximity/condition and exact owned dye copies; unchanged tint consumes nothing. Preview all dye shortfalls, then commit the whole supported batch atomically. |
| Optional Freehold Deed and Homes tab (web and website desktop only): mint a deed, list or buy a furnished home | Existing cold-window family for the deed card (src/ui/deed_card_view.ts and deed_card_window.ts; deed.description states the record is optional, deed.custody and deed.conditionCredits the custody and transfer facts, deed.noPricePromise the no-price-promise line, and the service-unavailable state reuses charter.serviceUnavailable); a client-side Homes tab in the Exchange window over the plot-listing feed; select home, review the exact included/retained contents, sign the wallet step-up, confirm, return. Money states reuse charter.*; deed states use deed.*. | Empty feed explains no listings; loading/error/reconnect reuse common.*; a buyer without a free home slot sees denied.deedBuyerCapacity (D80: the purchased plot occupies the buyer's index 0 only at tier 0, or a free index under 42's two-plot cap); denied distributions build nothing (D86, D91). |
| Second home: buy a second Cottage and switch plots | Steward gains Primary Home / Second Home tabs and the existing hearthDestination row; the store card reuses the charter.* purchase flow with the charter.second* rows. | Owned/pending/error reuse charter.*; the second home upgrades through the primary's build projects with every integer material line at ceil(1.5x) (D93); a third home shows denied.secondHomeCap. |

Unsupported future station or tint values preserve the original owned record and
make the affected surface read-only with common.unavailable. They are not absent
legacy defaults or repairable malformed current-schema values. Unrelated edits
never autosave their removal. The persistence/amenity/dye owners pin those distinct
load/round-trip arms and all-or-none import refusal; no client normalization silently
strips future data.

Kitchen Garden uses the exact garden keys below. Initial unresolved loading uses
garden.loading. Whole-source failure uses garden.unavailable; partial coverage
uses garden.incomplete while preserving truthful available rows. Only complete
successful zero-row coverage uses garden.empty. Complete all-live, all-saved or
mixed live/saved coverage selects garden.live, garden.saved or garden.mixed;
incomplete takes precedence over that aggregate summary. Missing freshness is
unavailable, never a live default.

Each saved row wraps its localized status with garden.savedStatus in both visible
and accessible text, even when the host-derived status is ready. A saved ready row
also uses garden.savedReadyTooltip. This qualification is never hidden only in a
hover tooltip. Live/saved/mixed explanation uses the matching tooltip key. Growing
uses garden.growing; ready/withered reuse hudChrome.harvestJournal.ready/withered.
Do not reuse harvestJournal.growing because it includes a countdown. Crop names
use normal localized crop selectors. The Journal button and tooltip interpolate
hudChrome.harvestJournal.title as journal and are offered only to the owner for
the current character. Guests receive no Journal action, alt identity or timer.
File 24 pins live/saved ready, mixed, incomplete-with-known-rows, unavailable and
confirmed-empty rows plus keyboard/aria output and guest privacy.

Monthly Endeavor progress may reset on the published authority calendar, but
Favor-unlocked decor capacity remains permanent. Existing decorations never
expire. Seasonal furniture sets and new Carpenter/Mason professions are outside
this packet per the settlement ruling, with explicit later-expansion handoff
instead of hidden promises. Every-second-release capacity review measures LOW
phones and perf-tour evidence; it never automatically increases a budget.

Later day/week/season limits, ranks, votes, guest-book cap, dye channels and saved
layout quantities resolve from state's owned content rows and accepted schedule.
No new number is specified by these outlines. A later owner adds new English
keys through the same mechanic-first review before introducing a screen, appends
them to the tables below with its Owner column, and regenerates both manifests in
the same change (D92).

```text
shared family
    +-- ledger/list -> guild board -> reviewed contribution
    +-- map/marker  -> ward -> authorized visit
    +-- collection  -> showcase -> inspected entry -> vote
    +-- small sheet -> guest book -> closed reaction
    +-- build       -> typed surfaces -> dye/layout review
```

| NEW key | English value | Owner |
|---|---|---|
| hudChrome.housing.garden.title | Kitchen Garden | 24 |
| hudChrome.housing.garden.loading | Loading the garden... | 24 |
| hudChrome.housing.garden.empty | No garden beds are recorded. | 24 |
| hudChrome.housing.garden.live | Current garden | 24 |
| hudChrome.housing.garden.saved | Saved garden | 24 |
| hudChrome.housing.garden.mixed | Some beds use saved records. | 24 |
| hudChrome.housing.garden.incomplete | Some garden beds could not be loaded. | 24 |
| hudChrome.housing.garden.unavailable | The garden is unavailable right now. | 24 |
| hudChrome.housing.garden.openJournal | Open {journal} | 24 |
| hudChrome.housing.garden.liveTooltip | These beds use their owner's current garden records. | 24 |
| hudChrome.housing.garden.savedTooltip | These beds use saved garden records. Changes made elsewhere may not appear yet. | 24 |
| hudChrome.housing.garden.mixedTooltip | Some beds use current records and others use saved records. Changes made elsewhere may not appear yet. | 24 |
| hudChrome.housing.garden.savedStatus | {status} (saved) | 24 |
| hudChrome.housing.garden.savedReadyTooltip | This bed appears ready from saved garden records. Changes made elsewhere may not appear yet. | 24 |
| hudChrome.housing.garden.journalTooltip | Open your current character's {journal}. | 24 |
| hudChrome.housing.garden.growing | Growing | 24 |
| hudChrome.housing.garden.board | Harvest Journal board | 24 |
| hudChrome.housing.guild.title | Guildhall | 28 |
| hudChrome.housing.guild.fund | Hall Fund | 28 |
| hudChrome.housing.guild.projects | Hall Projects | 28 |
| hudChrome.housing.guild.contributions | Contributions | 28 |
| hudChrome.housing.guild.warTable | War Table | 28 |
| hudChrome.housing.guild.noRecords | Your guild has no records here yet. | 28 |
| hudChrome.housing.guild.officerRequired | A guild officer can manage this project. | 28 |
| hudChrome.housing.guild.ownPlinth | Your assigned trophy plinth | 28 |
| hudChrome.housing.guild.lockouts | Raid Lockouts | 30a |
| hudChrome.housing.guild.firstKills | First Kills | 30a |
| hudChrome.housing.guild.lockoutRow | {boss} ({difficulty}): {locked} of {online} online members are locked until the next reset. | 30a |
| hudChrome.housing.guild.ownLockoutRow | You are locked to {boss} ({difficulty}) until {resetAt}. | 30a |
| hudChrome.housing.guild.noLockouts | No online member is locked to a final boss right now. | 30a |
| hudChrome.housing.guild.firstKillsUnavailable | First kills are not recorded yet. | 30a |
| hudChrome.housing.guild.membersOnly | Only current members of this guild can read the hall boards. | 30a |
| hudChrome.housing.guild.boardLoading | Loading the board... | 30a |
| hudChrome.housing.guild.firstKillRow | {boss} ({difficulty}): first cleared by {character} on {day}. | 31 |
| hudChrome.housing.denied.guildPolicy | A Guildhall can be private, open to its guild or open to everyone. | 28 |
| hudChrome.housing.guild.fundBalance | Hall Fund balance: {balance} | 29 |
| hudChrome.housing.guild.payFromFund | Pay From the Hall Fund | 29 |
| hudChrome.housing.guild.reviewFundPayment | Review Hall Fund Payment | 29 |
| hudChrome.housing.guild.fundPaymentPending | Paying this week's Ledger from the Hall Fund... | 29 |
| hudChrome.housing.guild.fundPaid | This week's Ledger is paid from the Hall Fund. | 29 |
| hudChrome.housing.guild.donate | Donate | 29 |
| hudChrome.housing.guild.donateTitle | Donate to the Hall Fund | 29 |
| hudChrome.housing.guild.donateMaterials | Materials | 29 |
| hudChrome.housing.guild.donateGold | Gold | 29 |
| hudChrome.housing.guild.donateClaudium | Claudium | 29 |
| hudChrome.housing.guild.capReadout | This week: {used} of {cap} donated | 29 |
| hudChrome.housing.guild.capReached | You have reached this week's donation limit. | 29 |
| hudChrome.housing.guild.capResets | Your donation limit resets with the weekly reset. | 29 |
| hudChrome.housing.guild.donatePending | Sending your donation... | 29 |
| hudChrome.housing.guild.donated | Your donation is recorded. | 29 |
| hudChrome.housing.guild.contributionsEmpty | No contributions have been recorded yet. | 29 |
| hudChrome.housing.guild.contributionEntry | {name} gave {amount} on {date} | 29 |
| hudChrome.housing.guild.contributionsWindow | Contributions from the last {days} days | 29 |
| hudChrome.housing.guild.withdrawToBank | Withdraw to Guild Bank | 29 |
| hudChrome.housing.guild.withdrawConfirm | Move the Hall Fund's materials and gold to the guild bank? | 29 |
| hudChrome.housing.guild.withdrawPending | Moving the Hall Fund to the guild bank... | 29 |
| hudChrome.housing.guild.withdrawn | The Hall Fund's materials and gold are in the guild bank. | 29 |
| hudChrome.housing.guild.fundEmpty | The Hall Fund is empty. | 29 |
| hudChrome.housing.guild.conditionRate | A Guildhall wears twice as fast as a personal home. | 29 |
| hudChrome.housing.guild.chestMembersOnly | Only guild members can use the guild chest. | 30 |
| hudChrome.housing.guild.stationMembersOnly | Only guild members can use the hall's stations. | 30 |
| hudChrome.housing.guild.amenitiesPaused | Hall amenities are paused until the hall's condition is restored. | 30 |
| hudChrome.housing.ward.title | Neighborhood | 34 |
| hudChrome.housing.ward.endeavors | Neighborhood Endeavors | 35 |
| hudChrome.housing.ward.favor | Neighborhood Favor | 35 |
| hudChrome.housing.ward.roster | Neighborhood Roster | 34 |
| hudChrome.housing.ward.loading | Loading the neighborhood... | 34 |
| hudChrome.housing.ward.unavailable | The neighborhood roster is unavailable right now. | 34 |
| hudChrome.housing.ward.occupancy | {claimed} of {capacity} plots claimed | 34 |
| hudChrome.housing.ward.anchor | Guild anchor: {guild} | 34 |
| hudChrome.housing.ward.noAnchor | No guild anchors this neighborhood. | 34 |
| hudChrome.housing.ward.openGround | Open ground | 34 |
| hudChrome.housing.ward.door | Door of {owner} | 34 |
| hudChrome.housing.ward.privateDoor | A private home | 34 |
| hudChrome.housing.ward.move | Move Here | 34 |
| hudChrome.housing.ward.moveReview | Move your home to this neighborhood? Your plot and furnishings move with it. | 34 |
| hudChrome.housing.ward.movePending | Moving your home... | 34 |
| hudChrome.housing.ward.moved | Your home now stands in its new neighborhood. | 34 |
| hudChrome.housing.denied.wardFull | This neighborhood is full. Your home stays where it is. | 34 |
| hudChrome.housing.denied.wardBusy | This neighborhood is busy right now. Try again shortly. | 34 |
| hudChrome.housing.denied.wardSame | Your home is already in this neighborhood. | 34 |
| hudChrome.housing.ward.favorRank | Favor rank {rank} of {maximum} | 35 |
| hudChrome.housing.ward.favorCapacity | Permanent decor bonus: +{count} | 35 |
| hudChrome.housing.ward.favorTooltip | Favor comes from paying your Ledger on time, from distinct neighbors visiting, and from completed Endeavors. It never decays and never drops when your home moves. | 35 |
| hudChrome.housing.ward.endeavorMonth | Endeavors for {month} | 35 |
| hudChrome.housing.ward.endeavorProgress | {current} of {goal} | 35 |
| hudChrome.housing.ward.endeavorComplete | Complete | 35 |
| hudChrome.housing.ward.endeavorReward | Reward: {reward} | 35 |
| hudChrome.housing.ward.endeavorRewardHidden | The reward is revealed when this Endeavor is complete. | 35 |
| hudChrome.housing.ward.endeavorsEmpty | No Endeavors are running this month. | 35 |
| hudChrome.housing.ward.endeavorsLoading | Loading Endeavors... | 35 |
| hudChrome.housing.ward.endeavorsUnavailable | Endeavors are unavailable right now. Your Favor is unchanged. | 35 |
| hudChrome.housing.ward.endeavorsReset | Progress resets on {date}. | 35 |
| hudChrome.housing.showcase.title | Home Showcase | 36 |
| hudChrome.housing.showcase.enter | Enter Your Home | 36 |
| hudChrome.housing.showcase.consent | Make this home's approved public display visible in the Showcase? | 36 |
| hudChrome.housing.showcase.vote | Vote for This Home | 36 |
| hudChrome.housing.showcase.noEntries | No homes have entered this Showcase yet. | 36 |
| hudChrome.housing.showcase.voted | Your vote is recorded. | 36 |
| hudChrome.housing.showcase.seasonClosed | This Showcase season is closed. The next season opens on {date}. | 36 |
| hudChrome.housing.showcase.seasonLocked | Voting is locked while results are counted. | 36 |
| hudChrome.housing.showcase.voteUsed | You have already voted this season. | 36 |
| hudChrome.housing.showcase.ownEntry | You cannot vote for your own home. | 36 |
| hudChrome.housing.showcase.loading | Loading the Showcase... | 36 |
| hudChrome.housing.guestBook.title | Guest Book | 36 |
| hudChrome.housing.guestBook.empty | Leave a friendly reaction for the owner. | 36 |
| hudChrome.housing.guestBook.wave | Wave | 36 |
| hudChrome.housing.guestBook.cheer | Cheer | 36 |
| hudChrome.housing.guestBook.admire | Admire | 36 |
| hudChrome.housing.guestBook.recorded | Your reaction is recorded. | 36 |
| hudChrome.housing.guestBook.used | You have already left a reaction here today. | 36 |
| hudChrome.housing.guestBook.loading | Loading the guest book... | 36 |
| hudChrome.housing.layouts.title | Layouts | 41a |
| hudChrome.housing.layouts.save | Save Layout | 41a |
| hudChrome.housing.layouts.load | Load Layout | 41a |
| hudChrome.housing.layouts.share | Share Layout | 41a |
| hudChrome.housing.layouts.review | Review Layout Changes | 41a |
| hudChrome.housing.layouts.shortfall | You need {count} more of {item} for this layout. | 41a |
| hudChrome.housing.layouts.empty | You have no saved layouts yet. | 41a |
| hudChrome.housing.layouts.nameLabel | Layout name | 41a |
| hudChrome.housing.layouts.slotsFull | All {count} layout slots are in use. Replace one to save. | 41a |
| hudChrome.housing.layouts.overwrite | Replace the saved layout {name}? | 41a |
| hudChrome.housing.layouts.saved | Your layout is saved. | 41a |
| hudChrome.housing.layouts.codeLabel | Share code | 41a |
| hudChrome.housing.layouts.copyCode | Copy Code | 41a |
| hudChrome.housing.layouts.pasteCode | Paste a share code | 41a |
| hudChrome.housing.layouts.importReview | Review this shared layout before applying it. | 41a |
| hudChrome.housing.layouts.displaced | {item} will move to {destination}. | 41a |
| hudChrome.housing.layouts.dyeShortfall | You need {count} more {dye} for this layout. | 41a |
| hudChrome.housing.layouts.applied | Your layout is applied. | 41a |
| hudChrome.housing.denied.layoutCode | This share code is not valid. | 41a |
| hudChrome.housing.dyes.title | Dye Station | 41 |
| hudChrome.housing.dyes.apply | Apply Dye | 41 |
| hudChrome.housing.dyes.review | Review Dye Use | 41 |
| hudChrome.housing.dyes.loading | Loading dyes... | 41 |
| hudChrome.housing.dyes.channelPrimary | Primary | 41 |
| hudChrome.housing.dyes.channelAccent | Accent | 41 |
| hudChrome.housing.dyes.noDye | No dye | 41 |
| hudChrome.housing.dyes.unchanged | No change. Nothing is used. | 41 |
| hudChrome.housing.dyes.swatchAria | {dye}: {count} in bags | 41 |
| hudChrome.housing.dyes.reviewLine | Use {count} {dye} on {furnishing}. | 41 |
| hudChrome.housing.dyes.pending | Applying dye... | 41 |
| hudChrome.housing.dyes.stationTooltip | Dyes are applied at this home's apothecary station while the home is at {threshold} condition or higher. Placing, moving and removing furnishings never need it. | 41 |
| hudChrome.housing.denied.dyeStation | Dyeing needs an apothecary station in this home. | 41 |
| hudChrome.housing.denied.dyeRange | Stand closer to the apothecary station to dye. | 41 |
| hudChrome.housing.denied.dyeShortfall | You do not have enough {dye}. | 41 |
| hudChrome.housing.denied.dyeChannel | This furnishing cannot be dyed. | 41 |
| hudChrome.housing.deed.title | Optional Freehold Deed | 38 |
| hudChrome.housing.deed.mint | Mint Freehold Deed | 38 |
| hudChrome.housing.deed.homesTab | Homes | 38 |
| hudChrome.housing.deed.list | List This Home | 38 |
| hudChrome.housing.deed.cancelListing | Cancel Listing | 38 |
| hudChrome.housing.deed.buy | Buy This Home | 38 |
| hudChrome.housing.deed.confirmSale | Confirm Sale | 38 |
| hudChrome.housing.deed.included | These items transfer with the home: {count} | 38 |
| hudChrome.housing.deed.retained | These items stay with you: {count} | 38 |
| hudChrome.housing.deed.minted | Your Freehold Deed is minted. | 38 |
| hudChrome.housing.deed.listed | Your home is listed. Its contents are locked until the sale settles or you cancel. | 38 |
| hudChrome.housing.deed.sold | Your home is sold. Your Inn Room is ready. | 38 |
| hudChrome.housing.deed.received | Your new home is ready. | 38 |
| hudChrome.housing.deed.noListings | No homes are listed right now. | 38 |
| hudChrome.housing.deed.stepUp | Sign with your linked wallet to continue. | 38 |
| hudChrome.housing.deed.flairAria | Freehold Deed holder flair | 38 |
| hudChrome.housing.denied.deedBuyerCapacity | You do not have a free home slot for this purchase. | 38 |
| hudChrome.housing.deed.description | Create an optional record for this Freehold through the approved service. Your game access does not require this record. | 38 |
| hudChrome.housing.deed.saleReview | Review the home and furnishings included in this sale. | 38 |
| hudChrome.housing.deed.includedHeading | Included in the sale | 38 |
| hudChrome.housing.deed.retainedHeading | Staying with you | 38 |
| hudChrome.housing.deed.custody | Your personal trophy records and excluded belongings remain yours. The sale proceeds only when their safe storage is confirmed. | 38 |
| hudChrome.housing.deed.custodyUnavailable | Your excluded belongings need safe storage before this sale can proceed. | 38 |
| hudChrome.housing.deed.conditionCredits | The home's condition is recorded through the transfer time. Existing prepayment credits keep their original terms. Account return grace does not transfer. | 38 |
| hudChrome.housing.deed.salePending | This sale is being confirmed. Its request reference is saved. | 38 |
| hudChrome.housing.deed.requestPending | This request is being confirmed. Your request reference is saved. | 38 |
| hudChrome.housing.deed.supportRecovery | This request needs a support review. Your home records and belongings are preserved. | 38 |
| hudChrome.housing.deed.noPricePromise | A listing does not guarantee a buyer or a future price. | 38 |

The deed.* rows ship dormant on denied distributions under D86 and are the one
namespace 38 registers in 14's tests/freehold_store_gates.test.ts web-only
allowlist; apiError.freehold.deed.buyer_capacity and apiError.freehold.second_plot_cap
mirror their English in api_error.ts and are protocol leaves, not manifest keys
(there is no second-home upgrade refusal and no key for one, D93). The deed modules
are src/ui/deed_card_view.ts and deed_card_window.ts (38).

## 11. Exact screenshot registry and fixture contract

### Functional gate and safe landing (06)

06 registers `scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets` in
`scripts/pr_shot_targets.mjs`. Its three targets each have desktop, compact and
tablet variants: nine registry variants, eighteen files when the runner captures
before and after. The filename identities are `freehold-gate-{view}`,
`freehold-inn-{view}` and `freehold-cottage-{view}`, with the normal before/after
prefix. Before/after is evidence identity, not another registry variant.

```js
const freeholdFunctionalTargets = [
  { key: 'freehold-gate', scene: 'gate-own-prompt' },
  { key: 'freehold-inn', scene: 'inn-safe-landing' },
  { key: 'freehold-cottage', scene: 'cottage-safe-landing' },
];
const freeholdFunctionalVariants = [
  { key: 'desktop', width: 1600, height: 900, mobile: false },
  { key: 'compact', width: 874, height: 402, mobile: true },
  { key: 'tablet', width: 1180, height: 820, mobile: true },
].map((view) => ({ ...view, viewport: { width: view.width, height: view.height } }));
```

Each capture stages one real state through the movement/entry route and returns
one region. The gate shows the own-home prompt without a proximity teleport;
Inn/Cottage show the accepted authoritative safe landing and usable exit. The
release baseline has no gate or owner room: `PR_SHOTS_FREEHOLD_BASELINE=1` captures
its real gate site for each prior state, explicitly recording the absent surface.
These LOW classic captures prove functional geometry, prompt and landing. They
do not prove 09 day/night lighting, first-tier camera, welcome, sampled audio,
placement UI or physical-device performance. Those later scenes remain separately
owned below. The functional helper's real low seed and viewport/CDP dimensions
remain its capture authority; the planned constructor below belongs to 09.

### Registry ownership and one-shot semantics

The following shared housing symbols remain planned APIs, alongside the working
06 functional helper above. File 09 introduces
scripts/lib/pr_shot_housing.mjs and its housingReviewTargets export with only the
functional interior subset. File 11 extends that same build descriptor; 16/17/18
append their functional targets. There is one descriptor per target key, never
parallel interior and build descriptors with a duplicate key. The existing scripts/pr_shot_targets.mjs receives
this import/spread beside the 06 functional targets in TARGETS. Every capture(page, variant) returns one
region and the runner writes exactly one image with that target/variant key.
A capture callback cannot emit a sequence by changing state several times before
returning. Pending, refused, cancelled and reconnected are separate uniquely
keyed variants, each staged and asserted independently. Do not change that API.

```js
import { housingReviewTargets, isHousingVisualPath } from './lib/pr_shot_housing.mjs';

// In TARGETS:
...housingReviewTargets({
  beforeLoad: lowGraphicsSeed,
  dismissOverlays: dismissEntryOverlays,
}),
```

Registration is cumulative by actual producer: file 06 registers nine functional
gate/landing variants; file 09 adds twelve day/night interiors (21 total); file 11 extends the registry to 98; file 16 reaches 187; file
17 reaches 235; file 18 reaches 339. File 20 verifies the complete 339-variant wave A
inventory. Later waves register by producer in the same way, through the
housingLaterRegistrations list below, each regenerating ux-shot-manifest.json in its
own change with every cited count updated and each wave close verifying the union:
file 21 reaches 357; file 23 reaches 366; file 24 reaches 408; file 25 reaches 446;
file 26 reaches 464; file 30 reaches 502; file 30a reaches 520; file 31 reaches 526;
file 34 reaches 544; file 35 reaches 562; file 36 reaches 604; file 38 reaches 648;
file 40 reaches 663; file 41 reaches 681; file 41a reaches 705; file 42 reaches 742.
The complete registry therefore expands to 742 variants, and the owner of every
planned housing variant is reproducible from housingVariantOwner below; the
functional freehold targets are owned by 06. Each owner is recorded in the manifest's
owner field. Earlier files require only their registered working subset, never
nonfunctional future UI. These are derived inventory counts, not new gameplay or
tuning values.

The exact constructor below is nested in housingReviewTargets. Everything it
names besides supplied beforeLoad is NEW helper-owned fixture metadata/function,
not an existing production API. housingSeedVariant applies the requested theme,
media/accessibility, input, distribution and light-profile fixture through the
real supported seams; it does not patch DOM or renderer output after rendering.
Its implementation has explicit scenario/option exhaustiveness tests. The output
key includes every identity dimension, and the inventory test rejects duplicate
keys or a declared matrix state without a variant.

```js
const housingInteriorScenes = [
  'interior-inn-day', 'interior-inn-night',
  'interior-cottage-day', 'interior-cottage-night',
];
const housingViews = [
  { key: 'desktop', width: 1600, height: 900, mobile: false },
  { key: 'compact', width: 874, height: 402, mobile: true },
  { key: 'tablet', width: 1180, height: 820, mobile: true },
];

function housingVariants(scenes, options = {}) {
  const {
    views = housingViews, theme = 'classic', graphics = 'low',
    motion = 'normal', input = 'pointer', surface = 'web',
    light = 'normal', forcedColors = 'none',
  } = options;
  return scenes.flatMap((scene) => views.map((view) => ({
    key: [scene, view.key, theme, graphics, motion, input, surface, light,
      forcedColors].join('-'),
    scene, view: view.key, theme, graphics, motion, input, surface, light,
    forcedColors,
    ...(view.mobile ? {
      mobile: true, viewport: { width: view.width, height: view.height },
    } : {}),
    async beforeLoad(page) {
      if (!view.mobile) {
        await page.setViewport({ width: view.width, height: view.height });
      }
      await beforeLoad(page);
      await housingSeedVariant(page, {
        scene, view: view.key, theme, graphics, motion, input, surface, light,
        forcedColors,
      });
    },
  })));
}

const housingDesktop = housingViews.filter((view) => view.key === 'desktop');
const housingDeniedSurfaces = [
  'ios-app-store', 'google-play', 'steam', 'epic', 'seeker', 'unknown',
];
```

The desktop dimensions and compact/tablet viewports are state "UX screenshot
viewports". Baseline compact/tablet capture uses Chromium with the default iPhone
user agent and iOS graphics-profile emulation, not Android, Safari or a physical
device. An Android claim requires an explicit userAgent/profile variant and its
assertions; this baseline makes no such claim. Desktop is explicitly set in beforeLoad because a viewport field
alone is ignored by this runner's non-mobile branch. The supplied low seed sets
graphicsPreset=1 and graphicsDefaultApplied=true (state "UX screenshot low seed").
Then housingSeedVariant explicitly seeds its theme and any intentional graphics
override, preserving the default-applied contract. It maps fixture surface labels
to the real typed distribution verdict, not to a guessed current enum spelling.
For phone graphics-profile fixtures it uses the existing touch emulation and
actual iOS profile flag, verified in the rendered state. It composes with shared
setting/fixture seams, never assumes an undocumented storage key or environment
variable. Touch tier checks include viewport and CDP screen metrics through the
existing harness helpers. Engine/profile evidence is stated separately below.

NEW housingVisualWhen is the shared truthful path inventory, taken from the completed
packet content/art manifest. Renderer/exporter/public art prefixes below are
owned by 09/19 and the content owners; they are NEW planned housing paths, not
claims that generated art already exists. The packet art brief itself now exists
and remains a required valid link before publication.

```js
const housingVisualWhen = [
  'src/render/freehold/furnishings.ts',
  'src/render/freehold/furnishing_layout_core.ts',
  'src/render/freehold/furnishing_models.ts',
  'src/render/freehold/furnishing_ghost_visual.ts',
  'src/render/freehold/interior_dressing.ts',
  'src/render/freehold/freehold_light_grade.ts',
  'src/sim/content/freehold/layouts.ts',
  'src/sim/content/freehold/furnishings.ts',
  'scripts/assets/freehold_basics/',
  'scripts/assets/freehold_crafted/',
  'scripts/assets/freehold_dressing/',
  'scripts/assets/freehold_trophies/',
  'scripts/assets/specs/freehold_basics.json',
  'scripts/assets/specs/freehold_crafted.json',
  'scripts/assets/specs/freehold_dressing.json',
  'scripts/assets/specs/freehold_trophies.json',
  'public/models/props/freehold_',
  'public/ui/items/freehold_',
  'public/ui/items/pattern_freehold_',
  'public/ui/items/mapping.json',
  'src/render/assets/manifest.generated.ts',
  'docs/freeholds/art/',
  'src/styles/components.css',
  'src/styles/hud.css',
  'src/styles/hud.mobile.css',
  'scripts/lib/pr_shot_housing.mjs',
  'scripts/lib/pr_shot_freeholds.mjs',
  'scripts/freehold_interior_route.mjs',
  'src/ui/hud/housing/',
  'src/sim/freehold/',
];
```

The exact descriptors returned by housingReviewTargets are below. Each
captureHousing* is a NEW helper-private function that stages one scene, asserts
its final state, and returns one optional-clip result. UI scene callbacks return
{ clip: '#ui' }; the interior callback/delegate returns {} for the full viewport.
Missing required after-state throws. Never skip required work, fake success with a hidden node, or write
screenshots from inside the callback to evade the runner's image manifest.

```js
{
  key: 'housing-build-mode',
  label: 'Housing palette, placement, camera and capacity',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/build_mode_',
    'src/ui/hud/housing/furnishing_palette_',
    'src/ui/hud/housing/capacity_meter_view.ts',
    'src/ui/hud/housing/build_input_core.ts',
    'src/game/build_mode_wiring.ts',
    'src/game/freehold_build_camera.ts',
    'src/sim/freehold/layout_core.ts',
    'src/sim/freehold/placement.ts',
  ],
  variants: [
    ...housingVariants([
      ...housingInteriorScenes,
      'build-empty', 'build-ready', 'build-blocked', 'build-decor-full', 'build-plinth-full',
      'build-amenity-full', 'build-placed-selected', 'build-move-preview',
      'build-remove-review', 'build-remove-refused', 'build-history-confirmed',
      'build-history-undone', 'build-history-redone', 'build-history-stale',
      'build-pending', 'build-refused', 'build-reconnect',
    ]),
    ...housingVariants(['build-blocked'], { theme: 'parchment' }),
    ...housingVariants(['build-blocked'], { theme: 'highContrast' }),
    ...housingVariants(['build-blocked'], { forcedColors: 'active' }),
    ...housingVariants(['build-blocked'], { motion: 'reduce' }),
    ...housingVariants(['build-ready'], { graphics: 'high' }),
    ...housingVariants(['build-blocked'], { light: 'ios-effective-one' }),
    ...housingVariants(['build-keyboard-focused'], { input: 'keyboard' }),
    ...housingVariants(['build-pad-placement'], { input: 'gamepad' }),
    ...housingVariants(['build-touch-controls'], { input: 'touch',
      views: housingViews.filter((view) => view.mobile) }),
  ],
  capture: captureHousingBuild,
},
{
  key: 'housing-steward-store',
  label: 'Steward material sources and permitted Charter surfaces',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/steward_panel_',
    'src/ui/charter_store_view.ts',
    'src/ui/woc_store_view.ts',
    'src/ui/daily_rewards_window.ts',
    'src/game/distribution_surfaces.ts',
    'src/sim/freehold/condition_core.ts',
    'src/sim/freehold/ledger_core.ts',
  ],
  variants: [
    ...housingVariants([
      'steward-bags', 'steward-vault', 'steward-automatic',
      'steward-vault-unavailable', 'steward-prepay-review',
      'steward-condition-30', 'steward-condition-29', 'steward-inn',
      'steward-pending', 'steward-refused', 'steward-reconnect',
      'charter-ready', 'charter-pending', 'charter-cancelled',
      'charter-reconciling', 'charter-reconciled',
      'charter-quote-unavailable', 'charter-quote-expired',
    ]),
    ...housingVariants(['charter-ready', 'charter-reconciled'], {
      surface: 'website-desktop', views: housingDesktop,
    }),
    ...housingDeniedSurfaces.flatMap((surface) =>
      housingVariants(['charter-denied'], { surface })),
    ...housingVariants(['steward-condition-29'], { theme: 'parchment' }),
    ...housingVariants(['steward-condition-29'], { theme: 'highContrast' }),
    ...housingVariants(['steward-condition-29'], { forcedColors: 'active' }),
    ...housingVariants(['steward-condition-29'], { motion: 'reduce' }),
    ...housingVariants(['steward-prepay-review'], { input: 'keyboard' }),
  ],
  capture: captureHousingStewardStore,
},
{
  key: 'housing-trophies',
  label: 'Trophy ownership, silhouettes, provenance and plinths',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/trophy_',
    'src/ui/hud/housing/furnishing_palette_',
    'src/sim/freehold/trophies.ts',
    'src/sim/freehold/trophy_eligibility.ts',
    'src/sim/content/freehold/trophies.ts',
  ],
  variants: [
    ...housingVariants([
      'trophies-owned', 'trophies-unearned-known', 'trophies-hidden',
      'trophies-provenance-known', 'trophies-provenance-unknown',
      'trophies-maker', 'trophies-possession-inactive',
      'trophies-plinth-preview', 'trophies-replace-review',
      'trophies-clear-review', 'trophies-refreshing',
    ]),
    ...housingVariants(['trophies-provenance-known'], { theme: 'parchment' }),
    ...housingVariants(['trophies-provenance-known'], { theme: 'highContrast' }),
    ...housingVariants(['trophies-provenance-known'], { forcedColors: 'active' }),
    ...housingVariants(['trophies-provenance-known'], { motion: 'reduce' }),
    ...housingVariants(['trophies-grid-focused'], { input: 'keyboard' }),
  ],
  capture: captureHousingTrophies,
},
{
  key: 'housing-visiting',
  label: 'Housing gate, arrival and owner/guest entry states',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/visit_prompt_',
    'src/ui/hud/housing/housing_view.ts',
    'src/ui/hud/housing/steward_panel_',
    'src/sim/freehold/gate.ts',
    'src/sim/freehold/visiting.ts',
    'src/game/teleport_camera.ts',
  ],
  variants: [
    ...housingVariants([
      'gate-own-choice', 'gate-friend-empty', 'gate-lookup-pending',
      'gate-lookup-ready', 'gate-lookup-stale', 'gate-lookup-refused',
      'arrival-inn', 'arrival-cottage', 'arrival-ordinary-return',
      'arrival-visitor', 'arrival-online-delayed-cosmetics',
      'visit-read-only', 'visit-owner-away', 'visit-owner-building',
      'visit-full', 'visit-private-refused', 'visit-policy-draft',
      'visit-policy-pending', 'visit-policy-saved', 'visit-policy-refused',
      'visit-end-review', 'visit-end-pending', 'visit-end-succeeded',
      'visit-revoked', 'entry-pending', 'entry-error', 'entry-busy',
    ]),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { motion: 'reduce' }),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { light: 'ios-effective-one' }),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { graphics: 'high' }),
    ...housingVariants(['gate-lookup-ready'], { input: 'keyboard' }),
    ...housingVariants(['portrait-rotation-gate'], {
      views: housingViews.filter((view) => view.mobile).map((view) => ({
        ...view, key: `${view.key}-portrait`, width: view.height, height: view.width,
      })),
    }),
  ],
  capture: captureHousingVisiting,
},
```

Wave A ownership is by target, with the four interior scenes owned by 09; every
later registration names its owner. The owner of any variant is:

```js
const housingWaveAOwners = {
  'housing-build-mode': '11', 'housing-steward-store': '16',
  'housing-trophies': '17', 'housing-visiting': '18',
};

function housingVariantOwner(target, scene) {
  if (housingInteriorScenes.includes(scene)) return '09';
  const later = housingLaterRegistrations.find((entry) =>
    entry.target === target && entry.scenes.includes(scene));
  return later ? later.owner : housingWaveAOwners[target];
}
```

Later producers append to an existing target or register a new one through this
list; each entry's `scenes` is the exact scene set that producer owns, and the
`variants` expansion uses the same constructor. New targets carry their own
`label`, `when` and NEW capture callback; appends carry only `variants`. Scene ids
below the wave A set are fixed here so the wave closes compare exact manifests.

```js
const housingGardenStates = [
  'live', 'saved', 'mixed', 'incomplete', 'unavailable', 'empty', 'loading',
];
const housingGardenScenes = housingGardenStates.flatMap((state) =>
  ['owner', 'guest'].map((role) => `garden-${state}-${role}`));

const housingLaterRegistrations = [
  { target: 'housing-steward-store', owner: '21',
    scenes: ['steward-upgrade-preview', 'steward-upgrade-partial',
      'steward-upgrade-fee-due', 'steward-upgrade-ready',
      'steward-upgrade-bags-full', 'steward-upgrade-complete'],
    variants: housingVariants(['steward-upgrade-preview', 'steward-upgrade-partial',
      'steward-upgrade-fee-due', 'steward-upgrade-ready',
      'steward-upgrade-bags-full', 'steward-upgrade-complete']) },
  { target: 'housing-trophies', owner: '23',
    scenes: ['trophies-finish-silver', 'trophies-finish-gilded', 'trophies-dulled-29'],
    variants: housingVariants(['trophies-finish-silver', 'trophies-finish-gilded',
      'trophies-dulled-29']) },
  { target: 'housing-garden', owner: '24',
    label: 'Kitchen Garden tableau, freshness and guest privacy',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/garden_view.ts',
      'src/render/freehold/garden_tableau.ts',
      'server/freehold_account_sources.ts',
      'src/ui/hud/housing/garden_',
    ],
    scenes: housingGardenScenes,
    variants: housingVariants(housingGardenScenes),
    capture: 'captureHousingGarden' },
  { target: 'housing-build-advanced', owner: '25',
    label: 'Typed surfaces, parent moves and free placement',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/layout_core.ts',
      'src/sim/freehold/placement.ts',
      'src/ui/hud/housing/build_mode_',
      'src/ui/hud/housing/build_input_core.ts',
      'src/render/freehold/furnishing_ghost_visual.ts',
    ],
    scenes: ['build-wall-placement', 'build-table-placement', 'build-ceiling-placement',
      'build-host-move-preview', 'build-child-blocked', 'build-surface-meter',
      'build-free-yaw', 'build-snap-mode', 'build-advanced-visitor'],
    variants: [
      ...housingVariants([
        'build-wall-placement', 'build-table-placement', 'build-ceiling-placement',
        'build-host-move-preview', 'build-child-blocked', 'build-surface-meter',
        'build-free-yaw', 'build-snap-mode', 'build-advanced-visitor',
      ]),
      ...housingVariants(['build-child-blocked'], { motion: 'reduce' }),
      ...housingVariants(['build-wall-placement'], { input: 'keyboard' }),
      ...housingVariants(['build-table-placement'], { input: 'gamepad' }),
      ...housingVariants(['build-free-yaw'], { input: 'touch',
        views: housingViews.filter((view) => view.mobile) }),
    ],
    capture: 'captureHousingBuildAdvanced' },
  { target: 'housing-visiting', owner: '26',
    scenes: ['open-house-list-empty', 'open-house-list-ready', 'open-house-list-error',
      'open-house-knock-sent', 'open-house-knock-wait', 'visit-public-full'],
    variants: housingVariants(['open-house-list-empty', 'open-house-list-ready',
      'open-house-list-error', 'open-house-knock-sent', 'open-house-knock-wait',
      'visit-public-full']) },
  { target: 'housing-hall-amenities', owner: '30',
    label: 'Guild chest, long table and hall stations',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/amenities.ts',
      'src/sim/freehold/permissions.ts',
      'src/sim/professions/stations.ts',
      'src/ui/bank_window.ts',
      'src/ui/guild_bank_window.ts',
    ],
    scenes: ['hall-chest-leader', 'hall-chest-officer', 'hall-chest-member',
      'hall-chest-guest', 'hall-chest-locked', 'hall-station-member',
      'hall-station-guest', 'hall-station-locked', 'hall-feast-table',
      'hall-feast-active'],
    variants: [
      ...housingVariants([
        'hall-chest-leader', 'hall-chest-officer', 'hall-chest-member',
        'hall-chest-guest', 'hall-chest-locked', 'hall-station-member',
        'hall-station-guest', 'hall-station-locked', 'hall-feast-table',
        'hall-feast-active',
      ]),
      ...housingVariants(['hall-chest-member'], { motion: 'reduce' }),
      ...housingVariants(['hall-chest-officer'], { input: 'keyboard' }),
      ...housingVariants(['hall-station-member'], { input: 'touch',
        views: housingViews.filter((view) => view.mobile) }),
    ],
    capture: 'captureHousingHallAmenities' },
  { target: 'housing-war-table', owner: '30a',
    label: 'Hall boards, War table lockouts and first kills',
    when: [
      ...housingVisualWhen,
      'src/ui/hud/housing/war_table_',
      'src/ui/hud/housing/hall_boards_',
      'server/guild_hall_boards.ts',
    ],
    scenes: ['hall-boards-roster', 'hall-boards-calendar', 'hall-boards-pledge',
      'hall-boards-members-only', 'war-table-lockouts',
      'war-table-first-kills-unavailable'],
    variants: housingVariants(['hall-boards-roster', 'hall-boards-calendar',
      'hall-boards-pledge', 'hall-boards-members-only', 'war-table-lockouts',
      'war-table-first-kills-unavailable']),
    capture: 'captureHousingWarTable' },
  { target: 'housing-war-table', owner: '31',
    scenes: ['war-table-first-kills-ready', 'war-table-first-kills-empty'],
    variants: housingVariants(['war-table-first-kills-ready',
      'war-table-first-kills-empty']) },
  { target: 'housing-ward', owner: '34',
    label: 'Neighborhood square, exteriors, roster and moves',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/ward_core.ts',
      'src/sim/freehold/wards.ts',
      'src/render/freehold/ward_exteriors.ts',
      'src/net/ward_wire.ts',
      'src/ui/hud/housing/ward_',
    ],
    scenes: ['ward-square', 'ward-exterior', 'ward-roster', 'ward-busy-cap',
      'ward-door', 'ward-move-review'],
    variants: housingVariants(['ward-square', 'ward-exterior', 'ward-roster',
      'ward-busy-cap', 'ward-door', 'ward-move-review']),
    capture: 'captureHousingWard' },
  { target: 'housing-ward', owner: '35',
    scenes: ['ward-endeavors-loading', 'ward-endeavors-empty',
      'ward-endeavor-in-progress', 'ward-endeavor-complete',
      'ward-endeavor-hidden-reward', 'ward-endeavors-unavailable'],
    variants: housingVariants(['ward-endeavors-loading', 'ward-endeavors-empty',
      'ward-endeavor-in-progress', 'ward-endeavor-complete',
      'ward-endeavor-hidden-reward', 'ward-endeavors-unavailable']) },
  { target: 'housing-showcase', owner: '36',
    label: 'Home Showcase entries, consent and votes',
    when: [
      ...housingVisualWhen,
      'src/ui/hud/housing/showcase_',
      'server/freehold_showcase',
    ],
    scenes: ['showcase-consent', 'showcase-list', 'showcase-voted',
      'showcase-vote-used', 'showcase-season-closed', 'showcase-season-locked',
      'showcase-empty', 'showcase-loading', 'showcase-error'],
    variants: housingVariants(['showcase-consent', 'showcase-list', 'showcase-voted',
      'showcase-vote-used', 'showcase-season-closed', 'showcase-season-locked',
      'showcase-empty', 'showcase-loading', 'showcase-error']),
    capture: 'captureHousingShowcase' },
  { target: 'housing-guest-book', owner: '36',
    label: 'Guest book reactions and daily limit',
    when: [
      ...housingVisualWhen,
      'src/ui/hud/housing/guest_book_',
      'server/freehold_guest_book',
    ],
    scenes: ['guest-book-empty', 'guest-book-reactions', 'guest-book-recorded',
      'guest-book-used', 'guest-book-denied'],
    variants: housingVariants(['guest-book-empty', 'guest-book-reactions',
      'guest-book-recorded', 'guest-book-used', 'guest-book-denied']),
    capture: 'captureHousingGuestBook' },
  { target: 'housing-deed', owner: '38',
    label: 'Optional Freehold Deed card, Homes tab and furnished-sale states',
    when: [
      ...housingVisualWhen,
      'src/ui/deed_card_',
      'src/game/distribution_surfaces.ts',
      'server/freehold_deed',
    ],
    scenes: ['deed-card', 'deed-homes-tab', 'deed-contents-review', 'deed-step-up',
      'deed-listed', 'deed-sold', 'deed-received', 'deed-buyer-capacity',
      'deed-denied'],
    variants: [
      ...housingVariants(['deed-card', 'deed-homes-tab', 'deed-contents-review',
        'deed-step-up', 'deed-listed', 'deed-sold', 'deed-received',
        'deed-buyer-capacity']),
      ...housingVariants(['deed-card', 'deed-homes-tab'], {
        surface: 'website-desktop', views: housingDesktop,
      }),
      ...housingDeniedSurfaces.flatMap((surface) =>
        housingVariants(['deed-denied'], { surface })),
    ],
    capture: 'captureHousingDeed' },
  { target: 'housing-steward-store', owner: '40',
    scenes: ['steward-requirements-met', 'steward-requirements-unmet',
      'steward-guild-clear-unmet', 'steward-overflow-review', 'steward-overflow-none'],
    variants: housingVariants(['steward-requirements-met', 'steward-requirements-unmet',
      'steward-guild-clear-unmet', 'steward-overflow-review',
      'steward-overflow-none']) },
  { target: 'housing-dyes', owner: '41',
    label: 'Dye picker, apothecary gate and shortfalls',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/dye.ts',
      'src/sim/content/freehold/dyes.ts',
      'src/ui/hud/housing/dye_',
    ],
    scenes: ['dyes-picker', 'dyes-station-locked', 'dyes-station-unlocked',
      'dyes-shortfall'],
    variants: [
      ...housingVariants(['dyes-picker', 'dyes-station-locked',
        'dyes-station-unlocked', 'dyes-shortfall']),
      ...housingVariants(['dyes-picker'], { graphics: 'high' }),
      ...housingVariants(['dyes-picker'], { motion: 'reduce' }),
    ],
    capture: 'captureHousingDyes' },
  { target: 'housing-layouts', owner: '41a',
    label: 'Saved layouts, share codes and import review',
    when: [
      ...housingVisualWhen,
      'src/sim/freehold/layout_share_core.ts',
      'src/ui/hud/housing/layouts_',
      'server/freehold_layout_saves_db.ts',
    ],
    scenes: ['layouts-empty', 'layouts-saved', 'layouts-overwrite',
      'layouts-import-review', 'layouts-shortfall', 'layouts-dye-shortfall',
      'layouts-displaced', 'layouts-stale'],
    variants: housingVariants(['layouts-empty', 'layouts-saved', 'layouts-overwrite',
      'layouts-import-review', 'layouts-shortfall', 'layouts-dye-shortfall',
      'layouts-displaced', 'layouts-stale']),
    capture: 'captureHousingLayouts' },
  { target: 'housing-second-home', owner: '42',
    label: 'Second home tabs, destination and second Charter',
    when: [
      ...housingVisualWhen,
      'src/ui/hud/housing/steward_panel_',
      'src/ui/charter_store_view.ts',
      'src/sim/freehold/second_plot.ts',
    ],
    scenes: ['second-home-primary-tab', 'second-home-second-tab',
      'second-home-hearth-destination', 'second-home-card', 'second-home-owned',
      'second-home-bill', 'second-home-denied'],
    variants: [
      ...housingVariants(['second-home-primary-tab', 'second-home-second-tab',
        'second-home-hearth-destination', 'second-home-card', 'second-home-owned',
        'second-home-bill']),
      ...housingVariants(['second-home-card'], {
        surface: 'website-desktop', views: housingDesktop,
      }),
      ...housingDeniedSurfaces.flatMap((surface) =>
        housingVariants(['second-home-denied'], { surface })),
    ],
    capture: 'captureHousingSecondHome' },
];
```

Capture names in that list are the NEW helper-private callbacks each producer
adds beside captureHousing* above; the manifest generator only expands variants.
The generic states each scene stages are in section 12's later-wave table. The
`when` paths of the later targets are NEW planned module prefixes the producing
phase creates; a producer that lands a different basename updates the entry and
regenerates the manifest in that same change.

File 09 initially registers exactly the following descriptor instead of the later
build descriptor above. It uses the same constructor, shared when inventory and
target key. No other housing target is registered in 09. File 11 replaces this one
descriptor's variants/capture with the extended build definition above; it does
not append a duplicate target.

```js
{
  key: 'housing-build-mode',
  label: 'Housing interior day and night',
  when: [...housingVisualWhen],
  variants: housingVariants(housingInteriorScenes),
  capture: captureHousingInterior,
},
```

The exact callback uses NEW 09-owned fixture/assertion functions in that shared
helper and the actual runner's optional-clip return contract:

```js
async function captureHousingInterior(page, variant) {
  await prepareHousingInteriorFixture(page, variant);
  await assertHousingInteriorFixture(page, variant);
  return {}; // Full viewport; the runner writes one image after this returns.
}
// In 11's captureHousingBuild, before the build-only fixture path:
if (housingInteriorScenes.includes(variant.scene)) {
  return captureHousingInterior(page, variant);
}
```

prepareHousingInteriorFixture enters the real free Inn or permission-gated offline
Cottage, dismisses ordinary overlays, and settles into the measured static room
view without replaying a fresh camera/cue. It never opens or calls build UI. It sends
existing DEV commands /daynight moon half plus /daynight day or /daynight night
through the actual chat route, src/game/daynight_dev_command.ts::tryDayNightDevCommand.
It invents no clock storage key. assertHousingInteriorFixture checks actual tier,
scene and structural readiness, and checks src/render/day_night_clock.ts exports
dayNightPhaseOverride/currentDayNightPhase against the command's existing named
preset. The actual renderer grade/window/hearth/LOW fallback must match that state.
These existing source presets add no housing balance number. Overrides stay fixed
until the runner writes its image; normal per-variant page teardown clears them,
never cleanup before capture. The four scenes differ in actual layout and pinned
clock state, not just filenames. They show steady room art and remain distinct from
the visiting target's fresh-arrival/cue acceptance scenes.

File 11's build-empty fixture is a legitimate owned home with no available furnishing
copies in the furnishing tab. Assert build.empty, an empty selectable grid, no ghost,
inactive placement/confirm and working close/tab controls. It grants no fake item and
does not substitute a search with no matches for an empty inventory. Every new scene
runs all desktop/compact/tablet baseline views. Guest observation stays the existing
visit-owner-building identity registered by 18; 11 carries the two-client behavioral
acceptance and cites that later capture, never a duplicate screenshot scene.

The values in option objects are explicit local fixture labels. No string above
claims to be a current wire key or runtime enum. A variant's metadata is applied
before navigation when necessary and asserted again after the real controls
reach the scene. A label such as ios-effective-one is not proof by itself.
Produce the expanded target/variant manifest and pin it in tests, including every
surface, theme, input, motion, light and transient-state arm. Every required
matrix image maps to one exact target/variant identity. Adding a new state adds
a unique variant and that manifest assertion, never an undocumented side shot.

File 09 owns NEW isHousingVisualPath in scripts/lib/pr_shot_housing.mjs, derived
from the single housingVisualWhen inventory and imported above for the existing
classifyDiff selection path. Public-art-only diffs reach the matching housing
targets. File 11 extends that same inventory and its selection tests; it creates
no second predicate or selector framework. There is no unrelated generic-asset
fallback.

The path-selection test independently changes a renderer-only file, placement
core, ordinary furnishing model, each exact manifest public art prefix and a
shared stylesheet. It asserts all affected housing targets are selected.
Generic visual classification is not assumed to recognize new GLBs; extend its
explicit supported housing-art classification through the script's owning pure
selector seam and pin the art-only diff case. Public model paths and catalog
item-art/reference paths must exactly match the completed art manifest.

### Real fixtures and offline grant authorization

The runner already calls enterOfflineGame from scripts/enter_offline_game.mjs
for ordinary non-landing variants. captureHousing* uses the resulting real
window.__game Sim/HUD and does not enter a second time. An actual online
scenario needs an explicit existing-runner-compatible setup adapter that joins
the local test server before its one capture. Presentation fixtures and real
multiplayer/authority evidence are labeled separately. Real UI controls are
used after fixture state is authorized; no fake DOM or post-capture correction.

The ordinary offline constructor gets devCommands from import.meta.env.DEV.
05 already delivered the housing-only explicit dev/loopback bridge below, gated
by ALLOW_DEV_COMMANDS, realizing D3/D24 while leaving ordinary devCommands unchanged:

| Existing owner/module | Exact engineering responsibility |
|---|---|
| scripts/lib/freehold_dev_authorization.mjs and its .d.mts | freeholdDevAuthorizationPlugin({ enabled }) and directly tested request predicate reuse existing diagnosticsReadAllowed socket/Host guard. |
| vite.config.ts composition | Pass enabled: process.env.ALLOW_DEV_COMMANDS === '1'; use configureServer only with apply: 'serve', preserving the literal defineConfig object AST pin. No preview/production route. |
| src/game/freehold_dev_bootstrap.ts | Injected/testable resolveOfflineFreeholdDevGrant before constructing the offline Sim. |
| SimConfig, Sim and SimContext seams | readonly nonpersisted freeholdDevGrantEnabled, default false. |
| src/sim/freehold/dev_grant.ts | Require both ctx.devCommands and ctx.freeholdDevGrantEnabled before the planned setFreeholdTier call. |
| src/sim/dev_commands.ts and server/sim_boot_config.ts | Thin housing command delegation; server supplies its housing permission from the same explicit flag without changing general-dev policy. |

The dev-only endpoint is exactly GET /__freehold/dev-authorization. It returns
only the strict affirmative JSON {"freeholdDevGrantEnabled":true}, with no-store,
when explicitly enabled and diagnosticsReadAllowed accepts both real socket
remote address and Host. Wrong method refuses, unrelated path passes through,
and disabled/missing/malformed/nonloopback cases cannot return an affirmative.
It reads no account, tier, purchase, receipt or arbitrary environment data.
Existing .dockerignore import admission and Docker-context tests cover the NEW
Vite helper, and tests/vite_dev_watch.test.ts retains its literal config-shape pin.

The browser requires import.meta.env.DEV and an HTTP(S) loopback document origin,
fetches same-origin without credentials, caching or redirects, and accepts only
the exact affirmative shape. Failure, refusal, missing endpoint, HTML fallback,
malformed/redirected response or entry-lifecycle cancellation resolves false.
Permission refusal never prevents ordinary free Inn initialization. There is no
new timeout literal; cancellation follows entry lifecycle. Consume permission
only for that offline Sim construction, never in localStorage, a query flag,
UA, window.__game override, user setting or receipt. This browser permission
and the browser-created offline fixture tier never enter online persistence.
D24 separately authorizes the server's `/dev freehold` path through the ordinary
state setter; preserve that path's existing save contract rather than inventing
an ephemeral server tier. Neither developer path creates a paid service receipt.
Authorization stays outside setFreeholdTier because legitimate service grants
also use that setter through their independent authoritative path.

The local reviewable launch is
`ALLOW_DEV_COMMANDS=1 npm run dev -- --host 127.0.0.1`.
The screenshot helper first uses existing assertLoopbackUrl, invokes the real
`/dev freehold cottage` chat dispatch, and reads ordinary world state for the
result. It cannot set tier directly. NEW tests/freehold_dev_authorization.test.ts
and tests/freehold_dev_bootstrap.test.ts cover exact flag values, real socket
versus forged Host, absent/external Host, wrong method, strict payload and
redirect refusal, and production/preview absence. Each Sim permission alone is
insufficient. A real flag-off browser enters Inn and refuses Cottage; a real
flag-on loopback dev browser starts in Inn then grants through the actual
command. Generic dev commands remain unchanged and no developer grant becomes
a paid receipt. These are future implementing-file 07 obligations, not test
results from this packet audit.

Stage each owned furnishing using the accepted dev/test inventory fixture, then
open the real HUD and place/move through its controls. Assert actual plot/tier,
layout revision, copy identity, usage, valid/blocked reason, visibility, current
surface and loading state. Wait for the scene's required actionable
representations, icon decoding and stable layout; do not require every optional
online cosmetic to settle contrary to the arrival contract. Stable ids,
data-focus-key and semantic attributes are selectors, not localized text.

Store variants use an explicitly labeled local recorded-response adapter at the
existing service/Store seam. It drives production views and receipt states;
it does not prove a debit, durable receipt or restart recovery. Denied surfaces
map fixture labels to the actual distribution/capability verdict rather than
phone UA, and assert absence of purchase model, handlers, catalog requests,
hidden DOM, aria text and unapproved website management alongside the image.

Each pending/refusal/reconnect image freezes its own real reachable state through
controlled service/event scheduling. It must not race through the intermediate
state and capture the final success. Each unique variant records its asserted
operation identity; it sends no duplicate mutation to reconstruct an image.
True two-client proof separately verifies private ghost non-fanout, occupancy,
offline-owner admission and revocation. Browser screenshots of a controlled
public projection alone do not prove server privacy or admission authority.

Keyboard/pad/touch variants execute actual input transitions before capture.
Arrival scene fixtures distinguish new accepted transitions from replay/resume
and supply the first-tier camera only through the fresh committed-winner
projection. The arrival-inn/arrival-cottage scenes assert that permission; a
historical firstTierAtAdmission value alone cannot stage them. Ordinary-return
and guest scenes assert no first-tier mark/directive. Targeted transition tests
cover fresh-client replay and commit-before-ACK omission without adding fake
celebrations to a recovered screenshot. Existing steward-pending/refused/reconnect
layout captures remain their declared states; focused view/DOM tests separately
cover connected-but-refreshing and unsupported history using the existing keys.
Do not claim those tests produced additional screenshots or alter the one-shot
manifest to imply uncaptured transient states.

The pad placement fixture starts with the companion visibly open and proves
scoped arbitration against the composed gamepad path, including ordinary window
override and no combat dispatch. A manually set focus class or pasted glyph
cannot satisfy this. Reduced-motion and forced-colors use actual supported
browser media emulation and assert computed behavior. Real LOW iOS/WebKit
capture and interaction/performance evidence remain separate required device
checks: Chromium with iPhone UA proves an iOS profile branch, not Safari engine
behavior, phone memory pressure or touch performance. A controlled effective-one
light fixture uses the live budget seam and asserts the actual contribution
count; its label does not prove physical device pressure.

No screenshots or real-device, audio, payment or multiplayer evidence are
produced in this packet-only audit. Implementation sessions write the normal
contribution evidence and record any unavailable device/runtime check honestly.

## 12. Wave A screenshot matrix and acceptance trace

Implementing file 20 and its QA own this complete matrix. Required baseline
sizes are desktop 1600x900, compact 874x402 and tablet 1180x820 from state "UX
screenshot viewports". Every row marked all-baseline gets a separate readable
capture at each size. Rows below group review responsibilities for readability
only. Every named state maps to its own explicit unique section 11 variant and
one image; no composite or last-state-only capture substitutes for an unobserved
arm. File names include target, scene, viewport, theme, preset, motion, input,
distribution, light/media profile and before/after identity. Missing required
after-state is a failure.

| Scenario target | Required visible state and assertion | Viewports | Primary owner |
|---|---|---|---|
| gate-own-prompt; inn-safe-landing; cottage-safe-landing | Real own-home prompt and authoritative safe room landing/exit; honest absent-surface gate-site baseline; no day/night or first-arrival presentation claim | All baseline | 06; freehold-gate/freehold-inn/freehold-cottage |
| gate-own-choice; gate-friend-empty; gate-lookup-pending; gate-lookup-ready; gate-lookup-stale; gate-lookup-refused | Eastbrook semantic marker, real interact prompt, own/friend choice, no proximity teleport | All baseline | 06/18 |
| arrival-inn | New accepted owner transition with committed fresh first-tier directive, safe reveal, truthful plinth, welcome and no automatic panel | All baseline | 06/09/19 |
| arrival-cottage; arrival-ordinary-return; arrival-visitor | Cottage first-tier view requires fresh committed-winner directive; ordinary-return/visitor scenes have new ordinary welcome only and static camera | All baseline | 06/09/19 |
| interior-inn-day; interior-inn-night; interior-cottage-day; interior-cottage-night | Steady actual Inn/Cottage at pinned named day/night and fixed moon presets, safe static view, readable LOW window/hearth/material distinction; no build UI or fresh arrival replay | All baseline | 09; shared target extended by 11 |
| build-empty | No available furnishing copies, build.empty, no selectable item/ghost/confirm, usable tab/close | All baseline | 11 |
| build-ready; build-placed-selected; build-move-preview; build-remove-review; build-remove-refused | Owned-copy marks, palette/Trophies tab, recognizable ghost, real footprint, live decor/plinth/amenity meters | All baseline | 11 |
| build-blocked | Hatched/crossed footprint plus exact reason, confirm unavailable, full touch strip visible | All baseline | 11 |
| build-decor-full; build-plinth-full; build-amenity-full | Live used/limit and needed/remaining, no invented warning threshold, no false place success | All baseline | 11 |
| build-history-confirmed; build-history-undone; build-history-redone; build-history-stale | A real confirmed move, undo and redo, then stale inverse/refused-history explanation | All baseline | 11 |
| build-pending; build-refused; build-reconnect | Original operation pending then reconnect, last committed world, mutation paused, no duplicate send | All baseline | 11 |
| steward-bags; steward-vault; steward-automatic; steward-vault-unavailable | Actual needed/bags/vault split and all source modes, truthful source-named action | All baseline | 16 |
| steward-prepay-review | Full versioned bill batch and source deductions, covered-through date, confirmation cleanup | All baseline | 16 |
| steward-condition-30; steward-condition-29 | Condition 30 with amenity available, condition 29 with amenity paused and safe home explanation | All baseline | 13/16 |
| steward-inn | No-upkeep state with no payment component | All baseline | 16 |
| steward-pending; steward-refused; steward-reconnect | One in-flight material send, matching refusal, preserved source/week draft | All baseline | 16 |
| charter-ready; charter-reconciled (also website-desktop) | Accurate art/grant/free-room copy, current service quote and review; browser and website desktop capability | All baseline for web; desktop for website shell | 16 |
| charter-pending; charter-cancelled; charter-reconciling; charter-reconciled | Pending/cancelled/reconciled original intent, current receipt, no second purchase invitation | All baseline on allowed web | 15/16 |
| charter-quote-unavailable; charter-quote-expired | Explicit quote unavailable/stale, no zero-price fallback | All baseline on allowed web | 16 |
| charter-denied | No purchase or unapproved management component and accompanying DOM/accessibility/network assertions for every denied distribution | All baseline using injected actual surface verdict | 14/16 |
| trophies-owned; trophies-unearned-known; trophies-hidden | Eligible art, truthful known-source silhouette, hidden-source non-disclosure, no free invented feat | All baseline | 17 |
| trophies-provenance-known; trophies-provenance-unknown; trophies-maker; trophies-possession-inactive; trophies-plinth-preview; trophies-replace-review; trophies-clear-review; trophies-refreshing | Same public deed/page/mark/name/day for owner and visitor; unknown history explicit; selected plinth | All baseline | 17 |
| visit-read-only; visit-owner-away | Guest context, who-is-home, offline-owner permitted entry, Leave, absent owner controls | All baseline | 18 |
| visit-owner-building | Guest sees accepted layout plus decorating line, owner ghost absent by real wire proof | All baseline | 11/18 |
| visit-full; visit-private-refused | Authorized full refusal and privacy-safe unknown/private refusal preserve typed name | All baseline | 18 |
| visit-policy-draft; visit-policy-pending; visit-policy-saved; visit-policy-refused; visit-end-review; visit-end-pending; visit-end-succeeded; visit-revoked | Existing guest safely returned after End visit/revocation; no stale cached admission | All baseline | 18 |
| entry-pending; entry-error; entry-busy; arrival-online-delayed-cosmetics | Pending/failed room load or foreign-realm busy state, retry with no false loss/waitlist | All baseline | 06/07/18 |

Focused additions are mandatory, with the relevant baseline scene reused:

| Variant | Visible proof and nonvisual check |
|---|---|
| Parchment and highContrast/forced colors | Build blocked, Steward condition/payment and trophy provenance retain readable text/focus/shape through theme repair. |
| Reduced motion | Static arrival or immediate handback; no ghost pulse, animated hatch, auto-orbit, shimmer or flame-dependent state. Same controls and information. |
| LOW iOS and pressured light case | Explicit ios-effective-one and high-preset variants assert live light-profile state. Separate real LOW iOS/WebKit device captures prove engine/readability/input; Chromium UA emulation proves only the profile branch. |
| Keyboard (build-keyboard-focused, trophies-grid-focused, steward-prepay-review and gate-lookup-ready keyboard variants) | Real open/tab/grid/confirm/cancel/close sequence, focused control visible, no focus lost after relocalize or authoritative refresh. |
| Gamepad (build-pad-placement) | Actual active-family glyphs and successful palette, move, rotate, nudge, confirm, undo and cancel sequence; no simultaneous combat action. |
| Touch (build-touch-controls) | Real compact/tablet tap-only and drag arbitration, safe areas, target size and input floor; no action hidden under existing HUD or keyboard. |
| Portrait shell (portrait-rotation-gate) | Existing rotation-gate presentation remains correct; no claim of a playable portrait build editor. |
| Audio and mute | Separate event evidence: ordinary feedback only on a newly accepted delivered transition; no cue/directive remint on replay/resume or fresh-client recovery; commit-before-ACK may skip output. Matching placement/payment feedback, mute and spatial teardown still apply. Screenshots cannot prove sound. |
| Multiplayer/authority | Two-client public revision/privacy, full-cap/refusal, offline-owner admission and revocation; restart/receipt integration for paid results. Offline screenshot fixtures cannot prove these. |

Locale: every registered variant is captured in English (locale 'en'); the
manifest carries no locale dimension by decision. Long non-Latin fills are proven
by the M16 same-change fill rule and tests/i18n_completeness.test.ts, never by a
capture variant; a later locale capture would add a locale key dimension and its
own manifest regeneration.

### Later-wave registrations and acceptance trace

Each later producer registers the scenes below through housingLaterRegistrations
and owns their acceptance; the wave close that follows verifies the union of every
registered key against the regenerated manifest.

| Scenario target | Required visible state and assertion | Viewports | Owner |
|---|---|---|---|
| steward-upgrade-preview; steward-upgrade-partial; steward-upgrade-fee-due; steward-upgrade-ready; steward-upgrade-bags-full; steward-upgrade-complete | Upgrade bill per leg, fee status, source mode, overflow preview, finish re-attempt and completion | All baseline | 21 |
| trophies-finish-silver; trophies-finish-gilded; trophies-dulled-29 | Silver and gilded finishes on qualifying sources; every finish dull and the hearth cold below condition 30 | All baseline | 23 |
| garden-{live,saved,mixed,incomplete,unavailable,empty,loading}-{owner,guest} | Truthful freshness per row, saved qualification visible and audible, owner-only Journal action, guest sees no alt identity or timer; unavailable and incomplete never imply empty or ready | All baseline | 24 |
| build-wall-placement; build-table-placement; build-ceiling-placement; build-host-move-preview; build-child-blocked; build-surface-meter; build-free-yaw; build-snap-mode; build-advanced-visitor | Typed surface ghost and reason, parent move with children, surface meter, free yaw versus snapped mode, visitor sees accepted revisions only | All baseline plus reduce, keyboard, gamepad and touch arms | 25 |
| open-house-list-empty; open-house-list-ready; open-house-list-error; open-house-knock-sent; open-house-knock-wait; visit-public-full | Open Houses tab states, Knock and its wait, public-policy full refusal preserving the list | All baseline | 26 |
| hall-chest-leader; hall-chest-officer; hall-chest-member; hall-chest-guest; hall-chest-locked; hall-station-member; hall-station-guest; hall-station-locked; hall-feast-table; hall-feast-active | Guild chest by rank, guest refusals with guild.chestMembersOnly and guild.stationMembersOnly, paused amenities, the feast table and an active feast | All baseline plus reduce, keyboard and touch arms | 30 |
| hall-boards-roster; hall-boards-calendar; hall-boards-pledge; hall-boards-members-only; war-table-lockouts; war-table-first-kills-unavailable | Board tabs, non-member refusal, lockout counts naming no other member, first kills unavailable before 31 | All baseline | 30a |
| war-table-first-kills-ready; war-table-first-kills-empty | First-kill rows with character and day, the empty state reusing guild.noRecords | All baseline | 31 |
| ward-square; ward-exterior; ward-roster; ward-busy-cap; ward-door; ward-move-review | Square and exterior kits at LOW, roster with anchor and occupancy, busy and full refusals, door names, the move confirmation | All baseline | 34 |
| ward-endeavors-loading; ward-endeavors-empty; ward-endeavor-in-progress; ward-endeavor-complete; ward-endeavor-hidden-reward; ward-endeavors-unavailable | Permanent Favor capacity separate from monthly progress, spoiler-safe hidden reward, unavailable leaves Favor unchanged | All baseline | 35 |
| showcase-consent; showcase-list; showcase-voted; showcase-vote-used; showcase-season-closed; showcase-season-locked; showcase-empty; showcase-loading; showcase-error | Consent prompt, consented entries, one vote per account, closed and locked seasons with dates, empty and error states | All baseline | 36 |
| guest-book-empty; guest-book-reactions; guest-book-recorded; guest-book-used; guest-book-denied | Reaction radiogroup, recorded reaction, daily limit used, private denial with no free text | All baseline | 36 |
| deed-card; deed-homes-tab; deed-contents-review; deed-step-up; deed-listed; deed-sold; deed-received; deed-buyer-capacity; deed-denied | Deed card and Homes tab on web and website desktop, exact included/retained contents, wallet step-up, listed/sold/received receipts, buyer capacity refusal, complete absence on every denied distribution | All baseline for web; desktop for website shell; denied surfaces via the injected verdict | 38 |
| steward-requirements-met; steward-requirements-unmet; steward-guild-clear-unmet; steward-overflow-review; steward-overflow-none | Read-only requirement rows with earned status, guild-clear requirement unmet, overflow destination confirmation and the everything-fits arm | All baseline | 40 |
| dyes-picker; dyes-station-locked; dyes-station-unlocked; dyes-shortfall | Eight swatches with bag counts, apothecary gate locked by condition or range, shortfall refusal; high preset and reduced motion keep identical actionable state | All baseline plus high and reduce arms | 41 |
| layouts-empty; layouts-saved; layouts-overwrite; layouts-import-review; layouts-shortfall; layouts-dye-shortfall; layouts-displaced; layouts-stale | Saved slots, overwrite confirmation, import review with shortfalls, displaced destinations and the stale preview refusal | All baseline | 41a |
| second-home-primary-tab; second-home-second-tab; second-home-hearth-destination; second-home-card; second-home-owned; second-home-bill; second-home-denied | Primary and Second Home tabs, destination row, second Charter card and owned state, the one-and-a-half bill note, complete absence on denied distributions | All baseline for web; desktop for website shell; denied surfaces via the injected verdict | 42 |

Every owning UI file extends the source/mechanic tooltip fixture, focused painter
and invalidation/focus tests, mobile and theme guards, i18n, fairness and script
selection pins appropriate to its diff. File 20 records the screenshot manifest,
input/audio/LOW evidence, content/art finish and outstanding external release
sign-offs as gates. A screenshot is evidence of the recorded state and build,
never proof that all implementation, performance or service gates passed.

The wave close reviews the complete wave's feature code and interactions against
its actual full-wave diff and evidence. Prior per-file QA informs that integration
review but does not exclude feature behavior when the close's immediate edits are
documentation. Resolve every review finding including nits, then obtain a fresh
review of the entire fix round. Only named external signature artifacts remain
release gates; they are never deferred review findings.

The implementation plan's reviewer matrix applies to every owner: frontend,
accessibility/i18n, test coverage, render performance for materials/lights/scene
attach, parity/sim for feature behavior, and security/persistence/database review
for authority or spending. Parent implementation sessions run the shared gate
once and reviewers inspect its evidence; repeated ad hoc test runs do not replace
the canonical QA contract. This packet settles what they must build and prove.


### Final Codex artwork and legal handoff

Every implementation file that generates a housing asset must be executed with
Codex, not Claude. This includes GLBs, icons, reference images, textures and
replacement artwork. Follow the existing image and image-to-GLB workflows,
provenance and registration contracts in [art-brief.md](art-brief.md). Nothing
in this documentation session generates or approves an unmade asset.

[44a, final Codex artwork](phase-44a-final-codex-artwork.md) inventories every
feature-created placeholder icon and image across all waves, replaces it with
finished Codex artwork, and records each source, final asset, registration,
provenance and acceptance result. It verifies the completed feature on desktop,
compact and tablet with LOW evidence and preserves gameplay identity and readable
state overlays. This closes the complete final inventory after the existing
per-wave art gates; it does not postpone those earlier gates or permit unfinished
sold content.

[44b, final legal handoff](phase-44b-final-legal-handoff.md) follows that artwork
closeout. It revisits the implemented Terms, listings, surface restrictions,
service contracts and artwork rights/provenance, then produces the concrete
legal-team handoff with final revisions and evidence in the NEW produced artifact
docs/prd/woc/freehold-final-legal-handoff.md. External legal and platform
sign-offs remain the existing release gates recorded in state. Preparing that
handoff does not itself send a message or authorize release.

Regenerate both planned inventories from the repository root with
`node docs/freeholds/generate-ux-manifests.mjs`. The optional first argument is a
repository root and the optional second argument is an output directory for a
read-only comparison. The generator preserves table/target order, excludes the
separate keybinding namespace, and expands capture metadata without executing
browser callbacks.

The checked-in [English key inventory](ux-key-manifest.json) and [screenshot target
inventory](ux-shot-manifest.json) are generated from this specification's tables and
executable registry examples. They record the approved 557 keys (each with its owning
phase) and 742 planned variants (339 in wave A, then file 21 reaches 357; file 23
reaches 366; file 24 reaches 408; file 25 reaches 446; file 26 reaches 464; file 30
reaches 502; file 30a reaches 520; file 31 reaches 526; file 34 reaches 544; file 35
reaches 562; file 36 reaches 604; file 38 reaches 648; file 40 reaches 663; file 41
reaches 681; file 41a reaches 705; file 42 reaches 742), respectively; they are
requirements, not screenshots, implemented translations or evidence that a capture
ran. A later reviewed source change regenerates the matching inventory in the same
change.
