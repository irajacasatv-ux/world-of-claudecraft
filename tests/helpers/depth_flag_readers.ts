// The reader audit behind the two nightly depth-flag registries in
// tests/ci_shard_plan.test.ts (the lane's balance-diet flag and the shard pool's
// nightly-sweep flag; docs/qa-gate.md). A registry that only searched test files for
// the exact read let a reader escape it by spelling the read another way (a negated
// compare, a bracket key, a destructure, a truthy check, a regex over the env keys) or
// by moving it into a helper module, a product module or a config, so a suite could
// thin its PR depth unlisted. The audit fails closed over every tracked source file
// that names the flag (the registry collects them with git grep):
//  - outside a comment, the flag's name may appear only in a listed reader, and there
//    only as one whole binding, `const NAME = process.env.<FLAG> === '1';`, so the
//    compared value and the sense of the read are fixed where it is made;
//  - a source outside the JS/TS family (a .svelte file) may not name it at all;
//  - the list is exactly the files that make that read.
// Every other file, the registries and the workflow pins included, builds the name
// from parts. Sources are read through the repository's tokenizing scanner
// (maskCommentsAndStrings in tests/helpers/declared_timeouts.ts), so a comment may name
// the flag anywhere. What text cannot see: a key assembled at run time from parts
// (which is how the pins themselves avoid spelling it), and a slash the scanner still
// misreads.

import { maskCommentsAndStrings } from './declared_timeouts';

export interface DepthFlagAudit {
  /** Files that make the binding read, sorted. */
  readers: string[];
  /** One line per broken rule, sorted. */
  violations: string[];
}

const JS_FAMILY = /\.(?:[cm]?[jt]sx?)$/;

function occurrences(text: string, needle: string): number[] {
  const out: number[] = [];
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) out.push(i);
  return out;
}

export function auditDepthFlag(
  flag: string,
  sources: ReadonlyMap<string, string>,
  listed: readonly string[],
): DepthFlagAudit {
  const exact = `process.env.${flag} === '1'`;
  const access = `process.env.${flag}`;
  const readers: string[] = [];
  const violations: string[] = [];
  for (const [file, raw] of sources) {
    if (!raw.includes(flag)) continue;
    if (!JS_FAMILY.test(file)) {
      violations.push(`${file}: names ${flag} in a source the audit cannot read`);
      continue;
    }
    const masked = maskCommentsAndStrings(raw);
    const commentsOnly = maskCommentsAndStrings(raw, { strings: false });
    // A binding read: live code (the access survives masking), the literal '1', and
    // the whole right-hand side of a `const NAME = ...;` declaration.
    const bindings = occurrences(raw, exact).filter(
      (i) =>
        masked.slice(i, i + access.length) === access &&
        /\bconst\s+[A-Za-z_$][\w$]*\s*=\s*$/.test(masked.slice(Math.max(0, i - 120), i)) &&
        /^\s*;/.test(masked.slice(i + exact.length)),
    ).length;
    // Every mention outside a comment: live code, strings, templates and regex
    // literals alike, wherever in them the name sits.
    const outsideComments = occurrences(commentsOnly, flag).length;
    if (bindings > 0) readers.push(file);
    if (listed.includes(file)) {
      if (outsideComments !== bindings)
        violations.push(`${file}: names ${flag} outside a comment other than as a binding read`);
    } else if (outsideComments > 0) {
      violations.push(`${file}: names ${flag} outside a comment but is not a listed reader`);
    }
  }
  return { readers: readers.sort(), violations: violations.sort() };
}
