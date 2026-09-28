// The deps a suite drives appendChatLogLine / chatItemLinkEl
// (src/ui/hud/chat/chat_log_appender.ts) with, in place of the
// Object.create(Hud.prototype) rig those suites used while the appender lived
// on the Hud coordinator (whose import alone cost a test file several hundred
// MB of retained heap).
//
// The defaults are the neutral stubs the old rigs stamped on the bare
// prototype: Show Timestamps off, no tab filter, a silent announcer, an
// identity profanity mask, and no tooltip binding. The follow tracker is a
// real ChatScrollFollow over the pane, the one Hud builds lazily. A case that
// exercises a hook passes its own through `overrides`.
import { type Mock, vi } from 'vitest';
import type { ItemInstancePayload } from '../../src/sim/types';
import { ERROR_LOG_CHAN } from '../../src/ui/error_toast_log';
import {
  appendChatLogLine,
  type ChatLogAppendDeps,
  chatItemLinkEl,
  chatLogLine,
} from '../../src/ui/hud/chat/chat_log_appender';
import { ChatScrollFollow } from '../../src/ui/hud/chat/chat_scroll_follow';

export function chatLogDeps(
  chatLogEl: HTMLElement,
  overrides: Partial<ChatLogAppendDeps> = {},
): ChatLogAppendDeps {
  const follow = new ChatScrollFollow([chatLogEl]);
  return {
    chatLogEl,
    follow: () => follow,
    timestampClock: () => null,
    hideIfFiltered: () => {},
    chatAnnouncer: { push: () => {} },
    maskChat: (text) => text,
    attachTooltip: () => {},
    itemTooltip: () => '',
    ...overrides,
  };
}

/** A chat pane with the Hud fields its lines read, and Hud.log, Hud.logNodes
 *  (the node-body system line log() appends: timestamped, 'system') and
 *  Hud.appendChatItemLink over it. The three transcriptions are compared with
 *  the real Hud methods' output in tests/hud_coordinator_delegators.test.ts. */
export interface ChatPane {
  readonly chatLogEl: HTMLElement;
  /** The Show Timestamps option (a 24h clock when on), read per line. */
  chatTimestamps: boolean;
  readonly hideIfFiltered: Mock;
  readonly chatAnnouncer: { push: Mock };
  /** Hud.log, its defaults included. */
  log(
    text: string | readonly Node[],
    color?: string,
    decorativeIconUrl?: string,
    channel?: string,
    announceWhenFiltered?: boolean,
    plainText?: boolean,
  ): void;
  logNodes(nodes: readonly Node[], color: string): void;
  appendChatItemLink(parent: HTMLElement, itemId: string, instance?: ItemInstancePayload): void;
}

export function chatPane(): ChatPane {
  const chatLogEl = document.createElement('div');
  const hideIfFiltered = vi.fn();
  const chatAnnouncer = { push: vi.fn() };
  const pane: ChatPane = {
    chatLogEl,
    chatTimestamps: false,
    hideIfFiltered,
    chatAnnouncer,
    log: (
      text,
      color = 'var(--color-accent)',
      decorativeIconUrl,
      channel = ERROR_LOG_CHAN,
      announceWhenFiltered = false,
      plainText = false,
    ) =>
      appendChatLogLine(
        chatLogEl,
        chatLogLine(text, color, decorativeIconUrl, channel, announceWhenFiltered, plainText),
        deps,
      ),
    logNodes: (nodes, color) =>
      appendChatLogLine(
        chatLogEl,
        chatLogLine(nodes, color, undefined, 'system', false, false),
        deps,
      ),
    appendChatItemLink: (parent, itemId, instance) => {
      parent.append(chatItemLinkEl(document, itemId, deps, instance));
    },
  };
  const deps = chatLogDeps(chatLogEl, {
    timestampClock: () => (pane.chatTimestamps ? '24h' : null),
    hideIfFiltered,
    chatAnnouncer,
  });
  return pane;
}
