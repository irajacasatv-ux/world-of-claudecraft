# Provisional cross-platform review

Coordinator transcription of cross_platform_sync specialist complete response. Scope original16f2aeed2b..c47e2cb245, merge041fd790ce, developing fixes. No tests or mutations by reviewer. Two new findings, final evidence pending.

PARITY-C1 (medium): item_compare effectiveStat/item_compare_view still credits loaded furnishing rolled.str100, so real armor str10 advertises -90 though furnishing contributes0. HUD statModel and player_card_data similarly project malformed authored weapon/stats/spellPower. Exclude furnishing on both comparison sides and at adapters; actual composed comparison and eligible gear controls required. Distinct from actual simulation power defect.

PARITY-C2 (low coverage): original synthetic tests stop at listingEligibility/category/hard-lock leaves. Drive sellableRows, lockedOutRows, wocTradableSlot, extractTradableCopy with all qualities, mount-policy switch and applicable locks; extraction negatives immutable, eligible controls required. Source trace finds no production disagreement.

Original host coverage and simulation-power issues tracked without duplicate counts. IWorld facade/command tokens unchanged; ClientWorld sends intent, GameServer validates through shared Sim. Inventory/equipment/instances/bank/guild/mail/market fields retain delta omission guards. applySnapshot computes shared character modifiers, requiring loaded furnishing set-effect display proof. RL vocabulary unchanged; eat_drink positively food/drink. Storage retains pipe-specific locks and copy shapes. D25 shared mount eligibility remains, furnishing browse identityother and no riding identity. Tooltip core host independent, bar eligibility shared.

Excluded inherited behavior: browseQualityOptions collectible choices begin uncommon although existing mounts admit lower qualities. Furnishing inherits mount policy and All browse works. This is not a new furnishing finding and D25 is not reopened.

Completion pending finished presentation/parity fixes plus scoped/type/i18n/protocol evidence. Provisional report is not PASS.

## Final scoped review

Cross-platform specialist re-read sealed ce0e25ec8593605d8f609074c4854fec56a811b2, tree7ad83845a4cf7f48631bbbf0cf152e07c11e18ab and clean worktree. Verdict PASS:2found2resolved0outstanding, no additional findings.

PARITY-C1 resolved: comparison treats equipped furnishing as zeropower/refusescandidate; eligible equipment sources and weapon-kind DPS at HUD/playercard. Actual hover pins100rolledStrength furnishing vs10Strength armor, malformedcapabilities, fistDPS and gearcontrols. PARITY-C2 resolved: actual sellableRows/lockedOutRows/wocTradableSlot/extractTradableCopy cover allqualities/default,mountpolicy,soulboundtolerance,ownership/bond/armed/listinglocks; extraction negatives immutable and eligible copies exactone.

Prior power/host issues verified resolved without duplicate counts. Actual ClientWorld intent reaches GameServer/sharedSim equip/use/disenchant/salvage/enchant/sunder/unbind/Perfecting/rankswap gates with eligiblecontrols. Shared three-host simulation filters loadedfurnishing stats/weapon/set/abilities/procs/caps while preservingstoredcopies. Actual ClientWorld set snapshot keeps Overpower baseline, eligible set changesit. Signed bank/guild deposit+withdraw,mail send/take,marketlist/search and omitted deltas tested. Fresh custodyreloads preserve signer/recipe and repeatnegative. D25mountpolicy/browseother retained without riding. Keyboard/XHBonbar/XHBonly inertwithpotioncontrols; RLwarrior/mageeatdrink ignoresforgedfurnishing and consumeseligiblefood/drink. No Python/actionvocabchange. Shared presentation/copy facts consistentacrosscells/cards/tooltips/comparison. No command/eventvocabchange, localizedcustodytruthful, placementkeyvaluesauthored.

Inspected exactcommands validation-results.md and logs:consumer182,expanded207,display56,cell412,required477;neighbors339passed3existingreleaseonlyskips;tsc exit0. Fullsharedgate stillrunning atscopedclosure. Collectiblequalityfloor remains inheritedexcludedbehavior, not outstandingfinding. Finalvisual/postcommit/fullgate remain coordinatorrequirements.
