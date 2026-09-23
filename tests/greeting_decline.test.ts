// @vitest-environment happy-dom
// GREETING_DECLINE (scripts/enter_offline_game.mjs) against the markup the HUD
// actually renders, and a scan that keeps every capture script on it. The ferry
// note's guidance form leads with "Turn guidance on", so a script that clicks a
// greeting's first (or any other) button accepts golden guidance for the frame.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { entryOverlayPass, GREETING_DECLINE } from '../scripts/enter_offline_game.mjs';
import { freeholdOverlayPass } from '../scripts/lib/freehold_capture_notices.mjs';
import { buildProfessionTutorialModel } from '../src/ui/hud/professions/profession_tutorial_view';
import { renderProfessionTutorial } from '../src/ui/hud/professions/profession_tutorial_window';
import {
  buildFerryBellHomeNote,
  buildFerryBellReturnNote,
  buildFerryIslandArrivalNote,
} from '../src/ui/tutorial_greeting_view';
import { renderTutorialGreetingNote } from '../src/ui/tutorial_greeting_window';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { sourceFilesUnder } from './helpers/source_files_under';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('GREETING_DECLINE on the rendered greetings', () => {
  it('declines the ferry guidance form, never accepting it', () => {
    const onGuidanceChoice = vi.fn();
    const el = renderTutorialGreetingNote(buildFerryBellHomeNote(), {
      onClose: vi.fn(),
      onGuidanceChoice,
    });
    document.body.append(el);
    expect(el.querySelector(GREETING_DECLINE)?.getAttribute('data-guidance')).toBe('off');
    // The real entry pass and the real capture settle both decline it.
    expect(entryOverlayPass(GREETING_DECLINE).greetingUp).toBe(true);
    expect(onGuidanceChoice.mock.calls).toEqual([[false]]);
  });

  it.each([
    ['the return-bell note', buildFerryBellReturnNote()],
    ["Ferryman Odo's island note", buildFerryIslandArrivalNote()],
  ])('closes %s through its close control', (_, note) => {
    const onClose = vi.fn();
    const el = renderTutorialGreetingNote(note, { onClose });
    document.body.append(el);
    expect(el.querySelector(GREETING_DECLINE)?.hasAttribute('data-close')).toBe(true);
    expect(freeholdOverlayPass(GREETING_DECLINE)).toEqual(['tutorial-greeting:close']);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('records the guidance decline by its attribute in the capture settle', () => {
    const el = renderTutorialGreetingNote(buildFerryBellHomeNote(), {
      onClose: vi.fn(),
      onGuidanceChoice: vi.fn(),
    });
    document.body.append(el);
    expect(freeholdOverlayPass(GREETING_DECLINE)).toEqual(['tutorial-greeting:guidance-off']);
  });

  it('closes the professions tutorial through its close control', () => {
    const onClose = vi.fn();
    const el = renderProfessionTutorial(buildProfessionTutorialModel(), { onClose });
    document.body.append(el);
    expect(el.querySelector(GREETING_DECLINE)?.hasAttribute('data-close')).toBe(true);
    // The scan below admits `#profession-tutorial .cd-ok` because this is so.
    expect(el.querySelector('.cd-ok')?.hasAttribute('data-close')).toBe(true);
    expect(freeholdOverlayPass(GREETING_DECLINE)).toEqual(['profession-tutorial']);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('every capture script declines through GREETING_DECLINE', () => {
  // A greeting cleared by its first, last or any button, by the guidance
  // accept (valued or valueless), by a retired play/skip selector, or by the
  // ferry note's accepting .cd-ok. Checked on code with comments removed line
  // by line, so a comment that quotes a bad form is not a hit.
  const RECEIVER = String.raw`\b(?:greeting|dlg|note|popup)\??`;
  const BAD = [
    /#tutorial-greeting[^'"`]*\bbutton\b/,
    /#tutorial-greeting[^'"`]*\.cd-ok/,
    /#tutorial-greeting[^'"`]*\[data-play\]/,
    /\[data-guidance=\\?["']?on/,
    /\[data-guidance\]/,
    /\[data-skip\]/,
    /querySelector\(\s*['"`]\.(?:cd-ok|ui-btn--gold)['"`]\s*\)/,
    new RegExp(String.raw`${RECEIVER}\.querySelector(?:All)?\(\s*['"][^'"]*(?:\bbutton\b|\.cd-ok)`),
    new RegExp(String.raw`${RECEIVER}\.(?:first|last)ElementChild\??\.click\(`),
    /getElementById\(\s*['"]tutorial-greeting['"]\s*\)\??\.(?:first|last)ElementChild/,
    /getElementById\(\s*['"]tutorial-greeting['"]\s*\)\??\.querySelector(?:All)?\(\s*['"][^'"]*(?:\bbutton\b|\.cd-ok)/,
  ];
  // Every click in a statement that names a greeting must be fed by a
  // declining selector: the shared one (the `decline` argument or
  // GREETING_DECLINE), a literal carrying [data-close] or the guidance
  // decline, or `#profession-tutorial .cd-ok`, which carries data-close
  // (pinned on the rendered markup above). Another control that happens to
  // close (the tutorial's .x-btn) is refused too: the rule admits only the
  // named declining selectors. Known limit: a greeting reached through a
  // variable assigned in an EARLIER statement is not traced.
  const SELECTOR = String.raw`(?:decline|GREETING_DECLINE|(['"\x60])(?:(?!\1).)*?(?:\[data-close\]|\[data-guidance=\\?["']?off)(?:(?!\1).)*?\1|(['"\x60])#profession-tutorial \.cd-ok\2)`;
  const DECLINING_CLICK = new RegExp(
    String.raw`querySelector\(\s*${SELECTOR}\s*\)\s*\??\.\s*click\(`,
    'g',
  );
  /** Statements (split on `;`) that name a greeting and click anything but a
   *  declining selector. */
  function statementHits(code: string): string[] {
    const hits: string[] = [];
    for (const statement of code.split(';')) {
      if (!/tutorial-greeting|profession-tutorial/.test(statement)) continue;
      const clicks = statement.match(/\.click\(/g)?.length ?? 0;
      if (clicks === 0) continue;
      const declining = statement.match(DECLINING_CLICK)?.length ?? 0;
      if (declining < clicks) hits.push(statement.trim());
    }
    return hits;
  }
  const files = sourceFilesUnder('scripts', { skipDirectories: ['node_modules'] }).filter((f) =>
    f.file.endsWith('.mjs'),
  );
  const codeOf = (full: string) =>
    readFileSync(full, 'utf8')
      .split('\n')
      .map((line) => line.replace(/^\s*(\/\/|\*).*$/, '').replace(/\s\/\/.*$/, ''));

  it('scans the whole scripts tree through the shared walker', () => {
    // Measured 2026-09-23: 645 .mjs files under scripts/.
    expect(files.length).toBeGreaterThan(600);
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['source_files_under']);
  });

  it('finds no greeting cleared by a non-declining control', () => {
    const hits: string[] = [];
    let declines = 0;
    for (const { file, full } of files) {
      codeOf(full).forEach((code, index) => {
        if (code.includes('GREETING_DECLINE')) declines++;
        if (BAD.some((pattern) => pattern.test(code))) hits.push(`scripts/${file}:${index + 1}`);
      });
    }
    expect(hits).toEqual([]);
    // Non-vacuous: the scripts really route through the shared selector
    // (measured 2026-09-23: 48 code lines).
    expect(declines).toBeGreaterThan(44);
  });

  it('finds no statement that names a greeting and clicks something else', () => {
    const hits: string[] = [];
    let clicked = 0;
    for (const { file, full } of files) {
      const code = codeOf(full).join('\n');
      for (const statement of code.split(';'))
        if (/tutorial-greeting|profession-tutorial/.test(statement) && /\.click\(/.test(statement))
          clicked++;
      for (const hit of statementHits(code)) hits.push(`scripts/${file}: ${hit}`);
    }
    expect(hits).toEqual([]);
    // Measured 2026-09-23: 21 greeting-naming statements that click.
    expect(clicked).toBeGreaterThan(18);
  });

  it.each([
    "document.querySelector('#tutorial-greeting [data-play]')?.click()",
    "document.querySelector('#tutorial-greeting .ui-btn.cd-ok')?.click()",
    "document.querySelector('#tutorial-greeting .cd-actions button')?.click()",
    'document.querySelector(\'[data-guidance="on"]\')?.click()',
    "document.querySelector('[data-guidance]')?.click()",
    "document.querySelector('[data-skip]')?.click()",
    "document.querySelector('.cd-ok')?.click()",
    "document.querySelector('.ui-btn--gold')?.click()",
    'greeting.firstElementChild?.click()',
    "document.getElementById('tutorial-greeting')?.lastElementChild?.click()",
    "note?.querySelector('.cd-actions button')?.click()",
    "document.getElementById('tutorial-greeting')?.querySelector('.cd-ok')?.click()",
  ])('the line rules catch %s', (code) => {
    expect(BAD.some((pattern) => pattern.test(code))).toBe(true);
  });

  it.each([
    "document.getElementById('tutorial-greeting')?.querySelector(decline)?.click()",
    "document.querySelector('#tutorial-greeting [data-close]')?.click()",
    "document.querySelector('#profession-tutorial .cd-ok')?.click()",
    "document.getElementById('tutorial-greeting')?.remove()",
    "footnote.querySelector('button')?.click()",
    'const first = greeting.firstElementChild',
  ])('the line rules pass %s', (code) => {
    expect(BAD.some((pattern) => pattern.test(code))).toBe(false);
  });

  it.each([
    // The loophole a bare `decline` token opened: the argument is named, but
    // the click is fed by an accepting selector.
    "page.evaluate((decline) => { document.getElementById('tutorial-greeting')?.querySelector('.ui-btn')?.click() }, GREETING_DECLINE)",
    "document.querySelector('#tutorial-greeting .ui-btn')?.click()",
    "document.getElementById('profession-tutorial')?.querySelector('.x-btn')?.click()",
    // One declining click does not excuse a second, accepting one.
    "document.getElementById('tutorial-greeting')?.querySelector(decline)?.click(), document.querySelector('#tutorial-greeting .ui-btn')?.click()",
    // Wrapped over lines, as the formatter lays it out.
    "document\n  .getElementById('tutorial-greeting')\n  ?.querySelector('.ui-btn--gold')\n  ?.click()",
  ])('the statement rule catches %s', (code) => {
    expect(statementHits(code)).toHaveLength(1);
  });

  it.each([
    "document.getElementById('tutorial-greeting')?.querySelector(decline)?.click()",
    "document\n  .getElementById('tutorial-greeting')\n  ?.querySelector(decline)\n  ?.click()",
    'document.querySelector(\'#tutorial-greeting [data-guidance="off"]\')?.click()',
    "document.querySelector('#tutorial-greeting [data-close]')?.click()",
    "document.querySelector('#profession-tutorial .cd-ok')?.click()",
    // Not a greeting statement, and a greeting statement with no click.
    "document.querySelector('.tut-skip')?.click()",
    "document.getElementById('tutorial-greeting')?.remove()",
    // Two statements, each judged on its own.
    "document.querySelector('.tut-skip')?.click(); document.getElementById('tutorial-greeting')?.querySelector(decline)?.click()",
  ])('the statement rule passes %s', (code) => {
    expect(statementHits(code)).toEqual([]);
  });
});
