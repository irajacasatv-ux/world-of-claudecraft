// The sweep's dirty decision driven directly. server/freehold_revision_probe.ts
// is three integers in and a boolean out, and the store reaches it only through
// a periodic sweep, so the arms below are decidable here with literals.

import { describe, expect, it } from 'vitest';
import { freeholdRevisionMoved } from '../../server/freehold_revision_probe';

const entry = (
  rev: number | null,
  overrides: { running?: boolean; snapshotRev?: number | null } = {},
) => ({
  state: rev === null ? null : { rev },
  running: overrides.running ?? false,
  snapshotRev: overrides.snapshotRev ?? null,
});

describe('freeholdRevisionMoved', () => {
  it('detects nothing when no record is live', () => {
    // A caller with no record has nothing to detect, and this is the arm that
    // keeps an entry with no record from being dirtied into a write that can
    // only ever land in writes_without_record.
    expect(freeholdRevisionMoved(null, entry(5))).toBe(false);
    expect(freeholdRevisionMoved(null, entry(null))).toBe(false);
  });

  it('detects a record this entry has never committed', () => {
    expect(freeholdRevisionMoved(1, entry(null))).toBe(true);
  });

  it('detects nothing when the live revision IS the committed one', () => {
    expect(freeholdRevisionMoved(5, entry(5))).toBe(false);
  });

  it('detects a revision that moved FORWARD', () => {
    expect(freeholdRevisionMoved(6, entry(5))).toBe(true);
  });

  it('detects a revision that moved BACKWARDS, which the seal then refuses', () => {
    // Detection is not admission: a live record below the entry's committed
    // revision is exactly the state worth looking at, and the write seal decides
    // whether it may land. Treating it as unmoved would make the probe the thing
    // that hides it.
    expect(freeholdRevisionMoved(4, entry(5))).toBe(true);
  });

  it('detects nothing for the edit a RUNNING write is already carrying', () => {
    // entry.state only advances at commit, so while a write is out it still
    // names the pre-edit revision and every sweep would re-detect the same edit,
    // arm a second write and burn a durable revision for nothing.
    expect(freeholdRevisionMoved(6, entry(5, { running: true, snapshotRev: 6 }))).toBe(false);
    // And an edit the running write is NOT carrying is still detected.
    expect(freeholdRevisionMoved(7, entry(5, { running: true, snapshotRev: 6 }))).toBe(true);
  });

  it('ignores the snapshot revision when no write is running', () => {
    // The arm is gated on `running`, so a stale snapshotRev left behind by a
    // settled write cannot suppress a real edit.
    expect(freeholdRevisionMoved(6, entry(5, { running: false, snapshotRev: 6 }))).toBe(true);
  });
});
