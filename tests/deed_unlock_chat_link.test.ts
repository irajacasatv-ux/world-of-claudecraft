// @vitest-environment happy-dom

// The clickable deed announcements, driven through the REAL painters the Hud
// delegates to (src/ui/deed_unlock_painter.ts and reliquary_unlock_painter.ts)
// over the real chat-log appender, on the celebration rig that wires them the
// way Hud.celebrationHost() does: a deed unlock and a guild broadcast each
// render the deed NAME as a chat-deed-link span inside the localized line, and
// activating the link (click or Enter) jumps to that deed's card via
// DeedsWindow.openWithDeed. The link label resolves from the local catalog
// (deedName), never from the wire. The handleEvents switch arms that route the
// two broadcast events here are pinned at source.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { deedName } from '../src/ui/deed_i18n';
import { paintDeedBroadcast, paintDeedUnlocks } from '../src/ui/deed_unlock_painter';
import { t } from '../src/ui/i18n';
import { reliquaryPageName } from '../src/ui/reliquary_i18n';
import { paintReliquaryIlluminationBroadcast } from '../src/ui/reliquary_unlock_painter';
import { type CelebrationRig, celebrationRig } from './helpers/celebration_rig';
import { type ChatPane, chatPane } from './helpers/chat_log_deps';

const UNLOCK_ID = 'prog_first_steps';
const BROADCAST_ID = 'cmb_first_blood';
const ILLUMINATED_PAGE_ID = 'conquerors_hollow_crypt';

// The DOM normalizes an assigned hex (rgb() form differs per engine), so
// round-trip the expected color through the same style property.
const cssColor = (hex: string): string => {
  const el = document.createElement('span');
  el.style.color = hex;
  return el.style.color;
};

// The plain-text log arm (the retro summary) stays a stub on the rig: this
// suite is about the NODE lines, which run the real logNodes/appender path
// into a real chat pane.
type DeedLinkRig = ChatPane & CelebrationRig;
const makeRig = (): DeedLinkRig => {
  const pane = chatPane();
  return Object.assign(pane, celebrationRig({ logNodes: pane.logNodes }));
};

beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(audio, 'achievement').mockImplementation(() => {});
  vi.spyOn(audio, 'click').mockImplementation(() => {});
});

describe('the unlock line (handleDeedUnlocks)', () => {
  it('renders the localized line with the deed name as a chat-deed-link span', () => {
    const hud = makeRig();
    paintDeedUnlocks(hud.host, [{ deedId: UNLOCK_ID }]);
    const line = hud.chatLogEl.lastElementChild as HTMLElement;
    expect(line).not.toBeNull();
    // The whole line reads exactly as before, name bracketed link-style.
    expect(line.textContent).toBe(
      t('hudChrome.deeds.unlockedBanner', { name: `[${deedName(UNLOCK_ID)}]` }),
    );
    const link = line.querySelector('span.chat-deed-link') as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe(`[${deedName(UNLOCK_ID)}]`);
    expect(link.getAttribute('role')).toBe('button');
    expect(link.tabIndex).toBe(0);
    // The gold announcement color rides the line, the link inherits it.
    expect(line.style.color).toBe(cssColor('#ffd100'));
  });

  it('click and Enter on the link both jump to the deed card', () => {
    const hud = makeRig();
    paintDeedUnlocks(hud.host, [{ deedId: UNLOCK_ID }]);
    const link = hud.chatLogEl.querySelector('span.chat-deed-link') as HTMLElement;
    link.click();
    expect(hud.deedsWindow.openWithDeed).toHaveBeenCalledWith(UNLOCK_ID);
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(hud.deedsWindow.openWithDeed).toHaveBeenCalledTimes(2);
  });

  it('announces the full spliced line through the chat live region, timestamp included', () => {
    const hud = makeRig();
    hud.chatTimestamps = true;
    paintDeedUnlocks(hud.host, [{ deedId: UNLOCK_ID }]);
    const line = hud.chatLogEl.lastElementChild as HTMLElement;
    // The timestamp option still decorates the node-body line.
    expect(line.querySelector('.chat-ts')).not.toBeNull();
    // The announcer receives the DIV's text (not the empty text argument the
    // node path passes), so screen readers hear the whole line.
    expect(hud.chatAnnouncer.push).toHaveBeenCalledWith(line.textContent ?? '', expect.any(Number));
    expect((line.textContent ?? '').length).toBeGreaterThan(0);
  });

  it('feeds the drain order to the recent strip and keeps retro out of it', () => {
    const hud = makeRig();
    paintDeedUnlocks(hud.host, [
      { deedId: UNLOCK_ID },
      { deedId: 'retro_x', retro: true },
      { deedId: BROADCAST_ID },
    ]);
    // Non-retro, drain order, catalog-known only (retro_x is also unknown).
    expect(hud.deedsWindow.noteUnlocks).toHaveBeenCalledWith([UNLOCK_ID, BROADCAST_ID]);
    // Two unlock lines rendered, each with its own link.
    expect(hud.chatLogEl.querySelectorAll('span.chat-deed-link')).toHaveLength(2);
  });
});

describe('the broadcast line (case deedBroadcast)', () => {
  // The switch arm's payload: { type: 'deedBroadcast', characterName, deedId }.
  const broadcast = (hud: DeedLinkRig): void => paintDeedBroadcast(hud.host, 'Hilda', BROADCAST_ID);

  it('renders the guild-green line with the deed name as the clickable jump', () => {
    const hud = makeRig();
    broadcast(hud);
    const line = hud.chatLogEl.lastElementChild as HTMLElement;
    expect(line.textContent).toBe(
      t('hudChrome.deeds.broadcastLine', { name: 'Hilda', deed: `[${deedName(BROADCAST_ID)}]` }),
    );
    // Same discipline as the illumination twin below: the t() assertion shares
    // the key and substitution with production, so this literal is the pin on
    // the English prose itself, names substituted.
    expect(line.textContent).toBe('Hilda has accomplished a deed: [First Blood]');
    expect(line.style.color).toBe(cssColor('#40d264'));
    const link = line.querySelector('span.chat-deed-link') as HTMLElement;
    expect(link.textContent).toBe(`[${deedName(BROADCAST_ID)}]`);
    link.click();
    expect(hud.deedsWindow.openWithDeed).toHaveBeenCalledWith(BROADCAST_ID);
  });
});

describe('the illumination broadcast line (case reliquaryIlluminationBroadcast)', () => {
  // The switch arm's payload: { type: 'reliquaryIlluminationBroadcast', characterName, pageId }.
  const illumination = (hud: DeedLinkRig, pageId: string = ILLUMINATED_PAGE_ID): void =>
    paintReliquaryIlluminationBroadcast(hud.host, 'Hilda', pageId);

  it('renders the guild-green line with the localized page name as the clickable jump', () => {
    const hud = makeRig();
    illumination(hud);
    const line = hud.chatLogEl.lastElementChild as HTMLElement;
    expect(line.textContent).toBe(
      t('hudChrome.reliquary.illuminationBroadcastLine', {
        name: 'Hilda',
        page: `[${reliquaryPageName(ILLUMINATED_PAGE_ID)}]`,
      }),
    );
    // The assertion above shares the key and the substitution with production,
    // so it cannot see a reword of the template. This literal is the pin on the
    // English prose itself, names substituted.
    expect(line.textContent).toBe('Hilda has illuminated a Reliquary page: [The Hollow Crypt]');
    expect(line.style.color).toBe(cssColor('#40d264'));
    const link = line.querySelector('span.chat-deed-link') as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe(`[${reliquaryPageName(ILLUMINATED_PAGE_ID)}]`);
    link.click();
    expect(hud.reliquaryWindow.openWithPage).toHaveBeenCalledWith(ILLUMINATED_PAGE_ID);
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(hud.reliquaryWindow.openWithPage).toHaveBeenCalledTimes(2);
  });

  it('a catalog-unknown page renders the plain line with no link (drift guard)', () => {
    // Mixed-version drift (a newer server's page id): the line keeps its
    // prose with the raw id through reliquaryPageName's fallback, and never
    // offers a link that would open the window un-navigated (the Illumination
    // toast's inert-link policy). Rendered through TEXT NODES, never the
    // token-parsing log path: a remote-origin string containing an item-link
    // token must stay literal text, so the branch is structurally inert
    // rather than incidentally safe via the name charset.
    const hud = makeRig();
    illumination(hud, 'page_from_a_newer_build[[i:evil]]');
    const line = hud.chatLogEl.lastElementChild as HTMLElement;
    expect(line.textContent).toBe(
      t('hudChrome.reliquary.illuminationBroadcastLine', {
        name: 'Hilda',
        page: 'page_from_a_newer_build[[i:evil]]',
      }),
    );
    expect(line.style.color).toBe(cssColor('#40d264'));
    // No deed link, and no chat-token element minted from the hostile id.
    expect(line.querySelector('span.chat-deed-link')).toBeNull();
    expect(line.querySelector('span.chat-item-link')).toBeNull();
    expect(line.children).toHaveLength(0);
  });

  it('hud.ts carries the reliquaryIlluminationBroadcast switch arm (source pin)', () => {
    // Belt over the behavior arms above: the real handleEvents switch must
    // name the case in CODE (comments stripped so a commented-out arm cannot
    // satisfy the pin).
    expect(hudCode()).toContain("case 'reliquaryIlluminationBroadcast':");
  });
});

// The painters above are what the handleEvents switch arms call, so each arm
// is pinned to hand its OWN event fields to its OWN painter: a swapped field,
// a dropped call or a crossed painter would leave every behavior arm green.
function hudCode(): string {
  const hudSource = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/ui/hud.ts'),
    'utf8',
  );
  return hudSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('the handleEvents broadcast arms route to the painters (source pins)', () => {
  it('deedBroadcast hands characterName and deedId to paintDeedBroadcast', () => {
    expect(hudCode()).toMatch(
      /case 'deedBroadcast':\s*paintDeedBroadcast\(this\.celebrationHost\(\), ev\.characterName, ev\.deedId\);\s*break;/,
    );
  });

  it('reliquaryIlluminationBroadcast hands characterName and pageId to its painter', () => {
    expect(hudCode()).toMatch(
      /case 'reliquaryIlluminationBroadcast':\s*paintReliquaryIlluminationBroadcast\(\s*this\.celebrationHost\(\),\s*ev\.characterName,\s*ev\.pageId,?\s*\);\s*break;/,
    );
  });
});
