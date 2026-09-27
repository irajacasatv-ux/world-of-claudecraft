// THE BOUND ON WHAT A DATABASE ERROR MAY CARRY INTO A LOG, for the housing
// store's three database paths. Moved whole out of server/freehold_persist.ts,
// which is at its monolith ceiling; it never needed the store's state.

/**
 * The ONE diagnostic channel that would otherwise bypass the classification
 * bound. `ports.error(message, err)` prints whatever it is handed, and a
 * PostgreSQL error object is not a bounded value: a 23514 or 23502 puts
 * `Failing row contains (...)` in `detail`, and a 23505 puts the conflicting
 * key value there. On a write path that is an account id and row content in a
 * console, which is exactly what src/sim/freehold/load_report.ts exists to
 * prevent.
 *
 * Applied ONLY where a pg error can actually arrive: the row read, the hearth
 * read and the write. A throw out of the store's own code is a programming
 * bug whose stack is the useful part, and bounding it there would hide the line.
 *
 * `message` is kept because it is what makes a line readable, and it is NOT a
 * pure classification: a few SQLSTATEs embed a parameter in it. Every parameter
 * the housing store sends is JSON it generated itself, so nothing player-authored
 * can ride out that way today; it is the field to watch if that ever changes.
 */
export function boundedDatabaseError(err: unknown): Record<string, unknown> {
  if (typeof err !== 'object' || err === null) return { message: String(err) };
  const source = err as { code?: unknown; constraint?: unknown; message?: unknown };
  return {
    code: typeof source.code === 'string' ? source.code : undefined,
    constraint: typeof source.constraint === 'string' ? source.constraint : undefined,
    message: typeof source.message === 'string' ? source.message : undefined,
  };
}
