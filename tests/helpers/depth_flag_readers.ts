// The reader audit behind the two nightly depth-flag registries in
// tests/ci_shard_plan.test.ts (WOC_FULL_BALANCE_SWEEP for the lane's balance diet,
// WOC_NIGHTLY_SWEEP for the shard pool; docs/qa-gate.md). A registry that only
// searched test files for the exact read `process.env.<FLAG> === '1'` let a reader
// escape it by spelling the read another way (`!== '1'`, a bracket key, a
// destructure, a truthy check, a regex over the env keys) or by moving it into a
// helper module or a config, so a suite could thin its PR depth unlisted. This audit
// reads every source file of the corpus through the repository's tokenizing scanner
// (maskCommentsAndStrings in tests/helpers/declared_timeouts.ts) and fails closed:
// outside a comment, the flag's name may appear
//  - in a listed reader, only as that exact read, in live code;
//  - in a pin file (the registries and the workflow pins), only inside a string,
//    template or regex literal, never in live code;
//  - anywhere else, not at all.
// And the list is exactly the files that make the exact read. A comment may name the
// flag anywhere. What text cannot see: a key assembled at run time from parts that
// never spell the name, and a slash the scanner misreads.

import { maskCommentsAndStrings } from './declared_timeouts';

export interface DepthFlagAudit {
  /** Files that make the exact live read, sorted. */
  readers: string[];
  /** One line per broken rule, sorted. */
  violations: string[];
}

function occurrences(text: string, needle: string): number[] {
  const out: number[] = [];
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) out.push(i);
  return out;
}

export function auditDepthFlag(
  flag: string,
  sources: ReadonlyMap<string, string>,
  listed: readonly string[],
  pinFiles: readonly string[],
): DepthFlagAudit {
  const exact = `process.env.${flag} === '1'`;
  const access = `process.env.${flag}`;
  const readers: string[] = [];
  const violations: string[] = [];
  for (const [file, raw] of sources) {
    if (!raw.includes(flag)) continue;
    const masked = maskCommentsAndStrings(raw);
    const commentsOnly = maskCommentsAndStrings(raw, { strings: false });
    // An exact read is live when the access itself survives masking (not in a
    // comment or string) and the compared value is the literal '1'.
    const liveExact = occurrences(raw, exact).filter(
      (i) => masked.slice(i, i + access.length) === access,
    ).length;
    const liveNames = occurrences(masked, flag).length;
    // Every mention outside a comment: live code, strings, templates and regex
    // literals alike, wherever in them the name sits.
    const outsideComments = occurrences(commentsOnly, flag).length;
    if (liveExact > 0) readers.push(file);
    if (listed.includes(file)) {
      if (outsideComments !== liveExact)
        violations.push(
          `${file}: names ${flag} outside a comment other than as the exact read ${exact}`,
        );
    } else if (pinFiles.includes(file)) {
      if (liveNames > 0) violations.push(`${file}: names ${flag} in live code but is a pin file`);
    } else if (outsideComments > 0) {
      violations.push(`${file}: names ${flag} outside a comment but is not a listed reader`);
    }
  }
  return { readers: readers.sort(), violations: violations.sort() };
}
