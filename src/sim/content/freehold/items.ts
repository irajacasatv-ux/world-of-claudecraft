import type { ItemDef } from '../../types';

/** Permanent travel tool. Possession never creates or proves plot ownership. */
export const FREEHOLD_ITEMS: Record<string, ItemDef> = {
  hearth_key: {
    id: 'hearth_key',
    name: 'Hearth Key',
    kind: 'tool',
    quality: 'common',
    use: { type: 'freeholdEnter' },
    soulbound: true,
    noMarketList: true,
    noDiscard: true,
    sellValue: 0,
  },
};
