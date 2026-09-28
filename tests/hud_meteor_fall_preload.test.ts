// Pins the HUD half of the Meteor anti-doubling fix (see
// tests/ability_audio_defers_to_recordings.test.ts for the sfx.ts and painter
// halves): the meteorFall telegraph, which fires ~2s before the ground tick
// lands, must kick off sfx.preload('meteor') so the first cast of a session
// doesn't race the fetch+decode and drop the landing recording silently. The
// arm lives in the HUD's spatial sound router (src/ui/event_sfx_router.ts),
// which Hud.playEventSfx forwards every event to.
import { describe, expect, it, vi } from 'vitest';
import { sfx } from '../src/game/sfx';
import type { EventSfxHost } from '../src/ui/event_sfx_router';
import { playEventSfx } from '../src/ui/event_sfx_router';

// Only the members the router's host interface names; the spellfxAt arm
// touches none of them before it returns.
function harness(): { sim: unknown; castLoopIds: Set<number>; mobAggroed: Set<number> } {
  return { sim: {}, castLoopIds: new Set(), mobAggroed: new Set() };
}

describe('HUD meteorFall telegraph preloads the meteor recording', () => {
  it('calls sfx.preload("meteor") on a meteorFall spellfxAt event', () => {
    const preload = vi.spyOn(sfx, 'preload').mockImplementation(() => {});
    try {
      const hud = harness();
      playEventSfx(hud as unknown as EventSfxHost, {
        type: 'spellfxAt',
        x: 0,
        z: 0,
        school: 'fire',
        fx: 'meteorFall',
        ability: 'meteor',
      });
      expect(preload).toHaveBeenCalledWith('meteor');
    } finally {
      preload.mockRestore();
    }
  });
});
