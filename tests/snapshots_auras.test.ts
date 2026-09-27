// Aura and timer wire: aura magnitude parity, the aura decode fast path and its
// guards, the server tick rate on the snap head and its client mirror, and the
// negotiated stable timer wire v3. Split out of tests/snapshots.test.ts on
// 2026-09-27.

import { describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { GameServer, wireEntity } from '../server/game';
import { Sim } from '../src/sim/sim';
import type { Aura } from '../src/sim/types';
import { absorbTotal } from '../src/ui/absorb_bar';
import { auraEffectDescriptor } from '../src/ui/aura_effect';
import { isAuraDebuff } from '../src/ui/auras_view';
import { STABLE_TIMER_WIRE_VERSION } from '../src/world_api';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { WIRE_TEST_WORLD } from './helpers/snapshot_wire';

// Buff/debuff hover tooltips read an aura's magnitude (src/ui/aura_effect.ts: flat stat amount,
// slow/haste multiplier, dot/hot per-tick, absorb remaining, imbue range, ...), so the wire must
// carry it or the tooltip reads 0 online (the reported "Increases attack power by 0" bug). The
// serializer now sends `value` whenever it is nonzero (raw, so a negative stat-sap's sign and its
// isAuraDebuff classification survive), plus value2/value3 (imbue), tickInterval (dot/hot), and a
// non-physical school. The client decode reads `a.value ?? 0` and `a.school ?? 'physical'`, so a
// value-0 aura or an old server still decodes to the defaults (backward compatible). This drives a
// real Sim aura through the real serializer (wireEntity) and the real client decode
// (ClientWorld.applySnapshot).
describe('aura magnitude over the wire (buff/debuff tooltip parity)', () => {
  function roundTrip(aura: Aura): {
    wire: Record<string, unknown>;
    mirror: Aura;
  } {
    const sim = new Sim({
      seed: 1,
      playerClass: 'warrior',
      noPlayer: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.addPlayer('warrior', 'Sapped');
    const e = sim.entities.get(pid)!;
    e.auras.push(aura);
    const wire = wireEntity(e);
    // A different pid than the wired entity, so the player is decoded as a regular entity.
    const client = bareClient(999);
    // Serialize through JSON exactly as production does (wireCacheFor -> JSON.stringify), so
    // the round trip also catches any JSON-normalization divergence (e.g. -0 -> 0), not just
    // the in-memory wire shape.
    const snap = JSON.parse(JSON.stringify({ t: 'snap', ents: [wire] }));
    (client as any).applySnapshot(snap);
    const mirrorEntity = client.entities.get(pid);
    if (!mirrorEntity) throw new Error('mirrored entity missing');
    const mirror = mirrorEntity.auras.find((a) => a.id === aura.id);
    if (!mirror) throw new Error(`mirrored ${aura.id} aura missing`);
    return { wire, mirror };
  }

  // Pull the wired aura record by id (the entity carries only the pushed aura here).
  function wireAura(wire: Record<string, unknown>, id: string): Record<string, unknown> {
    return (wire.auras as Array<Record<string, unknown>>).find((a) => a.id === id)!;
  }

  function sapInt(value: number): Aura {
    return {
      id: 'enfeeble',
      name: 'Enfeeble',
      kind: 'buff_int',
      remaining: 8,
      duration: 8,
      value,
      sourceId: 0,
      school: 'physical',
    };
  }

  it('sends a NEGATIVE buff_* value so the sap classifies as a debuff in BOTH worlds', () => {
    const simSap = sapInt(-30);
    const { wire, mirror } = roundTrip(simSap);
    // the serializer carried the negative value...
    expect(wireAura(wire, 'enfeeble').value).toBe(-30);
    // ...and the client decoded it (not the old hardcoded 0).
    expect(mirror.value).toBe(-30);
    // so isAuraDebuff agrees across the wire: a debuff offline AND online.
    expect(isAuraDebuff(simSap)).toBe(true);
    expect(isAuraDebuff(mirror)).toBe(true);
  });

  it('sends a POSITIVE buff value so its tooltip shows the real magnitude, still a buff in both worlds', () => {
    const buff: Aura = {
      ...sapInt(40),
      id: 'arcane_intellect',
      name: 'Aether Insight',
    };
    const { wire, mirror } = roundTrip(buff);
    expect(wireAura(wire, 'arcane_intellect').value).toBe(40); // rides the wire now (was omitted)
    expect(mirror.value).toBe(40); // client mirrors the real magnitude (not the old hardcoded 0)
    expect(isAuraDebuff(buff)).toBe(false); // positive value -> still a buff, online and off
    expect(isAuraDebuff(mirror)).toBe(false);
  });

  it('WIRES the Aura.flask marker, sparsely, so the online glyph matches offline', () => {
    // REVERSED at Phase 18 (item flask-buff-glyph-wire-marker). The phase 14
    // answer was that this marker stays off the wire, which meant an online
    // client could not tell a flask buff from the same-family elixir buff (they
    // share an aura ID by design) and painted the same glyph for both. It now
    // rides as the presence-only `fl`, the `und` shape exactly: sparse, so an
    // ordinary aura is byte-unchanged, and read only to choose art.
    const flaskBuff: Aura = {
      id: 'elixir_buff_sta',
      name: 'Ironhusk Fortitude',
      kind: 'buff_sta',
      remaining: 1200,
      duration: 1200,
      value: 15,
      sourceId: 0,
      school: 'nature',
      flask: true,
    };
    const { wire, mirror } = roundTrip(flaskBuff);
    const wired = wireAura(wire, 'elixir_buff_sta');
    expect(wired.fl, 'the marker rides as presence-only 1').toBe(1);
    // The rest of the aura still rides, so the marker is an addition rather
    // than a re-shaping of the record.
    expect(wired.value).toBe(15);
    expect(wired.school).toBe('nature');
    expect(mirror.value).toBe(15);
    expect((mirror as { flask?: boolean }).flask, 'and reaches the mirror').toBe(true);
  });

  it('leaves an ORDINARY aura byte-unchanged: no fl key at all', () => {
    // The sparse half of the contract above. A marker sent falsy on every aura
    // in the game would be a real per-snapshot cost for a rare buff.
    const plainBuff: Aura = {
      id: 'elixir_buff_sta',
      name: 'Ironhusk Fortitude',
      kind: 'buff_sta',
      remaining: 1200,
      duration: 1200,
      value: 15,
      sourceId: 0,
      school: 'nature',
    };
    const { wire, mirror } = roundTrip(plainBuff);
    const wired = wireAura(wire, 'elixir_buff_sta');
    expect('fl' in wired, 'no marker for a non-flask aura').toBe(false);
    expect((mirror as { flask?: boolean }).flask).toBeUndefined();
  });

  it('sends a POSITIVE absorb value so the shield overlay and tooltip work online too', () => {
    const shield: Aura = {
      id: 'power_word_shield',
      name: 'Psalm of Warding',
      kind: 'absorb',
      remaining: 12,
      duration: 12,
      value: 250,
      sourceId: 0,
      school: 'holy',
    };
    const { wire, mirror } = roundTrip(shield);
    expect(wireAura(wire, 'power_word_shield').value).toBe(250);
    expect(wireAura(wire, 'power_word_shield').school).toBe('holy'); // non-physical school rides
    expect(mirror.value).toBe(250); // client mirrors the remaining absorb...
    expect(mirror.school).toBe('holy');
    // ...so the unit-frame shield overlay now derives online exactly as offline.
    expect(absorbTotal([mirror])).toBe(250);
  });

  it('classifies a non-buff_ aura (fear) as a debuff by KIND, not value, across the wire', () => {
    // An incapacitate (fear) stores a random facing angle in value; it now rides the wire like
    // any nonzero value, but the incapacitate tooltip reads NO number, so the inert angle is
    // harmless. Classification stays KIND-based (DEBUFF_AURA_KINDS), identical in both worlds.
    const fear: Aura = {
      id: 'fear',
      name: 'Harrow',
      kind: 'incapacitate',
      remaining: 4,
      duration: 4,
      value: -1.5,
      sourceId: 0,
      school: 'shadow',
    };
    const { wire, mirror } = roundTrip(fear);
    expect(wireAura(wire, 'fear').value).toBe(-1.5); // nonzero value rides raw (sign preserved)
    expect(mirror.value).toBe(-1.5);
    expect(auraEffectDescriptor(fear)?.nums).toBeUndefined(); // incapacitate shows no number
    expect(isAuraDebuff(fear)).toBe(true); // debuff via kind, in both worlds
    expect(isAuraDebuff(mirror)).toBe(true);
  });

  it("round-trips Harrier's Guise so its tooltip shows the real attack power, not 0 (the bug)", () => {
    // The reported bug: online, Harrier's Guise read "Increases attack power by 0" because the
    // positive buff_ap magnitude never rode the wire. It now does, so offline == online.
    const hawk: Aura = {
      id: 'aspect_of_the_hawk',
      name: "Harrier's Guise",
      kind: 'buff_ap',
      remaining: 1800,
      duration: 1800,
      value: 20,
      sourceId: 0,
      school: 'physical',
    };
    const { wire, mirror } = roundTrip(hawk);
    expect(wireAura(wire, 'aspect_of_the_hawk').value).toBe(20);
    expect(mirror.value).toBe(20);
    // end to end: the mirrored aura drives the tooltip descriptor to the real number.
    const desc = auraEffectDescriptor(mirror);
    expect(desc?.key).toBe('hudChrome.auraEffect.increase.ap');
    expect(desc?.nums?.value).toBe(20); // "Increases attack power by 20", never 0
  });

  it('round-trips a dot magnitude, tick cadence, and non-physical school for its tooltip', () => {
    const dot: Aura = {
      id: 'corruption',
      name: 'Blackrot',
      kind: 'dot',
      remaining: 12,
      duration: 12,
      value: 15,
      tickInterval: 3,
      sourceId: 0,
      school: 'shadow',
    };
    const { wire, mirror } = roundTrip(dot);
    expect(wireAura(wire, 'corruption').value).toBe(15);
    expect(wireAura(wire, 'corruption').tickInterval).toBe(3);
    expect(wireAura(wire, 'corruption').school).toBe('shadow');
    expect(mirror.value).toBe(15);
    expect(mirror.tickInterval).toBe(3);
    expect(mirror.school).toBe('shadow');
    const desc = auraEffectDescriptor(mirror);
    expect(desc?.key).toBe('hudChrome.auraEffect.dot');
    expect(desc?.nums?.value).toBe(15);
    expect(desc?.nums?.interval).toBe(3);
    expect(desc?.school).toBe('shadow');
  });

  it('round-trips unbreakable control so the client never offers cancellation', () => {
    const scriptedStasis: Aura = {
      id: 'scripted_stasis',
      name: 'Scripted Stasis',
      kind: 'stasis',
      remaining: 10,
      duration: 10,
      value: 0,
      sourceId: 0,
      school: 'arcane',
      unbreakableControl: true,
    };

    const { wire, mirror } = roundTrip(scriptedStasis);
    expect(wireAura(wire, 'scripted_stasis').ub).toBe(1);
    expect(mirror.unbreakableControl).toBe(true);
  });

  it('round-trips the break-threshold armed marker so the dread band renders online', () => {
    // The v0.34.0 merge audit: the release added the presence-only bt emit
    // (server/game.ts WireAura) for the Lingering Dread victim band, but no
    // client decode existed, so the band (ability_vfx/painter.ts, gated on
    // breakThreshold !== undefined) could never render for online mirrors.
    // Presence-only both ways: the value never crosses the wire.
    const talentedFear: Aura = {
      id: 'fear_incap',
      name: 'Fear',
      kind: 'stasis',
      remaining: 8,
      duration: 8,
      value: 0,
      sourceId: 0,
      school: 'shadow',
      breakThreshold: 120,
    };
    const { wire, mirror } = roundTrip(talentedFear);
    expect(wireAura(wire, 'fear_incap').bt).toBe(1);
    expect('breakThreshold' in wireAura(wire, 'fear_incap')).toBe(false); // presence-only: no value leak
    expect(mirror.breakThreshold).not.toBeUndefined();

    // And the negative arm: an untalented fear (no threshold) stays unmarked
    // and mirrors to undefined, so the band gate stays closed.
    const plainFear: Aura = { ...talentedFear, breakThreshold: undefined };
    const plain = roundTrip(plainFear);
    expect('bt' in wireAura(plain.wire, 'fear_incap')).toBe(false);
    expect(plain.mirror.breakThreshold).toBeUndefined();
  });

  it('clears the armed marker through the in-place decode arm when bt drops', () => {
    // The 20 Hz path: a persisting aura re-uses its mirrored record through
    // the sameAuraShape fast path (aura identity unchanged between
    // snapshots), which is the ONE arm where `= undefined` carries clearing
    // semantics: a fear_incap slot re-armed by an untalented fear must lose
    // the band, not wear a stale one. roundTrip cannot reach this arm (it
    // builds a fresh client per call), so this drives two snapshots into
    // one client by hand.
    const sim = new Sim({
      seed: 1,
      playerClass: 'warrior',
      noPlayer: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.addPlayer('warrior', 'Dreaded');
    const e = sim.entities.get(pid)!;
    e.auras.push({
      id: 'fear_incap',
      name: 'Fear',
      kind: 'stasis',
      remaining: 8,
      duration: 8,
      value: 0,
      sourceId: 0,
      school: 'shadow',
      breakThreshold: 120,
    });
    const client = bareClient(999);
    (client as any).applySnapshot(JSON.parse(JSON.stringify({ t: 'snap', ents: [wireEntity(e)] })));
    const armedEntity = client.entities.get(pid);
    if (!armedEntity) throw new Error('armed entity missing');
    const armed = armedEntity.auras.find((a) => a.id === 'fear_incap');
    if (!armed) throw new Error('armed fear aura missing');
    expect(armed.breakThreshold).not.toBeUndefined();

    // Same aura identity, threshold gone: the in-place arm must CLEAR it.
    e.auras[e.auras.length - 1].breakThreshold = undefined;
    (client as any).applySnapshot(JSON.parse(JSON.stringify({ t: 'snap', ents: [wireEntity(e)] })));
    const mirroredEntity = client.entities.get(pid);
    if (!mirroredEntity) throw new Error('mirrored entity missing');
    const mirrored = mirroredEntity.auras.find((a) => a.id === 'fear_incap');
    if (!mirrored) throw new Error('mirrored fear aura missing');
    // The fast path updates the SAME record object; assert both the clear
    // and the reuse, so this pin cannot silently slide onto the fresh-array
    // arm if the shape check ever changes.
    expect(mirrored).toBe(armed);
    expect(mirrored.breakThreshold).toBeUndefined();
  });

  it('round-trips the imbue judgement range (value2/value3), value omitted when 0', () => {
    const imbue: Aura = {
      id: 'holy_might',
      name: 'Holy Might',
      kind: 'imbue',
      remaining: 300,
      duration: 300,
      value: 0,
      value2: 8,
      value3: 12,
      sourceId: 0,
      school: 'holy',
    };
    const { wire, mirror } = roundTrip(imbue);
    expect('value' in wireAura(wire, 'holy_might')).toBe(false);
    expect(wireAura(wire, 'holy_might').value2).toBe(8);
    expect(wireAura(wire, 'holy_might').value3).toBe(12);
    expect(mirror.value2).toBe(8);
    expect(mirror.value3).toBe(12);
    const desc = auraEffectDescriptor(mirror);
    expect(desc?.key).toBe('hudChrome.auraEffect.imbue');
  });

  it('tolerates an old-server wire aura with no value (backward compatible -> 0)', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      ents: [
        {
          id: 2,
          k: 'mob',
          tid: 'wolf',
          nm: 'Wolf',
          lv: 3,
          x: 0,
          y: 0,
          z: 0,
          f: 0,
          hp: 40,
          mhp: 40,
          auras: [
            {
              id: 'enfeeble',
              name: 'Enfeeble',
              kind: 'buff_int',
              rem: 8,
              dur: 8,
            },
          ],
        },
      ],
    });
    const mirrorEntity = client.entities.get(2);
    if (!mirrorEntity) throw new Error('mirrored entity missing');
    const mirror = mirrorEntity.auras.find((a) => a.kind === 'buff_int');
    if (!mirror) throw new Error('mirrored buff_int aura missing');
    expect(mirror.value).toBe(0);
  });
});

describe('aura decode reuses records across snapshots (allocation fast path)', () => {
  function wolfWire(sim: Sim, mobId: number): Record<string, unknown> {
    return JSON.parse(JSON.stringify(wireEntity(sim.entities.get(mobId)!)));
  }

  function makeMobWithAura(): { sim: Sim; mobId: number } {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Poker');
    const mob = [...sim.entities.values()].find((e) => e.kind === 'mob')!;
    void pid;
    mob.auras.push({
      id: 'corruption',
      name: 'Blackrot',
      kind: 'dot',
      remaining: 12,
      duration: 12,
      value: 15,
      tickInterval: 3,
      sourceId: 0,
      school: 'shadow',
    });
    return { sim, mobId: mob.id };
  }

  it('keeps the same array and record objects while only fields change', () => {
    const { sim, mobId } = makeMobWithAura();
    const client = bareClient(999);
    (client as any).applySnapshot({ t: 'snap', ents: [wolfWire(sim, mobId)] });
    const firstArr = client.entities.get(mobId)!.auras;
    const firstRec = firstArr[0];
    expect(firstRec.remaining).toBe(12);

    // same aura set, only the remaining ticked down: the mirror must update the
    // SAME objects in place (no per-snapshot churn) with the new field values
    sim.entities.get(mobId)!.auras[0].remaining = 7.5;
    (client as any).applySnapshot({ t: 'snap', ents: [wolfWire(sim, mobId)] });
    const secondArr = client.entities.get(mobId)!.auras;
    expect(secondArr).toBe(firstArr);
    expect(secondArr[0]).toBe(firstRec);
    expect(firstRec.remaining).toBe(7.5);
    expect(firstRec.value).toBe(15);
    expect(firstRec.school).toBe('shadow');
  });

  it('rebuilds the list when the aura composition changes', () => {
    const { sim, mobId } = makeMobWithAura();
    const client = bareClient(999);
    (client as any).applySnapshot({ t: 'snap', ents: [wolfWire(sim, mobId)] });
    const firstArr = client.entities.get(mobId)!.auras;

    sim.entities.get(mobId)!.auras.push({
      id: 'venom_bite',
      name: 'Venom Bite',
      kind: 'dot',
      remaining: 6,
      duration: 6,
      value: 4,
      tickInterval: 2,
      sourceId: 0,
      school: 'nature',
    });
    (client as any).applySnapshot({ t: 'snap', ents: [wolfWire(sim, mobId)] });
    const secondArr = client.entities.get(mobId)!.auras;
    expect(secondArr).not.toBe(firstArr); // composition changed: fresh build
    expect(secondArr.map((a) => a.id)).toEqual(['corruption', 'venom_bite']);
    expect(secondArr[1].value).toBe(4);

    // and dropping back to one aura rebuilds again (length mismatch path)
    sim.entities.get(mobId)!.auras.pop();
    (client as any).applySnapshot({ t: 'snap', ents: [wolfWire(sim, mobId)] });
    expect(client.entities.get(mobId)!.auras.map((a) => a.id)).toEqual(['corruption']);
  });
});

describe('aura decode fast-path guards (composition edge cases)', () => {
  function client2(sim: Sim, mobId: number) {
    const client = bareClient(999);
    const apply = () =>
      (client as any).applySnapshot({
        t: 'snap',
        ents: [JSON.parse(JSON.stringify(wireEntity(sim.entities.get(mobId)!)))],
      });
    return { client, apply };
  }

  function makeMobWithTwoAuras(): { sim: Sim; mobId: number } {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    sim.addPlayer('warrior', 'Poker');
    const mob = [...sim.entities.values()].find((e) => e.kind === 'mob')!;
    mob.auras.push(
      {
        id: 'corruption',
        name: 'Blackrot',
        kind: 'dot',
        remaining: 12,
        duration: 12,
        value: 15,
        sourceId: 0,
        school: 'shadow',
      },
      {
        id: 'weakness',
        name: 'Weakness',
        kind: 'buff_ap',
        remaining: 9,
        duration: 9,
        value: -5,
        sourceId: 0,
        school: 'physical',
      },
    );
    return { sim, mobId: mob.id };
  }

  it('a same-length REORDER rebuilds instead of smearing fields across records', () => {
    const { sim, mobId } = makeMobWithTwoAuras();
    const { client, apply } = client2(sim, mobId);
    apply();
    const mob = sim.entities.get(mobId)!;
    // swap the two auras: same ids, same length, different order
    mob.auras.reverse();
    apply();
    const mirrored = client.entities.get(mobId)!.auras;
    expect(mirrored.map((a) => a.id)).toEqual(['weakness', 'corruption']);
    // each record carries ITS aura's fields, not the other slot's
    expect(mirrored[0].value).toBe(-5);
    expect(mirrored[1].value).toBe(15);
    expect(mirrored[1].school).toBe('shadow');
  });

  it('the in-place path clears optional sub-fields the wire stops sending', () => {
    const { sim, mobId } = makeMobWithTwoAuras();
    const mob = sim.entities.get(mobId)!;
    mob.auras[0].stacks = 3;
    mob.auras[0].value2 = 8;
    const { client, apply } = client2(sim, mobId);
    apply();
    const rec = client.entities.get(mobId)!.auras[0];
    expect(rec.stacks).toBe(3);
    expect(rec.value2).toBe(8);
    // same aura set (fast path), but the optionals dropped off the wire
    mob.auras[0].stacks = undefined;
    mob.auras[0].value2 = undefined;
    apply();
    expect(client.entities.get(mobId)!.auras[0]).toBe(rec); // fast path taken
    expect(rec.stacks).toBeUndefined(); // not a stale 3
    expect(rec.value2).toBeUndefined(); // not a stale 8
  });
});

describe('server tick rate on the snap head', () => {
  it('omits tickHz while the meter warms up, then reports the measured rate', () => {
    const server = new GameServer();
    const fc = fakeWs();
    joinServer(server, fc, 1, 'Ticky');
    broadcast(server);
    // fresh server: nothing measured yet, so the head omits the field entirely
    // and the ops profile reports null rather than a fake number
    expect(lastSnap(fc.sent).tickHz).toBeUndefined();
    expect(server.perfProfile().tickHz).toBeNull();
    // Drive the meter the way start() does (one record per callback against
    // wall ms); the loop timer itself cannot run under vitest without flaking.
    const internals = server as any;
    internals.tickRateMeter.record(0, 1);
    for (let t = 50; t <= 3000; t += 50) internals.tickRateMeter.record(t, 1);
    internals.tickHz = internals.tickRateMeter.rate(3000);
    fc.sent.length = 0;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    // parsed by JSON.parse in fakeWs, so this also proves the head stays valid JSON
    expect(snap.tickHz).toBeCloseTo(20, 1);
    expect(snap.tick).toBeTypeOf('number');
    // the same reading rides the ops /api/perf payload (both dispatch arms
    // share perfProfile), rounded for the wire
    expect(server.perfProfile().tickHz).toBeCloseTo(20, 1);
  });

  it('throttles tickHz on the head, re-emitting once the interval elapses', () => {
    const server = new GameServer();
    const fc = fakeWs();
    joinServer(server, fc, 1, 'Ticky');
    const internals = server as any;
    internals.tickRateMeter.record(0, 1);
    for (let t = 50; t <= 3000; t += 50) internals.tickRateMeter.record(t, 1);
    internals.tickHz = internals.tickRateMeter.rate(3000);
    // first head after warm-up carries the value
    broadcast(server);
    expect(lastSnap(fc.sent).tickHz).toBeCloseTo(20, 1);
    // a second head within the throttle window (no sim.time advance) omits it,
    // so the slow-moving scalar does not ride every 20 Hz snapshot. The client
    // holds its last reading across that gap (see the mirror test below).
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).tickHz).toBeUndefined();
    // once sim.time advances past the interval, the next head carries it again
    for (let i = 0; i < 20; i++) server.sim.tick(); // ~1s of sim time
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).tickHz).toBeCloseTo(20, 1);
  });
});

describe('client mirror of the server tick rate', () => {
  it('mirrors tickHz from the snap head and keeps the last value when omitted', () => {
    const client = bareClient(1);
    expect(client.serverTickHz).toBeNull();
    (client as any).applySnapshot({ t: 'snap', tickHz: 19.6, ents: [] });
    expect(client.serverTickHz).toBe(19.6);
    // a warm-up-era head omits the field: the mirror holds the last reading
    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.serverTickHz).toBe(19.6);
  });

  it('rejects junk tickHz values instead of poisoning the mirror', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', tickHz: 20, ents: [] });
    // Infinity is the one value only Number.isFinite rejects (typeof passes, > 0 passes)
    for (const junk of ['20', Number.NaN, Number.POSITIVE_INFINITY, -1, 0, null]) {
      (client as any).applySnapshot({ t: 'snap', tickHz: junk, ents: [] });
    }
    expect(client.serverTickHz).toBe(20);
  });
});

describe('negotiated stable timer wire v3', () => {
  const timerV3 = {
    timerWireVersion: STABLE_TIMER_WIRE_VERSION,
  } as unknown as Parameters<GameServer['join']>[7];

  function testAura(id: string, remaining: number, value = 7): Aura {
    return {
      id,
      name: id,
      kind: 'buff_ap',
      remaining,
      duration: remaining,
      value,
      sourceId: 0,
      school: 'physical',
    };
  }

  it('keeps an unnegotiated recipient on the legacy remaining-time wire', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Legacy', 'mage');
    const player = server.sim.entities.get(session.pid)!;
    const meta = server.sim.meta(session.pid)!;
    player.auras = [];
    player.auras.push(testAura('legacy_aura', 10));
    player.cooldowns.set('legacy_cast', 5);
    meta.nodeHarvestReadyAt.legacy_node = server.sim.time + 30;

    broadcast(server);
    const first = lastSnap(fc.sent);
    expect(first.tw).toBeUndefined();
    expect(first.self.auras[0]).toMatchObject({ id: 'legacy_aura', rem: 10 });
    expect(first.self.auras[0]).not.toHaveProperty('exp');
    expect(first.self.cds.legacy_cast).toBe(5);
    expect(first.self.ncd.legacy_node).toBe(30);

    fc.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const second = lastSnap(fc.sent);
    expect(second.self.auras[0].rem).toBeLessThan(10);
    expect(second.self.cds.legacy_cast).toBeLessThan(5);
    expect(second.self.ncd.legacy_node).toBeLessThan(30);
  });

  it('round-trips permanent auras through legacy and stable server snapshots', () => {
    for (const stable of [false, true]) {
      const server = new GameServer();
      const fc = fakeWs();
      const session = joinServer(
        server,
        fc,
        stable ? 21 : 20,
        stable ? 'StablePermanent' : 'LegacyPermanent',
        'paladin',
        stable ? timerV3 : undefined,
      );
      const player = server.sim.entities.get(session.pid)!;
      const permanent = testAura('devotion_ward', Number.POSITIVE_INFINITY, 0.05);
      permanent.kind = 'buff_dr';
      permanent.school = 'holy';
      permanent.permanent = true;
      player.auras = [permanent];

      broadcast(server);
      const snapshot = lastSnap(fc.sent);
      expect(snapshot.self.auras[0]).toMatchObject({
        id: 'devotion_ward',
        perm: 1,
      });
      expect(snapshot.self.auras[0]).not.toHaveProperty('exp');
      if (stable) expect(snapshot.self.auras[0]).not.toHaveProperty('rem');
      else {
        expect(snapshot.self.auras[0].dur).toBeGreaterThan(0);
        expect(snapshot.self.auras[0].rem).toBe(snapshot.self.auras[0].dur);
      }

      const client = bareClient(session.pid, { playerClass: 'paladin' });
      (client as any).applySnapshot(snapshot);
      expect(client.player.auras[0]).toMatchObject({
        id: 'devotion_ward',
        permanent: true,
        remaining: Number.POSITIVE_INFINITY,
        duration: Number.POSITIVE_INFINITY,
      });
    }
  });

  it('sends a complete stable first snapshot, then ages omitted timers across skipped ticks', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Stable', 'mage', timerV3);
    const player = server.sim.entities.get(session.pid)!;
    const meta = server.sim.meta(session.pid)!;
    player.auras = [];
    player.auras.push(testAura('stable_aura', 10));
    player.cooldowns.set('stable_cast', 5);
    player.abilityCharges = {
      stable_cast: {
        charges: 1,
        maxCharges: 2,
        recharge: 5,
        rechargeLength: 5,
        recharges: [5],
      },
    };
    meta.nodeHarvestReadyAt.stable_node = server.sim.time + 30;

    broadcast(server);
    const first = lastSnap(fc.sent);
    expect(first.tw).toBe(STABLE_TIMER_WIRE_VERSION);
    expect(first.self.auras[0]).toMatchObject({ id: 'stable_aura', exp: 10 });
    expect(first.self.auras[0]).not.toHaveProperty('rem');
    expect(first.self.cds.stable_cast).toBe(5);
    expect(first.self.achg.stable_cast).toBe(1);
    expect(first.self.achr.stable_cast).toEqual([5, 5]);
    expect(first.self.ncd.stable_node).toBe(30);

    const client = bareClient(session.pid);
    (client as any).applySnapshot(first);
    expect(client.player.auras[0].remaining).toBe(10);
    expect(client.player.cooldowns.get('stable_cast')).toBe(5);
    expect(client.player.abilityCharges?.stable_cast?.recharge).toBe(5);
    expect(client.player.abilityCharges?.stable_cast?.rechargeLength).toBe(5);
    expect(client.nodeHarvestableByMe('stable_node')).toBe(false);

    fc.sent.length = 0;
    for (let i = 0; i < 5; i++) server.sim.tick();
    broadcast(server);
    const later = lastSnap(fc.sent);
    expect(later.tick - first.tick).toBe(5);
    expect(later.self).not.toHaveProperty('auras');
    expect(later.self).not.toHaveProperty('cds');
    expect(later.self).not.toHaveProperty('achg');
    expect(later.self).not.toHaveProperty('achr');
    expect(later.self).not.toHaveProperty('ncd');

    (client as any).applySnapshot(later);
    expect(client.player.auras[0].remaining).toBeCloseTo(9.75, 5);
    expect(client.player.cooldowns.get('stable_cast')).toBeCloseTo(4.75, 5);
    // the retained achr deadline ages the recharge strip across omitted snapshots
    expect(client.player.abilityCharges?.stable_cast?.recharge).toBeCloseTo(4.75, 5);
    expect(client.nodeHarvestableByMe('stable_node')).toBe(false);

    // A Temporal Hourglass window re-ships achr every tick while the unchanged
    // counts stay delta-omitted: the accelerated deadline must land even with
    // NO achg in the snapshot (the decode is deliberately not gated on achg;
    // a nested decode silently dropped these and froze the strip at 1x).
    const accelerated = {
      ...later,
      tick: later.tick + 1,
      time: later.time + 0.05,
      self: { id: session.pid, achr: { stable_cast: [3, 5] } },
    };
    (client as any).applySnapshot(accelerated);
    expect(client.player.abilityCharges?.stable_cast?.recharge).toBeCloseTo(
      3 - accelerated.time,
      5,
    );
    expect(client.player.abilityCharges?.stable_cast?.charges).toBe(1);

    player.auras.length = 0;
    player.cooldowns.clear();
    player.abilityCharges.stable_cast.charges = 2;
    player.abilityCharges.stable_cast.recharge = 0;
    // recharges[] mirrors the real refill invariant (auras.ts empties the
    // per-charge timers when the pool fills); the encoder only reads
    // `recharge`, but the fixture should never model a state the sim cannot be in.
    player.abilityCharges.stable_cast.recharges = [];
    meta.nodeHarvestReadyAt.stable_node = server.sim.time - 1;
    fc.sent.length = 0;
    broadcast(server);
    const cleared = lastSnap(fc.sent);
    expect(cleared.self.auras).toEqual([]);
    expect(cleared.self.cds).toEqual({});
    expect(cleared.self.achg).toEqual({ stable_cast: 2 });
    expect(cleared.self.achr).toEqual({});
    expect(cleared.self.ncd).toEqual({});

    (client as any).applySnapshot(cleared);
    expect(client.player.auras).toEqual([]);
    expect(client.player.cooldowns.size).toBe(0);
    expect(client.player.abilityCharges?.stable_cast?.charges).toBe(2);
    expect(client.player.abilityCharges?.stable_cast?.recharge).toBe(0);
    expect(client.nodeHarvestableByMe('stable_node')).toBe(true);
  });

  it('re-sends aura refreshes, reorder, values, stacks, and charges without timer churn', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'AuraMutations', 'mage', timerV3);
    const player = server.sim.entities.get(session.pid)!;
    player.auras = [];
    const firstAura = testAura('first', 10, 2);
    const secondAura = testAura('second', 12, 3);
    player.auras.push(firstAura, secondAura);

    broadcast(server);
    const first = lastSnap(fc.sent);
    const firstExpiry = first.self.auras.find((a: any) => a.id === 'first').exp;
    const client = bareClient(session.pid);
    (client as any).applySnapshot(first);

    server.sim.tick();
    player.auras.reverse();
    firstAura.remaining = 20;
    secondAura.value = 9;
    secondAura.stacks = 3;
    secondAura.charges = 4;
    fc.sent.length = 0;
    broadcast(server);
    const changed = lastSnap(fc.sent);
    expect(changed.self.auras.map((a: any) => a.id)).toEqual(['second', 'first']);
    expect(changed.self.auras[0]).toMatchObject({
      value: 9,
      stacks: 3,
      charges: 4,
    });
    expect(changed.self.auras[1].exp).toBeGreaterThan(firstExpiry);

    (client as any).applySnapshot(changed);
    expect(client.player.auras.map((a) => a.id)).toEqual(['second', 'first']);
    expect(client.player.auras[0]).toMatchObject({
      value: 9,
      stacks: 3,
      charges: 4,
    });
    expect(client.player.auras[1].remaining).toBeCloseTo(20, 5);
  });

  it('keeps rate-aware cooldown deadlines stable through Temporal Hourglass acceleration', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Accelerated', 'mage', timerV3);
    const player = server.sim.entities.get(session.pid)!;
    player.auras = [];
    player.auras.push({
      ...testAura('temporal_hourglass', 1, 3),
      kind: 'stasis',
      duration: 1,
    });
    player.cooldowns.set('accelerated_cast', 5);
    player.cooldowns.set('temporal_hourglass', 5);

    broadcast(server);
    const first = lastSnap(fc.sent);
    expect(first.self.cds.accelerated_cast).toEqual([3, 3, 1]);
    expect(first.self.cds.temporal_hourglass).toBe(5);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(first);
    expect(client.player.cooldowns.get('accelerated_cast')).toBe(5);

    fc.sent.length = 0;
    for (let i = 0; i < 10; i++) server.sim.tick();
    broadcast(server);
    const accelerated = lastSnap(fc.sent);
    expect(accelerated.self).not.toHaveProperty('cds');
    (client as any).applySnapshot(accelerated);
    expect(client.player.cooldowns.get('accelerated_cast')).toBeCloseTo(3.5, 5);

    fc.sent.length = 0;
    for (let i = 0; i < 10; i++) server.sim.tick();
    broadcast(server);
    const expired = lastSnap(fc.sent);
    expect(expired.self.cds.accelerated_cast).toBe(3);
    (client as any).applySnapshot(expired);
    expect(client.player.cooldowns.get('accelerated_cast')).toBeCloseTo(2, 5);

    player.cooldowns.set('accelerated_cast', 6);
    player.auras.push({
      ...testAura('temporal_hourglass', 2, 2),
      kind: 'stasis',
      duration: 2,
    });
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self.cds.accelerated_cast).toEqual([5, 2, 3]);

    player.auras = player.auras.filter((aura) => aura.id !== 'temporal_hourglass');
    fc.sent.length = 0;
    broadcast(server);
    const removed = lastSnap(fc.sent);
    expect(removed.self.cds.accelerated_cast).toBe(7);
    (client as any).applySnapshot(removed);
    expect(client.player.cooldowns.get('accelerated_cast')).toBe(6);
  });

  it('freezes retained auras while dead, then resumes absolute decay after resurrection', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Paused', 'mage', timerV3);
    const player = server.sim.entities.get(session.pid)!;
    player.auras = [];
    player.auras.push(testAura('retained', 8));
    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));

    player.dead = true;
    player.hp = 0;
    fc.sent.length = 0;
    broadcast(server);
    const frozen = lastSnap(fc.sent);
    expect(frozen.self.auras[0]).toMatchObject({ id: 'retained', rem: 8 });
    expect(frozen.self.auras[0]).not.toHaveProperty('exp');
    (client as any).applySnapshot(frozen);
    const frozenRemaining = client.player.auras[0].remaining;

    fc.sent.length = 0;
    for (let i = 0; i < 6; i++) server.sim.tick();
    broadcast(server);
    const whileDead = lastSnap(fc.sent);
    expect(whileDead.self).not.toHaveProperty('auras');
    (client as any).applySnapshot(whileDead);
    expect(client.player.auras[0].remaining).toBe(frozenRemaining);

    player.dead = false;
    player.hp = player.maxHp;
    fc.sent.length = 0;
    broadcast(server);
    const resumed = lastSnap(fc.sent);
    expect(resumed.self.auras[0]).toHaveProperty('exp');
    expect(resumed.self.auras[0]).not.toHaveProperty('rem');
    (client as any).applySnapshot(resumed);

    fc.sent.length = 0;
    server.sim.tick();
    server.sim.tick();
    broadcast(server);
    const decayed = lastSnap(fc.sent);
    expect(decayed.self).not.toHaveProperty('auras');
    (client as any).applySnapshot(decayed);
    expect(client.player.auras[0].remaining).toBeCloseTo(frozenRemaining - 0.1, 5);
  });

  it('keeps legacy and stable entity variants isolated and builds each at most once per tick', () => {
    const server = new GameServer();
    const stableWs = fakeWs();
    const legacyWs = fakeWs();
    const subjectWs = fakeWs();
    const stable = joinServer(server, stableWs, 1, 'StableViewer', 'warrior', timerV3);
    joinServer(server, legacyWs, 2, 'LegacyViewer');
    const subject = joinServer(server, subjectWs, 3, 'Subject', 'mage');
    const subjectEntity = server.sim.entities.get(subject.pid)!;
    subjectEntity.auras = [];
    subjectEntity.auras.push(testAura('shared_aura', 20));

    (server as any).perfDetailActive = true;
    (server as any).bcLegacySerializes = 0;
    (server as any).bcStableSerializes = 0;
    (server as any).bcBaseSerializes = 0;
    broadcast(server);
    const stableFirst = lastSnap(stableWs.sent);
    const legacyFirst = lastSnap(legacyWs.sent);
    const stableRow = stableFirst.ents.find((e: any) => e.id === subject.pid);
    const legacyRow = legacyFirst.ents.find((e: any) => e.id === subject.pid);
    expect(stableRow.auras[0]).toHaveProperty('exp');
    expect(stableRow.auras[0]).not.toHaveProperty('rem');
    expect(legacyRow.auras[0]).toHaveProperty('rem');
    expect(legacyRow.auras[0]).not.toHaveProperty('exp');
    expect((server as any).bcLegacySerializes).toBeLessThanOrEqual(server.sim.entities.size);
    expect((server as any).bcStableSerializes).toBeLessThanOrEqual(server.sim.entities.size);
    expect((server as any).bcBaseSerializes).toBeLessThanOrEqual(server.sim.entities.size);
    expect(
      (server as any).bcLegacySerializes + (server as any).bcStableSerializes,
    ).toBeLessThanOrEqual(server.sim.entities.size * 2);

    const stableClient = bareClient(stable.pid);
    (stableClient as any).applySnapshot(stableFirst);
    stableWs.sent.length = 0;
    legacyWs.sent.length = 0;
    subjectWs.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const stableSecond = lastSnap(stableWs.sent);
    const legacySecond = lastSnap(legacyWs.sent);
    expect(stableSecond.ents.find((e: any) => e.id === subject.pid)).toBeUndefined();
    expect(stableSecond.keep).toContain(subject.pid);
    expect(legacySecond.ents.find((e: any) => e.id === subject.pid)?.auras[0]).toHaveProperty(
      'rem',
    );
    expect(JSON.stringify(stableSecond).length).toBeLessThan(JSON.stringify(legacySecond).length);
    (stableClient as any).applySnapshot(stableSecond);
    expect(stableClient.entities.get(subject.pid)?.auras[0].remaining).toBeCloseTo(19.95, 5);
  });

  it('uses the recipient capability for spectator self records', () => {
    const server = new GameServer();
    const stableWs = fakeWs();
    const legacyWs = fakeWs();
    const targetWs = fakeWs();
    const stableSpectator = joinServer(server, stableWs, 1, 'StableSpec', 'mage', timerV3);
    const legacySpectator = joinServer(server, legacyWs, 2, 'LegacySpec', 'mage');
    const target = joinServer(server, targetWs, 3, 'Observed', 'mage');
    for (let i = 0; i < 5; i++) server.sim.tick();
    const targetEntity = server.sim.entities.get(target.pid)!;
    targetEntity.auras = [];
    targetEntity.auras.push(testAura('observed_aura', 10));
    targetEntity.cooldowns.set('observed_cast', 5);
    (server as any).enterSpectate(stableSpectator, target);
    (server as any).enterSpectate(legacySpectator, target);
    stableWs.sent.length = 0;
    legacyWs.sent.length = 0;
    broadcast(server);

    const stableSnap = lastSnap(stableWs.sent);
    const legacySnap = lastSnap(legacyWs.sent);
    expect(stableSnap.self.id).toBe(target.pid);
    expect(stableSnap.tw).toBe(STABLE_TIMER_WIRE_VERSION);
    expect(stableSnap.self.auras[0]).toHaveProperty('exp');
    expect(stableSnap.self.cds.observed_cast).toBeCloseTo(server.sim.time + 5, 5);
    expect(legacySnap.self.id).toBe(target.pid);
    expect(legacySnap.tw).toBeUndefined();
    expect(legacySnap.self.auras[0]).toHaveProperty('rem');
    expect(legacySnap.self.cds.observed_cast).toBe(5);
  });

  it('refreshes the negotiated capability on linkdead resume in both directions', () => {
    const server = new GameServer();
    const legacyWs = fakeWs();
    const original = joinServer(server, legacyWs, 1, 'ResumeWire');
    legacyWs.ws.readyState = 3;
    expect(server.socketClosed(original, legacyWs.ws)).toBe(true);

    const stableWs = fakeWs();
    const stableResult = server.join(
      stableWs.ws,
      1,
      1,
      'ResumeWire',
      'warrior',
      null,
      false,
      timerV3,
    );
    if ('error' in stableResult) throw new Error(stableResult.error);
    expect(stableResult).toBe(original);
    expect((stableResult as any).timerWireVersion).toBe(STABLE_TIMER_WIRE_VERSION);
    stableWs.sent.length = 0;
    broadcast(server);
    expect(lastSnap(stableWs.sent).tw).toBe(STABLE_TIMER_WIRE_VERSION);

    stableWs.ws.readyState = 3;
    expect(server.socketClosed(stableResult, stableWs.ws)).toBe(true);
    const fallbackWs = fakeWs();
    const fallback = server.join(fallbackWs.ws, 1, 1, 'ResumeWire', 'warrior', null);
    if ('error' in fallback) throw new Error(fallback.error);
    expect(fallback).toBe(original);
    expect((fallback as any).timerWireVersion).toBe(1);
    fallbackWs.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fallbackWs.sent).tw).toBeUndefined();
  });

  it('falls back to legacy decode solely when the snapshot has no stable marker', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'OldServer', 'mage');
    const player = server.sim.entities.get(session.pid)!;
    player.auras = [];
    player.auras.push(testAura('old_wire', 6));
    player.cooldowns.set('old_cast', 4);
    broadcast(server);
    const first = lastSnap(fc.sent);
    expect(first.tw).toBeUndefined();

    const client = bareClient(session.pid);
    (client as any).applySnapshot(first);
    expect(client.player.auras[0].remaining).toBe(6);
    expect(client.player.cooldowns.get('old_cast')).toBe(4);

    fc.sent.length = 0;
    for (let i = 0; i < 3; i++) server.sim.tick();
    broadcast(server);
    const second = lastSnap(fc.sent);
    expect(second.tw).toBeUndefined();
    (client as any).applySnapshot(second);
    expect(client.player.auras[0].remaining).toBeCloseTo(5.85, 5);
    expect(client.player.cooldowns.get('old_cast')).toBeCloseTo(3.85, 5);
  });

  it('omits stable auras from moving lite records, then sends an explicit remote removal', () => {
    const server = new GameServer();
    const viewerWs = fakeWs();
    const subjectWs = fakeWs();
    const viewer = joinServer(server, viewerWs, 1, 'MovingViewer', 'mage', timerV3);
    const subject = joinServer(server, subjectWs, 2, 'MovingSubject', 'mage');
    const subjectEntity = server.sim.entities.get(subject.pid)!;
    subjectEntity.auras = [testAura('moving_aura', 20)];

    broadcast(server);
    const first = lastSnap(viewerWs.sent);
    const client = bareClient(viewer.pid, { playerClass: 'mage' });
    (client as any).applySnapshot(first);
    expect(client.entities.get(subject.pid)?.auras[0].remaining).toBe(20);

    viewerWs.sent.length = 0;
    server.sim.tick();
    subjectEntity.pos.x += 1;
    subjectEntity.prevPos.x += 1;
    server.sim.grid.update(subjectEntity);
    broadcast(server);
    const moving = lastSnap(viewerWs.sent);
    const lite = moving.ents.find((entity: any) => entity.id === subject.pid);
    expect(lite).toBeDefined();
    expect(lite.k).toBeUndefined();
    expect(lite).not.toHaveProperty('auras');
    (client as any).applySnapshot(moving);
    expect(client.entities.get(subject.pid)?.auras[0].remaining).toBeCloseTo(19.95, 5);

    subjectEntity.auras = [];
    viewerWs.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const removed = lastSnap(viewerWs.sent);
    const removalRow = removed.ents.find((entity: any) => entity.id === subject.pid);
    expect(removalRow.auras).toEqual([]);
    (client as any).applySnapshot(removed);
    expect(client.entities.get(subject.pid)?.auras).toEqual([]);
  });

  it('retains a remote aura revision across a non-due distance-tier tick', () => {
    const server = new GameServer();
    const viewerWs = fakeWs();
    const subjectWs = fakeWs();
    const viewer = joinServer(server, viewerWs, 1, 'DeferredViewer', 'mage', timerV3);
    const subject = joinServer(server, subjectWs, 2, 'DeferredSubject', 'mage');
    const viewerEntity = server.sim.entities.get(viewer.pid)!;
    const subjectEntity = server.sim.entities.get(subject.pid)!;
    subjectEntity.auras = [testAura('deferred_aura', 20, 2)];
    subjectEntity.pos.x = viewerEntity.pos.x + 60;
    subjectEntity.pos.z = viewerEntity.pos.z;
    subjectEntity.prevPos = { ...subjectEntity.pos };
    server.sim.grid.update(subjectEntity);

    broadcast(server);
    expect(lastSnap(viewerWs.sent).ents.some((entity: any) => entity.id === subject.pid)).toBe(
      true,
    );

    server.sim.tick();
    subjectEntity.auras[0].value = 9;
    viewerWs.sent.length = 0;
    broadcast(server);
    const deferred = lastSnap(viewerWs.sent);
    expect(deferred.ents.find((entity: any) => entity.id === subject.pid)).toBeUndefined();
    expect(deferred.keep).toContain(subject.pid);

    server.sim.tick();
    viewerWs.sent.length = 0;
    broadcast(server);
    const delivered = lastSnap(viewerWs.sent).ents.find((entity: any) => entity.id === subject.pid);
    expect(delivered.k).toBeUndefined();
    expect(delivered.auras[0]).toMatchObject({ id: 'deferred_aura', value: 9 });
  });

  it('eliminates stable aura rebuild churn and aggregate bytes over 160 ticks', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'LongWindow', 'mage');
    const player = server.sim.entities.get(session.pid)!;
    player.auras = [testAura('long_window', 60)];
    const internals = server as any;
    internals.perfDetailActive = true;
    internals.bcBaseSerializes = 0;
    internals.bcLegacySerializes = 0;
    internals.bcStableSerializes = 0;
    let legacyBytes = 0;
    let stableBytes = 0;

    for (let i = 0; i < 160; i++) {
      const legacy = internals.wireCacheFor(player, false);
      const stable = internals.wireCacheFor(player, true);
      legacyBytes += (i === 0 ? legacy.fullJson : legacy.liteJson).length;
      stableBytes += i === 0 ? stable.fullAuraJson.length : `{"keep":[${player.id}]}`.length;
      if (i < 159) server.sim.tick();
    }

    expect(internals.bcBaseSerializes).toBe(160);
    expect(internals.bcLegacySerializes).toBeGreaterThan(150);
    expect(internals.bcStableSerializes).toBe(1);
    expect(internals.wireCache.get(player.id).auraCache.rebuilds).toBe(1);
    expect(stableBytes).toBeLessThan(legacyBytes * 0.35);
  });
});
