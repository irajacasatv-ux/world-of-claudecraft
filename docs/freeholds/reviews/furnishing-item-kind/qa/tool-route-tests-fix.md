# Furnishing tool route coverage

Owner: `tests/furnishing_tool_parity.test.ts` only. No production edits, test
execution, generators, staging, or commits were performed by this worker.

The cross-platform reviewer `parity_final_resumed` supplied the complete bounded
extra tool route list and assigned it to existing finding Q07. All six cases now
run once through the offline `Sim` and once through the actual `ClientWorld`
command, `GameServer.handleMessage`, event routing, command outcome, and snapshot
decode chain. The shared server/client fakes only replace sockets and database IO.

| Route | Furnishing assertion | Eligible control |
| --- | --- | --- |
| `slotToolEffect`, charm selection | `toolEffectResult` with literal `no_charm`; no item or state mutation | The same method consumes one eligible charm and creates the 20-charge `gatherers_cache` slot. |
| `slotToolEffect`, tool selection | `toolEffectResult` with literal `no_tool`; the charm remains | The same method consumes the charm with an eligible mining tool present. |
| `rechargeToolEffect` | Literal `no_tool`; depleted slot and three dust unchanged | The same method starts and completes the real recharge lifecycle, spends exactly two dust, and restores exactly 20 charges. |
| `harvestNode` | `false` plus the exact `gatherDenied` node/tool event, with no cast | The same method answers `true` and starts the real ore-node cast at 2.5 seconds. |
| `plantCrop` | Literal `farmDenied/tool`; seed and empty plot map unchanged | The same method spends one seed, makes one plot, starts the farming cast, and draws exactly twice. |
| `harvestCorpse` | A malformed furnishing cannot unlock the tier-two premium specimen; the literal corpse tool denial is mirrored | The same method with a real tool grants one `pristine_hide` specimen, preserving the ordinary hide quantity and two-draw stream. |

Every rejected whole command captures independent clones of the non-null player
metadata, all live entities, next entity ID, feast state, and finite RNG state.
The relevant full client mirrors are compared before the command, before its
snapshot, and after synchronization. Inventory copies and counts remain pinned;
the accepted controls explicitly prove no client-side prediction before sync.

The furnishing is the shared synthetic record with deliberately compatible
`use` metadata. Control tool and charm definitions also use synthetic IDs. No
shipping furnishing ID or asset is introduced.

The corpse arm preserves its actual contract: a tool denial downgrades premium
yield, not the whole harvest. All shipping monster material families currently
have tier one, so the existing mutable `MONSTER_MATERIAL_TIERS` test seam raises
`hide` to tier two and restores it after each test. The real Mulberry32 stream is
seeded at the same command boundary with state 9; its second draw is a rare roll.
The accepted command is completed through production `updateCasting` fixed steps,
which retains real admission, reservation, revalidation, charge consumption,
completion, and cast-stop handling without unrelated ambient-world RNG.

The fishing route was separately checked with both the parity and test-coverage
reviewers. `ClientWorld.useItem` sends only the generic `use` command. The existing
consumer-parity suite drives that command with forged fishing metadata and pins
the early furnishing refusal, then proves eligible use with the same method.
Its offline rows exercise both fishing metadata forms with real fishing controls;
the item-kind suite separately pins both implement helper forms. Neither metadata
form can reach a different transport arm before the shared furnishing refusal.

Parent validation on the final file: the route suite run passed three files and
24 tests, including all 12 tool cases (`tmp/freeholds-02-audit/routes-final.log`).
The parent also reported `npx tsc --noEmit` and the scoped Biome check exiting 0.
Worker formatting `npx biome check --write tests/furnishing_tool_parity.test.ts`
exited 0 with no remaining edits.

The first execution exposed fixture-only omissions, now corrected: the remaining
dust includes its canonical material-source bucket; the ore `castStart` includes
`gatherNodeType`; and corpse preference accepts the material ID `rough_hide`, not
the family tag `hide`. The preference now has explicit server and client pins, so
an unintended All-materials choice cannot hide behind a changed RNG expectation.
The single-family harvest still draws exactly twice.

Final source commit: `d38663539433cbcd30642ea47d7663c5c52c59c0`.
`git diff d38663539433cbcd30642ea47d7663c5c52c59c0 -- tests/furnishing_tool_parity.test.ts`
and scoped `git status --short` both produced no output. The file is frozen while
the parent runs the shared gate. No new distinct finding was added; this closes
the Q07 route-coverage extension.
