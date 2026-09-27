// The housing store's operator lines for CAPACITY holds, rate-limited per kind.
//
// A capacity refusal (cap_full, no_permit, read_threw, no_budget) comes in
// storms: one realm restart can refuse a thousand logins, and since ruling (b)
// a refused login can book three refusals (its first ask, its re-ask after the
// character lease, and retain's repair reload), each of which used to print its
// own line. That is synchronous stderr on the realm's one thread at the moment
// an operator most needs a clear signal, and every line says the same thing.
// So a capacity kind prints at most one line per window, and the next line it
// prints says how many it held back. The exact count is never lost:
// woc_freehold_load_failures_total books every refusal by kind whether or not a
// line was printed. A DATA kind (a row this build cannot read) is a per-row
// incident and always prints.
//
// Pure over its two injected ports, like the store it serves: no wall clock and
// no timer of its own.

/** How long a capacity kind stays quiet after it prints. */
export const FREEHOLD_CAPACITY_WARN_WINDOW_MS = 10_000;

/** Build the limiter. The returned function prints `line` through `warn` unless
 *  `capacity` is true and the same `kind` printed less than `windowMs` ago. */
export function createFreeholdCapacityWarn(
  warn: (line: string) => void,
  nowMs: () => number,
  windowMs: number = FREEHOLD_CAPACITY_WARN_WINDOW_MS,
): (kind: string, capacity: boolean, line: string) => void {
  const last = new Map<string, { atMs: number; heldBack: number }>();
  return (kind, capacity, line) => {
    if (!capacity) {
      warn(line);
      return;
    }
    const now = nowMs();
    const seen = last.get(kind);
    if (seen && now - seen.atMs < windowMs && now >= seen.atMs) {
      seen.heldBack++;
      return;
    }
    const tail =
      seen && seen.heldBack > 0
        ? ` (${seen.heldBack} more ${kind} held back since the last line)`
        : '';
    last.set(kind, { atMs: now, heldBack: 0 });
    warn(`${line}${tail}`);
  };
}
