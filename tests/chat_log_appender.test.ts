// @vitest-environment happy-dom

// The chat and combat log line appender (src/ui/hud/chat/chat_log_appender.ts,
// extracted from Hud.appendLog / Hud.appendChatItemLink): the chat pane's
// channel tag, tab filter and #chat-live announce versus the combat pane's
// plain path, the Show Timestamps prefix, the token splice, the 200-line trim,
// the follow-the-bottom scroll, the log() line shape, and the item link.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITEMS, QUESTS } from '../src/sim/data';
import { questTitle } from '../src/ui/entity_display_core';
import {
  appendChatLogLine,
  chatItemLinkEl,
  chatLogLine,
  prependChatTimestamp,
} from '../src/ui/hud/chat/chat_log_appender';
import { formatChatTimestamp } from '../src/ui/hud/chat/chat_timestamp';
import { chatLogDeps } from './helpers/chat_log_deps';

const itemId = Object.keys(ITEMS)[0] as string;
const questId = Object.keys(QUESTS)[0] as string;

function panes() {
  const chat = document.createElement('div');
  const combat = document.createElement('div');
  const push = vi.fn();
  const hideIfFiltered = vi.fn();
  const deps = chatLogDeps(chat, { chatAnnouncer: { push }, hideIfFiltered });
  return { chat, combat, push, hideIfFiltered, deps };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('appendChatLogLine: the two panes', () => {
  it('tags, filters and announces a chat-pane line on its channel', () => {
    const { chat, push, hideIfFiltered, deps } = panes();
    appendChatLogLine(chat, { body: 'Hello there', color: '#123456', chan: 'guild' }, deps);
    const line = chat.lastElementChild as HTMLElement;
    expect(line.textContent).toBe('Hello there');
    expect(line.dataset.chan).toBe('guild');
    expect(hideIfFiltered).toHaveBeenCalledWith(line, 'guild');
    expect(push).toHaveBeenCalledWith('Hello there', expect.any(Number));
  });

  it('keeps the combat pane plain: no channel tag, no filter, no chat announce, no links', () => {
    const { combat, push, hideIfFiltered, deps } = panes();
    appendChatLogLine(combat, { body: `hit [[i:${itemId}]]`, color: '#123456' }, deps);
    const line = combat.lastElementChild as HTMLElement;
    expect(line.dataset.chan).toBeUndefined();
    expect(hideIfFiltered).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(line.querySelector('.chat-item-link')).toBeNull();
    expect(line.textContent).toBe(`hit [[i:${itemId}]]`);
  });

  it('silences a tab-filtered line unless the caller asks it announced anyway', () => {
    const { chat, push, deps } = panes();
    const hideAll = {
      ...deps,
      hideIfFiltered: (div: HTMLElement) => div.classList.add('chat-hidden'),
    };
    appendChatLogLine(chat, { body: 'quiet', color: '#fff' }, hideAll);
    expect(push).not.toHaveBeenCalled();
    appendChatLogLine(chat, { body: 'loud', color: '#fff', announceWhenFiltered: true }, hideAll);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('loud', expect.any(Number));
  });
});

describe('appendChatLogLine: chrome and body', () => {
  it('prefixes the Show Timestamps stamp only when the line asks and the option is on', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27, 14, 5));
    const { chat, deps } = panes();
    appendChatLogLine(chat, { body: 'a', color: '#fff', timestamp: true }, deps);
    expect(chat.lastElementChild?.querySelector('.chat-ts')).toBeNull();
    const on = { ...deps, timestampClock: () => '24h' as const };
    appendChatLogLine(chat, { body: 'b', color: '#fff', timestamp: false }, on);
    expect(chat.lastElementChild?.querySelector('.chat-ts')).toBeNull();
    appendChatLogLine(chat, { body: 'c', color: '#fff', timestamp: true }, on);
    const ts = chat.lastElementChild?.querySelector('.chat-ts') as HTMLElement;
    expect(ts.className).toBe('chat-ts ui-faint ui-num');
    expect(ts.textContent).toBe(`${formatChatTimestamp(new Date(2026, 8, 27, 14, 5), '24h')} `);
    // The stamp leads the line, ahead of the body.
    expect(chat.lastElementChild?.firstChild).toBe(ts);
  });

  it('prependChatTimestamp is a no-op for a null clock', () => {
    const div = document.createElement('div');
    prependChatTimestamp(div, null);
    expect(div.childNodes).toHaveLength(0);
  });

  it('lands a node body verbatim and seals a decorated line', () => {
    const { chat, deps } = panes();
    const node = document.createElement('b');
    node.textContent = 'bold';
    appendChatLogLine(chat, { body: [node], color: '#fff', decorativeIconUrl: '/seal.webp' }, deps);
    const line = chat.lastElementChild as HTMLElement;
    const seal = line.querySelector('img.chat-masterwork-seal') as HTMLImageElement;
    expect(seal.getAttribute('src')).toBe('/seal.webp');
    expect(line.lastChild).toBe(node);
  });

  it('splices item links, quest titles and plain text from a tokened chat line', () => {
    const { chat, deps } = panes();
    appendChatLogLine(
      chat,
      { body: `get [[i:${itemId}]] for [[q:${questId}]] now`, color: '#fff' },
      deps,
    );
    const line = chat.lastElementChild as HTMLElement;
    expect(line.querySelectorAll('.chat-item-link')).toHaveLength(1);
    expect(line.textContent).toContain(`[${questTitle(questId)}]`);
    expect(line.textContent?.startsWith('get [')).toBe(true);
    expect(line.textContent?.endsWith(' now')).toBe(true);
  });

  it('trims the pane to its newest 200 lines', () => {
    const { chat, deps } = panes();
    for (let i = 0; i < 205; i++) appendChatLogLine(chat, { body: `l${i}`, color: '#fff' }, deps);
    expect(chat.children).toHaveLength(200);
    expect(chat.firstElementChild?.textContent).toBe('l5');
    expect(chat.lastElementChild?.textContent).toBe('l204');
  });

  it('scrolls to the bottom only when the pane was following before the append', () => {
    const { chat, deps } = panes();
    const scrollToBottom = vi.fn();
    const following = { shouldFollow: () => true, scrollToBottom };
    appendChatLogLine(
      chat,
      { body: 'x', color: '#fff' },
      {
        ...deps,
        follow: () => following as never,
      },
    );
    expect(scrollToBottom).toHaveBeenCalledWith(chat);
    const parked = { shouldFollow: () => false, scrollToBottom };
    appendChatLogLine(
      chat,
      { body: 'y', color: '#fff' },
      { ...deps, follow: () => parked as never },
    );
    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });
});

describe('chatLogLine: the log() line shape', () => {
  it("is a timestamped line carrying log()'s own parameters, in order", () => {
    expect(chatLogLine('t', '#c', '/i.webp', 'party', true, false)).toEqual({
      body: 't',
      color: '#c',
      timestamp: true,
      chan: 'party',
      decorativeIconUrl: '/i.webp',
      plainText: false,
      announceWhenFiltered: true,
    });
    const nodes = [document.createTextNode('n')];
    expect(chatLogLine(nodes, '#c', undefined, 'system', false, true).body).toBe(nodes);
    expect(chatLogLine(nodes, '#c', undefined, 'system', false, true).plainText).toBe(true);
  });
});

describe('chatItemLinkEl', () => {
  it('mints a focusable quality-colored link whose tooltip is the full item card', () => {
    const attachTooltip = vi.fn();
    const itemTooltip = vi.fn(() => '<card>');
    const deps = chatLogDeps(document.createElement('div'), { attachTooltip, itemTooltip });
    const link = chatItemLinkEl(document, itemId, deps) as HTMLElement;
    expect(link.className).toBe('chat-item-link');
    expect(link.tabIndex).toBe(0);
    expect(link.style.color).not.toBe('');
    expect(link.textContent?.startsWith('[')).toBe(true);
    expect(link.textContent?.endsWith(']')).toBe(true);
    expect(attachTooltip).toHaveBeenCalledWith(link, expect.any(Function));
    const html = (attachTooltip.mock.calls[0] as [HTMLElement, () => string])[1]();
    expect(html).toBe('<card>');
    expect(itemTooltip).toHaveBeenCalledWith(ITEMS[itemId], true, undefined);
  });

  it('degrades an unknown or prototype-key id to the masked [?] text', () => {
    const maskChat = vi.fn((text: string) => `m${text}`);
    const deps = chatLogDeps(document.createElement('div'), { maskChat });
    for (const id of ['no_such_item', 'constructor']) {
      const node = chatItemLinkEl(document, id, deps);
      expect(node.nodeType).toBe(Node.TEXT_NODE);
      expect(node.textContent).toBe('m[?]');
    }
  });
});
