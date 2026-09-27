// @vitest-environment jsdom
// The legendary celebration chat lines render PLAIN TEXT (the phase 13 review
// round): the chosen legendary name is player-authored, and the load bound
// deliberately admits names carrying chat item-link tokens from persistence,
// so the two legendary lines must not tokenize [[i:...]] into trusted
// clickable item-link spans. This drives the REAL log-line shape
// (chatLogLine, the one place Hud.log's parameters become the line) through
// the real appender (src/ui/hud/chat/chat_log_appender.ts), proving the
// plainText opt-out threads through into the append; the positive control
// proves the assertion is decisive, and a source pin holds Hud.log to that
// shape. The switch arms spelling plainText on both calls are pinned at source
// in tests/craft_celebration_text_view.test.ts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { appendChatLogLine, chatLogLine } from '../src/ui/hud/chat/chat_log_appender';
import { legendaryForgedLine } from '../src/ui/hud/professions/craft_celebration_text_view';
import { chatLogDeps } from './helpers/chat_log_deps';
import { methodBody } from './helpers/method_body';
import { stripComments } from './helpers/strip_comments';

// A real merged-table item id, derived so a content rename cannot silently rot
// the fixture into the unknown-id arm.
const itemId = Object.keys(ITEMS)[0] as string;

function harness(): { el: HTMLElement; deps: ReturnType<typeof chatLogDeps> } {
  const el = document.createElement('div');
  document.body.appendChild(el);
  // Neutral deps for the chrome the append path touches; `el` is the chat pane.
  return { el, deps: chatLogDeps(el) };
}

describe('legendary chat lines stay plain text (no item-link minting)', () => {
  it('a chosen name carrying [[i:...]] renders VERBATIM through the plainText log call', () => {
    const { el, deps } = harness();
    // The exact call shape the legendaryForged arm makes: the view bundle plus
    // the spelled channel reaching the plainText parameter.
    const line = legendaryForgedLine(itemId, `Oath of [[i:${itemId}]] Ruin`);
    appendChatLogLine(
      el,
      chatLogLine(line.text, line.color, line.icon, 'system', false, true),
      deps,
    );
    const rendered = el.lastElementChild as HTMLElement;
    expect(rendered.querySelector('.chat-item-link')).toBeNull();
    expect(rendered.textContent).toContain(`Oath of [[i:${itemId}]] Ruin`);
  });

  it('positive control: the default log path DOES linkify the same text', () => {
    // Proves the assertion above is decisive: same harness, same text, flag
    // off; if the linkifier were broken entirely, this arm fails instead of
    // the plain arm passing vacuously.
    const { el, deps } = harness();
    const line = legendaryForgedLine(itemId, `Oath of [[i:${itemId}]] Ruin`);
    appendChatLogLine(
      el,
      chatLogLine(line.text, line.color, line.icon, 'system', false, false),
      deps,
    );
    const rendered = el.lastElementChild as HTMLElement;
    expect(rendered.querySelector('.chat-item-link')).not.toBeNull();
    expect(rendered.textContent).not.toContain('[[i:');
  });

  it('Hud.log hands its six parameters, in order, to chatLogLine', () => {
    // The legendary arms call log(text, color, icon, channel, false, true);
    // plainText is the SIXTH log parameter and must land in chatLogLine's
    // sixth slot, or the verbatim opt-out above never reaches the line.
    const hud = stripComments(readFileSync(join(__dirname, '../src/ui/hud.ts'), 'utf8'));
    const body = methodBody(hud, '  log(\n');
    expect(body).toMatch(
      /log\(\s*text: string \| readonly Node\[\],\s*color = [^,]+,\s*decorativeIconUrl\?: string,\s*channel = ERROR_LOG_CHAN,\s*announceWhenFiltered = false,\s*plainText = false,\s*\): void \{/,
    );
    expect(body).toContain(
      'chatLogLine(text, color, decorativeIconUrl, channel, announceWhenFiltered, plainText)',
    );
    expect(body).toContain('appendChatLogLine(');
  });
});
