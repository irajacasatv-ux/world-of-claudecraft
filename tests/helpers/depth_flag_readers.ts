// The reader audit behind the two nightly depth-flag registries in
// tests/ci_shard_plan.test.ts (WOC_FULL_BALANCE_SWEEP for the lane's balance diet,
// WOC_NIGHTLY_SWEEP for the shard pool; docs/qa-gate.md). A registry that only
// searched test files for the exact read `process.env.<FLAG> === '1'` let a reader
// escape it by spelling the read another way (`!== '1'`, a bracket key, a
// destructure, a truthy check) or by moving it into a helper module, so a suite
// could thin its PR depth unlisted. This audit reads every source file of the
// corpus through the repository's tokenizing scanner (maskCommentsAndStrings in
// tests/helpers/declared_timeouts.ts) and holds three rules:
//  - a listed reader names the flag in live code only as that exact read;
//  - no file outside the list and the named pin files names the flag in live code
//    or inside a string (the pin files hold the registry and the workflow pins,
//    which must spell the name);
//  - the list is exactly the files that make the exact read.
// A comment may name the flag anywhere. What text cannot see: a key assembled at
// run time (`process.env[prefix + suffix]`), and a slash the scanner misreads.

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
    // An exact read is live when the access itself survives masking (not in a
    // comment or string) and the compared value is the literal '1'.
    const liveExact = occurrences(raw, exact).filter(
      (i) => masked.slice(i, i + access.length) === access,
    ).length;
    const liveNames = occurrences(masked, flag).length;
    // A name that starts a string literal: the bracket-key and destructure-by-key
    // spellings, masked to blanks, so they never reach liveNames. The scanner keeps
    // a live string's opening quote and blanks everything inside a comment, so a
    // quote that survives masking right before a blanked name opens a string.
    const inString = occurrences(raw, flag).filter(
      (i) => i > 0 && /['"`]/.test(raw[i - 1]) && masked[i - 1] === raw[i - 1] && masked[i] === ' ',
    ).length;
    if (liveExact > 0) readers.push(file);
    if (pinFiles.includes(file)) continue;
    if (listed.includes(file)) {
      if (liveNames !== liveExact)
        violations.push(`${file}: reads ${flag} in a form other than ${exact}`);
      if (inString > 0) violations.push(`${file}: spells ${flag} inside a string`);
    } else if (liveNames > 0 || inString > 0) {
      violations.push(`${file}: names ${flag} in code or a string but is not a listed reader`);
    }
  }
  return { readers: readers.sort(), violations: violations.sort() };
}
