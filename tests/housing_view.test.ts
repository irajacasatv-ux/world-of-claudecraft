import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { HEARTH_KEY_COOLDOWN_MS } from '../src/sim/freehold/gate_rules';
import { handleFreeholdEvent } from '../src/ui/hud/housing/freehold_event_feedback';
import { hearthKeyTooltipLines } from '../src/ui/hud/housing/hearth_key_tooltip';
import {
  beginGateLookup,
  editGateName,
  failGateLookup,
  freeholdDeniedLineKey,
  gateEntryResolution,
  gateOwnEntryEnabled,
  gateVisitAuthorized,
  newHousingGateDraft,
  resolveGateLookup,
} from '../src/ui/hud/housing/housing_view';
import { semanticMapMarkerArt } from '../src/ui/map_marker_icon_art';
import {
  classifyMapObjectMarker,
  mapMarkerSemanticLayer,
} from '../src/ui/map_marker_semantics_core';
import {
  mapMarkerSemanticToken,
  mapSemanticLabelId,
} from '../src/ui/map_semantic_accessibility_core';

describe('housing gate lookup identity', () => {
  it('invalidates an authorized result on every edit and rejects late replies for the same normalized name', () => {
    const draft = newHousingGateDraft();
    draft.tab = 'visit';
    editGateName(draft, '  Fen  ');
    const first = beginGateLookup(draft)!;
    expect(first.normalizedName).toBe('fen');
    expect(beginGateLookup(draft)).toBeNull();
    editGateName(draft, 'Fen');
    const second = beginGateLookup(draft)!;
    expect(resolveGateLookup(draft, { ...first, homeId: 'one', displayName: 'Fen' })).toBe(false);
    expect(gateVisitAuthorized(draft)).toBe(false);
    expect(
      resolveGateLookup(draft, {
        ...second,
        normalizedName: 'other',
        homeId: 'one',
        displayName: 'Fen',
      }),
    ).toBe(false);
    expect(resolveGateLookup(draft, { ...second, homeId: 'one', displayName: 'Fen' })).toBe(true);
    expect(gateVisitAuthorized(draft)).toBe(true);
    editGateName(draft, 'Other');
    expect(gateVisitAuthorized(draft)).toBe(false);
    expect(draft.capability).toBeNull();
  });
  it('never authorizes own entry from friend results or whitespace lookup', () => {
    const draft = newHousingGateDraft();
    draft.name = '   ';
    expect(beginGateLookup(draft)).toBeNull();
    draft.name = 'Fen';
    const request = beginGateLookup(draft)!;
    resolveGateLookup(draft, { ...request, homeId: 'one', displayName: 'Fen' });
    expect(gateVisitAuthorized(draft)).toBe(false);
  });
});

describe('housing feedback and key tooltip', () => {
  it.each([
    ['no_freehold', 'unavailable'],
    ['busy', 'busy'],
    ['locked', 'condition'],
    ['dead', 'dead'],
    ['combat', 'combat'],
    ['cooldown', 'cooldown'],
    ['instanced', 'instanced'],
    ['match', 'match'],
    ['visitors_full', 'permission'],
    ['not_friend', 'permission'],
  ] as const)('maps %s to one personal denial toast', (reason, suffix) => {
    expect(freeholdDeniedLineKey(reason)).toBe(`hudChrome.housing.denied.${suffix}`);
    const toasts: string[] = [];
    handleFreeholdEvent(
      { type: 'freeholdDenied', reason, pid: 1 },
      { showError: (text) => toasts.push(text) },
    );
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).not.toContain('hudChrome.');
  });
  it('uses the permanent key mechanic and live cooldown metadata in the item card', () => {
    const key = ITEMS.hearth_key;
    expect(key.use?.type).toBe('freeholdEnter');
    const text = hearthKeyTooltipLines(key);
    expect(text).toContain(
      'Return to your home. You cannot use this while in combat, dead, in jail, inside an instance or during a match.',
    );
    expect(HEARTH_KEY_COOLDOWN_MS).toBe(3600000);
    expect(text).toContain('3,600 sec cooldown');
    expect(hearthKeyTooltipLines(ITEMS.worn_sword)).toBe('');
  });
});

it('keeps gate navigation identity, art, accessibility token and label distinct from loot', () => {
  const semantic = classifyMapObjectMarker(
    { kind: 'object', templateId: 'freehold_gate' },
    { delveRun: null },
  );
  expect(semantic).toEqual({ kind: 'freehold-gate' });
  if (!semantic || semantic.kind !== 'freehold-gate') throw new Error('missing gate marker');
  expect(mapMarkerSemanticLayer(semantic)).toBe('navigation');
  expect(mapMarkerSemanticToken(semantic)).toBe('freehold-gate');
  expect(mapSemanticLabelId(semantic)).toBe('freeholdGate');
  expect(semanticMapMarkerArt(semantic)).toEqual(
    semanticMapMarkerArt({ kind: 'dungeon', role: 'entrance' }),
  );
});

it('settles only matching lookup failures and keeps the retry draft intact', () => {
  const draft = newHousingGateDraft();
  editGateName(draft, '  Fen  ');
  const first = beginGateLookup(draft)!;
  editGateName(draft, '  Fen  ');
  const retry = beginGateLookup(draft)!;
  expect(failGateLookup(draft, first)).toBe(false);
  expect(draft.request).toEqual(retry);
  expect(failGateLookup(draft, { ...retry, normalizedName: 'other' })).toBe(false);
  expect(failGateLookup(draft, retry)).toBe(true);
  expect(draft.name).toBe('  Fen  ');
  expect(draft.request).toBeNull();
  expect(draft.capability).toBeNull();
  expect(beginGateLookup(draft)).not.toBeNull();
});
it('keeps own entry state independent from friend capability and unrelated transitions', () => {
  const pending = { pid: 1, entrySeq: 4 };
  expect(gateEntryResolution(pending, 1, 4, true)).toBe('pending');
  expect(gateEntryResolution(pending, 1, 5, false)).toBe('pending');
  expect(gateEntryResolution(pending, 1, 5, true)).toBe('accepted');
  expect(gateEntryResolution(pending, 2, 4, false)).toBe('cancelled');
  expect(gateOwnEntryEnabled('visit', true, false)).toBe(false);
  expect(gateOwnEntryEnabled('own', true, true)).toBe(false);
  expect(gateOwnEntryEnabled('own', false, false)).toBe(false);
  expect(gateOwnEntryEnabled('own', true, false)).toBe(true);
});
it.each([
  ['no_freehold', 'This home is unavailable right now. Try again later.'],
  ['busy', 'This home is active elsewhere or still opening. Try again shortly.'],
  ['not_friend', 'You cannot use this here.'],
  ['locked', "Restore your home's condition to use this amenity."],
  ['dead', 'You cannot do that while dead.'],
  ['combat', 'You cannot do that in combat.'],
  ['cooldown', 'Your Hearth Key is still cooling down.'],
  ['instanced', 'You cannot use this inside an instance.'],
  ['match', 'You cannot use this during a match.'],
] as const)('renders the exact %s refusal sentence', (reason, expected) => {
  const lines: string[] = [];
  handleFreeholdEvent(
    { type: 'freeholdDenied', pid: 1, reason },
    { showError: (line) => lines.push(line) },
  );
  expect(lines).toEqual([expected]);
});
