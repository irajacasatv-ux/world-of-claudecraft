// The realm Sim boot config derives the second housing dev permission,
// SimConfig.freeholdDevGrantEnabled (D81), from the SAME strict
// ALLOW_DEV_COMMANDS === '1' read that sets devCommands: the two rise and fall
// together, and nothing but the exact string lights either. buildRealmSimConfig
// reads process.env at call time, so each arm sets the variable, builds, and
// the afterEach restores the original value.
import { afterEach, describe, expect, it } from 'vitest';
import { buildRealmSimConfig } from '../../server/sim_boot_config';
import { inertVaultConsumptionAdmission } from '../../src/sim/sim_context';

const ORIGINAL = process.env.ALLOW_DEV_COMMANDS;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ALLOW_DEV_COMMANDS;
  else process.env.ALLOW_DEV_COMMANDS = ORIGINAL;
});

function boot(value: string | undefined) {
  if (value === undefined) delete process.env.ALLOW_DEV_COMMANDS;
  else process.env.ALLOW_DEV_COMMANDS = value;
  return buildRealmSimConfig(undefined, inertVaultConsumptionAdmission);
}

describe('the realm boot config maps ALLOW_DEV_COMMANDS to freeholdDevGrantEnabled (D81)', () => {
  it('lights both permissions under the exact "1"', () => {
    const cfg = boot('1');
    expect(cfg.freeholdDevGrantEnabled).toBe(true);
    expect(cfg.devCommands).toBe(true);
  });

  it.each([
    ['unset', undefined],
    ['0', '0'],
    ['true', 'true'],
    ['a leading space', ' 1'],
    ['a trailing space', '1 '],
    ['01', '01'],
    ['empty', ''],
  ])('leaves both permissions off for %s', (_label, value) => {
    const cfg = boot(value);
    expect(cfg.freeholdDevGrantEnabled).toBe(false);
    expect(cfg.devCommands).toBe(false);
  });

  it('is a boot snapshot: the built value does not follow a later env change', () => {
    const cfg = boot('1');
    delete process.env.ALLOW_DEV_COMMANDS;
    expect(cfg.freeholdDevGrantEnabled).toBe(true);
  });
});
