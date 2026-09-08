// The development grant fixture (D24, refined by D81): `/dev freehold <tier>`
// sets the caller's record tier through the ONE tier writer in state.ts. It
// needs BOTH permissions, `ctx.devCommands` (the chat router's shared /dev
// gate) AND `ctx.freeholdDevGrantEnabled` (the housing-specific opt-in the
// realm maps from ALLOW_DEV_COMMANDS and the offline host from its dev-only
// bridge); without both nothing is written and the outcome says so. The tier
// is validated against the authored tier table, so an unknown id and a tier
// whose room has not been authored yet (`lodge` and later) are refused alike.
// dev_commands.ts owns the thin chat arm and its `[dev]` dev-channel text;
// this module decides and writes, and emits nothing.

import { freeholdTierById } from '../content/freehold';
import type { SimContext } from '../sim_context';
import { freeholdKeyFor } from './owner_key';
import { setFreeholdTier } from './state';
import type { FreeholdTier } from './types';

export type FreeholdDevGrantOutcome = 'granted' | 'unauthorized' | 'bad_tier' | 'no_freehold';

/** A grant carries the CANONICAL tier id it wrote (the content table's row id,
 *  never the raw chat text), so the reporting arm echoes what was stored. */
export type FreeholdDevGrantResult =
  | { outcome: 'granted'; tier: FreeholdTier }
  | { outcome: Exclude<FreeholdDevGrantOutcome, 'granted'> };

export function devGrantFreeholdTier(
  ctx: SimContext,
  pid: number,
  rawTier: string,
): FreeholdDevGrantResult {
  if (!ctx.devCommands || !ctx.freeholdDevGrantEnabled) return { outcome: 'unauthorized' };
  const tier = freeholdTierById(rawTier);
  if (tier === undefined) return { outcome: 'bad_tier' };
  if (!setFreeholdTier(ctx, freeholdKeyFor(ctx, pid), tier.id)) return { outcome: 'no_freehold' };
  return { outcome: 'granted', tier: tier.id };
}
