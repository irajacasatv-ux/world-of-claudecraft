import type { Entity, SimEvent } from '../../../sim/types';

export type FreeholdDeniedEvent = Extract<SimEvent, { type: 'freeholdDenied' }>;
export const FREEHOLD_DENIAL_KEYS = {
  no_freehold: 'hudChrome.housing.denied.unavailable',
  busy: 'hudChrome.housing.denied.busy',
  locked: 'hudChrome.housing.denied.condition',
  dead: 'hudChrome.housing.denied.dead',
  combat: 'hudChrome.housing.denied.combat',
  cooldown: 'hudChrome.housing.denied.cooldown',
  instanced: 'hudChrome.housing.denied.instanced',
  match: 'hudChrome.housing.denied.match',
  visitors_full: 'hudChrome.housing.denied.permission',
  not_friend: 'hudChrome.housing.denied.permission',
} as const satisfies Record<FreeholdDeniedEvent['reason'], string>;

export function canPresentFreeholdGate(
  player: Pick<Entity, 'dead' | 'ghost' | 'corpseInstanceId'>,
): boolean {
  // Only authority can establish ownership of the bound run; the prompt never grants it.
  return !player.dead || (player.ghost && typeof player.corpseInstanceId === 'number');
}

export interface GateLookupRequest {
  id: number;
  normalizedName: string;
}
export interface GateVisitCapability extends GateLookupRequest {
  homeId: string;
  displayName: string;
}
export interface HousingGateDraft {
  tab: 'own' | 'visit';
  name: string;
  nextRequestId: number;
  request: GateLookupRequest | null;
  capability: GateVisitCapability | null;
  lookupState: 'idle' | 'changed' | 'failed';
}
export function newHousingGateDraft(): HousingGateDraft {
  return {
    tab: 'own',
    name: '',
    nextRequestId: 1,
    request: null,
    capability: null,
    lookupState: 'idle',
  };
}
export function normalizeGateName(name: string): string {
  return name.trim().toLowerCase();
}
export function editGateName(draft: HousingGateDraft, name: string): void {
  draft.name = name;
  draft.lookupState = 'changed';
  draft.request = null;
  draft.capability = null;
}
export function beginGateLookup(draft: HousingGateDraft): GateLookupRequest | null {
  const normalizedName = normalizeGateName(draft.name);
  if (!normalizedName || draft.request) return null;
  const request = { id: draft.nextRequestId++, normalizedName };
  draft.request = request;
  draft.lookupState = 'idle';
  draft.capability = null;
  return request;
}
export function resolveGateLookup(draft: HousingGateDraft, result: GateVisitCapability): boolean {
  const request = draft.request;
  if (
    !request ||
    result.id !== request.id ||
    result.normalizedName !== request.normalizedName ||
    result.normalizedName !== normalizeGateName(draft.name)
  )
    return false;
  draft.request = null;
  draft.capability = { ...result };
  draft.lookupState = 'idle';
  return true;
}
export function gateVisitAuthorized(draft: HousingGateDraft): boolean {
  return (
    draft.tab === 'visit' &&
    !draft.request &&
    draft.capability !== null &&
    draft.capability.normalizedName === normalizeGateName(draft.name)
  );
}

export function freeholdDeniedLineKey(reason: FreeholdDeniedEvent['reason']) {
  return FREEHOLD_DENIAL_KEYS[reason];
}
export function failGateLookup(draft: HousingGateDraft, result: GateLookupRequest): boolean {
  if (
    !draft.request ||
    result.id !== draft.request.id ||
    result.normalizedName !== draft.request.normalizedName ||
    result.normalizedName !== normalizeGateName(draft.name)
  )
    return false;
  draft.request = null;
  draft.capability = null;
  draft.lookupState = 'failed';
  return true;
}
export interface GateEntryRequest {
  entrySeq: number;
  pid: number;
}
export function gateEntryResolution(
  request: GateEntryRequest,
  pid: number,
  entrySeq: number,
  ownerHome: boolean,
): 'pending' | 'accepted' | 'cancelled' {
  if (request.pid !== pid) return 'cancelled';
  return request.entrySeq !== entrySeq && ownerHome ? 'accepted' : 'pending';
}
export function gateOwnEntryEnabled(
  tab: HousingGateDraft['tab'],
  canEnter: boolean,
  pending: boolean,
): boolean {
  return tab === 'own' && canEnter && !pending;
}

export function gateLookupLine(draft: HousingGateDraft, available: boolean) {
  if (!available) return { key: 'hudChrome.housing.common.unavailable' } as const;
  if (draft.request) return { key: 'hudChrome.housing.gate.lookupPending' } as const;
  if (gateVisitAuthorized(draft))
    return { key: 'hudChrome.housing.gate.result', name: draft.capability!.displayName } as const;
  if (draft.lookupState === 'failed')
    return { key: 'hudChrome.housing.common.unavailable' } as const;
  if (!normalizeGateName(draft.name))
    return { key: 'hudChrome.housing.gate.nameRequired' } as const;
  return { key: 'hudChrome.housing.gate.lookupChanged' } as const;
}
