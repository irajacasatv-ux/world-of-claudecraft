# Furnishing market identity correction

Implemented Q27, Q29 and Q36 in the packet worktree. Parent owns test execution and final review.

Q27: Exchange Sell and locked-copy rows resolve furnishing quality from the authored definition through the shared presentation projection. Existing Browse, detail and Activity rows normalize furnishing quality from the definition. The server stamps the same authored quality on a newly escrowed listing and normalizes old public listing row quality at the wire projection. Ordinary gear keeps its rolled quality and existing unknown-tier behavior. Mount-rule eligibility and every price, category, filter, SQL operation and custody payload remain unchanged.

The wallet confirmation describes a furnishing copy only by its actual maker, through the existing control-character, Unicode-format, whitespace and length sanitizer. Empty sanitized makers produce no Copy line. Raw `expectInstance`, `itemCopyPin`, the binding digest, extracted payload and crafted recipe identity are preserved. Regression variants prove that unsupported name, rarity, masterwork, enchant, stats and Rift fields can produce identical human descriptors while still producing distinct cryptographic binding identities.

Q29: A World Market furnishing sale omits the equipment-only chosen-name stamp. The Collect projection also omits this name from older loaded furnishing ledger rows without rewriting saved history. Counts, money, buyer names, item IDs, escrowed copies and eligible named-gear behavior remain unchanged. Tests drive actual listing, purchase, JSON serialization, fresh load, Collect model, Collect painter and proceeds collection, with named gear as the control.

Q36: Removed the unused `listingSoldNoticeCustodyRef` import and the `walked` declaration/increment from the Exchange coordinator. `walked` was never read; the payout loop's time check, counter result, budget signal and all effects are unchanged. The three removed lines pay for the quality branch, leaving `server/woc_market.ts` at its existing exact ceiling of 3945 lines.

Owned files:

- `server/woc_market.ts`
- `server/woc_market_routes.ts`
- `server/woc_market_stepup.ts`
- `src/sim/market.ts`
- `src/ui/market_view.ts`
- `src/ui/woc_market_view.ts`
- `tests/furnishing_exchange_identity.test.ts`
- `tests/furnishing_market_identity.test.ts`

Parent's decisive red run: `/tmp/freeholds-02-audit/late-market-red-fixed-fixtures.log`, seven failed behavioral assertions before production edits. Earlier fixture setup failures were corrected before this red run and are not claimed as defect evidence. Local worker commands were limited to targeted reads, patch application and explicit-file Biome formatting; no tests, staging or commits were run by this worker. Green execution and independent review remain with the parent.
