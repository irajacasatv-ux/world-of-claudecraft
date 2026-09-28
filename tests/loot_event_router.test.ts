// @vitest-environment happy-dom

// The HUD's 'loot' arm (src/ui/hud/loot/loot_event_router.ts), extracted whole
// from the Hud's per-event switch. The line-versus-cue contract of #2430 and
// #2458 is driven burst by burst in tests/professions_single_line_grants.test.ts
// and the held-loot toast and roll-win banner in
// tests/error_toast_controller.test.ts; this suite holds what the router
// itself owns: which events it claims, the receipt body for a quality-rolled
// copy, the open-bags gate, and the weld to the private Hud members it reads.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import type { SimEvent } from '../src/sim/types';
import { applyLootEventPresentation } from '../src/ui/hud/loot/loot_event_router';
import { HUD_LOG } from '../src/ui/hud_tones';
import { chatLines, eventRouterRig } from './helpers/event_router_rig';
import { hudDeclares, interfaceMembers } from './helpers/hud_host_weld';
import { stripComments } from './helpers/strip_comments';

const PLAYER_ID = 7;

beforeEach(() => {
  document.body.innerHTML = '<div id="bags" style="display:none"></div>';
  vi.spyOn(audio, 'lootItem').mockImplementation(() => {});
  vi.spyOn(audio, 'coin').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('applyLootEventPresentation', () => {
  it('claims a loot event and leaves every other event to the HUD switch untouched', () => {
    const rig = eventRouterRig({ sim: { playerId: PLAYER_ID } });
    expect(
      applyLootEventPresentation(rig, { type: 'loot', text: 'You loot 5c.', pid: PLAYER_ID }),
    ).toBe(true);
    expect(rig.log).toHaveBeenCalledTimes(1);
    for (const ev of [
      { type: 'lootRoll', rollId: 1 },
      { type: 'craftResult', ok: true, recipeId: 'r', itemId: 'copper_ore', count: 1 },
      { type: 'comboPoint' },
    ] as unknown as SimEvent[]) {
      expect(applyLootEventPresentation(rig, ev), ev.type).toBe(false);
    }
    expect(rig.log).toHaveBeenCalledTimes(1);
    expect(rig.lootRolls.closeForItem).not.toHaveBeenCalled();
    expect(audio.coin).toHaveBeenCalledTimes(1);
  });

  it('logs the generic line on the good tone and refreshes the bags only while they are open', () => {
    const rig = eventRouterRig({ sim: { playerId: PLAYER_ID } });
    applyLootEventPresentation(rig, {
      type: 'loot',
      text: 'You receive: Copper Ore x3.',
      pid: PLAYER_ID,
    });
    expect(rig.log.mock.calls[0][1]).toBe(HUD_LOG.GOOD);
    expect(rig.renderBags).not.toHaveBeenCalled();
    // A window that was never opened carries no inline display at all.
    (document.getElementById('bags') as HTMLElement).style.display = '';
    applyLootEventPresentation(rig, {
      type: 'loot',
      text: 'You receive: Copper Ore x3.',
      pid: PLAYER_ID,
    });
    expect(rig.renderBags).not.toHaveBeenCalled();
    (document.getElementById('bags') as HTMLElement).style.display = 'block';
    applyLootEventPresentation(rig, {
      type: 'loot',
      text: 'You receive: Copper Ore x3.',
      pid: PLAYER_ID,
    });
    expect(rig.renderBags).toHaveBeenCalledTimes(1);
  });

  it('a quality-rolled receipt logs NODES whose link opens that exact copy', () => {
    const rig = eventRouterRig({ sim: { playerId: PLAYER_ID } });
    const instance = { lootQuality: 'rare' } as never;
    const appendChatItemLink = vi.spyOn(rig, 'appendChatItemLink');
    applyLootEventPresentation(rig, {
      type: 'loot',
      text: 'You receive: Copper Ore.',
      pid: PLAYER_ID,
      itemId: 'copper_ore',
      count: 1,
      instance,
    } as SimEvent);
    const body = rig.log.mock.calls[0][0];
    expect(Array.isArray(body)).toBe(true);
    expect(appendChatItemLink).toHaveBeenCalledTimes(1);
    expect(appendChatItemLink.mock.calls[0][1]).toBe('copper_ore');
    expect(appendChatItemLink.mock.calls[0][2]).toBe(instance);
    // The node body lands on the pane as one clickable line.
    expect(chatLines(rig)).toHaveLength(1);
    expect(rig.chatLogEl.querySelector('.chat-item-link')).not.toBeNull();
  });
});

describe('the weld to the private Hud members the router reads', () => {
  // join(process.cwd()) rather than import.meta.url: under happy-dom the module
  // URL is not a file: scheme.
  const router = readFileSync(join(process.cwd(), 'src/ui/hud/loot/loot_event_router.ts'), 'utf8');
  const hud = readFileSync(join(process.cwd(), 'src/ui/hud.ts'), 'utf8');

  it('every LootEventHost member is declared on the Hud', () => {
    const members = interfaceMembers(router, 'LootEventHost');
    expect(members).toEqual([
      'sim',
      'errorToast',
      'showBanner',
      'log',
      'appendChatItemLink',
      'lootRolls',
      'renderBags',
    ]);
    for (const member of members) expect(hudDeclares(hud, member), member).toBe(true);
    expect(hudDeclares(hud, 'lootReceiptBody')).toBe(false);
  });

  it("the Hud hands every drained event to the router before its switch, the quest router's way", () => {
    const code = stripComments(hud);
    const quest = code.indexOf('if (applyQuestEventPresentation(this, ev)) continue;');
    const loot = code.indexOf('if (applyLootEventPresentation(this, ev)) continue;');
    const prof = code.indexOf('if (applyProfessionEventPresentation(this, ev)) continue;');
    const sw = code.indexOf('switch (ev.type) {', prof);
    expect(quest).toBeGreaterThan(-1);
    expect(loot).toBeGreaterThan(quest);
    expect(prof).toBeGreaterThan(loot);
    // Straight into the per-event switch: nothing runs between the two router
    // calls and the switch, so a claimed event skips exactly the switch.
    expect(code.slice(prof, sw).split('\n')).toHaveLength(2);
    // And the switch no longer carries the arm.
    expect(code).not.toContain("case 'loot': {");
  });
});
