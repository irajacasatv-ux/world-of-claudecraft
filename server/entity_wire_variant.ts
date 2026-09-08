// The per-entity wire-fragment cache shape and its three pure helpers, moved
// WHOLE from server/game.ts (the freeholds 05 join stamp paid for by this
// extraction; bodies byte-identical). GameServer.wireCacheFor mints one
// variant per timer-wire arm (legacy and stable) and refreshes it lazily at
// most once per tick; the two JSON splicers assemble a full (identity plus
// dynamic) or lite (dynamic only) entity record from the already-serialized
// fragments without a second JSON.stringify. Nothing here reads GameServer
// state: every input is a value the coordinator hands in.

// Per-entity wire fragments, refreshed lazily at most once per tick and
// shared by every recipient. The version counters bump only when the
// serialized form actually changes, making per-session diffing O(1).
export interface EntityWireVariantCache {
  tick: number;
  idVer: number;
  dynJson: string;
  dynVer: number;
  auraVer: number;
  builtIdVer: number;
  builtDynVer: number;
  builtAuraVer: number;
  fullJson: string;
  liteJson: string;
  fullAuraJson: string;
  liteAuraJson: string;
}

export function emptyWireVariant(): EntityWireVariantCache {
  return {
    tick: -1,
    idVer: 0,
    dynJson: '',
    dynVer: 0,
    auraVer: 0,
    builtIdVer: -1,
    builtDynVer: -1,
    builtAuraVer: -1,
    fullJson: '',
    liteJson: '',
    fullAuraJson: '',
    liteAuraJson: '',
  };
}

export function fullEntityJson(id: number, idJson: string, dynJson: string): string {
  return `{"id":${id},${idJson.slice(1, -1)},${dynJson.slice(1, -1)}}`;
}

export function liteEntityJson(id: number, dynJson: string): string {
  return `{"id":${id},${dynJson.slice(1, -1)}}`;
}
