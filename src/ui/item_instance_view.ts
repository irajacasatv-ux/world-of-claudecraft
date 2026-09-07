import type { ItemInstancePayload } from '../sim/types';

/** Copy facts a presentation surface may describe for the given item kind.
 * Furnishing keeps authored identity and rarity, plus actual custody and maker
 * facts. Keep an empty payload present so an unsigned copy retains its generic
 * marker. This projection never changes the stored payload. */
export function itemPresentationInstance(
  kind: string | undefined,
  instance: ItemInstancePayload | undefined,
): ItemInstancePayload | undefined {
  if (kind !== 'furnishing' || !instance) return instance;
  const copy: ItemInstancePayload = {};
  if (instance.signer) copy.signer = instance.signer;
  if (instance.locked !== undefined) copy.locked = instance.locked;
  if (instance.boundTo !== undefined) copy.boundTo = instance.boundTo;
  if (instance.bindOnTrade !== undefined) copy.bindOnTrade = instance.bindOnTrade;
  if (instance.partyTrade !== undefined) copy.partyTrade = instance.partyTrade;
  return copy;
}
