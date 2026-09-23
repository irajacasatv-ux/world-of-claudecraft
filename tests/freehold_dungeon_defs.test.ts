// The two owner-keyed freehold rooms (src/sim/content/freehold/dungeons.ts):
// the Inn Room (index 15) and the Cottage (index 16) ride the dungeon slot pool
// under `claimKey: 'owner'` (D15). This suite pins the record shape that keeps
// every exhaustive dungeon sweep green without content it must not carry (no
// spawns, no objects, no overworld door, no Guide or Finder row), the overflow
// band math both ids resolve through, the entry point on the protected home floor,
// the English catalog rows that derive from the defs plus their five non-Latin
// fills (M16), the fresh-Sim boot shape (no door entity, 24 unclaimed slots per
// id on a lit AND a dark host), and the `/dungeons` readout exclusion. The
// gate's clearance from every other press is tests/freehold_gate_clearance.test.ts.
// `npcs` is deliberately NOT pinned empty: later work adds a room NPC.
import { beforeAll, describe, expect, it } from 'vitest';
import { isBlocked, resolvePosition } from '../src/sim/colliders';
import { FINDER_ACTIVITIES } from '../src/sim/content/dungeon_finder';
import {
  FREEHOLD_COTTAGE_DUNGEON_ID,
  FREEHOLD_DUNGEON_DEFS,
  FREEHOLD_INN_ROOM_DUNGEON_ID,
} from '../src/sim/content/freehold';
import { DUNGEON_LIST, DUNGEONS, dungeonAt, instanceOriginX } from '../src/sim/data';
import { PLAYER_BODY_RADIUS } from '../src/sim/pathfind';
import { Sim } from '../src/sim/sim';
import { dungeonsReadout } from '../src/sim/social/chat_readouts';
import { WORLD_SEED } from '../src/sim/world_seed';
import { dungeonText } from '../src/ui/entity_display_core';
import {
  entityTranslationFallbackLog,
  resetEntityTranslationFallbackLog,
  tEntity,
} from '../src/ui/entity_i18n';
import { ensureLocaleLoaded, type SupportedLanguage, setLanguage } from '../src/ui/i18n';

const ROOM_IDS = ['freehold_inn_room', 'freehold_cottage'] as const;
const NON_LATIN: SupportedLanguage[] = ['zh_CN', 'zh_TW', 'ja_JP', 'ko_KR', 'ru_RU'];

// The literal English every room line resolves to: pinned here, never read
// back from the def, so a reworded def and a stale catalog both surface.
const ENGLISH = {
  freehold_inn_room: {
    name: 'Inn Room',
    enterText: 'You climb the inn stairs and let yourself into your room.',
    leaveText: 'You lock the room behind you and step back out onto the quay.',
  },
  freehold_cottage: {
    name: 'Cottage',
    enterText: 'You push open the garden gate and step into your own cottage.',
    leaveText: 'You latch the cottage gate behind you and return to the quay.',
  },
} as const;

function litSim(): Sim {
  return new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true, freeholdsEnabled: true });
}

function darkSim(): Sim {
  return new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
}

describe('freehold dungeon defs: registry shape', () => {
  it('exports the two ids and registers both records in DUNGEONS and DUNGEON_LIST', () => {
    expect(FREEHOLD_INN_ROOM_DUNGEON_ID).toBe('freehold_inn_room');
    expect(FREEHOLD_COTTAGE_DUNGEON_ID).toBe('freehold_cottage');
    expect(Object.keys(FREEHOLD_DUNGEON_DEFS).sort()).toEqual([
      'freehold_cottage',
      'freehold_inn_room',
    ]);
    expect(DUNGEONS.freehold_inn_room).toBe(FREEHOLD_DUNGEON_DEFS.freehold_inn_room);
    expect(DUNGEONS.freehold_cottage).toBe(FREEHOLD_DUNGEON_DEFS.freehold_cottage);
    // DUNGEON_LIST is index-sorted: the two rooms close the list at 15 and 16.
    expect(DUNGEON_LIST).toHaveLength(16);
    expect(DUNGEON_LIST[14].id).toBe('freehold_inn_room');
    expect(DUNGEON_LIST[15].id).toBe('freehold_cottage');
    expect(DUNGEONS.freehold_inn_room.index).toBe(15);
    expect(DUNGEONS.freehold_cottage.index).toBe(16);
    for (const id of ROOM_IDS) {
      expect(DUNGEONS[id].id).toBe(id);
      const withIndex = DUNGEON_LIST.filter((d) => d.index === DUNGEONS[id].index);
      expect(withIndex).toEqual([DUNGEONS[id]]);
    }
  });

  it('keeps every field that holds the exhaustive dungeon sweeps green', () => {
    for (const id of ROOM_IDS) {
      const def = DUNGEONS[id];
      expect(def.claimKey).toBe('owner');
      expect(def.spawns).toEqual([]);
      expect(def.objects).toBeUndefined();
      expect(def.overworldDoor).toBe(false);
      expect(def.guideVisible).toBe(false);
      expect(def.suggestedPlayers).toBe(1);
      expect(def.interior).toBe(id === 'freehold_inn_room' ? 'inn_room' : 'cottage');
      expect(def.bossChainPull).toBeUndefined();
      expect(def.tombDressing).toBeUndefined();
      expect(def.staticDoor).toBeUndefined();
      expect(def.leaveOffset).toBeUndefined();
      expect(def.doorPos).toEqual({ x: -39, z: -104 });
    }
    expect(DUNGEONS.freehold_inn_room.name).toBe('Inn Room');
    expect(DUNGEONS.freehold_cottage.name).toBe('Cottage');
  });

  it('drops a leaving player on clear quay ground: unblocked, with zero depenetration, on every test seed', () => {
    // The drop is doorPos plus the shared 4 yd door inset (no leaveOffset;
    // the saved-inside rejoin in sim.ts applies the same inset). The
    // literal, then the proof: isBlocked false AND resolvePosition moves the
    // body nowhere, at the real player radius, across the test seeds, the
    // shipped WORLD_SEED and the corpus seed 2147483647. A door at z -96
    // failed this (its drop at z -100 sat inside the mailbox surround), which
    // is why it moved first; the later moves are the press clearance in
    // tests/freehold_gate_clearance.test.ts.
    for (const def of [DUNGEONS.freehold_inn_room, DUNGEONS.freehold_cottage]) {
      expect(def.leaveOffset).toBeUndefined();
      const drop = { x: def.doorPos.x, z: def.doorPos.z - 4 };
      expect(drop).toEqual({ x: -39, z: -108 });
      for (const seed of [1, 7, 42, 99, 1032, 1337, WORLD_SEED, 2_147_483_647]) {
        expect(isBlocked(seed, drop.x, drop.z, PLAYER_BODY_RADIUS), `${def.id} seed ${seed}`).toBe(
          false,
        );
        const resolved = resolvePosition(seed, drop.x, drop.z, PLAYER_BODY_RADIUS);
        expect(
          Math.hypot(resolved.x - drop.x, resolved.z - drop.z),
          `${def.id} seed ${seed} depenetration`,
        ).toBe(0);
      }
      expect(dungeonAt(drop.x)).toBeNull();
    }
  });

  it('is the only owner-keyed pair: every other dungeon claims by party', () => {
    const ownerKeyed = DUNGEON_LIST.filter((d) => d.claimKey === 'owner').map((d) => d.id);
    expect(ownerKeyed).toEqual(['freehold_inn_room', 'freehold_cottage']);
    for (const d of DUNGEON_LIST) {
      if (ROOM_IDS.includes(d.id as (typeof ROOM_IDS)[number])) continue;
      expect(d.claimKey, d.id).not.toBe('owner');
    }
  });
});

describe('freehold dungeon defs: overflow band and entry floor', () => {
  it('owns the 119200 and 119800 origins and resolves back through dungeonAt', () => {
    expect(instanceOriginX(15)).toBe(119200);
    expect(instanceOriginX(16)).toBe(119800);
    expect(dungeonAt(119200)?.id).toBe('freehold_inn_room');
    expect(dungeonAt(119800)?.id).toBe('freehold_cottage');
    // Band edges: +/-300 around each 600-yd centre, no overlap with the
    // neighbour (the forge lift at 118600 sits one band west of the Inn Room).
    expect(dungeonAt(119200 - 299)?.id).toBe('freehold_inn_room');
    expect(dungeonAt(119200 + 299)?.id).toBe('freehold_inn_room');
    expect(dungeonAt(119800 - 299)?.id).toBe('freehold_cottage');
    expect(dungeonAt(119800 + 299)?.id).toBe('freehold_cottage');
    expect(dungeonAt(118600)?.id).not.toBe('freehold_inn_room');
    expect(dungeonAt(118600)?.id).not.toBe('freehold_cottage');
    expect(dungeonAt(118600)?.id).toBe('ignivar_forge_lift');
    expect(dungeonAt(120400)).toBeNull();
  });

  it('arrives on the protected home floor, clear of fixed dressing and walls', () => {
    for (const id of ROOM_IDS) {
      const { entry, exitOffset } = DUNGEONS[id];
      expect(entry).toEqual({ x: 0, z: -4 });
      expect(exitOffset).toEqual({ x: 0, z: -6 });
      expect(entry.x).toBeGreaterThan(-7);
      expect(entry.x).toBeLessThan(7);
      expect(entry.z).toBeGreaterThan(-7);
      expect(entry.z).toBeLessThan(11);
      expect(exitOffset.x).toBeGreaterThan(-7);
      expect(exitOffset.x).toBeLessThan(7);
      expect(exitOffset.z).toBeGreaterThan(-7);
      expect(exitOffset.z).toBeLessThan(11);
    }
  });
});

describe('freehold dungeon defs: exclusions', () => {
  it('has no Dungeon Finder activity while the group dungeons keep theirs', () => {
    const finderDungeonIds = FINDER_ACTIVITIES.map((a) => a.dungeonId);
    expect(finderDungeonIds).not.toContain('freehold_inn_room');
    expect(finderDungeonIds).not.toContain('freehold_cottage');
    expect(finderDungeonIds).toContain('hollow_crypt');
    for (const activity of FINDER_ACTIVITIES) {
      expect(activity.id).not.toMatch(/^freehold_/);
    }
  });

  it('stays out of the /dungeons readout, which still lists the group dungeons', () => {
    const readout = dungeonsReadout();
    expect(readout).toMatch(/^Dungeons \(14\): /);
    expect(readout).not.toContain('Inn Room');
    expect(readout).not.toContain('Cottage');
    expect(readout).toContain('Hollow Crypt (');
    expect(readout).toContain('Dawnhold Castle (');
  });

  it("keeps both rooms' enterText and leaveText unique across DUNGEON_LIST", () => {
    // The HUD localizes a raw enter/leave log line by exact match against
    // DUNGEON_LIST in index order, so a room line shared with any other def
    // would resolve to the wrong catalog row. (One pre-existing collision is
    // outside this content: the two Nythraxis rooms share a leaveText, which
    // is why the pin is per room line rather than a whole-registry set size.)
    const others = DUNGEON_LIST.filter((d) => d.claimKey !== 'owner');
    expect(others).toHaveLength(14);
    const otherLines = new Set(others.flatMap((d) => [d.enterText, d.leaveText]));
    const roomLines = ROOM_IDS.flatMap((id) => [DUNGEONS[id].enterText, DUNGEONS[id].leaveText]);
    expect(new Set(roomLines).size).toBe(4);
    for (const line of roomLines) expect(otherLines.has(line), line).toBe(false);
    for (const id of ROOM_IDS) {
      const def = DUNGEONS[id];
      expect(def.enterText).toBe(ENGLISH[id].enterText);
      expect(def.leaveText).toBe(ENGLISH[id].leaveText);
      expect(def.enterText).not.toBe(def.leaveText);
      // One short sentence each, no em dash (the catalog normalizer would
      // silently rewrite one, so the def string must never carry it).
      for (const line of [def.enterText, def.leaveText]) {
        expect(line).toMatch(/^[A-Z][^.]*\.$/);
        expect(line).not.toMatch(/[\u2013\u2014]/);
        expect(line.length).toBeLessThan(80);
      }
    }
  });
});

describe('freehold dungeon defs: catalog rows', () => {
  beforeAll(async () => {
    await Promise.all(
      ['en', ...NON_LATIN].map((lang) => ensureLocaleLoaded(lang as SupportedLanguage)),
    );
  });

  it('resolves the English name, enterText and leaveText from the catalog, never a fallback', () => {
    setLanguage('en');
    resetEntityTranslationFallbackLog();
    for (const id of ROOM_IDS) {
      expect(tEntity({ kind: 'dungeon', id, field: 'name' })).toBe(ENGLISH[id].name);
      expect(tEntity({ kind: 'dungeon', id, field: 'enterText' })).toBe(ENGLISH[id].enterText);
      expect(tEntity({ kind: 'dungeon', id, field: 'leaveText' })).toBe(ENGLISH[id].leaveText);
      // The HUD's own resolver (localizeSystemText matches the raw log line
      // against the def and calls this) lands on the same rows.
      expect(dungeonText(id, 'enterText')).toBe(DUNGEONS[id].enterText);
      expect(dungeonText(id, 'leaveText')).toBe(DUNGEONS[id].leaveText);
    }
    expect(entityTranslationFallbackLog()).toEqual([]);
  });

  it('carries the five non-Latin fills for every wordy line (M16)', () => {
    for (const lang of NON_LATIN) {
      setLanguage(lang);
      resetEntityTranslationFallbackLog();
      for (const id of ROOM_IDS) {
        for (const field of ['name', 'enterText', 'leaveText'] as const) {
          const rendered = tEntity({ kind: 'dungeon', id, field });
          expect(rendered.trim().length, `${lang} ${id}.${field}`).toBeGreaterThan(0);
          expect(rendered, `${lang} ${id}.${field}`).not.toBe(ENGLISH[id][field]);
          expect(rendered, `${lang} ${id}.${field}`).not.toMatch(/[A-Za-z]{4,}/);
        }
      }
      expect(entityTranslationFallbackLog(), `${lang} fallback log`).toEqual([]);
    }
    setLanguage('en');
  });
});

describe('freehold dungeon defs: fresh Sim boot', () => {
  it('spawns no dungeon_door for either room while the group dungeons keep theirs', () => {
    for (const sim of [litSim(), darkSim()]) {
      const doors = [...sim.entities.values()].filter(
        (e) => e.kind === 'object' && e.templateId === 'dungeon_door',
      );
      const doorDungeonIds = doors.map((d) => d.dungeonId);
      expect(doorDungeonIds).not.toContain('freehold_inn_room');
      expect(doorDungeonIds).not.toContain('freehold_cottage');
      expect(doorDungeonIds).toContain('hollow_crypt');
      // No door stands at the planned gate spot either: the record's doorPos
      // is only where leaving drops the player.
      expect(doors.some((d) => d.pos.x === -39 && d.pos.z === -104)).toBe(false);
    }
  });

  it('pre-allocates exactly 24 unclaimed slots per room on a lit and a dark host', () => {
    for (const sim of [litSim(), darkSim()]) {
      for (const id of ROOM_IDS) {
        const slots = sim.instances.filter((s) => s.dungeonId === id);
        expect(slots).toHaveLength(24);
        expect(slots.map((s) => s.slot)).toEqual([...Array(24).keys()]);
        for (const slot of slots) {
          expect(slot.partyKey).toBeNull();
          expect(slot.difficulty).toBe('normal');
          expect(slot.mobIds).toEqual([]);
          expect(slot.objectIds).toEqual([]);
          expect(slot.exitId).toBeNull();
          expect(slot.emptyFor).toBe(0);
        }
      }
      // The pool grew by exactly the two rooms' 48 slots over the 14 group
      // dungeons' 336 (14 x 24): nothing else was minted for them.
      expect(sim.instances).toHaveLength(16 * 24);
    }
  });
});
