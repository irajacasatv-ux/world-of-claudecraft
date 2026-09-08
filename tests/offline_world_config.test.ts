import { afterEach, describe, expect, it, vi } from 'vitest';
import { offlineWorldConfig } from '../src/game/offline_world_config';
import { PLAYER_INTEREST_DROP_RADIUS, type SimConfig } from '../src/sim/types';
import { WORLD_SEED } from '../src/sim/world_seed';

afterEach(() => vi.unstubAllGlobals());

describe('offline browser world configuration', () => {
  it('retains live-world entry policy and supplies a fresh identity per character', () => {
    let sequence = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    });
    const options = { playerClass: 'warrior' as const, name: 'Ana', devCommands: true };
    const first = offlineWorldConfig(options);
    const second = offlineWorldConfig(options);
    expect(first).toMatchObject({
      seed: WORLD_SEED,
      playerClass: 'warrior',
      playerName: 'Ana',
      devCommands: true,
      freeholdsEnabled: true,
      riftPortals: true,
      compulsoryTutorial: true,
      idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS,
      gathererIdentity: { kind: 'offline', id: 'off:00000000-0000-4000-8000-000000000001' },
    });
    expect(second.gathererIdentity?.id).toBe('off:00000000-0000-4000-8000-000000000002');
  });

  it('retains editor map and zero seed and remains usable without crypto', () => {
    vi.stubGlobal('crypto', undefined);
    const world = { id: 'editor-fixture' } as unknown as SimConfig['world'];
    const config = offlineWorldConfig({
      playerClass: 'warrior',
      name: 'Ana',
      devCommands: false,
      world,
      seedOverride: 0,
    });
    expect(config.world).toBe(world);
    expect(config.seed).toBe(0);
    expect(config.devCommands).toBe(false);
    expect(config.freeholdsEnabled).toBe(false);
    expect(config.riftPortals).toBe(false);
    expect(config.compulsoryTutorial).toBe(false);
    expect(config.gathererIdentity).toBeUndefined();
  });

  it('passes the resolved dev grant through and defaults it to an explicit false', () => {
    vi.stubGlobal('crypto', undefined);
    const base = { playerClass: 'warrior' as const, name: 'Ana', devCommands: true };
    expect(offlineWorldConfig(base).freeholdDevGrantEnabled).toBe(false);
    expect(
      offlineWorldConfig({ ...base, freeholdDevGrantEnabled: false }).freeholdDevGrantEnabled,
    ).toBe(false);
    expect(
      offlineWorldConfig({ ...base, freeholdDevGrantEnabled: true }).freeholdDevGrantEnabled,
    ).toBe(true);
    // The grant is a permission beside devCommands, never a substitute for it.
    const granted = offlineWorldConfig({
      ...base,
      devCommands: false,
      freeholdDevGrantEnabled: true,
    });
    expect(granted.devCommands).toBe(false);
    expect(granted.freeholdDevGrantEnabled).toBe(true);
  });
});
