import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { stripComments } from './helpers/strip_comments';

const pending = vi.hoisted(() => new Map<string, () => void>());
vi.mock('../src/render/characters/assets', () => ({
  prepareCharacterUrl: (url: string) => new Promise<void>((resolve) => pending.set(url, resolve)),
}));
vi.mock('../src/render/characters', () => ({
  modularLookFor: (entity: { kind: string }) => (entity.kind === 'npc' ? {} : null),
  modularKeyFor: () => 'npc_modular_walking_staff',
}));
vi.mock('../src/sim/data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/sim/data')>()),
  MOBS: { training_dummy: { color: 0xffffff } },
  NPCS: { guide: { color: 0xffffff } },
}));

import { prepareZoneCharacterDependencies } from '../src/render/zone_character_dependencies';
import type { ZoneDef } from '../src/sim/types';

describe('zone character dependency barrier', () => {
  it('holds construction until lazy dummy and mandatory modular staff attachments are resident', async () => {
    pending.clear();
    let ready = false;
    const work = prepareZoneCharacterDependencies(
      {
        templateIdsInZone: (_zone: unknown, kind: string) =>
          kind === 'mob' ? ['training_dummy'] : ['guide'],
        prewarmEntity: (kind: string, templateId: string) => ({ kind, templateId }),
      },
      {} as ZoneDef,
    ).then(() => {
      ready = true;
    });
    const staff = 'models/weapons/brasscrown_walking_staff.glb';
    const dummy = 'models/creatures/training_dummy.glb';
    expect(pending.has(staff)).toBe(true);
    expect(pending.has(dummy)).toBe(true);
    expect([...pending.keys()].some((url) => url.includes('modular'))).toBe(true);
    expect([...pending.keys()].some((url) => url.includes('rogue'))).toBe(true);
    for (const [url, resolve] of pending) if (url !== staff) resolve();
    await Promise.resolve();
    expect(ready).toBe(false);
    pending.get(staff)?.();
    await work;
    expect(ready).toBe(true);
  });

  it('awaits the barrier in boot and streamed-zone builders before creating rigs', () => {
    const src = stripComments(
      readFileSync(new URL('../src/render/renderer.ts', import.meta.url), 'utf8'),
    );
    expect(
      src.match(
        /await prepareZoneCharacterDependencies\(this.zonePrewarmHost\(\), (?:zone|activeZone)\)/g,
      ),
    ).toHaveLength(3);
    for (const builder of ['buildEntityPrewarmGroup', 'buildNpcPrewarmGroup']) {
      const calls = [...src.matchAll(new RegExp(`const built = ${builder}\\(`, 'g'))];
      expect(calls).toHaveLength(1);
      const before = src.slice(Math.max(0, calls[0].index - 220), calls[0].index);
      expect(before).toMatch(
        /await prepareZoneCharacterDependencies[\s\S]*this\.assertPrewarmGeneration\(generation\);/,
      );
    }
  });
});
