# Freeholds and Guildhalls: interface and experience specification

Status: approved, UNBUILT design. Fernando approved R01 through R46 on
2026-09-06, with the final Codex artwork closeout and legal-team handoff additions.
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

## 2. Shared tokens, windows, painters and input ownership

### 2.1 Current tree versus adopted design

DESIGN.md is adopted, but the inspected tree still has the previous foundation.
Implementing file 11 verifies the shared foundation/chrome rollout before using
new tokens. Until the coordinated rollout lands, consume the current shared
family and its actual tokens; after it lands, consume the adopted shared tokens.
Do not introduce housing-local fallbacks with copied target colors or restyle the
game from this packet. This explicit migration condition is recorded in state.
The reverted window_frame.ts and .window-frame are not existing dependencies.

| Role | Verified current family | Adopted target | Content numbers source row |
|---|---|---|---|
| Accent/border/panel | theme.ts classic #ffd100 / #6f5a2a / #15151f | #d8a645 / #926321 / #12232c through shared theme variables | UX current and adopted colors |
| Text/muted | #f0ebd8 / #998d6a | #fff4d9 / #c4b590 through shared theme variables | UX current and adopted colors |
| Display/UI/reading fonts | Existing --font-display remains Cinzel; all remaining font roles use shipped shared tokens | Alegreya 700 / Alegreya Sans 400,500,700 / Alegreya 400; labels Alegreya Sans SC 700; Cinzel only brand/shell | UX typography |
| Type size/line height | Existing shared window and control selectors | Window title 17/22px, panel title 15/20px, button 14/17px, body 14/19px, metadata 12/15px; body floor 12px | UX typography |
| Spacing and scale | --spacing-xs 4px, --spacing-sm 8px, --spacing-md 16px, --spacing-lg 24px; existing --ui-scale | Same spacing; shell pad 12px, body pad 12 to 16px; only one scale at authored scale 1 | UX shared spacing and scale |
| Header/close/tabs | Actual .window.panel shared shell and controls | Header 44px, icon 24 to 28px, close 34px with expanded touch target; tabs 32px visually with full touch target | UX window and item geometry |
| Item cells/radius | Bags-family cells, --radius-sm 4px and --radius-md 8px | Cells 48px with 4px gap; --radius-slot 5px, --radius-button 7px, --radius-window 10px | UX window and item geometry |
| Touch | Existing body.mobile-touch, safe-area and input rules | Every target at least 40x40px; visible input, select and textarea text at least 16px | UX touch targets; UX typography |
| Motion | --transition-speed 0.25s and --transition-ease cubic-bezier(0.4,0,0.2,1) | --dur-fast 90ms, --dur-press 60ms, --dur-panel 160ms, --dur-frame 120ms, close about 120ms | UX motion |
| Tooltips | Actual shared #tooltip and attachTooltip | Strong fill, 10px pad, max 320px, hover delay about 250ms and immediate keyboard-focus presentation | UX tooltip |
| Readable states | themeCssVars contrast repair and shared semantic hooks | Normal text 4.5:1; large text/accent 3:1; error text stays --color-text-error #ff8f85 | UX contrast |

Adopted guaranteed-dark ramps are --color-ink-1000 through --color-ink-800 and
--color-gold-900 through --color-gold-300, with exact values in state "UX current
and adopted colors". They may ornament guaranteed-dark surfaces. Readable text,
selected borders and focus on themed surfaces use the theme-derived variables:
--color-accent-hover, --color-border-focus, --color-accent-glint,
--color-text-secondary, --color-text-faint and --panel-fill-strong when shipped.
Do not force dark ink/gold literals onto parchment. Success/warning/danger/info
use the shared semantic roles; item rarity uses the existing quality hooks.

### 2.2 Exact composition contracts

Reuse `.window.panel` from src/styles/layout.css and the existing window drag and
resize installers. Every NEW housing window id receives an explicit mobile pin,
size and transform rule or a reviewed mobile exception. CSS remains flat:
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
and src/game/build_mode_wiring.ts, with a small NEW pure housing input core.
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

| NEW key | English value |
|---|---|
| hudChrome.housing.common.close | Close |
| hudChrome.housing.common.cancel | Cancel |
| hudChrome.housing.common.back | Back |
| hudChrome.housing.common.retry | Try again |
| hudChrome.housing.common.loading | Loading your home... |
| hudChrome.housing.common.pending | Waiting for confirmation... |
| hudChrome.housing.common.reconnecting | Reconnecting. Your saved home is safe. |
| hudChrome.housing.common.readOnly | Read only |
| hudChrome.housing.common.unavailable | This is unavailable right now. |
| hudChrome.housing.common.unknown | Unknown |
| hudChrome.housing.common.selected | Selected: {name} |
| hudChrome.housing.common.closeAria | Close {window} |
| hudChrome.housing.denied.unavailable | This home is unavailable right now. Try again later. |
| hudChrome.housing.denied.busy | This home is active elsewhere or still opening. Try again shortly. |
| hudChrome.housing.denied.permission | You cannot use this here. |
| hudChrome.housing.denied.ownershipChanged | Your access changed. Your last confirmed changes are saved. |
| hudChrome.housing.denied.changed | Your home changed before this action finished. Review it and try again. |
| hudChrome.housing.denied.materials | You do not have enough materials in the selected source. |
| hudChrome.housing.denied.bagsFull | Make room in your bags before removing this furnishing. |
| hudChrome.housing.denied.condition | Restore your home's condition to use this amenity. |
| hudChrome.housing.denied.offlinePurchase | Purchases need an online connection. |
| hudChrome.housing.granted.placed | {item} placed. |
| hudChrome.housing.granted.moved | {item} moved. |
| hudChrome.housing.granted.removed | {item} returned to your bags. |
| hudChrome.housing.granted.ledgerPaid | Your Ledger is paid. |
| hudChrome.housing.granted.prepaid | Your Ledger is paid through {date}. |
| hudChrome.housing.granted.call | Your home's condition is restored. |

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
still player-visible. File13a's NEW server-only
FreeholdUpkeepAuthoritySuspension in server/freehold_db.ts is distinct from
file13's safe sim FreeholdUpkeepSuspension, whose allowed calendar facts are
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
where the globally stable day identity preserves signed CAL-SOCIAL calendar/reset
binding across revisions. Calendar/reset references do not create alternate
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
extends its static farm extraction, bounded cache, admission and invalidation.
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
to explore. The gate is a world interactable with the normal semantic map marker.
The proximity hint and the actual interact press share the same resolved target;
merely walking near it never teleports. Gate choice offers the account's own
home and friend-by-character-name. The free Inn Room is a normal destination and
has no purchase nag at its door.

Flow: interact at the Eastbrook quay gate, choose destination, activate entry,
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
room's safe bounds and camera collision. Any movement, look, confirm or cancel
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
freshArrivalPresentation with firstTierViewEligible true from08a. Historical
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

| NEW key | English value |
|---|---|
| hudChrome.housing.gate.title | Choose a home |
| hudChrome.housing.gate.own | My home |
| hudChrome.housing.gate.visit | Visit a friend |
| hudChrome.housing.gate.name | Character name |
| hudChrome.housing.gate.namePlaceholder | Enter a character name |
| hudChrome.housing.gate.nameRequired | Enter a character name to visit. |
| hudChrome.housing.gate.homeChoice | Choose your home |
| hudChrome.housing.gate.lookup | Find home |
| hudChrome.housing.gate.lookupPending | Finding your friend's home... |
| hudChrome.housing.gate.lookupChanged | Find this character's home before entering. |
| hudChrome.housing.gate.result | Home belonging to {name} |
| hudChrome.housing.gate.enter | Enter |
| hudChrome.housing.gate.loading | Opening the door... |
| hudChrome.housing.gate.marker | Freeholds gate |
| hudChrome.housing.gate.interact | Choose a home |
| hudChrome.housing.arrival.welcome | Welcome home, {name}. |
| hudChrome.housing.arrival.visitor | Welcome to {name}'s home. |
| hudChrome.housing.arrival.skip | Skip arrival view |
| hudChrome.housing.arrival.ready | Your home is ready to explore. |
| hudChrome.housing.hearthKey.tooltip | Return to your selected home. You cannot use this while in combat, dead or in jail. Your homes share its cooldown. |
| hudChrome.housing.hearthKey.destination | Destination: {home} |

Hearth Key metadata shows the live cooldown (state Hearth Key row), without
repeating it in the tooltip sentence. The second-home sentence is enabled only
when the shared-target mechanic lands; before then the English source uses the
same key with singular active-mechanic wording. No tooltip may ship a future
restriction or feature before its handler exists.

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
release. Meters show actual used and limit, including truthful over-capacity
numbers; clamp only drawn fill. They do not invent bank near-full thresholds.
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

Later advanced mode adds bounded planar translation/free yaw and typed
floor/wall/table/fixed-ceiling anchors, with parent movement and children applied
atomically. The snapped mode stays available. There is no arbitrary scale,
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
Return to bags. Replace opens the same eligible trophy chooser, then stages the
selected record on that exact plinth; no inventory copy is created. Cancel
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
world context owns input; otherwise native text undo remains intact. Existing
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
existing focus-navigation action returns to the palette. Trigger hotbar actions
are suspended while placement owns those inputs, so one press cannot decorate
and cast. The same logical actions are remappable and displayed using the
current pad family glyphs, including when the device changes mid-session.

Touch routes each pointer through touch_router's ownership ledger. Dragging a
selected piece previews it; dragging unoccupied world area controls the bounded
camera, and UI touches stay UI-owned. Pinch controls camera only. Confirm,
Rotate and Cancel remain separate visible targets at least 40x40px (state UX
touch targets), with reverse-rotate and nudge reachable by the tap-only action
panel. A finger-offset preview derives the selected control's actual hitbox and
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

| NEW key | English value |
|---|---|
| hudChrome.housing.build.title | Build mode |
| hudChrome.housing.build.enter | Build |
| hudChrome.housing.build.leave | Finish building |
| hudChrome.housing.build.furnishings | Furnishings |
| hudChrome.housing.build.trophies | Trophies |
| hudChrome.housing.build.amenityTab | Amenities |
| hudChrome.housing.build.search | Search furnishings |
| hudChrome.housing.build.searchPlaceholder | Search by name |
| hudChrome.housing.build.clearSearch | Clear search |
| hudChrome.housing.build.category | Furnishing category |
| hudChrome.housing.build.palette | Choose a furnishing |
| hudChrome.housing.build.collectionHelp | Use the arrow keys to move between furnishings. Press Enter to select one. |
| hudChrome.housing.build.placedObjects | Placed furnishings |
| hudChrome.housing.build.selectPlaced | Select {item} |
| hudChrome.housing.build.selectedPlaced | Selected placed furnishing: {item}. |
| hudChrome.housing.build.moveSelected | Move furnishing |
| hudChrome.housing.build.replaceTrophy | Replace trophy |
| hudChrome.housing.build.clearTrophy | Clear plinth |
| hudChrome.housing.build.returnTooltip | Return this exact furnishing to your bags. You need enough bag space. |
| hudChrome.housing.build.proposalReplaced | Previous placement preview cancelled. {item} is selected. |
| hudChrome.housing.build.selectionPending | Wait for this placement to finish before changing selection. |
| hudChrome.housing.build.surfaceFloor | Floor |
| hudChrome.housing.build.surfaceWall | Wall |
| hudChrome.housing.build.surfaceTabletop | Tabletop |
| hudChrome.housing.build.surfaceCeiling | Ceiling |
| hudChrome.housing.build.paletteOpen | Open furnishing palette |
| hudChrome.housing.build.empty | Find furnishings at vendors or make them with crafting recipes. |
| hudChrome.housing.build.noResults | No furnishings match your search. |
| hudChrome.housing.build.selectedCopy | {item}, {marks}, {count} available |
| hudChrome.housing.build.selectedCopyNoMarks | {item}, {count} available |
| hudChrome.housing.build.confirm | Place |
| hudChrome.housing.build.confirmMove | Move |
| hudChrome.housing.build.remove | Return to bags |
| hudChrome.housing.build.rotate | Rotate clockwise |
| hudChrome.housing.build.rotateBack | Rotate counterclockwise |
| hudChrome.housing.build.cancel | Cancel placement |
| hudChrome.housing.build.nudge | Nudge |
| hudChrome.housing.build.nudgeForward | Nudge forward |
| hudChrome.housing.build.nudgeBack | Nudge backward |
| hudChrome.housing.build.nudgeLeft | Nudge left |
| hudChrome.housing.build.nudgeRight | Nudge right |
| hudChrome.housing.build.snap | Snap to grid |
| hudChrome.housing.build.undo | Undo |
| hudChrome.housing.build.redo | Redo |
| hudChrome.housing.build.undoEmpty | There are no placement changes to undo. |
| hudChrome.housing.build.redoEmpty | There are no placement changes to redo. |
| hudChrome.housing.build.historyChanged | Your home changed. Placement history has been reset. |
| hudChrome.housing.build.historyTooltip | Undo confirmed placement changes from this building session. Payments and purchases are not included. |
| hudChrome.housing.build.saving | Saving placement... |
| hudChrome.housing.build.preparing | Preparing furnishing preview... |
| hudChrome.housing.build.valid | Ready to place. |
| hudChrome.housing.build.placementReason | Placement: {reason} |
| hudChrome.housing.build.decor | Decor: {used} of {limit} |
| hudChrome.housing.build.plinths | Plinths: {used} of {limit} |
| hudChrome.housing.build.amenities | Amenities: {used} of {limit} |
| hudChrome.housing.build.decorTooltip | This furnishing uses {cost} decor. You have {remaining} decor available. |
| hudChrome.housing.build.plinthTooltip | Display trophies on your home's plinths. {used} of {limit} are in use. |
| hudChrome.housing.build.amenityTooltip | Installed stations use amenity slots. Your built-in Strongbox does not use a slot. |
| hudChrome.housing.build.camera | Build camera |
| hudChrome.housing.build.cameraHint | Move the view to inspect your placement. |
| hudChrome.housing.build.controlsAria | Placement controls for {item} |
| hudChrome.housing.build.fixed | This is part of your home and cannot be moved. |
| hudChrome.housing.denied.placementBlocked | Something is in the way. |
| hudChrome.housing.denied.outsideRoom | Place this inside the room. |
| hudChrome.housing.denied.doorway | Keep the doorway and arrival path clear. |
| hudChrome.housing.denied.occupied | Someone is standing in that space. |
| hudChrome.housing.denied.decorFull | This needs {needed} decor. You have {remaining} available. |
| hudChrome.housing.denied.plinthFull | Every plinth is in use. |
| hudChrome.housing.denied.amenityFull | Every amenity slot is in use. |
| hudChrome.housing.denied.wrongSurface | This furnishing needs a {surface} surface. |
| hudChrome.housing.denied.copyMissing | This furnishing is no longer available. |
| hudChrome.housing.denied.childrenPresent | Move the furnishings on this piece before removing it. |

Surface names use the explicit build.surfaceFloor/build.surfaceWall/
build.surfaceTabletop/build.surfaceCeiling keys when those mechanics land. Every enum added to
freeholdDeniedLineKey has an exhaustive key mapping and mechanism fixture. The
English acceptance text is reconciled to the implemented handler before shipping.

## 5. Steward: a welcoming household ledger

### Player goal and layout

Understand the home's condition, see the next bill, and choose exactly which
materials to spend without fearing loss. The Steward is a standalone .window.panel
following PlantSheetWindow/buildPlantSheetView for a cold decision flow, live
affordability, aria-busy and operation-correlated pending state. Its NEW housing
view/window modules consume authoritative housing and inventory projections.
The fireplace-shaped condition meter is a small readable emblem, not an animated
monetization gauge. Beside it, show condition, amenity availability and next due
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
clock. The same contract applies to paid-through, suspension/resumption and
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
closing the window never offers a new charge as a recovery path.

Website management is a separate capability. Only an approved complete destination
and flow can show steward.manageWebsite. Denied native/storefront surfaces default
to no CTA, including hidden links, fetched purchase catalog, error text or aria
labels. A merely renamed purchase link is not neutral. These surfaces keep
material controls and honest household state. Housing use itself remains behind
the accepted entitlement-model release gate recorded in state.

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

| NEW key | English value |
|---|---|
| hudChrome.housing.steward.title | Steward |
| hudChrome.housing.steward.householdTab | Household |
| hudChrome.housing.steward.visitorsTab | Visitors |
| hudChrome.housing.steward.condition | Condition: {condition} of {maximum} |
| hudChrome.housing.steward.conditionTooltip | Amenities work at {threshold} condition or higher. Below that, amenities pause. Low condition does not prevent entry or decoration. Upkeep never removes your home or belongings. |
| hudChrome.housing.steward.amenitiesReady | Amenities are available. |
| hudChrome.housing.steward.amenitiesPaused | Amenities are paused until your home's condition is restored. |
| hudChrome.housing.steward.nextDue | Next Ledger due: {date} |
| hudChrome.housing.steward.coveredThrough | Ledger paid through {date}. |
| hudChrome.housing.steward.noUpkeep | Your Inn Room has no upkeep. |
| hudChrome.housing.steward.currentPaid | This week's Ledger is paid. |
| hudChrome.housing.steward.ledger | Weekly Ledger |
| hudChrome.housing.steward.needed | Needed |
| hudChrome.housing.steward.bags | Bags |
| hudChrome.housing.steward.vault | Materials Vault |
| hudChrome.housing.steward.rowAria | {item}: need {needed}; {bags} in bags; {vault} in Materials Vault. |
| hudChrome.housing.steward.rowUnavailableAria | {item}: need {needed}; {bags} in bags; Materials Vault balance is unavailable. |
| hudChrome.housing.steward.haveNeed | Have {have} of {need}. |
| hudChrome.housing.steward.source | Pay using |
| hudChrome.housing.steward.bagsOnly | Bags only |
| hudChrome.housing.steward.vaultOnly | Materials Vault only |
| hudChrome.housing.steward.automatic | Bags, then Materials Vault |
| hudChrome.housing.steward.payBags | Pay from bags |
| hudChrome.housing.steward.payVault | Pay from vault |
| hudChrome.housing.steward.payAutomatic | Pay from bags and vault |
| hudChrome.housing.steward.sourceTooltip | Automatic payment takes matching materials from your bags first, then your Materials Vault. Review the listed amounts before confirming. |
| hudChrome.housing.steward.prepay | Prepay Ledger |
| hudChrome.housing.steward.prepayWeeks | Weeks to cover: {weeks} |
| hudChrome.housing.steward.prepayLimit | You can cover up to {limit} weeks. |
| hudChrome.housing.steward.review | Review material payment |
| hudChrome.housing.steward.reviewThrough | Cover your Ledger through {date} using {source}. |
| hudChrome.housing.steward.confirm | Confirm material payment |
| hudChrome.housing.steward.pending | Confirming your Ledger payment... |
| hudChrome.housing.steward.refreshing | Updating your Ledger and material balances... |
| hudChrome.housing.steward.outagePause | Upkeep is paused while the market service is unavailable. No missed upkeep will be added later. |
| hudChrome.housing.steward.absencePause | Wear is paused while you are away. |
| hudChrome.housing.steward.returnGrace | Wear is paused until {date} while you settle back in. |
| hudChrome.housing.steward.call | Master Builder's Call |
| hudChrome.housing.steward.callCurrentTooltip | Pay the current unpaid Ledger and restore condition to {maximum}. Future prepaid weeks stay unchanged. |
| hudChrome.housing.steward.callRepairTooltip | Restore condition to {maximum}. Your current Ledger is already paid. Future prepaid weeks stay unchanged. |
| hudChrome.housing.steward.reviewCall | Review Master Builder's Call |
| hudChrome.housing.steward.manageWebsite | Manage on the website |
| hudChrome.housing.steward.manageWebsiteAria | Open approved home management on the website |
| hudChrome.housing.steward.visitor | Only the owner can manage this home's Ledger. |
| hudChrome.housing.steward.hearthDestination | Hearth Key destination |

## 6. Trophy case, public provenance and plinth placement

### Player goal and flow

See what their adventures have made available, choose a display and share the
truth of that accomplishment. Reuse ReliquaryWindow/reliquary_view,
reliquary_cell_art, reliquary_labels and reliquary_i18n for shelf navigation,
collection art, silhouettes, source hints and scroll/focus preservation. The NEW
trophy_tooltip_view.ts produces a pure public provenance model. The build
palette's Trophies tab uses the same eligibility and selected record; it must
not maintain another account trophy catalog with divergent ownership.

Flow: open trophy case, browse the selected shelf/source, inspect owned display
or safe unearned silhouette, choose Place on a plinth, return to build mode with
the record selected, preview the valid plinth and confirm authoritatively. A
visitor can inspect the same public provenance from the placed object without
seeing the owner's unrelated unearned collection, bags or paid entitlement.
Trophies are account unlock records, never transferable items. Placing/removing
a display never mints, consumes or trades a trophy inventory copy.

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
show the corresponding unknown key. Do not synthesize either. Owner and guest
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
is never reused for a different source predicate.

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

| NEW key | English value |
|---|---|
| hudChrome.housing.trophies.title | Trophy case |
| hudChrome.housing.trophies.search | Search trophies |
| hudChrome.housing.trophies.collectionHelp | Use the arrow keys to move between trophies. Press Enter to inspect one. |
| hudChrome.housing.trophies.refreshing | Updating your trophy collection... |
| hudChrome.housing.trophies.empty | Your adventures will fill these shelves. |
| hudChrome.housing.trophies.noResults | No trophies match your search. |
| hudChrome.housing.trophies.achievedBy | Achieved by {name} |
| hudChrome.housing.trophies.achievedOn | Achieved on {date} |
| hudChrome.housing.trophies.characterUnknown | Original character unknown. |
| hudChrome.housing.trophies.dateUnknown | Original date unknown. |
| hudChrome.housing.trophies.deed | {deedLabel}: {deed} |
| hudChrome.housing.trophies.page | {pageLabel}: {page} |
| hudChrome.housing.trophies.mark | {markLabel}: {mark} |
| hudChrome.housing.trophies.item | Displayed item: {item} |
| hudChrome.housing.trophies.titleSource | Title: {title} |
| hudChrome.housing.trophies.mountSource | Mount: {mount} |
| hudChrome.housing.trophies.unearned | Complete {deed} to display this trophy. |
| hudChrome.housing.trophies.requireDeed | Complete {deed} to display this trophy. |
| hudChrome.housing.trophies.requireTitle | Unlock {title} to display this trophy. |
| hudChrome.housing.trophies.requirePage | Complete {page} to display this trophy. |
| hudChrome.housing.trophies.requireSlain | Defeat {creature} to display this trophy. |
| hudChrome.housing.trophies.requireMasterwork | Craft a Masterwork item to display this trophy. |
| hudChrome.housing.trophies.requireMasterworkCraft | Craft a Masterwork item with {craft} to display this trophy. |
| hudChrome.housing.trophies.requireGatherEvent | Find {find} through {profession} to display this trophy. |
| hudChrome.housing.trophies.requireGoldenHarvest | Gather a golden harvest from a farm bed to display this trophy. |
| hudChrome.housing.trophies.requirePerfectSpecimen | Harvest a perfect specimen from a fallen creature to display this trophy. |
| hudChrome.housing.trophies.requireSet | Complete the {set} collection to display this trophy. |
| hudChrome.housing.trophies.requireItemAcquired | Find {item} to unlock this trophy. |
| hudChrome.housing.trophies.requireItemOwned | Own {item} to activate this display. |
| hudChrome.housing.trophies.requireMount | Collect {mount} to display this trophy. |
| hudChrome.housing.trophies.requireRank | Reach {rank} in {collection} to display this trophy. |
| hudChrome.housing.trophies.requirePerfected | Own a qualifying named Perfected item to activate this display. |
| hudChrome.housing.trophies.setSource | Armor set: {set} |
| hudChrome.housing.trophies.rankSource | {collection}: {rank} |
| hudChrome.housing.trophies.maker | Made by {maker} |
| hudChrome.housing.trophies.namedItem | Named item: {name} |
| hudChrome.housing.trophies.makerUnknown | Original maker unknown. |
| hudChrome.housing.trophies.nameUnknown | Original item name unknown. |
| hudChrome.housing.trophies.inactive | This display is inactive because its required item is no longer owned. |
| hudChrome.housing.trophies.hidden | A trophy for an undiscovered accomplishment. |
| hudChrome.housing.trophies.unknownSource | This trophy's original source is unknown. |
| hudChrome.housing.trophies.place | Place on a plinth |
| hudChrome.housing.trophies.choosePlinth | Choose a plinth for {trophy}. |
| hudChrome.housing.trophies.plinthFull | Every plinth is in use. |
| hudChrome.housing.trophies.ownedAria | {trophy}. Available to display. {source}. |
| hudChrome.housing.trophies.unearnedAria | {trophy}. Not yet available. {requirement}. |
| hudChrome.housing.trophies.hiddenAria | Undiscovered trophy. |
| hudChrome.housing.trophies.inspectAria | Inspect {trophy} |
| hudChrome.housing.trophies.placeTooltip | Display this accomplishment on a free plinth. Removing the display keeps your trophy unlocked. |
| hudChrome.housing.trophies.possessionRequired | This display is active while you own {item}. |

## 7. Visiting: a friend's door and an honest guest role

### Player goal, flow and family

Find a friend's home, know whether entry is possible and feel welcome without
mistaking their controls for the owner's. Gate and NEW visit_prompt_view.ts /
visit_prompt_window.ts reuse the same plant-sheet standalone decision family.
Initial policy is private/friends; guild/public discovery arrives in the later
visiting work. Friend-by-name uses server normalization and a bounded authorized
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
future-policy teasers. The tab contains confirmed policy, policy radiogroup,
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

| NEW key | English value |
|---|---|
| hudChrome.housing.visit.title | Visit a home |
| hudChrome.housing.visit.occupancy | Visitors: {count} of {limit} |
| hudChrome.housing.visit.occupancyTooltip | The visitor limit does not count characters on the owner's account. |
| hudChrome.housing.visit.home | At home: {names} |
| hudChrome.housing.visit.quiet | No one else is home. |
| hudChrome.housing.visit.full | This home is full. Try again later. |
| hudChrome.housing.visit.unavailable | This home is not available to visit. |
| hudChrome.housing.visit.ownerAway | The owner is away. You are welcome to visit. |
| hudChrome.housing.visit.guest | You are visiting {name}. |
| hudChrome.housing.visit.leave | Leave home |
| hudChrome.housing.visit.ownerBuilding | {name} is decorating. |
| hudChrome.housing.visit.policy | Who can visit |
| hudChrome.housing.visit.private | Private |
| hudChrome.housing.visit.friends | Friends |
| hudChrome.housing.visit.guild | Guild |
| hudChrome.housing.visit.public | Public |
| hudChrome.housing.visit.endVisit | End visit |
| hudChrome.housing.visit.endVisitAria | End {name}'s visit |
| hudChrome.housing.visit.endConfirm | Return {name} to the gate? |
| hudChrome.housing.visit.ended | Your visit has ended. You have returned to the gate. |
| hudChrome.housing.visit.pending | Confirming entry... |
| hudChrome.housing.visit.endPending | Ending {name}'s visit... |
| hudChrome.housing.visit.endSucceeded | {name}'s visit has ended. |
| hudChrome.housing.visit.policyPending | Updating who can visit... |
| hudChrome.housing.visit.policySaved | Visiting policy updated. |
| hudChrome.housing.visit.policyConfirmed | Current policy: {policy} |
| hudChrome.housing.visit.policyDraft | Selected policy: {policy} |
| hudChrome.housing.visit.applyPolicy | Apply visiting policy |
| hudChrome.housing.visit.roster | Guests at home |
| hudChrome.housing.visit.rosterEmpty | No guests are here. |
| hudChrome.housing.visit.privateExisting | Current guests may stay until they leave or you end their visit. |
| hudChrome.housing.visit.readOnlyTooltip | Inspect this home's furnishings and trophies. Only the owner can change them. |
| hudChrome.housing.visit.ownerService | This service is for the home's owner. |

## 8. Freehold Charter: permitted WOC Store purchase

### Player goal, scope and family

Understand exactly what a cosmetic home grants before spending. Only browser
web and website-distributed desktop can expose the Charter or Call purchase
surface, and only after counsel, published Terms and accepted economy-service
contract gates pass. Seeker is use-only unless a later explicit ruling changes
the signed surface map. Native iOS, Google Play Android, Steam and Epic do not
receive the housing purchase submodel. A phone browser is still web, not native;
a phone user agent cannot stand in for an authoritative distribution verdict.
Unknown distribution fails closed. An existing wallet capability does not
independently authorize housing purchase or deed functionality.

Use woc_store_view.ts and the store composition in daily_rewards_window.ts,
extended by the planned src/ui/charter_store_view.ts. The same catalog card,
review, durable purchase intent and receipt family serves website desktop and
browser web. Show painted Cottage art with the same finish as the actual room,
exact grant summary, current service availability and service-formatted price.
Do not put an invented dollar amount, conversion, burn percentage, multiplier,
discount or future resale price in the card. A price is a current versioned
service quote; expired/unavailable quotes disable review with a plain reason.
Expiry alone uses charter.quoteExpired. charter.priceChanged is selected only
when a valid comparison actually proves the quoted amount changed.

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
copy, tooltip, aria/alt, errors, network catalog or hidden DOM. The existing Book
of Deeds gameplay noun continues through its localized selector; do not confuse
ordinary achievement naming with on-chain marketing. No disabled Charter tile,
store badge, deep link, click handler or fallback wallet error remains behind
CSS. Approved neutral management, if any, is independently capability-gated as
section 5 specifies. Purchase authority is independently enforced by the economy service's NEW
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
| Error | A stable service/refusal outcome keeps intent identity and explains retry/reconciliation. Sanitized housing copy, never an upstream stack/error dump. |
| Locked | Owned/not eligible/counsel-gated/Terms-gated/service-gated product cannot submit. Native denies are absence, not a grayed-up sell. |
| Visitor | Visiting another home does not expose the owner's purchase state. Allowed account Store remains their own account context outside the visit flow. |
| Owner | Exact owned tier and permitted next action; duplicate initial entitlement is not a second buy button. |
| Pending | Match durable operation/quote/account/plot; one confirmation and recoverable status. Distinguish interrupted checkout from confirmed purchase. |
| Reconnect | Read the original intent/receipt and server grant; either finish ready state, remain reconciling or show confirmed refusal. No second debit. |

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
+----------------------------------------------------+
        review -> original intent -> receipt -> home
Denied surface: this entire purchase component is absent.
```

| NEW key | English value |
|---|---|
| hudChrome.housing.charter.title | Freehold Charter |
| hudChrome.housing.charter.summary | Open a Cottage to furnish, display your trophies and welcome friends. |
| hudChrome.housing.charter.boundary | A cosmetic home with convenience and access features. It grants no combat power. |
| hudChrome.housing.charter.freeRoom | An Inn Room is free for every account. |
| hudChrome.housing.charter.artAria | Cottage interior with a hearth and space for your furnishings |
| hudChrome.housing.charter.review | Review purchase |
| hudChrome.housing.charter.price | Price: {price} |
| hudChrome.housing.charter.quoteLoading | Loading current price... |
| hudChrome.housing.charter.quoteExpired | This quote has expired. Review the current quote before confirming. |
| hudChrome.housing.charter.priceChanged | The price has changed. Review the new price before confirming. |
| hudChrome.housing.charter.confirm | Confirm purchase |
| hudChrome.housing.charter.pending | Your purchase is being confirmed. |
| hudChrome.housing.charter.reconciling | Checking your original purchase. You do not need to buy again. |
| hudChrome.housing.charter.received | Your Cottage is ready. |
| hudChrome.housing.charter.owned | This account already has a Cottage or a larger home. |
| hudChrome.housing.charter.cancelled | Purchase cancelled. |
| hudChrome.housing.charter.unavailable | This purchase is unavailable right now. |
| hudChrome.housing.charter.receipt | Purchase confirmation |
| hudChrome.housing.charter.mapUnavailable | The gate could not be shown on the map. Try again. |
| hudChrome.housing.charter.showGate | Show gate on map |

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
proximity flag. Direct Materials Vault chest is a later Manor unlock. Guest
geometry does not confer permission to owner services. Guild chest and hall
station routing remain separate later service identities.

### Rendering and lights

NEW src/render/freehold/interior_dressing.ts and interior_light_rig.ts compose
through the existing renderer seams. The room uses the existing sun/hemi/env/rim
rig and a housing grade, not new directional/hemisphere producers. The verified
Last Keep warm family is the reference for plaster, warm hearth and cool edges;
any changed coefficients are measured/tuning rows before use, not copied numbers
from a screenshot. LOW's current interior branch skips the richer state light
rig, so the housing renderer must explicitly implement a readable LOW grade or
fallback and prove it. surfaceMat's LOW Lambert path is a first-class target.

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
visiting several homes must not ratchet lights, materials, audio loops or listeners.

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

| NEW key | English value |
|---|---|
| hudChrome.housing.interior.door | Home door |
| hudChrome.housing.interior.hearth | Hearth |
| hudChrome.housing.interior.strongbox | Strongbox |
| hudChrome.housing.interior.strongboxTooltip | Open your personal bank here. This does not add storage space. |
| hudChrome.housing.interior.stationTooltip | Use this home's {station}. Recipes keep their normal skill and training requirements. |
| hudChrome.housing.interior.strongboxVisitorTooltip | This Strongbox opens the owner's personal bank. Guests cannot use it. |
| hudChrome.housing.interior.strongboxPausedTooltip | This Strongbox is paused by the home's condition. The owner can restore condition to use it. |
| hudChrome.housing.interior.stationVisitorTooltip | This station is for the home's authorized users. |
| hudChrome.housing.interior.stationPausedTooltip | This station is paused by the home's condition. The owner can restore condition to use it. |
| hudChrome.housing.interior.plinth | Trophy plinth |
| hudChrome.housing.interior.emptyPlinth | An empty plinth for one of your trophies. |
| hudChrome.housing.interior.amenityPaused | This amenity is paused. The owner can restore the home's condition. |
| hudChrome.housing.interior.preparing | Preparing the room... |

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
| Guildhall boards: understand shared plans and contributions | Existing plant-sheet/list/ledger window and shared tabs; select board/tab, read authorized project or raid-lockout/first-kill list, choose permitted contribution/project action, review, confirm, return. War table is a real authorized projection, not a generic standings redirect. | Empty board explains no records; loading/error/reconnect preserve known state without authorizing spending; locked shows role/condition reason; visitor sees only approved public facts; member can manage assigned personal plinths; officer owns layout/projects. Pending contribution follows durable service/material result. No timed construction wait or new combat benefit. |
| Kitchen Garden: remember an existing harvest | Existing plant-sheet/list family and localized crop/Journal selectors; inspect the account-owner tableau, then owner may open the current character's private Harvest Journal. Guests inspect only safe owner-derived decor. No new beds, remote tending, harvest or growth benefit. | Empty requires a complete successful no-plots source. Loading/error/unavailable cannot imply an empty garden or ready crop. Current local authority can be live; remote/nonlocal committed snapshots remain visibly saved, with truthful mixed-source coverage. Reconnect preserves honest known source state. Selection is read-only; no spending/harvest mutation or pending duplicate action. |
| Wards: find neighbors without losing a quiet home | Existing map marker/list family, bounded public roster and gate prompt; select marker, inspect authorized owner/occupancy, choose visit, then ordinary admission. Physical ward travel and plot-entry permissions remain separate. | Empty plots are scenery, not a ownership scarcity offer; loading/error/busy has retry; private/blocked facts stay private; owner/member and visitor get actual rights. Pending assignment is server-authorized. Reconnect never trusts cached capacity. Every admitted occupant is visible at LOW. |
| Showcases: exhibit a home intentionally | Reliquary-style cards, ordinary opt-in prompt and public source detail; select entry, inspect, visit if allowed, cast eligible account vote, receive acknowledgement. Owner explicitly opts in. | Empty/locked season explains dates/eligibility; loading/error/reconnect preserves vote identity; visitor sees consented public entries; owner cannot vote for their own entry. Pending vote cannot double-submit. Season results/rewards are durable and cosmetic; changing wards does not reset the account vote. |
| Guest books: leave a friendly reaction | Existing compact list and selected reaction radiogroup; read public entries, select wave/cheer/admire, confirm, return. Same touch/pad sequence and shared prompt. | Empty book invites an allowed reaction; loading/error/reconnect cannot duplicate it; closed/blocked denies privately; owner can use normal moderation tools; guest never writes free text. Live per-account limit and retained-entry cap come from state. |
| Advanced layout and dyes: refine an owned arrangement | Extend the existing build palette and plant-sheet confirmation family when live; choose typed surface/snap mode, preview parent/child move, confirm. Dye station selects permitted channel/dye then atomic consumption. Layouts select save/load/share, preview exact-copy shortfalls and changes, confirm. | Empty saves/dyes explain normal acquisition; loading/error leaves current layout; locked dye station follows amenity condition/proximity while ordinary placement stays available. Visitor read-only. Pending/reconnect preserves original operation. Import never grants missing furnishings, includes private names or bypasses bounds. Every changed imported tint uses the canonical dye admission/consumption transaction, current station/proximity/condition and exact owned dye copies; unchanged tint consumes nothing. Preview all dye shortfalls, then commit the whole supported batch atomically. |

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
keys through the same mechanic-first review before introducing a screen.

```text
shared family
    +-- ledger/list -> guild board -> reviewed contribution
    +-- map/marker  -> ward -> authorized visit
    +-- collection  -> showcase -> inspected entry -> vote
    +-- small sheet -> guest book -> closed reaction
    +-- build       -> typed surfaces -> dye/layout review
```

| NEW key | English value |
|---|---|
| hudChrome.housing.garden.title | Kitchen Garden |
| hudChrome.housing.garden.loading | Loading the garden... |
| hudChrome.housing.garden.empty | No garden beds are recorded. |
| hudChrome.housing.garden.live | Current garden |
| hudChrome.housing.garden.saved | Saved garden |
| hudChrome.housing.garden.mixed | Some beds use saved records. |
| hudChrome.housing.garden.incomplete | Some garden beds could not be loaded. |
| hudChrome.housing.garden.unavailable | The garden is unavailable right now. |
| hudChrome.housing.garden.openJournal | Open {journal} |
| hudChrome.housing.garden.liveTooltip | These beds use their owner's current garden records. |
| hudChrome.housing.garden.savedTooltip | These beds use saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.mixedTooltip | Some beds use current records and others use saved records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.savedStatus | {status} (saved) |
| hudChrome.housing.garden.savedReadyTooltip | This bed appears ready from saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.journalTooltip | Open your current character's {journal}. |
| hudChrome.housing.garden.growing | Growing |
| hudChrome.housing.guild.title | Guildhall |
| hudChrome.housing.guild.fund | Hall Fund |
| hudChrome.housing.guild.projects | Hall projects |
| hudChrome.housing.guild.contributions | Contributions |
| hudChrome.housing.guild.warTable | War table |
| hudChrome.housing.guild.noRecords | Your guild has no records here yet. |
| hudChrome.housing.guild.officerRequired | A guild officer can manage this project. |
| hudChrome.housing.guild.ownPlinth | Your assigned trophy plinth |
| hudChrome.housing.ward.title | Neighborhood |
| hudChrome.housing.ward.endeavors | Neighborhood Endeavors |
| hudChrome.housing.ward.favor | Neighborhood Favor |
| hudChrome.housing.showcase.title | Home Showcase |
| hudChrome.housing.showcase.enter | Enter your home |
| hudChrome.housing.showcase.consent | Make this home's approved public display visible in the Showcase? |
| hudChrome.housing.showcase.vote | Vote for this home |
| hudChrome.housing.showcase.noEntries | No homes have entered this Showcase yet. |
| hudChrome.housing.showcase.voted | Your vote is recorded. |
| hudChrome.housing.guestBook.title | Guest book |
| hudChrome.housing.guestBook.empty | Leave a friendly reaction for the owner. |
| hudChrome.housing.guestBook.wave | Wave |
| hudChrome.housing.guestBook.cheer | Cheer |
| hudChrome.housing.guestBook.admire | Admire |
| hudChrome.housing.guestBook.recorded | Your reaction is recorded. |
| hudChrome.housing.layouts.title | Layouts |
| hudChrome.housing.layouts.save | Save layout |
| hudChrome.housing.layouts.load | Load layout |
| hudChrome.housing.layouts.share | Share layout |
| hudChrome.housing.layouts.review | Review layout changes |
| hudChrome.housing.layouts.shortfall | You need {count} more of {item} for this layout. |
| hudChrome.housing.dyes.title | Dye station |
| hudChrome.housing.dyes.apply | Apply dye |
| hudChrome.housing.dyes.review | Review dye use |

## 11. Exact screenshot registry and fixture contract

### Registry ownership and one-shot semantics

These are NEW planned script symbols, not existing exported APIs. File 09 introduces
scripts/lib/pr_shot_housing.mjs and its housingReviewTargets export with only the
functional interior subset. File 11 extends that same build descriptor; 16/17/18
append their functional targets. There is one descriptor per target key, never
parallel interior and build descriptors with a duplicate key. The existing scripts/pr_shot_targets.mjs receives
only this import/spread in TARGETS. Every capture(page, variant) returns one
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

Registration is cumulative by actual producer: file 09 registers the interior
baseline subset (12 variants); file 11 extends the same target to 89; file 16
reaches 178; file 17 reaches 226; file 18 reaches 330. File 20 verifies the complete
330-variant inventory. Earlier files require only their registered working subset,
never nonfunctional future UI. These are derived inventory counts, not new gameplay
or tuning values.

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
  'src/render/freehold/interior_light_rig.ts',
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
visit-owner-building identity registered by 18;11 carries the two-client behavioral
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

The ordinary offline constructor currently gets devCommands from
import.meta.env.DEV; server ALLOW_DEV_COMMANDS has no browser bridge. File 07
owns this NEW housing-only explicit dev/loopback bridge, realizing existing
D3/D24 intent while leaving ordinary devCommands unchanged:

| NEW owner/module | Exact engineering responsibility |
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
| Keyboard | Real open/tab/grid/confirm/cancel/close sequence, focused control visible, no focus lost after relocalize or authoritative refresh. |
| Gamepad | Actual active-family glyphs and successful palette, move, rotate, nudge, confirm, undo and cancel sequence; no simultaneous combat action. |
| Touch | Real compact/tablet tap-only and drag arbitration, safe areas, target size and input floor; no action hidden under existing HUD or keyboard. |
| Portrait shell | Existing rotation-gate presentation remains correct; no claim of a playable portrait build editor. |
| Audio and mute | Separate event evidence: ordinary feedback only on a newly accepted delivered transition; no cue/directive remint on replay/resume or fresh-client recovery; commit-before-ACK may skip output. Matching placement/payment feedback, mute and spatial teardown still apply. Screenshots cannot prove sound. |
| Multiplayer/authority | Two-client public revision/privacy, full-cap/refusal, offline-owner admission and revocation; restart/receipt integration for paid results. Offline screenshot fixtures cannot prove these. |

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

The checked-in [English key inventory](ux-key-manifest.json) and
[screenshot target inventory](ux-shot-manifest.json) are generated from this
specification's tables and executable registry examples. They record the approved
329 keys and 330 planned variants, respectively; they are requirements, not
screenshots, implemented translations or evidence that a capture ran. A later
reviewed source change regenerates the matching inventory in the same change.
