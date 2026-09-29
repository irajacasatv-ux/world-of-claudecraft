// The two nightly depth flags (docs/qa-gate.md, "The balance-harness diet" and
// "Nightly-only sweep depth"), built from parts: outside a comment only a listed reader
// may spell one (tests/helpers/depth_flag_readers.ts). The registries in
// tests/ci_shard_plan.test.ts validate these names (a typo leaves every listed reader
// unmatched) and tests/nightly_workflow.test.ts finds both on the nightly tests step,
// so a pin that reads them here cannot go vacuous on a misspelling.
export const DIET_FLAG = ['WOC_FULL_BALANCE', 'SWEEP'].join('_');
export const NIGHTLY_FLAG = ['WOC_NIGHTLY', 'SWEEP'].join('_');
