# Furnishing commerce host coverage

Implementation owner: commerce_host_coverage. Scope: only
`tests/furnishing_commerce_parity.test.ts`. No production code, generated output,
assets, translations, or database schema was changed by this worker. This closes
the commerce portions of Q07 and Q09; the audit finding total stays 40.

The completed file is in commit
`d38663539433cbcd30642ea47d7663c5c52c59c0`. A read of that committed file confirmed
the quest-offer refusal, material provenance expectation, and literal crafting
fees are present. `git diff` from that commit for the owned file was empty when
the source freeze began.

## Coverage

The shared synthetic `FURNISHING` fixture supplies the furnishing id. Existing
content ids are used only as eligible materials, riding service, vendor, or quest
controls. No furnishing content id is shipped by these tests.

| Command | Exercised path | Decisive assertions |
| --- | --- | --- |
| `craftItem` | Offline Sim and actual ClientWorld command, GameServer dispatch, Sim admission, production `updateCasting` completion, event routing, decoded client inventory | Both ordinary forged stat-bearing furnishing and forged Masterwrought furnishing yield exactly one signer-only copy despite commission opt-in and a forced proc hit. No commission, rolled bonus, or Perfecting rank appears. Each completion makes exactly one RNG draw; admission makes none. The same recipe shape produces the eligible weapon's masterwork or literal rank 1 and an armed commission copy. Reagents reach zero and copper is exactly 9,960 then 9,920. |
| `buyItem` | Offline Sim and actual ClientWorld command through GameServer and decoded snapshots | A furnishing carrying malformed `teachesRiding: true` costs 100 copper, grants exactly one ordinary copy, leaves the entity unchanged, and does not train Riding or draw RNG. The same count request for the real riding service trains Riding, debits exactly 800,000 copper, and grants no extra inventory item. Both authoritative and decoded ownership/currency are pinned. |
| `marketList` | Offline Sim and actual plain ClientWorld listing command through GameServer, followed by real cancellation | Quest stock emits the literal broker refusal and preserves non-null character state, all entities, listings, and RNG. Furnishing and eligible gear each leave the source bags, enter a plain one-copy listing for 100 copper, appear in the decoded owned listing, and return after cancellation with the count restored and listing removed. Copper remains exactly 10,000. The three plain-list request frames are pinned. |
| `tradeSetOffer` and confirmation | Two actual ClientWorld peers, GameServer dispatch, authoritative Sim trade, event and snapshot decode for both peers | Request and accept identify the other real peer. A quest offer preserves character/entity/listing state and both empty offers. Furnishing and eligible weapon then follow the same full offer and two-confirmation flow. Signer-only custody is retained; an armed payload binds to the actual recipient id. One-sided confirmation does not transfer the item. Final source count is zero and recipient count is one, material provenance is retained in the offered reagent stack, and both peers mirror exact inventory and currency. Each flow conserves the 37/11 copper exchange with literal net deltas of 26 and makes no RNG draw. |

The trade table has both ordinary and armed-copy cases. The three other command
families run in both hosts, with two crafting cases per host: 10 commerce tests
in total. Existing direct Sim trade tests remain the offline counterpart; this
new module supplies the previously missing real two-client transport proof.

## Validation evidence

The parent executed the deterministic commands. This worker ran formatting only.

- `routes-first.log`: all eight crafting, vendor, and market cases passed. The
  two trade cases reached a decisive offer comparison and exposed an incomplete
  test expectation for the inherited `materialSources` field. The expectation
  now names the full provenance record instead of removing or ignoring it.
- `tsc-routes.log`: the initial harness typed its read surface as `IWorld`, which
  does not promise `drainEvents`. The harness now uses its actual `Sim |
  ClientWorld` host union. No public interface was expanded.
- `routes-final.log`: parent run passed all three selected route suites, 24 tests,
  including all 10 commerce tests, with exit code 0 reported by the parent.
- `tsc-routes-final.log`: parent `npx tsc --noEmit` completed with exit code 0.
- `routes-biome-final.log`: parent explicit-file Biome check completed with exit
  code 0 and no formatting edits. Seven permitted fixture non-null warnings
  remain; repository changed-file CI does not treat lint warnings as failures.
- Worker `npx biome check --write tests/furnishing_commerce_parity.test.ts`:
  exit code 0. No tests, generators, or commits were run by this worker.

The parent has started the full shared gate after the commit. This report records
the bounded test implementation and its accepted focused evidence; the overall
QA verdict belongs to the parent after the gate and independent reviews finish.
