// Cosmetic and appearance wire: guild nameplates, active titles and borders from
// the Book of Deeds, the shared cosmetic rate guard, held weapons, weapon skins
// and equipped instances. Split out of tests/snapshots.test.ts on 2026-09-27.

import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { COSMETIC_OP_BURST, COSMETIC_OP_REFILL_PER_SECOND } from '../server/cosmetic_op_guard';
import { type ClientSession, GameServer, wireEntity } from '../server/game';
import { gameMetricsCounters } from '../server/http/game_signals';
import { legendaryRegaliaActive } from '../src/render/legendary_regalia_core';
import { Sim } from '../src/sim/sim';
import { deedBorderSlug } from '../src/ui/deed_border_view';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { WIRE_TEST_WORLD } from './helpers/snapshot_wire';

// Guild name rides the identity wire (terse key `gd`) so nearby players' plates
// can show "<Guild>" under the name. setPlayerGuild is the server's only writer;
// offline/headless never call it, so the field stays ''.
describe('guild nameplate wire', () => {
  it('carries the guild name through wireEntity only when set', () => {
    const sim = new Sim({
      seed: 1,
      playerClass: 'warrior',
      noPlayer: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.addPlayer('warrior', 'Thaldrin');

    expect(wireEntity(sim.entities.get(pid)!).gd).toBeUndefined();

    sim.setPlayerGuild(pid, 'Silver Hand');
    expect(wireEntity(sim.entities.get(pid)!).gd).toBe('Silver Hand');

    // leaving the guild clears the field, so the line disappears for viewers
    sim.setPlayerGuild(pid, '');
    expect(wireEntity(sim.entities.get(pid)!).gd).toBeUndefined();
  });

  it('restores entity.guild on the client from a full record', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...base, gd: 'Silver Hand' }],
    });
    expect(client.entities.get(7)?.guild).toBe('Silver Hand');

    // a later full record without `gd` means "no guild" → reset to ''
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.guild).toBe('');
  });

  it('patches only the matching social guild from a structured rename event', () => {
    const client = bareClient(99);
    client.socialInfo = {
      friends: [],
      blocks: [],
      ignores: [],
      guild: {
        id: 7,
        name: 'Silver Hand',
        rank: 'member',
        motd: '',
        motdSetBy: '',
        members: [],
        events: [],
        pledgeSettings: { enabled: true, minLevel: 1, note: '', newPlayerFriendly: false },
        pledges: [],
        tier: 0,
      },
      myPledge: null,
    };
    (client as any).socialDirty = false;
    const internals = client as unknown as { onMessage(raw: string): void };

    internals.onMessage(
      JSON.stringify({
        t: 'events',
        list: [{ type: 'guildRenamed', guildId: 7, newName: 'Dawn Guard' }],
      }),
    );

    expect(client.socialInfo?.guild?.name).toBe('Dawn Guard');
    expect(client.consumeSocialChanged()).toBe(true);

    internals.onMessage(
      JSON.stringify({
        t: 'events',
        list: [{ type: 'guildRenamed', guildId: 8, newName: 'Wrong Guild' }],
      }),
    );
    expect(client.socialInfo?.guild?.name).toBe('Dawn Guard');
    expect(client.consumeSocialChanged()).toBe(false);
  });

  it('stamps the live server entity and emits one event without a social snapshot', () => {
    const server = new GameServer();
    const socialSnapshot = vi.spyOn(server as any, 'sendSocialSnapshot');
    const socket = fakeWs();
    const session = joinServer(server, socket, 71, 'Brae');
    server.sim.setPlayerGuild(session.pid, 'Silver Hand');
    socialSnapshot.mockClear();
    socket.sent.length = 0;

    server.social.guildRenamed(7, 'Silver Hand', 'Dawn Guard', [session.characterId]);

    expect(server.sim.entities.get(session.pid)?.guild).toBe('Dawn Guard');
    expect(socket.sent).toContainEqual({
      t: 'events',
      list: [{ type: 'guildRenamed', guildId: 7, newName: 'Dawn Guard' }],
    });
    expect(socialSnapshot).not.toHaveBeenCalled();
  });

  it('reports only socket-connected character ids to cheap admin reads', () => {
    const server = new GameServer();
    const connected = joinServer(server, fakeWs(), 81, 'Connected');
    const linkdead = joinServer(server, fakeWs(), 82, 'Linkdead');
    linkdead.linkdead = true;

    expect(server.liveCharacterIds()).toEqual(new Set([connected.characterId]));
  });
});

// The Book of Deeds active title rides the identity wire (key `title`, a deed
// id, never display text) so other players' titles reach nameplates/inspect.
// Emitted only when non-null (mobs and untitled players pay zero bytes); the
// sim validator (src/sim/deeds.ts setActiveTitle) is the only writer.
describe('active title wire (Book of Deeds)', () => {
  it('carries the title deed id through wireEntity only when set', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Thaldrin');
    const e = sim.entities.get(pid)!;
    const meta = sim.players.get(pid)!;
    expect(wireEntity(e).title).toBeUndefined();

    // earn a title-reward deed, then select it through the sim setter
    meta.deedsEarned.set('prog_veteran', '2026-07-08');
    sim.setActiveTitle('prog_veteran', pid);
    expect(wireEntity(e).title).toBe('prog_veteran');

    // clearing the title drops the key, so the line disappears for viewers
    sim.setActiveTitle(null, pid);
    expect(wireEntity(e).title).toBeUndefined();
  });

  it('restores entity.title on the client from a full record', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...base, title: 'prog_veteran' }],
    });
    expect(client.entities.get(7)?.title).toBe('prog_veteran');

    // a later full record without `title` means "untitled" -> reset to null
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.title).toBeNull();
  });

  it('server dispatch shape-checks the payload and routes through the sim validator', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Titled');
    const sim = server.sim;
    const meta = sim.players.get(session.pid)!;
    const e = sim.entities.get(session.pid)!;
    meta.deedsEarned.set('prog_veteran', '2026-07-08');

    // a non-string, non-null payload never reaches the sim (silent no-op)
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_title', deedId: 42 }));
    expect(meta.activeTitle).toBeNull();
    expect(e.title).toBeNull();

    // a raw frame naming an UNEARNED deed is refused by the sim validator
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'deed_set_title',
        deedId: 'prog_champion',
      }),
    );
    expect(meta.activeTitle).toBeNull();
    expect(e.title).toBeNull();

    // the earned title-reward deed is accepted and echoes on the snapshot
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'deed_set_title',
        deedId: 'prog_veteran',
      }),
    );
    expect(meta.activeTitle).toBe('prog_veteran');
    expect(e.title).toBe('prog_veteran');
    broadcast(server);
    expect(lastSnap(fc.sent).self.atitle).toBe('prog_veteran');
  });

  it('the ClientWorld send frame round-trips through the server dispatch (key lockstep)', () => {
    // Drive the REAL ClientWorld send path (cmd -> rawCmd -> ws.send) and feed
    // the produced frame verbatim into server.handleMessage, so a key rename
    // on EITHER side (deedId vs anything else) reddens here instead of
    // silently no-oping in production.
    const outbox: string[] = [];
    const client = bareClient(1);
    (client as any).connected = true;
    (client as any).ws = { readyState: 1, send: (p: string) => outbox.push(p) };
    client.setActiveTitle('prog_veteran');
    // Asserted HERE, between the select and the clear: the send writes NO
    // optimistic local copy (the mirror only moves when the server echo
    // lands), so a refused pick can never leave a phantom worn title on the
    // client. After the trailing clear this would read null either way.
    expect(client.activeTitle).toBeNull();
    client.setActiveTitle(null);
    expect(outbox.map((p) => JSON.parse(p))).toEqual([
      { t: 'cmd', cmd: 'deed_set_title', deedId: 'prog_veteran' },
      { t: 'cmd', cmd: 'deed_set_title', deedId: null },
    ]);

    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Lockstep');
    const meta = server.sim.players.get(session.pid)!;
    const e = server.sim.entities.get(session.pid)!;
    meta.deedsEarned.set('prog_veteran', '2026-07-08');
    server.handleMessage(session, outbox[0]); // the client-built select frame
    expect(meta.activeTitle).toBe('prog_veteran');
    expect(e.title).toBe('prog_veteran');
    server.handleMessage(session, outbox[1]); // the client-built clear frame
    expect(meta.activeTitle).toBeNull();
    expect(e.title).toBeNull();
  });

  it('a null payload through the server dispatch clears the title and echoes null', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Cleared');
    const sim = server.sim;
    const meta = sim.players.get(session.pid)!;
    const e = sim.entities.get(session.pid)!;
    meta.deedsEarned.set('prog_veteran', '2026-07-08');
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'deed_set_title',
        deedId: 'prog_veteran',
      }),
    );
    expect(meta.activeTitle).toBe('prog_veteran');

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_title', deedId: null }),
    );
    expect(meta.activeTitle).toBeNull();
    expect(e.title).toBeNull();
    broadcast(server);
    expect(lastSnap(fc.sent).self.atitle).toBeNull();
  });

  it('a mid-session unlock re-emits deeds and dstats on the next snapshot', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Unlocks');
    const sim = server.sim;
    const meta = sim.players.get(session.pid)!;

    broadcast(server); // first snapshot: full self state
    sim.tick(); // a quiet tick: nothing deed-related changed
    fc.sent.length = 0;
    broadcast(server);
    const quiet = lastSnap(fc.sent);
    expect(quiet.self).not.toHaveProperty('deeds');
    expect(quiet.self).not.toHaveProperty('dstats');

    // a real evaluator grant mid-session (duelsWon 0 -> 1 crosses the
    // pvp_duel_first_win threshold) must reach the client on the NEXT
    // snapshot, not the ~2s staggered backstop
    sim.ctx.bumpDeedStat(meta, 'duelsWon', 1);
    sim.tick();
    expect(meta.deedsEarned.has('pvp_duel_first_win')).toBe(true);
    fc.sent.length = 0;
    broadcast(server);
    const after = lastSnap(fc.sent);
    expect(after.self.deeds).toHaveProperty('pvp_duel_first_win');
    expect(after.self.dstats.counters.duelsWon).toBe(1);
    expect(after.self.renown).toBe(5); // exactly pvp_duel_first_win's renown, from a base of 0
  });

  it('a second client sees the first client entity title after the re-wire', () => {
    const server = new GameServer();
    const fcA = fakeWs();
    const a = joinServer(server, fcA, 1, 'Wearer');
    const fcB = fakeWs();
    const b = joinServer(server, fcB, 2, 'Viewer');
    const sim = server.sim;
    sim.players.get(a.pid)!.deedsEarned.set('prog_veteran', '2026-07-08');

    // before the title: B's view of A carries no `title` key
    broadcast(server);
    const viewerB = bareClient(b.pid);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.title ?? null).toBeNull();

    // A selects the title; the identity change re-wires A as a full record on
    // the next tick (the per-entity wire cache re-serializes at most once per
    // sim tick, so the tick between command and broadcast mirrors production)
    server.handleMessage(
      a,
      JSON.stringify({
        t: 'cmd',
        cmd: 'deed_set_title',
        deedId: 'prog_veteran',
      }),
    );
    sim.tick();
    fcB.sent.length = 0;
    broadcast(server);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.title).toBe('prog_veteran');

    // A clears; the identity JSON loses the key, so A re-wires as a full
    // record WITHOUT `title` and B's mirror must return to null (the ?? null
    // default in the apply, not a stale carry-over)
    server.handleMessage(a, JSON.stringify({ t: 'cmd', cmd: 'deed_set_title', deedId: null }));
    sim.tick();
    fcB.sent.length = 0;
    broadcast(server);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.title).toBeNull();
  });

  it('a fresh player wires an empty earned map and null title that decode faithfully', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Fresh');
    broadcast(server);
    const snap = lastSnap(fc.sent);
    // empty-value fidelity on the wire (the 40-key presence test in
    // tests/snapshots.test.ts only proves the keys ride the first snapshot)
    expect(snap.self.deeds).toEqual({});
    expect(snap.self.atitle).toBeNull();
    expect(snap.self.renown).toBe(0);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.deedsEarned.size).toBe(0);
    expect(client.activeTitle).toBeNull();
    expect(client.renown).toBe(0);
  });
});

// The Book of Deeds nameplate border rides the identity wire (key `border`, a
// deed id, never the reward slug and never display text) so other players'
// borders reach nameplates/inspect. Emitted only when non-null (mobs and
// borderless players pay zero bytes); the sim validator (src/sim/deeds.ts
// setActiveBorder) is the only writer. Every arm is the exact sibling of the
// active-title suite above, plus the cross-kind rejection both ways: the two
// cosmetics share one earned set and one reward field, so a validator that
// checked "has a reward" instead of "has a reward of MY kind" would let a
// title ride the border wire.
describe('active border wire (Book of Deeds)', () => {
  // prog_prestige_10 rewards { kind: 'border', slug: 'prestige_laurels' };
  // prog_veteran rewards a title. The pair is what makes the kind checks
  // below decisive (tests/deeds_content.test.ts pins the four border deeds).
  const BORDER_DEED = 'prog_prestige_10';
  const TITLE_DEED = 'prog_veteran';

  it('carries the border deed id through wireEntity only when set', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Thaldrin');
    const e = sim.entities.get(pid)!;
    const meta = sim.players.get(pid)!;
    expect(wireEntity(e).border).toBeUndefined();

    // earn a border-reward deed, then select it through the sim setter
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    sim.setActiveBorder(BORDER_DEED, pid);
    expect(wireEntity(e).border).toBe(BORDER_DEED);

    // clearing the border drops the key, so the frame disappears for viewers
    sim.setActiveBorder(null, pid);
    expect(wireEntity(e).border).toBeUndefined();
  });

  it('rejects a cross-kind deed in BOTH directions and never crosses the two wire fields', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Crosskind');
    const e = sim.entities.get(pid)!;
    const meta = sim.players.get(pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    meta.deedsEarned.set(TITLE_DEED, '2026-07-08');

    // an EARNED title deed is not a border: the border setter refuses it
    sim.setActiveBorder(TITLE_DEED, pid);
    expect(meta.activeBorder).toBeNull();
    expect(wireEntity(e).border).toBeUndefined();

    // and an EARNED border deed is not a title: the title setter refuses it
    sim.setActiveTitle(BORDER_DEED, pid);
    expect(meta.activeTitle).toBeNull();
    expect(wireEntity(e).title).toBeUndefined();

    // each accepts its own kind, and neither write lands on the other's field
    sim.setActiveBorder(BORDER_DEED, pid);
    sim.setActiveTitle(TITLE_DEED, pid);
    expect(wireEntity(e).border).toBe(BORDER_DEED);
    expect(wireEntity(e).title).toBe(TITLE_DEED);
  });

  it('restores entity.border on the client from a full record', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...base, border: BORDER_DEED }],
    });
    expect(client.entities.get(7)?.border).toBe(BORDER_DEED);

    // a later full record without `border` means "borderless" -> reset to null
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.border).toBeNull();
  });

  it('server dispatch shape-checks the payload and routes through the sim validator', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Bordered');
    const sim = server.sim;
    const meta = sim.players.get(session.pid)!;
    const e = sim.entities.get(session.pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    // The sim validator refuses a non-string too, so a state-only assertion
    // cannot tell the server's shape check apart from the sim's: it stays
    // green with the check deleted. Spy on the CALL, which is exactly what the
    // shape check exists to prevent.
    const setter = vi.spyOn(server.sim, 'setActiveBorder');

    // a non-string, non-null payload never reaches the sim (silent no-op)
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: 42 }));
    expect(setter).not.toHaveBeenCalled();
    expect(meta.activeBorder).toBeNull();
    expect(e.border).toBeNull();

    // a raw frame naming an UNEARNED border deed DOES reach the sim (a string
    // clears the shape check) and is refused there by the validator
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'deed_set_border',
        deedId: 'dgn_deepward',
      }),
    );
    expect(setter).toHaveBeenCalledWith('dgn_deepward', session.pid);
    expect(meta.activeBorder).toBeNull();
    expect(e.border).toBeNull();
    setter.mockRestore();

    // the earned border-reward deed is accepted and echoes on the snapshot
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: BORDER_DEED }),
    );
    expect(meta.activeBorder).toBe(BORDER_DEED);
    expect(e.border).toBe(BORDER_DEED);
    broadcast(server);
    expect(lastSnap(fc.sent).self.aborder).toBe(BORDER_DEED);
  });

  it('the ClientWorld send frame round-trips through the server dispatch (key lockstep)', () => {
    // Same reasoning as the title arm: drive the REAL ClientWorld send path and
    // feed the produced frame verbatim into server.handleMessage, so a key
    // rename on EITHER side reddens here instead of silently no-oping.
    const outbox: string[] = [];
    const client = bareClient(1);
    (client as any).connected = true;
    (client as any).ws = { readyState: 1, send: (p: string) => outbox.push(p) };
    client.setActiveBorder(BORDER_DEED);
    // Same as the title arm, and asserted at the same point: no optimistic
    // local copy, so the mirror stays null between the select and the echo.
    expect(client.activeBorder).toBeNull();
    client.setActiveBorder(null);
    expect(outbox.map((p) => JSON.parse(p))).toEqual([
      { t: 'cmd', cmd: 'deed_set_border', deedId: BORDER_DEED },
      { t: 'cmd', cmd: 'deed_set_border', deedId: null },
    ]);

    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Lockstep');
    const meta = server.sim.players.get(session.pid)!;
    const e = server.sim.entities.get(session.pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    server.handleMessage(session, outbox[0]); // the client-built select frame
    expect(meta.activeBorder).toBe(BORDER_DEED);
    expect(e.border).toBe(BORDER_DEED);
    server.handleMessage(session, outbox[1]); // the client-built clear frame
    expect(meta.activeBorder).toBeNull();
    expect(e.border).toBeNull();
  });

  it('a null payload through the server dispatch clears the border and echoes null', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Cleared');
    const sim = server.sim;
    const meta = sim.players.get(session.pid)!;
    const e = sim.entities.get(session.pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: BORDER_DEED }),
    );
    expect(meta.activeBorder).toBe(BORDER_DEED);

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: null }),
    );
    expect(meta.activeBorder).toBeNull();
    expect(e.border).toBeNull();
    broadcast(server);
    expect(lastSnap(fc.sent).self.aborder).toBeNull();
  });

  it('a second client sees the first client entity border after the re-wire', () => {
    const server = new GameServer();
    const fcA = fakeWs();
    const a = joinServer(server, fcA, 1, 'Wearer');
    const fcB = fakeWs();
    const b = joinServer(server, fcB, 2, 'Viewer');
    const sim = server.sim;
    sim.players.get(a.pid)!.deedsEarned.set(BORDER_DEED, '2026-07-08');

    // before the border: B's view of A carries no `border` key
    broadcast(server);
    const viewerB = bareClient(b.pid);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.border ?? null).toBeNull();

    // A selects the border; the identity change re-wires A as a full record on
    // the next tick (the per-entity wire cache re-serializes at most once per
    // sim tick, so the tick between command and broadcast mirrors production)
    server.handleMessage(
      a,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: BORDER_DEED }),
    );
    sim.tick();
    fcB.sent.length = 0;
    broadcast(server);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.border).toBe(BORDER_DEED);

    // A clears; the identity JSON loses the key, so A re-wires as a full
    // record WITHOUT `border` and B's mirror must return to null (the ?? null
    // default in the apply, not a stale carry-over)
    server.handleMessage(a, JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: null }));
    sim.tick();
    fcB.sent.length = 0;
    broadcast(server);
    (viewerB as any).applySnapshot(lastSnap(fcB.sent));
    expect(viewerB.entities.get(a.pid)?.border).toBeNull();
  });

  it('a fresh player wires a null border that decodes faithfully', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Fresh');
    broadcast(server);
    const snap = lastSnap(fc.sent);
    // empty-value fidelity on the wire (the delta-key presence test only
    // proves the key rides the first snapshot)
    expect(snap.self.aborder).toBeNull();
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.activeBorder).toBeNull();
  });

  it('cannot redirect the write to another player: pid comes from the session, not the payload', () => {
    // This is currently safe only because dispatch binds `const pid = session.pid`
    // once and never rebinds it in the switch. Nothing else in the suite would
    // notice if a future edit read a pid from the message, so pin it here. BOTH
    // players earn the deed, so the only thing deciding whose border is written
    // is the resolved pid, not the validator.
    const server = new GameServer();
    const attacker = joinServer(server, fakeWs(), 1, 'Attacker');
    const victim = joinServer(server, fakeWs(), 2, 'Victim');
    const sim = server.sim;
    const attackerMeta = sim.players.get(attacker.pid)!;
    const victimMeta = sim.players.get(victim.pid)!;
    attackerMeta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    victimMeta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    for (const field of [
      'pid',
      'playerId',
      'target',
      'targetPid',
      'id',
      'entityId',
      'characterId',
      'sessionId',
    ]) {
      server.handleMessage(
        attacker,
        JSON.stringify({
          t: 'cmd',
          cmd: 'deed_set_border',
          deedId: BORDER_DEED,
          [field]: victim.pid,
        }),
      );
    }
    expect(
      victimMeta.activeBorder,
      'no message field may redirect the write to the victim',
    ).toBeNull();
    expect(sim.entities.get(victim.pid)!.border).toBeNull();
    // every accepted write landed on the session owner instead
    expect(attackerMeta.activeBorder).toBe(BORDER_DEED);
  });

  it('admits only null or a string: object, array, boolean, and an absent key never reach the sim', () => {
    // The existing dispatch arm pins the number case (deedId: 42); this covers
    // the other non-string shapes plus an OMITTED key (undefined, not null),
    // which falls through to a no-op rather than clearing. A real border is
    // seated first so a shape that slipped through and cleared it would show.
    const server = new GameServer();
    const session = joinServer(server, fakeWs(), 1, 'Shapes');
    const meta = server.sim.players.get(session.pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: BORDER_DEED }),
    );
    expect(meta.activeBorder).toBe(BORDER_DEED);

    const setter = vi.spyOn(server.sim, 'setActiveBorder');
    for (const deedId of [{}, { deedId: BORDER_DEED }, [BORDER_DEED], [], true, false]) {
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId }));
    }
    // an omitted key is undefined, which is neither null nor a string
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_border' }));
    expect(setter, 'only null or a string may reach the sim validator').not.toHaveBeenCalled();
    expect(meta.activeBorder).toBe(BORDER_DEED); // the worn border survived every one
    setter.mockRestore();
  });

  it('earns col_reliquary_rank_5 and wears it end to end (the Eternal Spoils acceptance id)', () => {
    // The acceptance criterion names col_reliquary_rank_5, but the wire arms above
    // use prog_prestige_10 (its cross-kind sibling makes the kind rejection
    // decisive). This composes the real rank-5 id through the whole earn -> select
    // -> wire -> slug chain so the named criterion is demonstrated, not just derived.
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Curator');
    const e = sim.entities.get(pid)!;
    const meta = sim.players.get(pid)!;
    const RANK5 = 'col_reliquary_rank_5';
    expect(sim.ctx.grantDeed(meta, RANK5)).toBe(true); // the real grant path
    sim.setActiveBorder(RANK5, pid);
    expect(meta.activeBorder).toBe(RANK5);
    expect(wireEntity(e).border).toBe(RANK5);
    expect(deedBorderSlug(RANK5)).toBe('reliquary_gilt');
  });
});

// The two Book of Deeds cosmetic sets share ONE per-session token bucket
// (server/cosmetic_op_guard.ts). Both `title` and `border` are identityFields
// members, so an accepted set bumps idVer and re-wires the FULL identity
// record to every in-range viewer BEFORE the distance-tier thinning, and the
// command lane alone would allow that at 30/s. These arms drive the REAL
// dispatch, and drive the guard's clock through Date.now (which is where
// handleMessage stamps its receive time) rather than reaching into the bucket.
describe('cosmetic set rate guard (one bucket for title and border)', () => {
  const BORDER_DEED = 'prog_prestige_10';
  const TITLE_DEED = 'prog_veteran';
  const NOW_MS = 1_700_000_000_000;
  let clock: ReturnType<typeof vi.spyOn> | null = null;

  const freezeAt = (ms: number): void => {
    clock?.mockRestore();
    clock = vi.spyOn(Date, 'now').mockReturnValue(ms) as ReturnType<typeof vi.spyOn>;
  };

  afterEach(() => {
    clock?.mockRestore();
    clock = null;
  });

  /** A joined session holding both cosmetic deeds, with the clock frozen so
   *  every frame below lands in the same second (the command lane's own burst
   *  is 60, far above these counts, so a refusal here is the cosmetic guard). */
  const wearer = () => {
    freezeAt(NOW_MS);
    const server = new GameServer();
    const session = joinServer(server, fakeWs(), 1, 'Flooder');
    const meta = server.sim.players.get(session.pid)!;
    meta.deedsEarned.set(BORDER_DEED, '2026-07-08');
    meta.deedsEarned.set(TITLE_DEED, '2026-07-08');
    return { server, session, meta };
  };

  const setBorder = (server: GameServer, session: ClientSession, id: string | null): void => {
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_border', deedId: id }));
  };
  const setTitle = (server: GameServer, session: ClientSession, id: string | null): void => {
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'deed_set_title', deedId: id }));
  };

  it('pins the budget against disagreeing literals', () => {
    // The arms below spend COSMETIC_OP_BURST tokens, so they would follow a
    // silent budget change; these literals are what makes them decisive.
    expect(COSMETIC_OP_BURST).toBe(10);
    expect(COSMETIC_OP_REFILL_PER_SECOND).toBe(1);
  });

  it('lets a whole burst of alternating sets through, every one landing', () => {
    const { server, session, meta } = wearer();
    // Checked after EVERY frame: a guard that dropped one mid-burst would be
    // invisible to an end-state assertion on an even count.
    for (let i = 0; i < COSMETIC_OP_BURST; i++) {
      const wanted = i % 2 === 0 ? BORDER_DEED : null;
      setBorder(server, session, wanted);
      expect(meta.activeBorder, `set ${i} of the burst was dropped`).toBe(wanted);
    }
  });

  it('stops changing state past the budget, and the sim setter stops being called', () => {
    const { server, session, meta } = wearer();
    for (let i = 0; i < COSMETIC_OP_BURST - 1; i++) setBorder(server, session, BORDER_DEED);
    // The last token buys the state we then hold frozen through the flood.
    setBorder(server, session, BORDER_DEED);
    expect(meta.activeBorder).toBe(BORDER_DEED);

    // A state-only assertion cannot tell a dropped frame from one the sim
    // validator refused, so spy on the CALL: past the budget the frame never
    // reaches the sim at all.
    const setter = vi.spyOn(server.sim, 'setActiveBorder');
    for (let i = 0; i < 12; i++) setBorder(server, session, null);
    expect(setter).not.toHaveBeenCalled();
    expect(meta.activeBorder).toBe(BORDER_DEED);
    setter.mockRestore();
  });

  it('draws BOTH commands from the same bucket (titles exhaust it for borders)', () => {
    const { server, session, meta } = wearer();
    // Spend the whole budget on titles only.
    for (let i = 0; i < COSMETIC_OP_BURST; i++) {
      setTitle(server, session, i % 2 === 0 ? TITLE_DEED : null);
    }
    expect(meta.activeTitle).toBeNull(); // the even-count burst ends cleared

    // A perfectly valid border set now finds the shared bucket empty: two
    // buckets would let an alternating flooder buy twice the re-wire budget.
    const setter = vi.spyOn(server.sim, 'setActiveBorder');
    setBorder(server, session, BORDER_DEED);
    expect(setter).not.toHaveBeenCalled();
    expect(meta.activeBorder).toBeNull();
    setter.mockRestore();
  });

  it('refills one op per second of received time, and no more', () => {
    const { server, session, meta } = wearer();
    for (let i = 0; i < COSMETIC_OP_BURST; i++) setBorder(server, session, BORDER_DEED);
    setBorder(server, session, null);
    expect(meta.activeBorder).toBe(BORDER_DEED); // drained: the clear was dropped

    freezeAt(NOW_MS + 1000); // exactly one refilled token
    setBorder(server, session, null);
    expect(meta.activeBorder).toBeNull();
    setBorder(server, session, BORDER_DEED);
    expect(meta.activeBorder).toBeNull(); // and nothing beyond that one
  });

  it('books a cosmetic drop-cause metric when the bucket refuses a set', () => {
    // The refusal path in consumeCosmeticOp books wsMessageDropped('cosmetic')
    // and tallies into the abuse window; both could be deleted with every other
    // arm in this describe still green. Spy on the shared counters singleton
    // (gameMetricsCounters returns activeCounters) AFTER the burst so it only
    // sees the post-drain refusal.
    const { server, session } = wearer();
    for (let i = 0; i < COSMETIC_OP_BURST; i++) setBorder(server, session, BORDER_DEED);
    const dropped = vi.spyOn(gameMetricsCounters(), 'wsMessageDropped');
    setBorder(server, session, null); // bucket empty: refused, so booked
    expect(dropped).toHaveBeenCalledWith('cosmetic');
    dropped.mockRestore();
  });
});

// Equipped hand item ids ride the identity wire (terse keys `mh`/`oh`) so the
// renderer can show each player's held weapon models. Recomputed in
// recalcPlayerStats; the renderer maps them to GLBs (ITEM_WEAPON_VARIANTS).
describe('held weapon wire (mainhandItemId/offhandItemId)', () => {
  it('carries both equipped hand item ids through wireEntity', () => {
    const sim = new Sim({
      seed: 1,
      playerClass: 'warrior',
      noPlayer: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.addPlayer('warrior', 'Thaldrin');
    const e = sim.entities.get(pid)!;
    // a fresh warrior starts holding its class startWeapon
    expect(e.mainhandItemId).toBe('worn_sword');
    e.offhandItemId = 'eastbrook_buckler';
    expect(wireEntity(e).mh).toBe('worn_sword');
    expect(wireEntity(e).oh).toBe('eastbrook_buckler');
  });

  it('restores both held item ids on the client from a full record', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...base, mh: 'zealotsbane_blade', oh: 'eastbrook_buckler' }],
    });
    expect(client.entities.get(7)?.mainhandItemId).toBe('zealotsbane_blade');
    expect(client.entities.get(7)?.offhandItemId).toBe('eastbrook_buckler');

    // A later full record without either hand means "nothing equipped" → reset both.
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.mainhandItemId).toBeNull();
    expect(client.entities.get(7)?.offhandItemId).toBeNull();
  });
});

// Season 1 Armory: the active weapon-skin cosmetic rides the identity wire
// (terse key `wsk`, render-only like `mh`). Identity resend is a JSON compare,
// so an apply AND a detach must each produce a fresh full record for viewers;
// lite records leave the decoded value untouched.
describe('weapon skin wire (weaponSkinId)', () => {
  it('keeps the online optimistic bow and crossbow loadout mutually exclusive', () => {
    const client = bareClient(99);
    const internals = client as any;
    internals.connected = false;
    internals.accountCosmetics = {
      completedQuestIds: [],
      mechChromaIds: [],
      weaponSkinIds: ['winterbite', 'meteorlatch_crossbow'],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    };
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 99,
        k: 'player',
        tid: 'hunter',
        nm: 'Ranger',
        lv: 5,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
        mh: 'rusty_hatchet',
        res: 0,
        mres: 100,
        rtype: 'focus',
      },
    });

    client.changeWeaponSkin('winterbite', 'bow');
    client.changeWeaponSkin('meteorlatch_crossbow', 'crossbow');
    expect(client.player.weaponSkinLoadout).toEqual({
      crossbow: 'meteorlatch_crossbow',
    });
    expect(client.accountCosmetics.weaponSkinLoadout).toEqual({
      crossbow: 'meteorlatch_crossbow',
    });

    client.changeWeaponSkin('winterbite', 'bow');
    expect(client.player.weaponSkinLoadout).toEqual({ bow: 'winterbite' });
    expect(client.accountCosmetics.weaponSkinLoadout).toEqual({
      bow: 'winterbite',
    });
  });

  it('carries the active skin through wireEntity only while one is applied', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Thaldrin');
    const e = sim.entities.get(pid)!;
    expect(wireEntity(e).wsk).toBeUndefined();

    // a fresh warrior holds worn_sword (a sword), so the sword skin attaches
    expect(sim.setWeaponSkin(pid, 'ice_fang_sword')).toBe(true);
    expect(wireEntity(e).wsk).toBe('ice_fang_sword');

    // detaching drops the key from the wire entirely
    sim.setWeaponSkin(pid, null, 'sword');
    expect(wireEntity(e).wsk).toBeUndefined();
  });

  it('restores entity.weaponSkinId from a full record; a lite record preserves it', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...base, wsk: 'ice_fang_sword' }],
    });
    expect(client.entities.get(7)?.weaponSkinId).toBe('ice_fang_sword');

    // a lite record (no identity fields) leaves the applied skin in place
    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ id: 7, x: 1, y: 0, z: 1, f: 0, hp: 100, mhp: 100 }],
    });
    expect(client.entities.get(7)?.weaponSkinId).toBe('ice_fang_sword');

    // a later full record without `wsk` means "no skin applied" → reset to null
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.weaponSkinId).toBeNull();
  });

  it('broadcasts wsk to nearby sessions as a full record on apply and drops it on detach', () => {
    const server = new GameServer();
    const fcA = fakeWs();
    const joined = server.join(fcA.ws, 1, 1, 'Skinner', 'warrior', null, false, {
      accountCosmetics: {
        completedQuestIds: [],
        mechChromaIds: [],
        weaponSkinIds: ['ice_fang_sword'],
        weaponSkinLoadout: {},
        mountSkinIds: [],
      },
    });
    if ('error' in joined) throw new Error(joined.error);
    const a = joined;
    a.blockListLoaded = true;
    const fcB = fakeWs();
    joinServer(server, fcB, 2, 'Watcher');

    // Before the apply, B's first-sight full record of A carries no wsk.
    broadcast(server);
    const before = lastSnap(fcB.sent)?.ents.find((r: any) => r.id === a.pid);
    expect(before?.k).toBe('player');
    expect(before?.wsk).toBeUndefined();

    server.handleMessage(
      a,
      JSON.stringify({
        t: 'cmd',
        cmd: 'change_weapon_skin',
        skin: 'ice_fang_sword',
        wtype: 'sword',
      }),
    );
    fcB.sent.length = 0;
    server.sim.tick(); // the wire cache re-serializes identity once per sim tick
    broadcast(server);
    const applied = lastSnap(fcB.sent)?.ents.find((r: any) => r.id === a.pid);
    // identity changed, so B receives a FULL record (k present) with the skin
    expect(applied?.k).toBe('player');
    expect(applied?.wsk).toBe('ice_fang_sword');

    server.handleMessage(
      a,
      JSON.stringify({
        t: 'cmd',
        cmd: 'change_weapon_skin',
        skin: null,
        wtype: 'sword',
      }),
    );
    fcB.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const detached = lastSnap(fcB.sent)?.ents.find((r: any) => r.id === a.pid);
    // the detach re-sends identity too, now without the wsk key
    expect(detached?.k).toBe('player');
    expect(detached?.wsk).toBeUndefined();
  });
});

// Worn per-slot instance payloads ride the identity wire (terse key `eqi`,
// Professions 2.0) so the inspect window shows another player's
// masterwork/enchant rolls. Sparse exactly like `eq`: players only, present
// only while at least one worn piece carries a payload, absent otherwise (the
// no-bloat tooth: an instance-less player's identity record is byte-unchanged).
// `eqi` is an IDENTITY key, not a maybe() delta key, so it stays out of
// ALL_DELTA_KEYS; and like `eq` it is outside TERSE_TO_IWORLD scope (that map
// pins delta keys + self scalars only). End-to-end GameServer liveness plus
// clone-not-alias live in tests/inspect_instances.test.ts.
describe('equipped instance wire (eqi)', () => {
  const inst = {
    rolled: { masterwork: true, stats: { int: 3, spi: 1 } },
    signer: 'Aldric',
  };

  it('carries eqi through wireEntity only while an instanced piece is worn', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Thaldrin');
    const e = sim.entities.get(pid)!;
    // The fresh auto-equipped worn set is all plain pieces: eq rides, eqi
    // stays off the wire entirely.
    expect(wireEntity(e).eq).toBeDefined();
    expect(wireEntity(e).eqi).toBeUndefined();

    sim.addItemInstance('eastbrook_ritual_vestments', structuredClone(inst), pid);
    sim.equipItem('eastbrook_ritual_vestments', pid);
    expect((wireEntity(e).eq as any).chest).toBe('eastbrook_ritual_vestments');
    expect(wireEntity(e).eqi).toEqual({ chest: inst });

    // Unequipping the one instanced piece drops the key again (sparse, like wsk).
    sim.unequipItem('chest', pid);
    expect(wireEntity(e).eqi).toBeUndefined();
  });

  it('strips non-cosmetic instance fields from the wire payload (data minimization)', () => {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Yrsa');
    const e = sim.entities.get(pid)!;
    sim.addItemInstance(
      'eastbrook_ritual_vestments',
      {
        signer: 'Aldric',
        rolled: { masterwork: true, stats: { int: 3 } },
        boundTo: pid,
        charges: { mend: 2 },
        bindOnTrade: true,
        perfected: true,
        // Contradictory rank beside Perfected, to prove the privacy trim drops
        // progression independently of the visible marker.
        perfecting: 2,
        perfectingBound: true,
        perfectingBonus: { int: 3 },
      },
      pid,
    );
    sim.equipItem('eastbrook_ritual_vestments', pid);
    const wired = wireEntity(e).eqi as Record<string, Record<string, unknown>>;
    // Only the cosmetic inspect fields (signer, enchant, rolled) leave the
    // server; boundTo, charges, and the bindOnTrade arm are gameplay
    // state no inspecting client needs and must never ride the identity wire.
    expect(wired.chest.signer).toBe('Aldric');
    expect(wired.chest.rolled).toEqual({ masterwork: true, stats: { int: 3 } });
    expect(wired.chest.boundTo).toBeUndefined();
    expect(wired.chest.charges).toBeUndefined();
    expect(wired.chest.bindOnTrade).toBeUndefined();
    // Inspect must know whether a Perfected-only enchant is currently active.
    // Binding proof, rank and immutable bonus provenance remain owner-only.
    expect(wired.chest.perfected).toBe(true);
    expect(wired.chest.perfecting).toBeUndefined();
    expect(wired.chest.perfectingBound).toBeUndefined();
    expect(wired.chest.perfectingBonus).toBeUndefined();
    expect(Object.keys(wired.chest).sort()).toEqual(['perfected', 'rolled', 'signer']);
  });

  it('welds the regalia predicate across hosts: one legendary roll through the real wire', () => {
    // The one assertion joining the eqi allowlist scrape and the mirror pin
    // (Phase 16 QA): a real legendary-rolled worn piece drives
    // legendaryRegaliaActive TRUE on the Sim entity's own mirror, then TRUE
    // again on the ClientWorld mirror decoded from the same wireEntity
    // record, so the both-hosts claim is measured, not argued.
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Sunwrought');
    const e = sim.entities.get(pid)!;
    sim.addItemInstance(
      'eastbrook_ritual_vestments',
      { signer: 'Aldric', rolled: { quality: 'legendary', stats: { int: 3 } } },
      pid,
    );
    sim.equipItem('eastbrook_ritual_vestments', pid);
    expect(legendaryRegaliaActive(e.equippedInstances)).toBe(true);
    const wired = wireEntity(e);
    const client = bareClient(99);
    (client as any).applySnapshot({ t: 'snap', ents: [wired] });
    const mirror = client.entities.get(pid)!;
    expect(legendaryRegaliaActive(mirror.equippedInstances)).toBe(true);
    // Negative control on a FRESH rig (aimed, not order-dependent: on the
    // shared rig the unequipped legendary copy would sit in bags beside the
    // masterwork one and the un-aimed equip's pick order would decide the
    // arm): a plain masterwork roll glows on NEITHER host (the predicate
    // keys on rolled.quality alone).
    const sim2 = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid2 = sim2.addPlayer('warrior', 'Plainwrought');
    const e2 = sim2.entities.get(pid2)!;
    sim2.addItemInstance('eastbrook_ritual_vestments', structuredClone(inst), pid2);
    sim2.equipItem('eastbrook_ritual_vestments', pid2);
    expect(legendaryRegaliaActive(e2.equippedInstances)).toBe(false);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e2)] });
    expect(legendaryRegaliaActive(client.entities.get(pid2)!.equippedInstances)).toBe(false);
  });

  it('restores equippedInstances from a full record, deep-cloned; an eqi-less full record resets', () => {
    const client = bareClient(99);
    const base = {
      id: 7,
      k: 'player',
      tid: 'warrior',
      nm: 'Brae',
      lv: 5,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };
    const wireInst = structuredClone(inst);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [
        {
          ...base,
          eq: { chest: 'eastbrook_ritual_vestments' },
          eqi: { chest: wireInst },
        },
      ],
    });
    const e = client.entities.get(7)!;
    expect(e.equippedInstances).toEqual({ chest: inst });
    // Deep-cloned, never aliased: mutating the wire-parsed payload (a later
    // message could) must not reach the mirror, rolled.stats included.
    expect(e.equippedInstances.chest).not.toBe(wireInst);
    wireInst.rolled.stats.int = 99;
    expect(e.equippedInstances.chest?.rolled?.stats?.int).toBe(3);

    // A lite record (no identity fields) leaves the mirror in place.
    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ id: 7, x: 1, y: 0, z: 1, f: 0, hp: 100, mhp: 100 }],
    });
    expect(client.entities.get(7)?.equippedInstances).toEqual({ chest: inst });

    // A later full record WITHOUT eqi means no worn piece carries a payload
    // anymore: the mirror resets to empty (the `eq` absent-key semantics).
    (client as any).applySnapshot({ t: 'snap', ents: [base] });
    expect(client.entities.get(7)?.equippedInstances).toEqual({});
  });
});
