import type { ZoneDef } from '../sim/types';
import { prepareZoneCharacterDependencies } from './zone_character_dependencies';

interface ZoneDependencyHost {
  prewarmDependencyController: AbortController;
  zonePrewarmHost(): object;
}

/** All prewarm continuations check the renderer generation before publishing or building. */
export function assertPrewarmGeneration(owner: object, generation: number): void {
  const host = owner as { shutdownStarted: boolean; lifecycleGeneration: number };
  if (host.shutdownStarted || generation !== host.lifecycleGeneration)
    throw new Error('Renderer prewarm cancelled after shutdown');
}

/** Bound the owner's wait, never the shared cache fetch or another renderer's use of it. */
export async function prepareBoundedZoneCharacterDependencies(
  owner: object,
  zone: ZoneDef,
  deadlineMs: number,
): Promise<void> {
  const host = owner as ZoneDependencyHost;
  const signal = host.prewarmDependencyController.signal;
  if (signal.aborted) throw new Error('Renderer prewarm cancelled after shutdown');
  if (deadlineMs <= performance.now())
    throw new Error('Renderer prewarm dependency deadline exceeded');
  await awaitPrewarmOwnerTask(
    prepareZoneCharacterDependencies(host.zonePrewarmHost(), zone),
    owner,
    deadlineMs,
  );
}

/** A first-paint wait is cancellable too: a retired renderer will never paint it. */
export async function awaitPrewarmOwnerTask(
  task: Promise<unknown> | undefined,
  owner: object,
  deadlineMs = Infinity,
): Promise<void> {
  const signal = (owner as ZoneDependencyHost).prewarmDependencyController.signal;
  if (signal.aborted) throw new Error('Renderer prewarm cancelled after shutdown');
  const remainingMs = deadlineMs - performance.now();
  if (remainingMs <= 0) throw new Error('Renderer prewarm dependency deadline exceeded');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = (): void => {};
  const interrupted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(new Error('Renderer prewarm cancelled after shutdown'));
    signal.addEventListener('abort', onAbort, { once: true });
    if (Number.isFinite(remainingMs))
      timer = setTimeout(
        () => reject(new Error('Renderer prewarm dependency deadline exceeded')),
        remainingMs,
      );
  });
  try {
    await Promise.race([task, interrupted]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}
