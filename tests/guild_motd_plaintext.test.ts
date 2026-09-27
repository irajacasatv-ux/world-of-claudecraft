// @vitest-environment jsdom
// The guild billboard login echo renders PLAIN TEXT (PR 2785 review): the
// billboard's home rendering (social_window.ts) is esc()'d plain text with no
// item links, so the chat-log echo of the same guild-controlled text must not
// tokenize [[i:...]] into trusted clickable item-link spans. This drives the
// REAL chat-log appender (src/ui/hud/chat/chat_log_appender.ts, extracted from
// Hud.appendLog) and asserts both arms: the plainText path keeps the token
// literal, and the default chat path still linkifies (so this suite fails
// loudly if the flag ever inverts or the linkifier moves). The Hud half,
// appendLog's positional plainText slot reaching the line, is pinned at source.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { appendChatLogLine } from '../src/ui/hud/chat/chat_log_appender';
import { chatLogDeps } from './helpers/chat_log_deps';
import { methodBody } from './helpers/method_body';
import { stripComments } from './helpers/strip_comments';

// A real merged-table item id, derived so a content rename cannot silently rot
// the fixture into the unknown-id arm.
const itemId = Object.keys(ITEMS)[0] as string;

function harness(): { el: HTMLElement; deps: ReturnType<typeof chatLogDeps> } {
  const el = document.createElement('div');
  document.body.appendChild(el);
  // Neutral deps for the chrome around the segment rendering (timestamps, tab
  // filters, the AT announcer, tooltips): the chat pane is `el` itself.
  return { el, deps: chatLogDeps(el) };
}

describe('guild billboard echo stays plain text (no item-link minting)', () => {
  it('plainText appendLog keeps a [[i:...]] token LITERAL: one text node, no link span', () => {
    const { el, deps } = harness();
    const motd = `Raid loot council: bring [[i:${itemId}]] offers`;
    appendChatLogLine(
      el,
      { body: motd, color: '#abc', timestamp: false, chan: 'guild', plainText: true },
      deps,
    );
    const line = el.lastElementChild as HTMLElement;
    expect(line.querySelector('.chat-item-link')).toBeNull();
    expect(line.textContent).toBe(motd); // verbatim, token intact as typed
  });

  it('positive control: the default chat path DOES linkify the same text', () => {
    // Proves the assertion above is decisive: same harness, same text, flag
    // off; if the linkifier were broken entirely, this arm fails instead of
    // the plain arm passing vacuously.
    const { el, deps } = harness();
    appendChatLogLine(
      el,
      {
        body: `Raid loot council: bring [[i:${itemId}]] offers`,
        color: '#abc',
        timestamp: false,
        chan: 'guild',
      },
      deps,
    );
    const line = el.lastElementChild as HTMLElement;
    expect(line.querySelector('.chat-item-link')).not.toBeNull();
    expect(line.textContent).not.toContain('[[i:');
  });

  it("Hud.appendLog carries its 7th positional argument into the line's plainText", () => {
    // The billboard echo calls appendLog positionally with `true` in the 7th
    // slot (tests/guild_motd_login.test.ts pins the call). The delegator must
    // keep that slot named plainText and forward it by name, or the verbatim
    // opt-out above never reaches the line.
    const hud = stripComments(readFileSync(join(__dirname, '../src/ui/hud.ts'), 'utf8'));
    const body = methodBody(hud, '  private appendLog(\n');
    expect(body).toMatch(
      /private appendLog\(\s*el: HTMLElement,\s*text: string,\s*color: string,\s*timestamp = false,\s*chan = 'system',\s*decorativeIconUrl\?: string,\s*plainText = false,\s*bodyNodes\?: readonly Node\[\],\s*announceWhenFiltered = false,\s*\): void \{/,
    );
    expect(body).toMatch(
      /appendChatLogLine\(\s*el,\s*\{[^}]*\bplainText,[^}]*\},\s*this\.chatLogDeps\(\),?\s*\);/,
    );
  });
});
