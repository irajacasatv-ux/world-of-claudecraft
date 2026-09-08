import { describe, expect, it } from 'vitest';
import { VISUALS, weaponSkinModelUrls } from '../src/render/characters/manifest';
import { streamedCharacterUrls } from '../src/render/characters/streaming_policy_core';

describe('character streaming dependency classification', () => {
  it('keeps the shipping NPC walking staff in the boot barrier although it is also a weapon skin', () => {
    const staff = 'models/weapons/brasscrown_walking_staff.glb';
    const cosmetics = new Set(weaponSkinModelUrls());
    expect(cosmetics.has(staff)).toBe(true);
    expect(VISUALS.npc_modular_walking_staff.attach?.some((a) => a.url === staff)).toBe(true);
    expect(streamedCharacterUrls([staff], cosmetics, VISUALS, false, [])).toEqual([]);
    expect(streamedCharacterUrls([staff], cosmetics, VISUALS, true, ['models/creatures/'])).toEqual(
      [],
    );
  });
  it('still streams optional cosmetics and mobile creature bodies while lazy-only attachments stay optional', () => {
    const urls = ['optional.glb', 'lazy.glb', 'required.glb', 'models/creatures/wolf.glb'];
    const defs = {
      npc: { attach: [{ url: 'required.glb' }] },
      lazy: { lazyPreload: true, attach: [{ url: 'lazy.glb' }] },
    };
    const cosmetics = new Set(urls.slice(0, 3));
    expect(streamedCharacterUrls(urls, cosmetics, defs, false, ['models/creatures/'])).toEqual([
      'optional.glb',
      'lazy.glb',
    ]);
    expect(streamedCharacterUrls(urls, cosmetics, defs, true, ['models/creatures/'])).toEqual([
      'optional.glb',
      'lazy.glb',
      'models/creatures/wolf.glb',
    ]);
  });
});
