// server/entity_wire_cache.ts: the per-entity wire-fragment cache shapes and
// their three pure helpers. This branch and the release each extracted this
// block out of server/game.ts (this branch four names, to pay for the
// freeholds owner-key join stamp; the release a superset, those four plus
// EntityWireCache and EntityWireView, as a ratchet extraction), with the
// shared bodies byte-identical; the v0.44.0 re-sync collapsed the two onto
// the release's module and this suite followed it, so it guards the module
// at its OWN seam: the fresh-variant literal (every version counter at its
// "never built" sentinel, every fragment empty, and a new object per call so
// two timer-wire arms never alias), and the two JSON splicers, whose whole
// point is to assemble a record byte-identical to a JSON.stringify of the
// merged object without paying for that stringify on the broadcast hot path.
// The game.ts side is pinned too: the coordinator imports every name and
// declares none of them any more, so a merge resolution that re-inlines a
// copy, or restores the retired twin module, reds here by name.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type EntityWireVariantCache,
  emptyWireVariant,
  fullEntityJson,
  liteEntityJson,
} from '../../server/entity_wire_cache';

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('emptyWireVariant', () => {
  it('is the exact never-built literal: tick -1, built versions -1, live versions 0, fragments empty', () => {
    const expected: EntityWireVariantCache = {
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
    expect(emptyWireVariant()).toEqual(expected);
    // The built sentinels sit BELOW every live version the coordinator can
    // assign (idVer/dynVer start at 0 and only ever grow), so the very first
    // refresh always reads as "changed" and serializes; a sentinel of 0 would
    // make a fresh entity's first full record silently skip.
    const v = emptyWireVariant();
    expect(v.builtIdVer).toBeLessThan(v.idVer);
    expect(v.builtDynVer).toBeLessThan(v.dynVer);
    expect(v.builtAuraVer).toBeLessThan(v.auraVer);
  });

  it('mints a fresh object per call, so the legacy and stable arms of one cache never alias', () => {
    const legacy = emptyWireVariant();
    const stable = emptyWireVariant();
    expect(legacy).not.toBe(stable);
    legacy.fullJson = '{"id":1}';
    legacy.builtIdVer = 3;
    expect(stable.fullJson).toBe('');
    expect(stable.builtIdVer).toBe(-1);
  });
});

describe('the two JSON splicers', () => {
  const idJson = '{"k":"player","tid":"warrior","nm":"Ari","lv":12}';
  const dynJson = '{"x":-14.25,"y":0,"z":-96,"hp":812,"auras":[{"id":"rested","t":40}]}';

  it('fullEntityJson splices id, identity and dynamic fragments into one record, byte for byte', () => {
    expect(fullEntityJson(7, idJson, dynJson)).toBe(
      '{"id":7,"k":"player","tid":"warrior","nm":"Ari","lv":12,"x":-14.25,"y":0,"z":-96,"hp":812,"auras":[{"id":"rested","t":40}]}',
    );
  });

  it('liteEntityJson splices id and the dynamic fragment only, byte for byte', () => {
    expect(liteEntityJson(7, dynJson)).toBe(
      '{"id":7,"x":-14.25,"y":0,"z":-96,"hp":812,"auras":[{"id":"rested","t":40}]}',
    );
  });

  it('both are byte-identical to JSON.stringify of the merged object (the hot-path claim)', () => {
    // The splice exists so the broadcast loop never re-stringifies a record
    // it already holds as fragments; that is only sound while the spliced
    // bytes equal what a stringify of the merged object would have produced.
    const id = 4096;
    expect(fullEntityJson(id, idJson, dynJson)).toBe(
      JSON.stringify({ id, ...JSON.parse(idJson), ...JSON.parse(dynJson) }),
    );
    expect(liteEntityJson(id, dynJson)).toBe(JSON.stringify({ id, ...JSON.parse(dynJson) }));
  });

  it('the id is written as a bare number, never quoted (the client reads a numeric id)', () => {
    expect(JSON.parse(fullEntityJson(31, idJson, dynJson)).id).toBe(31);
    expect(JSON.parse(liteEntityJson(31, dynJson)).id).toBe(31);
    expect(liteEntityJson(31, dynJson).startsWith('{"id":31,')).toBe(true);
  });

  it('a single-field fragment splices without a stray separator', () => {
    expect(fullEntityJson(2, '{"k":"mob"}', '{"hp":5}')).toBe('{"id":2,"k":"mob","hp":5}');
    expect(liteEntityJson(2, '{"hp":5}')).toBe('{"id":2,"hp":5}');
  });
});

describe('the game.ts side of the extraction', () => {
  it('imports all six names from ./entity_wire_cache and declares none of them itself', () => {
    const game = codeOnly(
      readFileSync(new URL('../../server/game.ts', import.meta.url), 'utf8'),
    ).replace(/\s+/g, ' ');
    expect(game).toContain(
      "import { type EntityWireCache, type EntityWireVariantCache, type EntityWireView, emptyWireVariant, fullEntityJson, liteEntityJson, } from './entity_wire_cache';",
    );
    // The coordinator still consumes every helper (a dead import would let a
    // re-inlined copy hide beside it).
    expect(game).toContain('legacy: emptyWireVariant()');
    expect(game).toContain('stable: emptyWireVariant()');
    expect(game).toContain('fullEntityJson(e.id, cache.idJson, variant.dynJson)');
    expect(game).toContain('liteEntityJson(e.id, variant.dynJson)');
    // And declares none of them any more.
    for (const decl of [
      'interface EntityWireVariantCache',
      'interface EntityWireCache',
      'interface EntityWireView',
      'function emptyWireVariant',
      'function fullEntityJson',
      'function liteEntityJson',
    ]) {
      expect(game).not.toContain(decl);
    }
  });

  it('the cache record holds one variant per timer-wire arm, typed by the module', () => {
    const mod = codeOnly(
      readFileSync(new URL('../../server/entity_wire_cache.ts', import.meta.url), 'utf8'),
    ).replace(/\s+/g, ' ');
    expect(mod).toContain('legacy: EntityWireVariantCache;');
    expect(mod).toContain('stable: EntityWireVariantCache;');
  });

  it('the retired twin module stays retired (one home for the cache shapes)', () => {
    expect(existsSync(new URL('../../server/entity_wire_variant.ts', import.meta.url))).toBe(false);
  });
});
