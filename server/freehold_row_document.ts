// THE DURABLE ROW, turned back into the document the load normalizer reads, and
// the one narrowing that turn needs. Pure, and moved whole out of
// server/freehold_persist.ts, which is at its monolith ceiling; the store's
// classify is their only caller.

/** The wire revision arrives as EXACT bigint text, because a bigint that has
 *  already been through a JS number is a value nothing can trust. The
 *  persisted document holds a number, so the narrowing has to happen
 *  somewhere; it happens HERE, once, and its caller (the store's classify) HOLDS
 *  the row rather than handing a broken value onward.
 *
 *  Holding is the point. normalizeFreehold REPAIRS an out-of-range `rev` to
 *  zero and still answers `loaded`, so a row whose wire_rev has outgrown a JS
 *  number would come back writable at revision zero and the next save would
 *  write that zero over the larger stored value: the client-facing counter
 *  would go backwards, permanently, on a row nothing was wrong with. */
export const representableRev = (text: string): boolean => Number.isSafeInteger(Number(text));

// The durable row is turned back into the document normalizeFreehold admits.
// The row reader owns the column shapes; this is the one place the two meet.
export function rowDocument(row: {
  schemaVersion: number;
  plotId: string;
  tier: string;
  layout: unknown;
  trophies: unknown;
  condition: number;
  visitPolicy: string;
  wireRev: string;
}): unknown {
  return {
    version: row.schemaVersion,
    plotId: row.plotId,
    tier: row.tier,
    layout: row.layout,
    trophies: row.trophies,
    condition: row.condition,
    visitPolicy: row.visitPolicy,
    rev: Number(row.wireRev),
  };
}
