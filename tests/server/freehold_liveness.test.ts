// The four liveness reads the housing store takes from the sim, driven against
// a real live map. The composition root binds them through this one function
// and so does the store suite's harness, so what is pinned here is what every
// case there executes: a record is live for all four reads or for none of them.

import { describe, expect, it } from 'vitest';
import { freeholdLivenessPorts } from '../../server/freehold_liveness';
import {
  defaultFreeholdState,
  evictFreehold,
  loadFreehold,
  PENDING_FREEHOLD_PLOT_ID,
} from '../../src/sim/freehold/state';
import { asFreeholdPlotId } from '../../src/sim/freehold/types';
import type { SimContext } from '../../src/sim/sim_context';

const OWNER_KEY = 'account:918273';
const PLOT_ID = 'plot:livenessfixture';

function liveCtx(): SimContext {
  return {
    freeholdsEnabled: true,
    freeholds: new Map(),
    freeholdKeyReadyAtMs: new Map<string, number>(),
  } as unknown as SimContext;
}

describe('freeholdLivenessPorts', () => {
  it('answers NO record from all four reads when the map holds none', () => {
    const ports = freeholdLivenessPorts(() => liveCtx());
    expect(ports.hasLive(OWNER_KEY)).toBe(false);
    expect(ports.serialize(OWNER_KEY)).toBeNull();
    expect(ports.liveRev(OWNER_KEY)).toBeNull();
    expect(ports.livePlotId(OWNER_KEY)).toBeNull();
  });

  it('answers the SAME record from all four reads once one is live', () => {
    const ctx = liveCtx();
    const ports = freeholdLivenessPorts(() => ctx);
    loadFreehold(ctx, OWNER_KEY, {
      ...defaultFreeholdState(OWNER_KEY, asFreeholdPlotId(PLOT_ID)),
      tier: 'cottage',
      rev: 7,
    });
    expect(ports.hasLive(OWNER_KEY)).toBe(true);
    expect(ports.liveRev(OWNER_KEY)).toBe(7);
    expect(ports.livePlotId(OWNER_KEY)).toBe(PLOT_ID);
    const doc = ports.serialize(OWNER_KEY);
    expect(doc?.plotId).toBe(PLOT_ID);
    expect(doc?.rev).toBe(7);
    expect(doc?.tier).toBe('cottage');
    // Another owner's key is still absent from all four.
    expect(ports.hasLive('account:1')).toBe(false);
    expect(ports.serialize('account:1')).toBeNull();
    expect(ports.liveRev('account:1')).toBeNull();
    expect(ports.livePlotId('account:1')).toBeNull();
  });

  it('follows the map as it changes, for every read at once', () => {
    const ctx = liveCtx();
    const ports = freeholdLivenessPorts(() => ctx);
    loadFreehold(ctx, OWNER_KEY, defaultFreeholdState(OWNER_KEY, PENDING_FREEHOLD_PLOT_ID));
    // A STAND-IN is a live record like any other: the identity read names it
    // rather than answering null.
    expect(ports.livePlotId(OWNER_KEY)).toBe(PENDING_FREEHOLD_PLOT_ID);
    expect(ports.hasLive(OWNER_KEY)).toBe(true);
    const record = ctx.freeholds.get(OWNER_KEY);
    if (!record) throw new Error('the record was not loaded');
    record.rev = 3;
    expect(ports.liveRev(OWNER_KEY)).toBe(3);
    expect(ports.serialize(OWNER_KEY)?.rev).toBe(3);
    evictFreehold(ctx, OWNER_KEY);
    expect(ports.hasLive(OWNER_KEY)).toBe(false);
    expect(ports.serialize(OWNER_KEY)).toBeNull();
    expect(ports.liveRev(OWNER_KEY)).toBeNull();
    expect(ports.livePlotId(OWNER_KEY)).toBeNull();
  });

  it('reads the context through its getter on EVERY call, never a captured one', () => {
    // The closures this replaced read `deps.sim.ctx` at call time, so a getter
    // that were read once would be a behaviour change on the host.
    let ctx = liveCtx();
    const ports = freeholdLivenessPorts(() => ctx);
    expect(ports.hasLive(OWNER_KEY)).toBe(false);
    ctx = liveCtx();
    loadFreehold(ctx, OWNER_KEY, defaultFreeholdState(OWNER_KEY, asFreeholdPlotId(PLOT_ID)));
    expect(ports.hasLive(OWNER_KEY)).toBe(true);
    expect(ports.serialize(OWNER_KEY)?.plotId).toBe(PLOT_ID);
    expect(ports.liveRev(OWNER_KEY)).toBe(0);
    expect(ports.livePlotId(OWNER_KEY)).toBe(PLOT_ID);
  });

  it('serializes a COPY, so the writer can never reach back into the live record', () => {
    const ctx = liveCtx();
    const ports = freeholdLivenessPorts(() => ctx);
    loadFreehold(ctx, OWNER_KEY, {
      ...defaultFreeholdState(OWNER_KEY, asFreeholdPlotId(PLOT_ID)),
      layout: [{ placementId: 1, itemId: 'oak_chair', x: 1, y: 0, z: 2, yaw: 0 }],
      isDecorating: true,
    });
    const doc = ports.serialize(OWNER_KEY);
    const record = ctx.freeholds.get(OWNER_KEY);
    if (!doc || !record) throw new Error('no document');
    expect(doc.layout).toEqual(record.layout);
    expect(doc.layout).not.toBe(record.layout);
    expect(doc.layout[0]).not.toBe(record.layout[0]);
    // Build presence is a live, per-session fact and never reaches a document.
    expect(Object.keys(doc)).not.toContain('isDecorating');
  });
});
