// The second hop of tests/fixtures/i18n_reach_chain.ts: a top-level dynamic import of a slice,
// started only after a timer, so a settle that waits a single macrotask misses it every time
// while one that drains every tracked dynamic import (this module is still evaluating) waits.
await new Promise((resolve) => setTimeout(resolve, 20));
void import('../../src/ui/i18n.resolved.generated/es');

export {};
