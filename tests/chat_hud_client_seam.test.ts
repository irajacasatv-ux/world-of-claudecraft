// The chat send seam between the HUD and ClientWorld. Hud.composeChatSend and
// Hud.noteSentChannel are one-line forwards to the ChatWindowController, so
// these cases drive the controller the Hud delegates to directly (no Hud
// import: that coordinator's module graph alone costs a test file several
// hundred MB of retained heap).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientWorld } from '../src/net/online';
import {
  ChatWindowController,
  type ChatWindowControllerDeps,
} from '../src/ui/hud/chat/chat_window_controller';

afterEach(() => vi.unstubAllGlobals());

// A bare controller never ran init, so its state is the field defaults (the All
// tab, a sticky say target). No dep is exercised by compose/noteSent, so an
// empty deps object is enough here.
function bareController(): ChatWindowController {
  return new ChatWindowController({} as ChatWindowControllerDeps);
}

describe('Hud to ClientWorld chat seam', () => {
  it('sends an explicit /say command when the HUD presents the neutral Say channel', () => {
    vi.stubGlobal('WebSocket', { OPEN: 1 });
    const controller = bareController();

    const sent: unknown[] = [];
    // Kept bespoke on purpose (issue #2088): a hand-picked field subset plus a
    // live `ws` mock. tests/helpers/bare_client.ts bareClient() is the default
    // for a new suite that just needs a bare ClientWorld.
    const client = Object.create(ClientWorld.prototype) as ClientWorld;
    Object.assign(client as unknown as Record<string, unknown>, {
      connected: true,
      spectating: null,
      ws: { readyState: 1, send: (raw: string) => sent.push(JSON.parse(raw)) },
    });

    client.chat(controller.composeSend('hello nearby players'));

    expect(sent).toEqual([{ t: 'cmd', cmd: 'chat', text: '/say hello nearby players' }]);
  });

  it('stays on the last channel sent, including a whisper reply (v0.26.0 regression)', () => {
    const controller = bareController();
    const state = controller as unknown as {
      stickyTarget: string;
      inputTintTarget(): string;
    };

    // Send in party: the sticky target follows there.
    controller.noteSentChannel(controller.composeSend('/p on my way'), true);
    expect(state.stickyTarget).toBe('party');

    // Reply to a whisper: the sticky target follows to whisper, and the NEXT plain
    // line keeps replying (/r) instead of snapping back to party (the regression).
    controller.noteSentChannel(controller.composeSend('/r sure thing'), true);
    expect(state.stickyTarget).toBe('whisper');
    expect(controller.composeSend('and thanks')).toBe('/r and thanks');
    expect(state.inputTintTarget()).toBe('whisper');
  });

  it('stays in guild after a /g send online, instead of snapping back to General', () => {
    // The reported bug: talk in General, then Guild via the classic /g command, and
    // the next plain line reverts to General. "/g" reaches guild online but is not a
    // host-independent standing channel, so the sticky target must follow it here.
    const controller = bareController();
    const state = controller as unknown as {
      stickyTarget: string;
      inputTintTarget(): string;
    };

    // Talk in General (the /1 shortcut), then in Guild (the classic /g), both online.
    controller.noteSentChannel(controller.composeSend('/1 hey all'), true);
    expect(state.stickyTarget).toBe('general');
    controller.noteSentChannel(controller.composeSend('/g coming'), true);

    // The next plain line stays in guild (/gu), not back to /general.
    expect(state.stickyTarget).toBe('guild');
    expect(controller.composeSend('on my way')).toBe('/gu on my way');
    expect(state.inputTintTarget()).toBe('guild');
  });

  it('Hud forwards compose and the sent-line note to this controller unchanged (source pin)', () => {
    // The cases here drive the controller, so the Hud half of the seam (what
    // src/main.ts calls on send) is pinned at its source: each forward hands its
    // arguments straight through and returns the controller's own line.
    const hud = readFileSync(path.join(__dirname, '../src/ui/hud.ts'), 'utf8').replace(
      /^\s*\/\/.*$/gm,
      '',
    );
    expect(hud).toMatch(
      /composeChatSend\(typed: string\): string \{\s*return this\.chatWindow\.composeSend\(typed\);\s*\}/,
    );
    expect(hud).toMatch(
      /noteSentChannel\(sentLine: string, online: boolean\): void \{\s*this\.chatWindow\.noteSentChannel\(sentLine, online\);\s*\}/,
    );
  });

  it('threads the host flag through: a bare /g send offline sticks to General', () => {
    // The other arm of the host-aware resolution: offline the sim routes bare /g
    // to General, so the sticky follows it there (a controller that ignored the
    // flag would fail here).
    const controller = bareController();
    const state = controller as unknown as { stickyTarget: string };

    controller.noteSentChannel('/g anyone around', false);
    expect(state.stickyTarget).toBe('general');
  });
});
