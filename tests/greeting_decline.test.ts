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
  // accept, by a retired play/skip selector, or by the ferry note's accepting
  // .cd-ok. Checked on code with comments removed line by line, so a comment
  // that quotes a bad form is not a hit.
  const RECEIVER = String.raw`(?:greeting|dlg|note|popup)\??`;
  const BAD = [
    /#tutorial-greeting[^'"`]*\bbutton\b/,
    /#tutorial-greeting[^'"`]*\.cd-ok/,
    /#tutorial-greeting[^'"`]*\[data-play\]/,
    /\[data-guidance=\\?["']?on/,
    /\[data-skip\]/,
    new RegExp(String.raw`${RECEIVER}\.querySelector(?:All)?\(\s*['"][^'"]*(?:\bbutton\b|\.cd-ok)`),
    new RegExp(String.raw`${RECEIVER}\.(?:first|last)ElementChild`),
    /getElementById\(\s*['"]tutorial-greeting['"]\s*\)\??\.(?:first|last)ElementChild/,
    /getElementById\(\s*['"]tutorial-greeting['"]\s*\)\??\.querySelector(?:All)?\(\s*['"][^'"]*(?:\bbutton\b|\.cd-ok)/,
  ];
  // A statement that names a greeting and clicks must click a declining
  // control. `#profession-tutorial .cd-ok` is admitted because that control
  // carries data-close (pinned on the rendered markup above).
  const DECLINING =
    /\bdecline\b|GREETING_DECLINE|\[data-close\]|\[data-guidance=\\?["']?off|#profession-tutorial \.cd-ok/;
  const files = sourceFilesUnder('scripts', { skipDirectories: ['node_modules'] }).filter((f) =>
    f.file.endsWith('.mjs'),
  );
  const codeOf = (full: string) =>
    readFileSync(full, 'utf8')
      .split('\n')
      .map((line) => line.replace(/^\s*(\/\/|\*).*$/, '').replace(/\s\/\/.*$/, ''));

  it('scans the whole scripts tree through the shared walker', () => {
    expect(files.length).toBeGreaterThan(100);
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
    // Non-vacuous: the scripts really route through the shared selector.
    expect(declines).toBeGreaterThan(20);
  });

  it('finds no statement that names a greeting and clicks something else', () => {
    const hits: string[] = [];
    let clicked = 0;
    for (const { file, full } of files) {
      for (const statement of codeOf(full).join('\n').split(';')) {
        if (!/tutorial-greeting|profession-tutorial/.test(statement)) continue;
        if (!/\.click\(/.test(statement)) continue;
        clicked++;
        if (!DECLINING.test(statement)) hits.push(`scripts/${file}: ${statement.trim()}`);
      }
    }
    expect(hits).toEqual([]);
    expect(clicked).toBeGreaterThan(10);
  });

  it.each([
    "document.querySelector('#tutorial-greeting [data-play]')?.click()",
    "document.querySelector('#tutorial-greeting .ui-btn.cd-ok')?.click()",
    'document.querySelector(\'[data-guidance="on"]\')?.click()',
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
  ])('the line rules pass %s', (code) => {
    expect(BAD.some((pattern) => pattern.test(code))).toBe(false);
  });

  it.each([
    ["document.querySelector('#tutorial-greeting .ui-btn')?.click()", false],
    ["document.getElementById('profession-tutorial')?.querySelector('.x-btn')?.click()", false],
    ["document.getElementById('tutorial-greeting')?.querySelector(decline)?.click()", true],
    ['document.querySelector(\'#tutorial-greeting [data-guidance="off"]\')?.click()', true],
  ])('the statement rule judges %s as declining: %s', (statement, declining) => {
    expect(DECLINING.test(statement)).toBe(declining);
  });
});
