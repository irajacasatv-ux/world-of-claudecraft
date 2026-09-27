// The composed item card (src/ui/item_tooltip_view.ts) against BOTH real
// IWorld hosts: the offline Sim itself, and the online ClientWorld mirror fed
// a self snapshot carrying the same state. tests/item_tooltip_view.test.ts and
// the per-line suites drive the composer through a hand-cast partial stub
// (tests/helpers/item_tooltip_deps.ts), which cannot notice a read the stub
// happens to fill in differently from a real world. The card reads four IWorld
// members a def-only hover never exercises (the quest log, the craft identity,
// the worn per-copy payloads and the party-trade clock) plus the viewer's level
// and class, so each case below puts real state behind one of them and
// requires the two hosts to render the SAME card.
//
// The snapshot is assembled from the keys server/game.ts bcastSelf sends for
// these reads (the self identity record's `lv`, `equip`, `einst`, `cprof`, and
// the quest family through the server's own emitQuestSelfKeys), JSON
// round-tripped like the wire, without standing a GameServer up.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { emitQuestSelfKeys } from '../server/quest_snapshot_wire';
import type { ClientWorld } from '../src/net/online';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { ItemDef, ItemInstancePayload } from '../src/sim/types';
import { questObjectiveLabel } from '../src/ui/entity_display_core';
import { instancePartyTradeLine } from '../src/ui/item_instance_tooltip';
import { type ItemTooltipWorld, itemTooltipHtml } from '../src/ui/item_tooltip_view';
import { questProgressText } from '../src/ui/quest_progress_text';
import { bareClient } from './helpers/bare_client';

// The party-trade clock both hosts read: the Sim through its injected
// lockoutNowMs, the client through Date.now(), stubbed to the same instant.
const NOW = 1_700_000_000_000;
const WORN = ITEMS.cryptbone_helm;
const HOVERED = ITEMS.boundstone_helm;
const QUEST_ITEM = ITEMS.boar_hide;
const PATTERN = ITEMS.pattern_spiritweld_girdle;
const SOULBOUND = ITEMS.reins_mech_bird;
const SIGNER = 'Mirror Maker';
const PARTY_TRADE: ItemInstancePayload = {
  partyTrade: { untilMs: NOW + 90_000, eligible: ['Ally'] },
};

interface Hosts {
  readonly sim: Sim;
  readonly client: ClientWorld;
  /** The client before its snapshot: the vacuity control, since a card both
   *  hosts render from their DEFAULTS would match without proving anything. */
  readonly bare: ClientWorld;
}

/** A mage (so the mail helm reads as an armor weight the viewer cannot wear)
 *  at level 15, with a signed helm worn, q_boars three hides in, Armorcrafting
 *  at 200 and the Spiritweld Girdle recipe already known. */
function hosts(): Hosts {
  const sim = new Sim({
    seed: 73,
    playerClass: 'mage',
    autoEquip: false,
    freeholdsEnabled: true,
    lockoutNowMs: () => NOW,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
  const pid = sim.playerId;
  const meta = sim.meta(pid);
  if (!meta) throw new Error('the Sim has no primary player');
  sim.setPlayerLevel(15);
  meta.equipment.helmet = WORN.id;
  meta.equipmentInstance.helmet = { signer: SIGNER };
  meta.questLog.set('q_boars', { questId: 'q_boars', counts: [3], state: 'active' });
  meta.craftSkills.armorcrafting = 200;
  meta.knownRecipes.add('recipe_spiritweld_girdle');

  const self: Record<string, unknown> = {
    id: pid,
    k: 'player',
    tid: 'mage',
    nm: sim.player.name,
    lv: sim.player.level,
    x: 0,
    y: 0,
    z: 0,
    f: 0,
    hp: sim.player.hp,
    mhp: sim.player.maxHp,
    equip: meta.equipment,
    einst: meta.equipmentInstance,
    cprof: sim.craftingIdentityFor(pid),
  };
  emitQuestSelfKeys(
    (key, value) => {
      self[key] = value;
    },
    sim,
    meta,
  );
  const cfg = () => ({ seed: 73, playerClass: 'mage', freeholdsEnabled: true });
  const client = bareClient(pid, { cfg: cfg() });
  (client as unknown as { applySnapshot(snap: unknown): void }).applySnapshot(
    JSON.parse(JSON.stringify({ t: 'snap', tick: 1, ents: [], self })),
  );
  return { sim, client, bare: bareClient(pid, { cfg: cfg() }) };
}

const card = (
  world: ItemTooltipWorld,
  item: ItemDef,
  compare = false,
  instance?: ItemInstancePayload,
): string => itemTooltipHtml(item, { world, showItemLevel: () => true }, compare, instance);

let h: Hosts;
beforeAll(() => {
  h = hosts();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('itemTooltipHtml renders the same card over a real Sim and a snapshot-fed ClientWorld', () => {
  it('the viewer level and class, the worn gear and its per-copy payload (the comparison)', () => {
    const offline = card(h.sim, HOVERED, true);
    expect(card(h.client, HOVERED, true)).toBe(offline);
    // The state is really on the card: the class read (a mage cannot wear
    // mail), the worn copy's signer on the comparison half, and the set count
    // off the worn equipment.
    expect(offline).toContain('tt-armor-bad');
    expect(offline).toContain(SIGNER);
    expect(card(h.bare, HOVERED, true)).not.toBe(offline);
  });

  it('the quest log (the quest item progress line)', () => {
    const offline = card(h.sim, QUEST_ITEM);
    expect(card(h.client, QUEST_ITEM)).toBe(offline);
    expect(offline).toContain(questProgressText(questObjectiveLabel('q_boars', 0), 3, 5));
    expect(card(h.bare, QUEST_ITEM)).not.toBe(offline);
  });

  it('the craft identity (the pattern skill and known-recipe lines)', () => {
    const offline = card(h.sim, PATTERN);
    expect(card(h.client, PATTERN)).toBe(offline);
    expect(offline).toContain('<div class="tt-sub">Requires Armorcrafting 100</div>');
    expect(offline).toContain('<div class="tt-red">You already know that recipe.</div>');
    // Pre-cprof the client knows no skills and renders the teaches line alone.
    expect(card(h.bare, PATTERN)).not.toBe(offline);
  });

  it('the party-trade clock (the soulbound trade window line)', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    expect(SOULBOUND?.soulbound).toBe(true);
    const offline = card(h.sim, SOULBOUND, false, PARTY_TRADE);
    expect(card(h.client, SOULBOUND, false, PARTY_TRADE)).toBe(offline);
    // The trade window line itself (not the Soulbound line above it, which
    // shares its markup), at the 90 seconds both clocks agree remain.
    const windowLine = instancePartyTradeLine(PARTY_TRADE, () => 90_000);
    expect(windowLine).not.toBe('');
    expect(offline).toContain(windowLine);
    // The line is the clock's: an expired window renders nothing on either host.
    vi.spyOn(Date, 'now').mockReturnValue(NOW + 90_000);
    expect(card(h.client, SOULBOUND, false, PARTY_TRADE)).not.toBe(offline);
  });
});
