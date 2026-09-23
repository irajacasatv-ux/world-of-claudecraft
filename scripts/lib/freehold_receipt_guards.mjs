// The Freehold capture receipt's placement guards, pure so a test can drive
// each arm: a synthetic producer set cannot stand up a baseline checkout at
// the release commit, so scripts/freehold_capture_receipt.mjs calls these with
// what it read from git and the command line.
import path from 'node:path';

/** Why the baseline runtime cannot stand as the declared release, or null. */
export function baselineRuntimeRefusal({ head, expected, applicationDiff, applicationUntracked }) {
  if (head !== expected) return 'Baseline runtime HEAD does not match the declared release';
  if (applicationDiff.length > 0 || applicationUntracked.length > 0)
    return 'Baseline runtime has application changes; only the current capture harness may differ';
  return null;
}

/** Why the receipt cannot be written to `output`, or null. Every path absolute. */
export function outputPlacementRefusal({ output, before, after, performance, files }) {
  if (before === output || after === output)
    return 'Output directory must differ from both producer directories';
  if (files.some((file) => path.join(output, file) === performance))
    return 'Output must not overwrite the performance producer';
  return null;
}
