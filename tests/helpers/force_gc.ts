// A full garbage collection on demand, for retention pins. Node exposes gc()
// only under --expose-gc; setting that flag at runtime and reading gc from a
// fresh context is V8's route to the same function without a restart. The
// awaited macrotask ends the current job first, because a WeakRef created or
// dereferenced in a job keeps its target alive until that job ends.

import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

export async function collectGarbage(): Promise<void> {
  setFlagsFromString('--expose-gc');
  const gc = runInNewContext('gc') as () => void;
  await new Promise<void>((resolve) => setImmediate(resolve));
  gc();
  gc();
}
