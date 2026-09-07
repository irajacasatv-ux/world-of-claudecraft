import type { PlayerClass } from '../src/sim/types';

interface HelloSession {
  pid: number;
  name: string;
  isAdmin: boolean;
  chatMutedUntil?: number | null;
  movementWireVersion: 1 | 2;
}

// Both join paths advertise the same boot configuration; no live environment read.
export function buildWorldHello(
  cfg: { seed: number; freeholdsEnabled?: boolean },
  session: HelloSession,
  cls: PlayerClass,
  realm: string,
  softWords: string[],
) {
  return {
    t: 'hello',
    pid: session.pid,
    seed: cfg.seed,
    name: session.name,
    cls,
    realm,
    // Presentation only; all gated commands retain their authority checks.
    admin: session.isAdmin,
    softWords,
    chatMutedUntil: session.chatMutedUntil ?? null,
    movementWire: session.movementWireVersion,
    ...(cfg.freeholdsEnabled === true ? { freeholdsEnabled: true } : {}),
  };
}
