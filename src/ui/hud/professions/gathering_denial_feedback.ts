import type { SimEvent } from '../../../sim/types';
import { formatNumber, t } from '../../i18n';
import { gatherDeniedLineKey, gatherDowngradeLineKey, gatherToolNoNodeKey } from './gathering_view';

export type GatheringDenialEvent = Extract<
  SimEvent,
  { type: 'gatherDenied' | 'gatherToolNoNode' | 'gatherDowngrade' }
>;
export function handleGatheringDenial(
  ev: GatheringDenialEvent,
  host: { showError(text: string): void },
): void {
  switch (ev.type) {
    case 'gatherDenied': {
      // Tool-tier denial (Professions 2.0): an error toast ONLY.
      // No loot line, no cue, no other state (the grant-hub double-log
      // trap); the sim event is text-free, so the pure core resolves the
      // key off surface + professionId + requiredTier (tier 1 = no tool
      // owned at all, #2343) plus the R22 wield arm (wieldProficiency
      // present = a covering tool is owned, only the counter is short),
      // and the numbers interpolate.
      host.showError(
        t(gatherDeniedLineKey(ev.surface, ev.professionId, ev.requiredTier, ev.wieldProficiency), {
          tier: formatNumber(ev.requiredTier, { maximumFractionDigits: 0 }),
          skill: formatNumber(ev.wieldProficiency ?? 0, { maximumFractionDigits: 0 }),
        }),
      );
      break;
    }
    case 'gatherToolNoNode': {
      // Bag-clicked gathering tool with nothing in reach (#2343): an
      // error toast ONLY, the gatherDenied pattern above; the sim event
      // is text-free, so the pure core resolves the key off professionId.
      host.showError(t(gatherToolNoNodeKey(ev.professionId)));
      break;
    }
    case 'gatherDowngrade': {
      // Full-bag signed-grant downgrade (Professions 2.0): a
      // toast ONLY, the gatherDenied pattern above. No loot line, no cue,
      // no other state (the grant-hub double-log trap); the sim event is
      // text-free, so the pure core resolves the key off lost + surface.
      host.showError(t(gatherDowngradeLineKey(ev.lost, ev.surface)));
      break;
    }
  }
}
