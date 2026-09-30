/**
 * Deterministic shard packs for the CI balanced vitest sequencer (D11
 * path-matrix). Pure module: no vitest, no fs.
 *
 * Approach history:
 * 1. LPT on import-proxy weights: regressed D11 (run 30748073443, ratio 1.59,
 *    s4 import-bound). Proxy did not match real import residual.
 * 2. Stripe (round-robin) after sha1 order: breaks vitest's default contiguous
 *    sha1 slices so unlucky import clusters cannot sit in one equal-size slice.
 *
 * Callers supply keys; weights remain available for LPT helpers and tests.
 */

import { createHash } from 'node:crypto';

/**
 * @typedef {{ id: unknown, weight: number, key: string }} WeightedItem
 */

/**
 * Partition items into `count` packs by striping a sha1-sorted order.
 * Vitest default is contiguous slices of the same order; striping assigns
 * every Nth file to the same shard so neighbors in hash space fan out.
 *
 * Every item appears in exactly one pack. Empty packs only when
 * items.length < count.
 *
 * @param {WeightedItem[]} items
 * @param {number} count  shard count (N), must be >= 1
 * @returns {WeightedItem[][]} packs[0] is shard 1, packs[count-1] is shard N
 */
export function partitionByStripe(items, count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`partitionByStripe: count must be a positive integer, got ${count}`);
  }
  /** @type {WeightedItem[][]} */
  const packs = Array.from({ length: count }, () => []);
  if (items.length === 0) return packs;

  const ordered = [...items].sort((a, b) => {
    const ha = createHash('sha1').update(a.key).digest('hex');
    const hb = createHash('sha1').update(b.key).digest('hex');
    if (ha < hb) return -1;
    if (ha > hb) return 1;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  for (let i = 0; i < ordered.length; i++) {
    packs[i % count].push(ordered[i]);
  }
  return packs;
}

/**
 * Partition items into `count` packs by LPT (kept for unit tests / overlays).
 * - Sort by cost desc, then key asc (stable).
 * - Assign each item to the pack with the smallest current load; ties break
 *   toward the lower pack index.
 * `cost` defaults to the item's weight; the CI packer passes packingCost.
 * The packs hold the items themselves, so a caller still reads `weight`.
 *
 * @param {WeightedItem[]} items
 * @param {number} count
 * @param {(item: WeightedItem) => number} [cost]
 * @returns {WeightedItem[][]}
 */
export function partitionByLpt(items, count, cost = (item) => item.weight) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`partitionByLpt: count must be a positive integer, got ${count}`);
  }
  /** @type {WeightedItem[][]} */
  const packs = Array.from({ length: count }, () => []);
  const load = Array.from({ length: count }, () => 0);
  if (items.length === 0) return packs;

  const costed = items.map((item) => ({ item, cost: cost(item) }));
  costed.sort((a, b) => {
    if (b.cost !== a.cost) return b.cost - a.cost;
    return a.item.key < b.item.key ? -1 : a.item.key > b.item.key ? 1 : 0;
  });

  for (const { item, cost: itemCost } of costed) {
    let best = 0;
    for (let i = 1; i < count; i++) {
      if (load[i] < load[best]) best = i;
    }
    packs[best].push(item);
    load[best] += itemCost;
  }
  return packs;
}

/**
 * The worker time a test file costs a shard beyond its table weight, in ms: the
 * weight is the vitest reporter's per-file TEST time, and every file also pays
 * transform, setup, import and environment before its first case. The table
 * stays test time only (the lane rule and the total-time ratchet read it as
 * that); the overhead lives only in the packing cost.
 *
 * The fit (2026-09-30), from the 24 shard jobs of green full-mode runs
 * 36648684156, 36654475632 and 36658730347: vitest's own Duration line splits
 * each job's worker time, so the per-file overhead is read directly as the
 * job's transform + setup + import + environment seconds over its file count,
 * after dividing out the job's runner speed (each job's median per-file ratio
 * to the same files in the other runs: 0.67 to 1.19). Pooled 803 ms (import
 * alone 651), per job 697 to 939, and 797 to 811 with any one run left out.
 * The check against each shard's wall: vitest's wall = 0.510 x (weights + 800
 * ms x files x runner speed), through the origin, i.e. total worker time over
 * 1.96 of the 2 workers, residuals RMS 15.8 s, max 35.6 s (6.9 percent),
 * median 1.8 percent. The wall alone cannot pin the constant: every shard ran
 * 632 or 633 files, so a per-file term is collinear with a per-shard one, and
 * fitting the test-step wall with a free intercept is nearly flat in it (RMS
 * 14.3 s at 0 ms, 13.4 s at the 200 ms optimum, 16.0 s at 800 ms, the 0 ms fit
 * buying its fit with a 51 s intercept no per-shard cost explains: the step
 * spends 8 to 13 s outside vitest). So the decomposition sets it.
 *
 * The modeled gain is NIL today, stated so nobody re-derives it: LPT over this
 * table already gives every shard 630 or 631 files (the long tail of small
 * files fills round-robin), so the packs are byte-identical for any overhead
 * from 0 to 2000 ms, on the committed table and on each of the three runs'
 * own measurements, and the predicted slowest shard moves 0.0 s. The shards'
 * 6.75 to 11.30 min spread at run 36654475632 was runner speed (0.73 to 1.14
 * in that run) plus a table that inherits its harvest jobs' speeds; the
 * harvest's runner calibration (scripts/lib/ci_runner_calibration.mjs) is
 * the lever for both. The constant keeps the cost model honest where counts
 * do diverge (a small or heavy-tailed pack) and prices an unknown file at a
 * realistic cost.
 */
export const PER_FILE_OVERHEAD_MS = 800;

/**
 * The CI packer's cost for one item: its weight plus PER_FILE_OVERHEAD_MS.
 * @param {WeightedItem} item
 * @returns {number}
 */
export function packingCost(item) {
  return item.weight + PER_FILE_OVERHEAD_MS;
}

/** Active pack strategy for the CI sequencer (approach 2). */
// Active CI strategy: LPT over MEASURED weights (re-wired 2026-08-14).
// History: D11 tried LPT over static import-cost weights and stripe; both
// missed the balance bar and stayed unwired. Re-measured with real per-file
// durations after the harness splits, on the lane-excluded shard pool and
// scored in real ms: stripe is WORSE than sha1-contiguous (11.3m vs 10.5m
// worst shard) and stays rejected; LPT over measured weights lands 9.79m
// worst with 0.06m spread, PROVIDED unknown files take the measured-scale
// fallback (raw heuristic units regressed to 11.21m, the review round's
// central catch). 2026-09-30: packed on packingCost (weight plus the per-file
// overhead above), not the bare weight.
/**
 * @param {WeightedItem[]} items
 * @param {number} count
 * @returns {WeightedItem[][]}
 */
export function partitionForCi(items, count) {
  return partitionByLpt(items, count, packingCost);
}

/**
 * Known long-Duration files from Phase 3 CI evidence (run 30712431702 and
 * earlier). Additive overlay so test-time monsters stay spread even when the
 * static import proxy under-weights them. Keys are repo-relative paths.
 * Values are extra weight units (same scale as weightForTestFile).
 */
// The measured weight table: real per-file durations (ms) harvested from a
// green full-mode CI run by scripts/ci_shard_weights_harvest.mjs. Regenerate
// with `node scripts/ci_shard_weights_harvest.mjs <run-id>`; refresh when
// the suite's shape changes. Staleness only unbalances (completeness is
// structural); a file absent here falls back to the static heuristic below.
import MEASURED_WEIGHTS_JSON from './ci_shard_weights.generated.json' with { type: 'json' };

export const MEASURED_WEIGHTS = Object.freeze(
  Object.fromEntries(Object.entries(MEASURED_WEIGHTS_JSON).filter(([k]) => k !== '__provenance')),
);

// The fallback for a file ABSENT from the table, on the MEASURED scale: the
// review round proved the import-cost heuristic sits on a different scale
// (median 36 ms measured vs 50k to 173k heuristic units), so 1.3% unknown
// files claimed 18.7% of planned load and made the committed packing WORSE
// than the sha1-contiguous baseline (11.21m vs 10.49m worst shard, scored
// on real durations); a neutral measured-scale fallback restores the
// intended result (9.79m worst, 0.06m spread). The measured MEDIAN is the
// neutral estimate: most unknown files are new ordinary suites, and the
// error from a genuinely heavy unknown is bounded until the next harvest.
export const MEASURED_FALLBACK_MS = (() => {
  const values = Object.values(MEASURED_WEIGHTS).sort((a, b) => a - b);
  return values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
})();

/**
 * Deterministic import-cost weight for a test file.
 * Size is a weak proxy; boosts target the graphs that dominate CI import time
 * (three/render/electron) and long suites from the overlay.
 *
 * @param {string} relPath  repo-relative posix path (e.g. tests/foo.test.ts)
 * @param {string} body     file contents (may be empty if unreadable)
 * @param {number} size     byte length
 * @returns {number} weight >= 1
 */
export function weightForTestFile(relPath, body, size) {
  const path = relPath.replace(/\\/g, '/');
  // A real measured duration beats every heuristic (the D11 LPT attempt
  // missed its bar precisely because static import-cost weights mispredict
  // runtime). A file absent from a NON-EMPTY table gets the measured-scale
  // fallback above; the import-cost heuristic below survives only for a
  // tree with no measured table at all (an emptied regeneration), where
  // relative ordering is better than nothing.
  const measured = MEASURED_WEIGHTS[path];
  if (typeof measured === 'number' && measured > 0) return measured < 1 ? 1 : measured;
  if (MEASURED_FALLBACK_MS > 0) return MEASURED_FALLBACK_MS;
  const text = typeof body === 'string' ? body : '';
  const bytes = Number.isFinite(size) && size > 0 ? size : text.length;
  let w = 1000 + bytes;

  // Heavy runtime graphs (import-bound residual drivers).
  if (/\bfrom\s+['"]three(?:\/|['"])/.test(text) || /require\(['"]three['"]\)/.test(text)) {
    w += 80_000;
  }
  if (/src\/render\/|from\s+['"][^'"]*\/render\//.test(text)) w += 40_000;
  if (path.includes('electron') || /from\s+['"][^'"]*electron/.test(text)) w += 50_000;
  if (/from\s+['"][^'"]*server\//.test(text) || path.startsWith('tests/server/')) w += 25_000;
  if (/from\s+['"][^'"]*src\/sim\/sim['"]|from\s+['"][^'"]*\/sim['"]/.test(text)) w += 30_000;
  if (/from\s+['"][^'"]*src\/sim\//.test(text)) w += 10_000;
  if (/@vitest-environment\s+jsdom/.test(text)) w += 15_000;
  if (path.startsWith('tests/admin/') || /from\s+['"][^'"]*src\/admin\//.test(text)) w += 20_000;
  if (/i18n\.resolved|i18n\.catalog|from\s+['"][^'"]*i18n/.test(text)) w += 15_000;
  if (/from\s+['"][^'"]*src\/ui\//.test(text)) w += 12_000;
  if (/from\s+['"][^'"]*src\/net\//.test(text)) w += 12_000;
  if (/from\s+['"][^'"]*src\/game\//.test(text)) w += 12_000;
  if (path.startsWith('tests/parity/')) w += 20_000;
  if (path.startsWith('tests/helpers/')) w += 5_000;

  return w < 1 ? 1 : w;
}

/**
 * Completeness check: packs form a partition of the original key set.
 * @param {WeightedItem[]} items
 * @param {WeightedItem[][]} packs
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function assertPartitionCompleteness(items, packs) {
  const expected = new Set(items.map((i) => i.key));
  const seen = new Set();
  for (const pack of packs) {
    for (const item of pack) {
      if (seen.has(item.key)) {
        return { ok: false, reason: `duplicate key in packs: ${item.key}` };
      }
      if (!expected.has(item.key)) {
        return { ok: false, reason: `unknown key in packs: ${item.key}` };
      }
      seen.add(item.key);
    }
  }
  if (seen.size !== expected.size) {
    const missing = [...expected].filter((k) => !seen.has(k));
    return {
      ok: false,
      reason: `missing ${expected.size - seen.size} key(s); e.g. ${missing[0] ?? '?'}`,
    };
  }
  return { ok: true };
}
