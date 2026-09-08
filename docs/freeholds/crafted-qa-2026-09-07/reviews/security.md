# Security and server hot-path review

Coordinator transcription of the independent `security_review` specialist's final report. The specialist performed no writes or deterministic commands.

Verdict: PASS for scoped static review. Zero verified security, privacy, authority, deterministic-integrity or server hot-path findings; no actionable uncertain finding remains.

Scope: authored `49ed3f0933..3666d89647`, then integration effects at `2e24ba8818` on acquisition, hello construction, dispatch and shared save/journal wiring. Unrelated upstream features were outside this review.

- Server authority: `server/game.ts:6269` derives the player from the authenticated session; crafting, training and quartermaster requests reach the authoritative Sim. Training validates station, source, skill, knownness and affordability. `train_recipe.ts:14` checks availability before that chain. `instances/heroic_vendor.ts:32` validates availability, life, range, Marks and capacity before mutation.
- Disabled hosts: acquisition, resolution, preview and cast start check availability in `crafting.ts`. Refused pattern grants restore knowledge and retain the copy. The server requires exact `FREEHOLDS_ENABLED === '1'`; hello advertises only strict true. Client decode clears missing, false or malformed capabilities on reconnect.
- Privacy: `server/world_hello.ts:19` selects public fields explicitly; it does not spread configuration/session data, credentials, account IDs or owner keys. Fresh joins and resume share the builder. No new sensitive logging or authentication surface belongs to this packet.
- Abuse bounds: stale-session and shutdown guards precede dispatch; frame/byte checks precede JSON parsing; command lanes precede mutation. Craft batches remain finite and capped. Added catalogs are authored finite sets.
- Durability: furnishing crafts keep existing planned consumption and vault reservation before mutation. `server/game.ts:1815` checks account, character and session ownership. `sim_context.ts:1771` creates one frozen planned take list. Existing character FIFO and save acknowledgement retain realm/account/character/lease checks. No new SQL, transaction boundary or per-ingredient async work was added.
- Cost: availability is constant-time set membership, recipe projection is catalog-bounded and cached, and personalized hello serialization happens on join/resume. No new tick scan, broadcast fan-out, retention collection or redundant database read was introduced.
- Secrets and determinism: the original packet's 102,827 added text lines produced zero credential-signature candidates; added sim lines produced zero `Math.random`, `Date.now` or `performance.now` candidates. Existing strict dev-command guards remain intact.

Evidence limits: this is source review, not a production flag check, deployment test or latency measurement. The specialist inspected supplied typecheck and 22-suite/744-test results without rerunning them. Final settled-tree gates remain coordinator-owned. No new load or PostgreSQL plan experiment is warranted solely by this bounded content delta.
