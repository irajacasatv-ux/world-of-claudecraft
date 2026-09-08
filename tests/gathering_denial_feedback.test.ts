import { expect, it } from 'vitest';
import {
  type GatheringDenialEvent,
  handleGatheringDenial,
} from '../src/ui/hud/professions/gathering_denial_feedback';

it.each<[GatheringDenialEvent, string]>([
  [
    { type: 'gatherDenied', pid: 1, surface: 'node', professionId: 'mining', requiredTier: 2 },
    'You need a tier 2 mining pick to harvest this vein.',
  ],
  [
    {
      type: 'gatherDenied',
      pid: 1,
      surface: 'node',
      professionId: 'mining',
      requiredTier: 2,
      wieldProficiency: 70,
    },
    'You need Mining 70 to swing the pick already in your bags.',
  ],
  [
    { type: 'gatherToolNoNode', pid: 1, professionId: 'mining' },
    'There is no ore vein within reach.',
  ],
  [
    { type: 'gatherDowngrade', pid: 1, surface: 'crop', lost: 'mark' },
    "Bags full: the harvest was stored without its grower's mark.",
  ],
  [
    { type: 'gatherDowngrade', pid: 1, surface: 'node', lost: 'find' },
    'Bags full: a pristine find slipped away.',
  ],
])('composes one personal gathering toast for %j', (event, expected) => {
  const lines: string[] = [];
  handleGatheringDenial(event, { showError: (line) => lines.push(line) });
  expect(lines).toEqual([expected]);
});
