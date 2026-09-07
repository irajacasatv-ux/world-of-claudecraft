// src/net/blank_entity.ts: the neutral-default Entity the online mirror starts
// from for an id the snapshot has not fully described yet. Extracted verbatim
// out of online.ts, so this suite guards it at its OWN seam from here on.
//
// The expensive failure this module has is a SILENT OMISSION: a field dropped
// in a merge does not throw, it surfaces as `undefined` in whatever bar or
// sentence reads it later (tests/snapshots.test.ts records a bug of exactly
// that shape). A hand-written key list would rot, so the completeness arm
// scrapes every REQUIRED member of the Entity interface off the TypeScript AST
// (the tests/bare_client_defaults.test.ts idiom) and holds the factory to it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { blankEntity } from '../src/net/blank_entity';

/** Every non-optional property name declared on `interface Entity`. */
function requiredEntityFields(): string[] {
  const file = join(__dirname, '../src/sim/types.ts');
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const names: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'Entity') {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member)) continue;
        if (member.questionToken) continue; // optional: the factory may omit it
        if (!ts.isIdentifier(member.name)) continue;
        names.push(member.name.text);
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return names;
}

describe('blankEntity: completeness', () => {
  it('defines every REQUIRED field of the Entity interface', () => {
    const required = requiredEntityFields();
    // Anti-vacuity floor: the scrape walked the real interface. If the AST walk
    // ever returned nothing, the loop below would pass having checked nothing.
    expect(required.length).toBeGreaterThan(50);
    const e = blankEntity(1) as unknown as Record<string, unknown>;
    const missing = required.filter((f) => !(f in e));
    expect(missing, 'required Entity fields the factory omits').toEqual([]);
    // Present is not enough: an explicit `undefined` reads the same as a hole
    // to every consumer, so no required field may hold one. ONE documented
    // exception, verbatim from the pre-extraction original: `procReadyAt` is a
    // lazily-created proc map that the mirror fills on first use rather than
    // allocating an empty Record for every blank entity. Pinning it BY NAME
    // means it stays the only one: a second field defaulted to undefined reds
    // here instead of joining a silent class.
    const undef = required.filter((f) => e[f] === undefined);
    expect(undef, 'required Entity fields defaulted to undefined').toEqual(['procReadyAt']);
  });

  it('adds no field the Entity interface does not declare', () => {
    // The reverse direction: a stale field left behind after a rename would
    // otherwise sit in every mirrored entity forever.
    const file = join(__dirname, '../src/sim/types.ts');
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const declared = new Set<string>();
    const visit = (node: ts.Node): void => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === 'Entity') {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
            declared.add(member.name.text);
          }
        }
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    expect(declared.size).toBeGreaterThan(50);
    const extra = Object.keys(blankEntity(1)).filter((k) => !declared.has(k));
    expect(extra, 'fields the factory sets that Entity does not declare').toEqual([]);
  });
});

describe('blankEntity: the neutral defaults themselves', () => {
  it('carries the id through and starts as an anonymous level-1 mob', () => {
    const e = blankEntity(4242);
    expect(e.id).toBe(4242);
    expect(e.kind).toBe('mob');
    expect(e.templateId).toBe('');
    expect(e.name).toBe('');
    expect(e.level).toBe(1);
  });

  it('starts at the origin, grounded and still', () => {
    const e = blankEntity(1);
    expect(e.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect(e.prevPos).toEqual({ x: 0, y: 0, z: 0 });
    expect(e.facing).toBe(0);
    expect(e.vx).toBe(0);
    expect(e.vy).toBe(0);
    expect(e.vz).toBe(0);
    expect(e.onGround).toBe(true);
    expect(e.jumping).toBe(false);
  });

  it('returns a FRESH object graph per call, aliasing no previous entity', () => {
    // Two mirrored entities sharing one pos object would move together; this is
    // the classic factory bug and costs nothing to hold still.
    const a = blankEntity(1);
    const b = blankEntity(2);
    expect(a).not.toBe(b);
    expect(a.pos).not.toBe(b.pos);
    expect(a.prevPos).not.toBe(b.prevPos);
    a.pos.x = 99;
    expect(b.pos.x).toBe(0);
    // Array-valued defaults are per-instance too, never a shared literal.
    for (const [key, value] of Object.entries(a as unknown as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;
      const other = (b as unknown as Record<string, unknown>)[key];
      expect(other, `${key} must not be shared between entities`).not.toBe(value);
    }
  });

  it('leaves every array default empty and every timer at its documented rest value', () => {
    // Most timers start at zero, but three are deliberate SENTINELS carried
    // verbatim from the pre-extraction original. Pinning them by name and value
    // is what keeps the sweep decisive: a fourth non-zero timer, or a drift in
    // one of these three, reds here instead of being waved through by a loose
    // "timers are numbers" assertion.
    const TIMER_SENTINELS: Readonly<Record<string, number>> = {
      combatTimer: 99, // time SINCE the last combat event: blank starts long out of combat
      detonateTimer: Number.POSITIVE_INFINITY, // never detonating
      lootFfaTimer: Number.POSITIVE_INFINITY, // never falling open to free-for-all
    };
    const e = blankEntity(1) as unknown as Record<string, unknown>;
    const seenTimers: string[] = [];
    for (const [key, value] of Object.entries(e)) {
      if (Array.isArray(value)) expect(value, `${key} starts empty`).toEqual([]);
      if (!key.endsWith('Timer')) continue;
      seenTimers.push(key);
      if (key in TIMER_SENTINELS) expect(value, `${key} sentinel`).toBe(TIMER_SENTINELS[key]);
      else expect(value, `${key} starts at zero`).toBe(0);
    }
    // Floor: the sweep actually walked timers, and every named sentinel exists
    // (a renamed sentinel field would otherwise silently stop being checked).
    expect(seenTimers.length).toBeGreaterThan(5);
    for (const name of Object.keys(TIMER_SENTINELS)) expect(seenTimers).toContain(name);
  });
});
