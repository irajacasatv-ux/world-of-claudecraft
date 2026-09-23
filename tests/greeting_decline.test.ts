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
    expect(freeholdOverlayPass(GREETING_DECLINE)).toEqual(['profession-tutorial']);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('every capture script declines through GREETING_DECLINE', () => {
  // A greeting cleared by its first, last or any button, by a stale play/skip
  // selector, or by the accepting .cd-ok. Checked on code with comments removed
  // line by line, so a comment that quotes a bad form is not a hit.
  const BAD = [
    /#tutorial-greeting[^'"`]*\bbutton\b/,
    /#tutorial-greeting \.cd-ok/,
    /(?:greeting|dlg|note|popup)\??\.querySelector\(\s*['"]button['"]\s*\)/,
    /(?:greeting|dlg|note|popup)\??\.querySelectorAll\(\s*['"]button['"]\s*\)/,
    /\[data-skip\]/,
  ];
  const files = sourceFilesUnder('scripts', { skipDirectories: ['node_modules'] }).filter((f) =>
    f.file.endsWith('.mjs'),
  );

  it('scans the whole scripts tree through the shared walker', () => {
    expect(files.length).toBeGreaterThan(100);
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['source_files_under']);
  });

  it('finds no greeting cleared by a non-declining control', () => {
    const hits: string[] = [];
    let declines = 0;
    for (const { file, full } of files) {
      const lines = readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, index) => {
        const code = line.replace(/^\s*(\/\/|\*).*$/, '').replace(/\s\/\/.*$/, '');
        if (code.includes('GREETING_DECLINE')) declines++;
        if (BAD.some((pattern) => pattern.test(code))) hits.push(`scripts/${file}:${index + 1}`);
      });
    }
    expect(hits).toEqual([]);
    // Non-vacuous: the scripts really route through the shared selector.
    expect(declines).toBeGreaterThan(20);
  });
});
