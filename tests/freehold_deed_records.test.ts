import { describe, expect, it } from 'vitest';
import { DEED_ORDER, DEEDS } from '../src/sim/content/deeds';
import { RELIQUARY_PAGES_BY_ID } from '../src/sim/content/reliquary';
import { evaluateDeedsFor, grantDeed, setActiveBorder, setActiveTitle } from '../src/sim/deeds';
import { Sim } from '../src/sim/sim';
import { borderAccent, borderMotifPrimitives, deedBorderSlug } from '../src/ui/deed_border_view';
import { table as ja } from '../src/ui/deed_i18n.locales/ja_JP';
import { table as ko } from '../src/ui/deed_i18n.locales/ko_KR';
import { table as ru } from '../src/ui/deed_i18n.locales/ru_RU';
import { table as zhCN } from '../src/ui/deed_i18n.locales/zh_CN';
import { table as zhTW } from '../src/ui/deed_i18n.locales/zh_TW';
import { VENDOR_TEST_WORLD } from './sim_shared';

const FURNISHING = 'homesteader_first_furnishing';
const COTTAGE = 'homesteader_first_cottage';

describe('Freehold manual deed records', () => {
  it('appends the two routine cosmetic milestones after the existing tail', () => {
    // The release's Eastbrook ferry deed (exp_harbor_to_harbor) sits behind
    // hid_forgebreaker since the 2026-09-26 sync, and behind the release's Clue
    // Scroll casket pair since the aaff789813 sync; the two milestones stay last.
    expect(DEED_ORDER.slice(-4)).toEqual([
      'exp_clue_ten_caskets',
      'exp_harbor_to_harbor',
      FURNISHING,
      COTTAGE,
    ]);
    expect(DEEDS[FURNISHING]).toEqual({
      id: FURNISHING,
      name: 'Homesteader',
      desc: 'Place your first furnishing in your Freehold.',
      category: 'progression',
      renown: 5,
      trigger: { kind: 'manual' },
      reward: { kind: 'title', text: 'Homesteader' },
    });
    expect(DEEDS[COTTAGE]).toEqual({
      id: COTTAGE,
      name: 'Householder',
      desc: 'Receive your first Cottage for this character.',
      category: 'progression',
      renown: 5,
      trigger: { kind: 'manual' },
      reward: { kind: 'border', slug: 'householder' },
    });
  });

  it('keeps automatic evaluation inert and existing manual grants character-scoped and idempotent', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', world: VENDOR_TEST_WORLD });
    const first = sim.players.get(sim.playerId);
    const secondId = sim.addPlayer('mage', 'Neighbor');
    const second = sim.players.get(secondId);
    if (!first || !second) throw new Error('Both test characters must exist');
    evaluateDeedsFor(sim.ctx, first, sim.player, false);
    const renown = first.renown;
    const stats = { ...sim.player.stats };
    for (const id of [FURNISHING, COTTAGE]) {
      expect(first.deedsEarned.has(id)).toBe(false);
      expect(grantDeed(sim.ctx, first, id)).toBe(true);
      expect(grantDeed(sim.ctx, first, id)).toBe(false);
      expect(first.deedsEarned.has(id)).toBe(true);
      expect(second.deedsEarned.has(id)).toBe(false);
    }
    expect(first.renown - renown).toBe(10);
    setActiveTitle(first, sim.player, FURNISHING);
    setActiveBorder(first, sim.player, COTTAGE);
    expect(sim.player.title).toBe(FURNISHING);
    expect(sim.player.border).toBe(COTTAGE);
    expect(sim.player.stats).toEqual(stats);
  });

  it('adds only the title reward to Horizons and resolves the cottage border to its shared motif', () => {
    const titles = RELIQUARY_PAGES_BY_ID.horizons_titles.relics;
    expect(titles.filter((relic) => relic.kind === 'title' && relic.deedId === FURNISHING)).toEqual(
      [{ kind: 'title', deedId: FURNISHING, source: { sourceKind: 'deed', sourceId: FURNISHING } }],
    );
    expect(titles.some((relic) => relic.kind === 'title' && relic.deedId === COTTAGE)).toBe(false);
    expect(deedBorderSlug(COTTAGE)).toBe('householder');
    expect(borderAccent('householder')).toMatchObject({
      frame: '#c28a64',
      edge: '#432b1d',
      glow: '#f2d5bb',
      motif: 'home',
    });
    expect(borderMotifPrimitives('home')).toEqual([
      { x1: -0.8, y1: 0, x2: 0, y2: -0.8 },
      { x1: 0, y1: -0.8, x2: 0.8, y2: 0 },
      { x1: -0.6, y1: -0.2, x2: -0.6, y2: 0.8 },
      { x1: -0.6, y1: 0.8, x2: 0.6, y2: 0.8 },
      { x1: 0.6, y1: 0.8, x2: 0.6, y2: -0.2 },
      { x1: -0.2, y1: 0.8, x2: -0.2, y2: 0.2 },
      { x1: -0.2, y1: 0.2, x2: 0.2, y2: 0.2 },
      { x1: 0.2, y1: 0.2, x2: 0.2, y2: 0.8 },
    ]);
  });

  it('provides real name, criteria, and title fills in every required non-Latin locale', () => {
    for (const table of [ja, ko, ru, zhCN, zhTW]) {
      for (const id of [FURNISHING, COTTAGE]) {
        expect(table[id]?.name).toBeTruthy();
        expect(table[id]?.name).not.toBe(DEEDS[id].name);
        expect(table[id]?.desc).toBeTruthy();
        expect(table[id]?.desc).not.toBe(DEEDS[id].desc);
      }
      expect(table[FURNISHING]?.title).toBe(table[FURNISHING]?.name);
    }
  });
});
