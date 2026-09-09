// The development grant fixture (D24/D81): `/dev freehold <tier>` through
// src/sim/freehold/dev_grant.ts and the ONE tier writer in state.ts. Pins the
// devCommands x freeholdDevGrantEnabled matrix (only true/true grants), the
// real chat delegation through the router, the refusal of unknown ids AND of
// not-yet-authored tiers, the revision bump per grant, and (by source scan)
// that setFreeholdTier is the sole writer of a freehold record's tier.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_COTTAGE_DUNGEON_ID,
  FREEHOLD_INN_ROOM_DUNGEON_ID,
} from '../src/sim/content/freehold';
import { BUILTIN_WORLD, DUNGEONS, dungeonAt } from '../src/sim/data';
import {
  devGrantFreeholdTier,
  enterFreehold,
  evictFreehold,
  type FreeholdTier,
  persistedFreeholdFromState,
  serializeFreehold,
  setFreeholdTier,
} from '../src/sim/freehold';
import { Sim } from '../src/sim/sim';
import type { SimEvent, WorldContent } from '../src/sim/types';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { tsFilesUnder } from './helpers/ts_files_under';

const SLIM_WORLD: WorldContent = { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] };

function makeSim(devCommands: boolean, freeholdDevGrantEnabled: boolean, seed = 42): Sim {
  return new Sim({
    seed,
    playerClass: 'warrior',
    freeholdsEnabled: true,
    devCommands,
    freeholdDevGrantEnabled,
    world: SLIM_WORLD,
  });
}

function keyOf(sim: Sim): string {
  return `entity:${sim.primaryId}`;
}

function logTexts(events: SimEvent[]): string[] {
  return events.flatMap((ev) => (ev.type === 'log' ? [ev.text] : []));
}

function errorTexts(events: SimEvent[]): string[] {
  return events.flatMap((ev) => (ev.type === 'error' ? [ev.text] : []));
}

describe('the permission matrix', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
  ])(
    'devCommands %s and freeholdDevGrantEnabled %s refuse as unauthorized and write nothing',
    (devCommands, grantEnabled) => {
      const sim = makeSim(devCommands, grantEnabled);
      expect(sim.ctx.devCommands).toBe(devCommands);
      expect(sim.ctx.freeholdDevGrantEnabled).toBe(grantEnabled);
      const record = sim.freeholds.get(keyOf(sim));
      expect(record?.tier).toBe('inn_room');
      expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
        outcome: 'unauthorized',
      });
      expect(record?.tier).toBe('inn_room');
      expect(record?.rev).toBe(0);
    },
  );

  it('precedence: authorization is decided before the tier, and the tier before the record', () => {
    const noGrant = makeSim(true, false);
    expect(devGrantFreeholdTier(noGrant.ctx, noGrant.primaryId, 'nonsense')).toEqual({
      outcome: 'unauthorized',
    });
    const dark = makeSim(false, false);
    evictFreehold(dark.ctx, keyOf(dark));
    expect(devGrantFreeholdTier(dark.ctx, dark.primaryId, 'cottage')).toEqual({
      outcome: 'unauthorized',
    });
    const lit = makeSim(true, true);
    evictFreehold(lit.ctx, keyOf(lit));
    expect(devGrantFreeholdTier(lit.ctx, lit.primaryId, 'nonsense')).toEqual({
      outcome: 'bad_tier',
    });
  });

  it('devCommands true and freeholdDevGrantEnabled true grant the tier and bump the revision', () => {
    const sim = makeSim(true, true);
    const record = sim.freeholds.get(keyOf(sim));
    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
      outcome: 'granted',
      tier: 'cottage',
    });
    expect(record?.tier).toBe('cottage');
    expect(record?.rev).toBe(1);
    // Layout and trophies are never touched by a tier write.
    expect(record?.layout).toEqual([]);
    expect(record?.trophies).toEqual([]);
  });
});

describe('the real chat delegation', () => {
  it('with both permissions on, /dev freehold cottage grants and the next entry lands in the Cottage band', () => {
    const sim = makeSim(true, true);
    const pid = sim.primaryId;
    sim.drainEvents();
    expect(sim.chat('/dev freehold cottage', pid)).toBeNull();
    const events = sim.drainEvents();
    expect(logTexts(events)).toEqual(['[dev] Freehold tier set to cottage.']);
    expect(errorTexts(events)).toEqual([]);
    expect(sim.freeholds.get(keyOf(sim))?.tier).toBe('cottage');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const e = sim.entities.get(pid);
    expect(dungeonAt(e?.pos.x ?? Number.NaN)?.id).toBe(FREEHOLD_COTTAGE_DUNGEON_ID);
    expect(DUNGEONS[FREEHOLD_COTTAGE_DUNGEON_ID].index).toBe(16);
    expect(sim.instances.find((i) => i.partyKey === keyOf(sim))?.dungeonId).toBe(
      FREEHOLD_COTTAGE_DUNGEON_ID,
    );
  });

  it('with devCommands off the text is ordinary chat: the router never reaches the arm', () => {
    const sim = makeSim(false, true);
    const pid = sim.primaryId;
    sim.drainEvents();
    sim.chat('/dev freehold cottage', pid);
    const events = sim.drainEvents();
    expect(logTexts(events).filter((t) => t.startsWith('[dev]'))).toEqual([]);
    expect(errorTexts(events)).toEqual(['Unknown command: /dev. Type /help for a list.']);
    expect(sim.freeholds.get(keyOf(sim))?.tier).toBe('inn_room');
    expect(sim.freeholds.get(keyOf(sim))?.rev).toBe(0);
  });

  it('with the grant permission off the [dev] refusal arrives as an error and the tier stays inn_room', () => {
    // Refusals ride the error channel like the file's other dev refusals
    // (Unknown mob / item / dungeon); only the success line is a log.
    const sim = makeSim(true, false);
    const pid = sim.primaryId;
    sim.drainEvents();
    expect(sim.chat('/dev freehold cottage', pid)).toBeNull();
    const events = sim.drainEvents();
    expect(errorTexts(events)).toEqual(['[dev] Freehold grant is not authorized on this host.']);
    expect(logTexts(events)).toEqual([]);
    expect(sim.freeholds.get(keyOf(sim))?.tier).toBe('inn_room');
    expect(sim.freeholds.get(keyOf(sim))?.rev).toBe(0);
    // And the Inn Room is still the room that opens.
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const e = sim.entities.get(pid);
    expect(dungeonAt(e?.pos.x ?? Number.NaN)?.id).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
  });

  it('is case-insensitive on the tier and lists the authored options on a bad tier', () => {
    const sim = makeSim(true, true);
    const pid = sim.primaryId;
    sim.drainEvents();
    expect(sim.chat('/dev freehold COTTAGE', pid)).toBeNull();
    expect(logTexts(sim.drainEvents())).toEqual(['[dev] Freehold tier set to cottage.']);
    expect(sim.chat('/dev freehold lodge', pid)).toBeNull();
    const refused = sim.drainEvents();
    expect(errorTexts(refused)).toEqual([
      "[dev] Unknown freehold tier 'lodge'. Options: inn_room, cottage.",
    ]);
    expect(logTexts(refused)).toEqual([]);
    expect(sim.freeholds.get(keyOf(sim))?.tier).toBe('cottage');
    expect(sim.freeholds.get(keyOf(sim))?.rev).toBe(1);
  });

  it('the /dev usage line lists the freehold arm', () => {
    const sim = makeSim(true, true);
    const pid = sim.primaryId;
    sim.drainEvents();
    expect(sim.chat('/dev', pid)).toBeNull();
    const usage = errorTexts(sim.drainEvents()).filter((t) => t.startsWith('Dev commands: '));
    expect(usage).toHaveLength(1);
    expect(usage[0]).toContain('/dev freehold <tier>');
  });

  it('a stamped second player grants its own account record, not the primary one', () => {
    const sim = makeSim(true, true);
    const b = sim.addPlayer('mage', 'Bbb', { freeholdOwnerKey: 'account:7' });
    sim.drainEvents();
    expect(sim.chat('/dev freehold cottage', b)).toBeNull();
    expect(sim.freeholds.get('account:7')?.tier).toBe('cottage');
    expect(sim.freeholds.get(keyOf(sim))?.tier).toBe('inn_room');
  });
});

describe('tier validation through the one writer', () => {
  it('refuses an unknown id and a not-yet-authored tier alike, leaving the record untouched', () => {
    const sim = makeSim(true, true);
    const record = sim.freeholds.get(keyOf(sim));
    // '' reaches only the direct call: the chat arm's `\S+` cannot match an empty tier.
    for (const raw of ['lodge', 'manor', 'keep', 'citadel', 'castle', '', 'Inn_Room']) {
      expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, raw), raw).toEqual({
        outcome: 'bad_tier',
      });
    }
    expect(record?.tier).toBe('inn_room');
    expect(record?.rev).toBe(0);
    // Directly through the writer too: a FreeholdTier the table has not
    // authored is refused, and so is an owner with no record.
    expect(setFreeholdTier(sim.ctx, keyOf(sim), 'lodge')).toBe(false);
    expect(record?.rev).toBe(0);
    expect(setFreeholdTier(sim.ctx, 'account:none', 'cottage')).toBe(false);
    expect(sim.freeholds.has('account:none')).toBe(false);
  });

  it('answers no_freehold once the record is evicted, writing nothing', () => {
    const sim = makeSim(true, true);
    evictFreehold(sim.ctx, keyOf(sim));
    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
      outcome: 'no_freehold',
    });
    expect(sim.freeholds.size).toBe(0);
    sim.drainEvents();
    expect(sim.chat('/dev freehold cottage', sim.primaryId)).toBeNull();
    const refused = sim.drainEvents();
    expect(errorTexts(refused)).toEqual(['[dev] You hold no freehold record on this host.']);
    expect(logTexts(refused)).toEqual([]);
    expect(sim.freeholds.size).toBe(0);
  });

  it('bumps the revision by exactly one per grant, the same tier included', () => {
    const sim = makeSim(true, true);
    const record = sim.freeholds.get(keyOf(sim));
    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
      outcome: 'granted',
      tier: 'cottage',
    });
    expect(record?.rev).toBe(1);
    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
      outcome: 'granted',
      tier: 'cottage',
    });
    expect(record?.rev).toBe(2);
    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'inn_room')).toEqual({
      outcome: 'granted',
      tier: 'inn_room',
    });
    expect(record?.tier).toBe('inn_room');
    expect(record?.rev).toBe(3);
    const tiers: FreeholdTier[] = ['inn_room', 'cottage'];
    for (const tier of tiers) expect(setFreeholdTier(sim.ctx, keyOf(sim), tier)).toBe(true);
    expect(record?.rev).toBe(5);
  });

  it('draws no rng (with the observer proven live first)', () => {
    const sim = makeSim(true, true);
    let draws = 0;
    sim.rng.setObserver(() => {
      draws++;
    });
    sim.rng.next();
    expect(draws).toBe(1);
    draws = 0;
    try {
      expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
        outcome: 'granted',
        tier: 'cottage',
      });
      expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'lodge')).toEqual({
        outcome: 'bad_tier',
      });
    } finally {
      sim.rng.setObserver(null);
    }
    expect(draws).toBe(0);
  });
});

describe('applyFreeholdOwnerStamp is the SOLE owner-stamp writer (source scan)', () => {
  const simDir = join(__dirname, '..', 'src', 'sim');
  const serverDir = join(__dirname, '..', 'server');
  const codeOnly = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('finds exactly one `.freeholdOwnerKey =` assignment across src/sim and server, inside applyFreeholdOwnerStamp', () => {
    const files = [...tsFilesUnder(simDir), ...tsFilesUnder(serverDir)];
    expect(files.length).toBeGreaterThan(150);
    const hits: string[] = [];
    for (const { file, full } of files) {
      const code = codeOnly(readFileSync(full, 'utf8'));
      for (const line of code.split('\n')) {
        if (/\.freeholdOwnerKey\s*=[^=]/.test(line)) hits.push(`${file}: ${line.trim()}`);
      }
    }
    // The server MINTS the key (freeholdOwnerKeyForAccount) and passes it as
    // an addPlayer option; the one assignment onto a PlayerMeta is the stamp
    // writer in state.ts, which the directory keeps off its barrel. Same
    // stated bound as the tier scan below: dotted assignments only.
    expect(hits).toEqual(['freehold/state.ts: meta.freeholdOwnerKey = key;']);
  });

  it('no production module imports the stamp writer: addPlayer reaches it through seedFreeholdOnJoin only', () => {
    // Each root is tagged so the writer's own directory is exempt under
    // src/sim only; a server/freehold/ path would still be reported.
    const files = [
      ...tsFilesUnder(simDir).map((f) => ({ ...f, file: `src/sim/${f.file}` })),
      ...tsFilesUnder(serverDir).map((f) => ({ ...f, file: `server/${f.file}` })),
    ];
    const importers: string[] = [];
    for (const { file, full } of files) {
      const code = codeOnly(readFileSync(full, 'utf8'));
      if (/\bapplyFreeholdOwnerStamp\b/.test(code) && !file.startsWith('src/sim/freehold/')) {
        importers.push(file);
      }
    }
    expect(importers).toEqual([]);
  });
});

describe('setFreeholdTier is the SOLE tier writer (source scan)', () => {
  const simDir = join(__dirname, '..', 'src', 'sim');
  const codeOnly = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('walks src/sim through the shared walker only (tests/CLAUDE.md, Coverage & guards)', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });

  it('finds exactly one `.tier =` assignment under src/sim/freehold, inside setFreeholdTier', () => {
    const files = tsFilesUnder(simDir);
    expect(files.length).toBeGreaterThan(100);
    const hits: string[] = [];
    for (const { file, full } of files) {
      const code = codeOnly(readFileSync(full, 'utf8'));
      for (const line of code.split('\n')) {
        if (/\.tier\s*=[^=]/.test(line)) hits.push(`${file}: ${line.trim()}`);
      }
    }
    // The whole core, listed exactly: the freehold writer plus the two
    // RiftInstance.tier writes in rift/runs.ts, a different record with a
    // different tier. Any new `.tier =` anywhere is a new row here, on purpose.
    // Stated bound: the regex sees dotted assignments only. A bracket write
    // (`x['tier'] =`), an `Object.assign(record, { tier })`, or a spread
    // rebuild (`{ ...record, tier }`) set into the map would escape it; none
    // exists today, and whoever adds one owes this scan a matching arm.
    expect(hits.sort()).toEqual([
      'freehold/state.ts: state.tier = tier;',
      'rift/runs.ts: inst.tier = eventId === null ? null : (portal?.riftTier ?? null);',
      'rift/runs.ts: inst.tier = null;',
    ]);
    // And the freehold write sits inside setFreeholdTier's body, not elsewhere.
    const state = codeOnly(readFileSync(join(simDir, 'freehold', 'state.ts'), 'utf8'));
    const start = state.indexOf('export function setFreeholdTier(');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = state.indexOf('\nexport function', start + 1);
    const body = state.slice(start, end === -1 ? undefined : end);
    expect(body).toContain('state.tier = tier;');
    expect(state.replace(body, '')).not.toMatch(/\.tier\s*=[^=]/);
  });
});

describe('the persisted projection of a granted tier', () => {
  // The development grant reaches the record through the ONE tier setter and
  // nothing else, so what a persistence sweep would write is exactly what the
  // setter produced. These arms pin that the projection follows the setter,
  // that the revision it bumps is the movement signal a sweep reads, and that
  // the grant never reaches the character blob, which is CHARACTER state while
  // a freehold is ACCOUNT state.
  it('projects the granted tier and the bumped revision, and nothing else moves', () => {
    const sim = makeSim(true, true);
    const key = keyOf(sim);
    const before = persistedFreeholdFromState(serializeFreehold(sim.ctx, key) as never);
    expect(before.tier).toBe('inn_room');

    expect(devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage')).toEqual({
      outcome: 'granted',
      tier: 'cottage',
    });
    const after = persistedFreeholdFromState(serializeFreehold(sim.ctx, key) as never);
    expect(after.tier).toBe('cottage');
    // The revision is what a periodic sweep compares against the last written
    // one, so it must have MOVED, by exactly one.
    expect(after.rev).toBe(before.rev + 1);
    // And a tier grant moves nothing else: the owner's furnishings, trophies,
    // condition and visit policy are untouched.
    expect(after.layout).toEqual(before.layout);
    expect(after.trophies).toEqual(before.trophies);
    expect(after.condition).toBe(before.condition);
    expect(after.visitPolicy).toBe(before.visitPolicy);
    expect(after.plotId).toBe(before.plotId);
  });

  it('carries no owner key into the durable projection', () => {
    // The account identity keys the ROW, so repeating it inside the owned
    // content would put an internal key in a blob that later travels with a
    // sold plot.
    const sim = makeSim(true, true);
    devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage');
    const projected = persistedFreeholdFromState(serializeFreehold(sim.ctx, keyOf(sim)) as never);
    expect(Object.keys(projected)).not.toContain('ownerKey');
    expect(JSON.stringify(projected)).not.toContain(keyOf(sim));
  });

  it('writes nothing housing into the character blob, granted or refused', () => {
    for (const granting of [true, false]) {
      const sim = makeSim(true, granting);
      devGrantFreeholdTier(sim.ctx, sim.primaryId, 'cottage');
      const json = JSON.stringify(sim.serializeCharacter(sim.primaryId));
      expect(json, `granting=${granting}`).not.toMatch(/freehold|cottage|inn_room/i);
      expect(json, `granting=${granting}`).not.toContain(keyOf(sim));
    }
  });

  it('answers null for an evicted owner, which the persistence caller reads as skip', () => {
    const sim = makeSim(true, true);
    const key = keyOf(sim);
    evictFreehold(sim.ctx, key);
    expect(serializeFreehold(sim.ctx, key)).toBeNull();
  });
});
