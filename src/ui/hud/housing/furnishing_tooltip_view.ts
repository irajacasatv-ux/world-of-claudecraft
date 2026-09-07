import type { ItemDef, ItemInstancePayload } from '../../../sim/types';

/** Resolved furnishing metadata. Localization and markup belong to the composer. */
export type FurnishingTooltipRow =
  | {
      key: 'hudChrome.housing.furnishing.footprint';
      values: { width: number; depth: number };
    }
  | { key: 'hudChrome.housing.furnishing.decorCost'; values: { cost: number } }
  | { key: 'hudChrome.housing.furnishing.surfaceFloor'; values: Record<string, never> }
  | { key: 'hudChrome.housing.furnishing.maker'; values: { maker: string } };

/** A copy's signer is its only maker source; unsigned definitions have no maker row. */
export function furnishingTooltipRows(
  item: ItemDef,
  instance?: ItemInstancePayload,
): FurnishingTooltipRow[] {
  if (item.kind !== 'furnishing') return [];
  const { footprint, decorCost } = item.furnishing;
  const rows: FurnishingTooltipRow[] = [
    {
      key: 'hudChrome.housing.furnishing.footprint',
      values: { width: footprint.width, depth: footprint.depth },
    },
    { key: 'hudChrome.housing.furnishing.decorCost', values: { cost: decorCost } },
    { key: 'hudChrome.housing.furnishing.surfaceFloor', values: {} },
  ];
  if (instance?.signer) {
    rows.push({ key: 'hudChrome.housing.furnishing.maker', values: { maker: instance.signer } });
  }
  return rows;
}
