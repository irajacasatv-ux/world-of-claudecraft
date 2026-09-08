# Crafted content security review

Coordinator transcription of the woc_security review. PASS for scoped source
changes at 0932963250: zero findings, nits or unresolved suspicions. High
confidence in traced acquisition paths. No files edited or tests rerun.

The ten named original/repair commits preserve server actor authority: game.ts
derives the actor from the authenticated session, then existing bounded command
lanes dispatch crafting, training, use and quartermaster commands as that actor.
Craft acquisition, cast start and completion guard availability before effects.
Training checks availability before its validator and fees; the quartermaster
checks before Marks and inventory mutation.

items.ts validates ownership and selected slots before pattern_items.ts. Failed
acquisition restores previous knowledge and retains the pattern; success consumes
the selected copy and replay cannot consume another after the recipe is known.
The hello exposes only boot-time strict-true presentation capability. Both join
paths use it; absent/malformed capability clears the client flag. A forged client
mirror cannot enable server acquisition. Catalog identities remain complete on
dark hosts, with no schema or save-field removal.

Both full protected declarations independently match 86eb86bbe2^: 8,599 bytes
for evaluateCraftAdmission, SHA256
02084dd3b64fc40fc1f15bf18226964176f232ebd763829ca9402728772870c3;
1,040 bytes for resolveTrain, SHA256
ca7437959bbc99f2f155217bc25f8a8b0f9ffb5b420808ae83728567fc90bbd3.

No changed auth, session, OAuth, TOTP, recovery, wallet-link, admin/internal
authorization, SQL, static-path or production dev-command configuration. No
newly exposed account data or sensitive logging. Added-line scans found no
credential/private-key signatures or forbidden sim clock/random/import calls;
broader hits were screenshot settings, fixture UI text and test/report references.

Inspected tests cover preservation, selected-copy and duplicate learning,
profession/tier refusal, quartermaster admission, hello/resume, market custody
and deterministic replay. Initial scoped run: 20 files, 938 passed, three
release-only checks skipped. The shared gate malware step scanned 8,645 files
and found zero high findings after priors. Final gate and PG outcomes remain
coordinator-owned. Production environment values were not inspected, so this
verifies code gating rather than deployed settings.
