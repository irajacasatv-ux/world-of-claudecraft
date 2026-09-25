# The write-blocked hold: the player-facing surface, SCOPED

C23. This is a SCOPE document, not an implementation. It names the exact `t()`
keys, the render sink each one goes to, and which load-failure kinds the player
is told apart. No key here exists in the catalog yet, nothing renders it, and the
housing UI is still dark.

Why it is scoped here and built separately: the identity fix that closed the
eighth path touches the sim's load path and this surface touches the HUD, and
merging them makes one reviewable change into two unreviewable halves. The gate
itself is carried in
[persistence-rollout-contract.md](persistence-rollout-contract.md) section 8a.

## The problem this closes

When a durable load is HELD, `installLoadedFreehold` installs nothing and
`addPlayer` seeds the free tier-0 Inn Room. The owner therefore sees an EMPTY
DEFAULT HOUSE, with none of their furnishings, none of their tier, and no
explanation, while their real row sits intact on disk. Every edit they make that
session is refused at the write seal and discarded at logout. The only observer
this release has is an operator watching the `held` gauge.

Every capacity item in section 8a makes a hold more reachable, so this and they
are one obligation.

THE SAME EMPTY HOUSE WITH NO HOLD AT ALL, and a worse loss, added 2026-09-25. A
join that lands just after the same account's previous session was evicted (a
quick relog onto another character while the old leave is slow, or a linkdead
session's grace expiring while a new handshake is in flight) installs nothing,
because its answer was read beside the old record, and `addPlayer` seeds the
same empty default. The store then refuses that record at the seal or the insert
refusal and quiesces the entry: no `kind` is booked, so a surface keyed on the
hold kinds alone never sees this group. THE PREMISE ABOVE DOES NOT HOLD FOR IT:
a leave capture still waiting to be written when the join lands is released
unwritten, so the leaver's last edits reach no row, and for an account whose
first insert had not landed there is no row at all and the whole first house is
gone. Copy that carries the hold's premise, that the real row sits intact on
disk, would be false here. The surface owes this group too, keyed on the entry
being write-blocked rather than on a hold, and a ruling on recovering the
capture is owed first (the ledger's harness-fidelity section has the order, the
cost and the ruling).

THE SAME GROUP SEES AN OLDER HOUSE TOO, not only the empty default. The seal
also refuses, with no hold, a record installed from an answer that went stale
during the handshake (another session of the account edited and left inside it),
and a superseded leave capture offered to a rejoin as the install source. When
the store already knows a commit above that stale house (the leaving session's
own save, or an earlier session's), refusing it also loses the leaving session's
later edits, so here too the real row is not the house the leaving player last
saw. Those players see an older house, write-blocked, so copy that assumes an
empty house would be as wrong as copy that assumes an intact one. Some orders of
the stale answer are refused by nothing and write silently (the twelfth path);
no surface can see those, and the ruling owed on it decides whether any remain.
A HELD login (on capacity or a thrown read) that joins after the same account's
other session was evicted loses that session's unwritten capture the same way,
loudly: the held player sees the empty default the hold already explains, and
the leaver's last edits are gone, which copy built only on the hold kind would
not say.

## The rule this design is built under

`src/sim/` and `server/` are LANGUAGE-AGNOSTIC. Neither may emit English prose
for this surface. The server already has the vocabulary it needs: the hold
carries a `kind` from `FREEHOLD_LOAD_FAILURE_KINDS`, which is a stable token, and
the client matcher maps a token to a `t()` key exactly as
`freeholdDeniedLineKey` already does for the ten text-free `freeholdDenied`
reasons. `hold.detail` is DEV-CHANNEL PROSE and must never reach a player: it is
bounded for a log, not written for a reader.

## What the player is told apart, and what they are not

There are NINE load-failure kinds. Telling a player all nine apart would be
nine strings for a distinction they cannot act on, and telling them nothing
would be one string that says "something went wrong", which is not worth a
string at all. The split is by WHAT THE PLAYER CAN DO:

There are NINE kinds, and the ninth (`unnamed_record`, the ordering cause) reads
as RETRY to a player: the next login builds a fresh entry whose durable read runs
before the record is seeded, which is exactly the thing a relog fixes.

| kind | group | what the player can do |
|---|---|---|
| `cap_full` | RETRY | nothing now; it clears by itself, and a relog is worth trying |
| `no_permit` | RETRY | the same |
| `read_threw` | RETRY | the same |
| `no_budget` | RETRY | the same |
| `unadmitted` | REPORT | nothing; a person has to look at the row |
| `unsupported` | REPORT | the same |
| `malformed` | REPORT | the same |
| `oversize` | REPORT | the same |
| `unnamed_record` | RETRY | nothing now; the next login reads before the record is seeded |

TWO GROUPS, and they are NOT the repairable and terminal split ruling 2
introduced. An earlier version of this paragraph said they lined up exactly, and
its own table eleven lines above falsified it: `unnamed_record` is TERMINAL in
`FREEHOLD_TERMINAL_HOLD_KINDS` and reads as RETRY to a player, because what a
later read cannot fix within one session a fresh login can. Deriving the player
group from the runtime set would therefore tell the one player a relog reliably
helps that their home will not clear on its own, and send them to report a
non-incident. The player split is its own decision: RETRY is every kind a relog
can clear (the four capacity kinds plus the ordering one), REPORT is the four
DATA kinds, where the same row answers the same way every time. A third message
would be a distinction with no action behind it.

## The keys

One new sub-family, `hudChrome.housing.held.*`, beside the existing
`common`, `denied`, `gate`, `furnishing` and `hearthKey` families in
`src/ui/i18n.catalog/hud_chrome.ts`. English only; the maintainer fills every
locale at release.

| key | English | render sink |
|---|---|---|
| `hudChrome.housing.held.bannerRetry` | Your home could not be opened right now. Nothing has been lost. Try again in a moment. | a banner row in the housing window's PAINTER. There is no housing window module yet: `src/ui/hud/housing/housing_view.ts` is the DOM-free view core (its sibling `gate_prompt_painter.ts` is where that family's markup lives), so the release that builds this owes a `housing_painter.ts` beside it and the banner's text belongs there, chosen by a view-core field. |
| `hudChrome.housing.held.bannerReport` | Your home could not be opened, and this one will not clear on its own. Nothing has been lost, and no changes you make now will be saved. | the same banner row, same painter |
| (no new key) | Read only | REUSE `hudChrome.housing.common.readOnly`, which already exists and already says this; a second key for one word is drift. Listed here so the badge is not forgotten, not as a key to add. |
| `hudChrome.housing.held.editRefused` | Your home is read only until it opens. Nothing you do now will be saved. | `host.showError` through `handleFreeholdEvent`, the sink the ten `freeholdDenied` reasons already use, on any placement or policy command attempted while held |
| `hudChrome.housing.held.tooltip` | This is not your saved home. Your home is on the server and is not being changed. | the Hearth Key item tooltip (`src/ui/hud/housing/hearth_key_tooltip.ts`), appended while held |
| `hudChrome.housing.held.gateAria` | Your home is read only right now | the gate prompt's `aria-label`, through the painter in `gate_prompt_painter.ts` |

FOUR SINKS, FIVE NEW KEYS, and the two counts differ on purpose: the two banner
strings share one sink and `readOnlyBadge` names no sink of its own, because it
is the existing `common.readOnly` reused rather than duplicated. Counting table
rows as sinks is how a scope document promises a surface it has not designed.

WHAT NONE OF THEM SAYS. No key names a kind, a plot index, a revision, a byte
count or an account. The player is told the state and what it costs them; the
diagnosis is the operator's, through
`woc_freehold_load_failures_total` by `kind`.

## What the wire owes it

Nothing today: `LoadedFreehold.hold` is consumed server-side by
`installLoadedFreehold` and never reaches a client. The release that builds this
owes ONE wire field, a text-free hold group (`retry` or `report`, or its absence)
on the self-wire, and its `IWorldHousing` member beside `myFreehold`, implemented
in BOTH `Sim` and `ClientWorld` with the parity pin updated in the same change.
The GROUP travels, never the kind: the kind is an operator's vocabulary and
widening it later must not be a wire change.

Offline and headless hosts have no store, so they hold nothing and the member is
always absent there.

## What it does NOT cover

It does not cover the SILENT cross-realm quiesce (section 8a), where a second
realm's write fences stale after a successful load. That account is not held, its
record is real, and its session's edits are discarded by a different mechanism.
It needs a different message and it is a different obligation.
