// The HUD's spatial sound router (src/ui/event_sfx_router.ts), extracted whole
// from Hud.playEventSfx and its three helpers. The cue CHOICES are pinned per
// mapping in tests/combat_sfx.test.ts; this suite holds what the router itself
// owns: the COMBAT_GAIN scaling, the two entity sets it shares with the Hud's
// reconcileSfx sweep (cast loops and first-contact aggro), and the weld to the
// private Hud members it reads.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sfx } from '../src/game/sfx';
import type { Entity, SimEvent } from '../src/sim/types';
import {
  COMBAT_GAIN,
  type EventSfxHost,
  playCombatSfx,
  playEventSfx,
  TEMPORAL_CLOCK_GAIN,
} from '../src/ui/event_sfx_router';
import { hudDeclares, interfaceMembers } from './helpers/hud_host_weld';
import { stripComments } from './helpers/strip_comments';

const PLAYER_ID = 1;

function entity(id: number, over: Partial<Entity> = {}): Entity {
  return {
    id,
    kind: 'mob',
    templateId: 'no_such_mob_template',
    pos: { x: id, y: 2, z: 3 },
    castingAbility: null,
    auras: [],
    ...over,
  } as unknown as Entity;
}

function host(entities: Entity[] = []): EventSfxHost {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return {
    sim: {
      playerId: PLAYER_ID,
      entities: byId,
      player: byId.get(PLAYER_ID) ?? entity(PLAYER_ID, { kind: 'player' }),
    } as unknown as EventSfxHost['sim'],
    castLoopIds: new Set(),
    mobAggroed: new Set(),
  };
}

let playAt: ReturnType<typeof vi.spyOn>;
let loop: ReturnType<typeof vi.spyOn>;
let unloop: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  playAt = vi.spyOn(sfx, 'playAt').mockImplementation(() => true);
  loop = vi.spyOn(sfx, 'loop').mockImplementation(() => {});
  unloop = vi.spyOn(sfx, 'unloop').mockImplementation(() => {});
  vi.spyOn(sfx, 'preload').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('playCombatSfx', () => {
  it('plays at the position with the gain scaled by COMBAT_GAIN and the options passed through', () => {
    playCombatSfx('combat_block', 1, 2, 3, 0.5, { rate: 0.8, cooldown: 0.1, jitter: false });
    expect(playAt).toHaveBeenCalledWith('combat_block', 1, 2, 3, {
      gain: 0.5 * COMBAT_GAIN,
      rate: 0.8,
      cooldown: 0.1,
      jitter: false,
    });
  });

  it('keeps the two layer constants at their tuned values', () => {
    expect(COMBAT_GAIN).toBe(1.0);
    expect(TEMPORAL_CLOCK_GAIN).toBe(0.72);
  });
});

describe('the cast-loop set the Hud prunes in reconcileSfx', () => {
  it('a castStart with a school cue starts a keyed loop at the caster and records it', () => {
    const h = host([entity(5)]);
    playEventSfx(h, { type: 'castStart', entityId: 5, ability: 'fireball' } as SimEvent);
    expect(loop).toHaveBeenCalledWith('cast:5', 'cast_fire', 1.0 * COMBAT_GAIN, 5, 2, 3);
    expect([...h.castLoopIds]).toEqual([5]);
  });

  it('Chain Heal plays its one-shot cast clip and records no loop', () => {
    const h = host([entity(5)]);
    playEventSfx(h, { type: 'castStart', entityId: 5, ability: 'chain_heal' } as SimEvent);
    expect(loop).not.toHaveBeenCalled();
    expect(playAt).toHaveBeenCalledWith('cast_chain_heal', 5, 2, 3, expect.any(Object));
    expect(h.castLoopIds.size).toBe(0);
  });

  it('a castStop fades the loop and forgets it; a death cuts it at once', () => {
    const h = host([entity(5), entity(6)]);
    h.castLoopIds.add(5);
    h.castLoopIds.add(6);
    playEventSfx(h, { type: 'castStop', entityId: 5, success: true });
    expect(unloop).toHaveBeenLastCalledWith('cast:5', 0.2);
    playEventSfx(h, { type: 'death', entityId: 6 } as SimEvent);
    expect(unloop).toHaveBeenLastCalledWith('cast:6', 0);
    expect(h.castLoopIds.size).toBe(0);
  });
});

describe('the first-contact aggro set', () => {
  it('a struck mob is engaged once, and its death forgets it', () => {
    const player = entity(PLAYER_ID, { kind: 'player', templateId: 'warrior' });
    const mob = entity(9);
    const h = host([player, mob]);
    const hit = {
      type: 'damage',
      sourceId: PLAYER_ID,
      targetId: 9,
      amount: 5,
      kind: 'hit',
    } as unknown as SimEvent;
    playEventSfx(h, hit);
    expect([...h.mobAggroed]).toEqual([9]);
    playEventSfx(h, hit);
    expect([...h.mobAggroed]).toEqual([9]);
    playEventSfx(h, { type: 'death', entityId: 9 } as SimEvent);
    expect(h.mobAggroed.size).toBe(0);
  });

  it('a mob that strikes first is engaged as the attacker', () => {
    const player = entity(PLAYER_ID, { kind: 'player', templateId: 'warrior' });
    const mob = entity(9);
    const h = host([player, mob]);
    playEventSfx(h, {
      type: 'damage',
      sourceId: 9,
      targetId: PLAYER_ID,
      amount: 5,
      kind: 'hit',
    } as unknown as SimEvent);
    expect([...h.mobAggroed]).toEqual([9]);
  });

  it('an event for an entity outside interest touches neither set', () => {
    const h = host();
    playEventSfx(h, {
      type: 'damage',
      sourceId: 3,
      targetId: 4,
      amount: 5,
      kind: 'hit',
    } as unknown as SimEvent);
    playEventSfx(h, { type: 'death', entityId: 4 } as SimEvent);
    expect(h.mobAggroed.size).toBe(0);
    expect(h.castLoopIds.size).toBe(0);
    expect(playAt).not.toHaveBeenCalled();
  });
});

describe('the weld to the private Hud members the router reads', () => {
  const router = readFileSync(new URL('../src/ui/event_sfx_router.ts', import.meta.url), 'utf8');
  const hud = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');

  it('every EventSfxHost member is declared on the Hud', () => {
    const members = interfaceMembers(router, 'EventSfxHost');
    expect(members).toEqual(['sim', 'castLoopIds', 'mobAggroed']);
    for (const member of members) expect(hudDeclares(hud, member), member).toBe(true);
    // The declaration reader has teeth.
    expect(hudDeclares(hud, 'noSuchHudMemberXyz')).toBe(false);
  });

  it('the Hud forwards every drained event to the router with itself as the host', () => {
    const code = stripComments(hud);
    expect(code).toContain(
      '  private playEventSfx(ev: SimEvent): void {\n    playEventSfx(this, ev);\n  }',
    );
    expect(code).toContain('this.playEventSfx(ev);');
    // The Hourglass aura tick is the one other caller of the scaled player.
    expect(code).toContain(
      "playCombatSfx('temporal_clock', tgt.pos.x, tgt.pos.y, tgt.pos.z, TEMPORAL_CLOCK_GAIN, {",
    );
  });
});
