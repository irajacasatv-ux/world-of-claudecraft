# Housing research index (Freeholds and Guildhalls)

Everything the Freeholds and Guildhalls proposal rests on, in one place. Start with the
proposal, then read a lane only when you need its sources.

| File | What it is |
|---|---|
| `../freeholds-and-guildhalls-research.md` | The proposal: rulings adopted 2026-09-05, the PR #3872 re-read, the store-safe model, the MVP slice (section 13), the roadmap, the engineering blueprint. |
| `../freeholds-and-guildhalls-deck.html` | The player-facing announcement deck (thirteen slides, arrow keys or scroll, prints one slide per page). No internal detail, no prices. |
| `code-crypto-guilds.md` | Codebase lane: Claudium rails, the token firewall, guilds and the guild bank, bank storage, holder tiers, the Seeker entitlement, telemetry. |
| `code-content-systems.md` | Codebase lane: Reliquary and Deeds, professions and materials, the absence of durability, items and rarity, cosmetics, mail, gold sinks. |
| `code-world-instancing.md` | Codebase lane: instancing, zones and free land, props and civic services, persisted objects, the world editor, guild presence, the mobile floor. |
| `web-mmo-housing.md` | Web lane: WoW Midnight, FFXIV, ESO, OSRS, EQ2, WildStar, SWG, UO, New World, ArcheAge, EVE, Albion, Entropia, with every URL. |
| `web-upkeep-ux.md` | Web lane: upkeep economics, decor economies, trophy display, placement editor UX, housing monetization data, guild halls, and the upkeep recommendation. |
| `web-web3-land.md` | Web lane: virtual land outcomes, why land models failed, token utility patterns, the 2026 regulatory and platform constraints, Solana specifics, guild-owned property. |

The three codebase lanes were read against the worktree on 2026-09-05 (release/v0.41.4
plus PR #3872 at head `0f53c92ff7`); the three web lanes were fetched the same day and mark
unverified claims inline. The named seams and constants are anchors to verify, not
promises: check them against the tree before building on them.

Status, rulings, and the next step live in the proposal's status block and section 12.
The next step is the Phase 0 PRD off release/v0.42.0 once PR #3872 merges; while that PR
is open, base the packet branch on its head.
