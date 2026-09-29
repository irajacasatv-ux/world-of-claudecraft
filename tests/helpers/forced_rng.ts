// Forcing a roll without hunting a world seed. A case that rides a roll (a
// masterwork proc, a Jack variance draw) installs this as `sim.rng` right
// before the command: the roll then comes from a fresh Rng whose first draws
// satisfy the predicates, in order, through the real draw path, so a draw
// observer still counts and reads the real values. Hunting a world seed
// instead builds that seed's collider grids (about half a second each) and
// re-hunts whenever content shifts the construction-time draws.
import { Rng } from '../../src/sim/rng';

const SCAN_LIMIT = 1_000_000;

export function rngWithFirstDraws(...accept: ((value: number) => boolean)[]): Rng {
  for (let seed = 1; seed < SCAN_LIMIT; seed++) {
    const probe = new Rng(seed);
    if (accept.every((ok) => ok(probe.next()))) return new Rng(seed);
  }
  throw new Error('no rng seed in the scan satisfies the forced draws');
}
