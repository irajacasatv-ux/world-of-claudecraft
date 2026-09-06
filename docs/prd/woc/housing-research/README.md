# Housing research index (Freeholds and Guildhalls)

> **Dated research, not implementation authority.** Captured 2026-09-05. The
> [proposal](../freeholds-and-guildhalls-research.md) and [state](../../../freeholds/state.md)
> record the requirements adopted on 2026-09-06. Historical
> code inventories, editor capabilities, opinions and market figures below are context,
> not current API guarantees, WOC tuning approval or legal/store approval.

Historical source trails for the proposal. Start with state and the proposal for current
decision status; use each lane for its dated evidence and explicit corrections.

| File | What it is |
|---|---|
| `../freeholds-and-guildhalls-research.md` | The proposal: rulings adopted 2026-09-05, the PR #3872 re-read, the adopted distribution model and release gates, the MVP slice (section 13), the roadmap, the engineering blueprint. |
| `../freeholds-and-guildhalls-deck.html` | The player-facing announcement deck (thirteen slides, arrow keys or scroll, prints one slide per page). No internal detail, no prices. |
| `code-crypto-guilds.md` | Codebase lane: Claudium rails, the token firewall, guilds and the guild bank, bank storage, holder tiers, the Seeker entitlement, telemetry. |
| `code-content-systems.md` | Codebase lane: Reliquary and Deeds, professions and materials, the absence of durability, items and rarity, cosmetics, mail, gold sinks. |
| `code-world-instancing.md` | Codebase lane: instancing, zones and free land, props and civic services, persisted objects, the world editor, guild presence, the mobile floor. |
| `web-mmo-housing.md` | Web lane: WoW Midnight, FFXIV, ESO, OSRS, EQ2, WildStar, SWG, UO, New World, ArcheAge, EVE, Albion, Entropia, with every URL. |
| `web-upkeep-ux.md` | Web lane: upkeep economics, decor economies, trophy display, placement editor UX, housing monetization data, guild halls, and the upkeep recommendation. |
| `web-web3-land.md` | Web lane: virtual land outcomes, why land models failed, token utility patterns, the 2026 regulatory and platform constraints, Solana specifics, guild-owned property. |

The three codebase lanes were read on 2026-09-05 against the author's `add-real-estate`
worktree (release/v0.41.4 plus PR #3872 at head `0f53c92ff7`, a head itself based on
release/v0.42.0). The packet's own base is that PR head on release/v0.42.0 (state.md
"Worktree, base, and merge-forward"), so the two trees differ by the commits between those
releases; the three web lanes were fetched the same day and mark unverified claims inline.
The named seams and constants are anchors to verify, not promises: check them against the
tree before building on them.

Revision note (2026-09-06): the proposal, the deck and these six lanes are the settled
propagation of the text adopted on 2026-09-05 at revision `383fd7da83` (also the
FernandoX7/add-real-estate head), edited in place under the decisions recorded in
state.md. The proposal's status block lists its section-level changes and their decisions.
Each lane keeps its original conclusions where they were rewritten after capture: the
original text stands under a "Superseded 2026-09-06 by D<n>" marker beside the adopted
replacement, so the dated trail can still be re-checked.

Current status, dependency sync and next-file ownership live in
[progress](../../../freeholds/progress.md) and [state](../../../freeholds/state.md).
Fernando approved R01 through R46 on 2026-09-06. The proposal is aligned to those
requirements; nothing is implemented or submitted to a store by this documentation
work. All asset generation uses Codex. The packet closes with final placeholder
icon/image replacement in 44a, then a completed-implementation Terms/legal and
rights/provenance bundle for the legal team in 44b. Earlier release gates remain.
