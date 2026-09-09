// server/client_perf_reports_db.ts: the client performance telemetry accessors,
// moved whole out of server/db.ts to pay for the freehold persistence wiring
// against the monolith ratchet. The behaviour is already covered where it was
// always covered (tests/db_retention_prune.test.ts drives the retention batch
// and tests/perf_report.test.ts drives the insert, both through the db.ts
// re-export, which is exactly the point of keeping that re-export). What is NEW
// and needs its own guard is the SPLIT: db.ts must re-export every moved name
// and declare none of them, the new module must not grow a second copy of the
// DDL that already lives in client_perf_reports_schema.ts, and the boot-order
// argument that makes the ./db cycle safe (the pool binding is dereferenced
// only inside function bodies) must stay true.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function read(rel: string): string {
  return readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');
}

const MOVED = [
  'CLIENT_PERF_WORST10S_INDEX_SQL',
  'CLIENT_PERF_WORST10S_INVALID_INDEX_CHECK_SQL',
  'CLIENT_PERF_WORST10S_INVALID_INDEX_DROP_SQL',
  'insertClientPerfReport',
  'pruneClientPerfReportsBatch',
] as const;

describe('the client-perf telemetry extraction', () => {
  it('scans the real files (the presence control for the absences below)', () => {
    expect(read('server/client_perf_reports_db.ts')).toContain('insertClientPerfReport');
    expect(read('server/db.ts')).toContain('client_perf_reports_db');
  });

  it('db.ts re-exports every moved name so no caller re-points', () => {
    const db = codeOnly(read('server/db.ts')).replace(/\s+/g, ' ');
    expect(db).toContain("export type { ClientPerfReportInsert } from './client_perf_reports_db';");
    for (const name of MOVED) {
      expect(db, `${name} must ride the db.ts re-export`).toContain(name);
    }
    expect(db).toContain(
      `export { ${MOVED.join(', ')}, } from './client_perf_reports_db';`.replace(/\s+/g, ' '),
    );
  });

  it('db.ts declares none of the moved bodies any more', () => {
    const db = codeOnly(read('server/db.ts'));
    expect(db).not.toContain('export interface ClientPerfReportInsert');
    expect(db).not.toContain('export async function insertClientPerfReport');
    expect(db).not.toContain('export async function pruneClientPerfReportsBatch');
    expect(db).not.toContain('INSERT INTO client_perf_reports');
    expect(db).not.toContain('DELETE FROM client_perf_reports');
  });

  it('the new module owns exactly one copy of each moved body', () => {
    const src = codeOnly(read('server/client_perf_reports_db.ts'));
    expect(src.split('export interface ClientPerfReportInsert').length - 1).toBe(1);
    expect(src.split('export async function insertClientPerfReport').length - 1).toBe(1);
    expect(src.split('export async function pruneClientPerfReportsBatch').length - 1).toBe(1);
    expect(src.split('INSERT INTO client_perf_reports').length - 1).toBe(1);
    expect(src.split('DELETE FROM client_perf_reports').length - 1).toBe(1);
  });

  it('does not duplicate the DDL, which stays in client_perf_reports_schema.ts', () => {
    const src = codeOnly(read('server/client_perf_reports_db.ts'));
    expect(src).not.toContain('CREATE TABLE IF NOT EXISTS client_perf_reports');
    expect(read('server/client_perf_reports_schema.ts')).toContain(
      'CREATE TABLE IF NOT EXISTS client_perf_reports',
    );
  });

  it('keeps the retention batch bounded on the default statement allowance', () => {
    const src = codeOnly(read('server/client_perf_reports_db.ts'));
    // The batching contract that travelled with the body: a LIMIT subquery,
    // oldest first, a keep-forever zero guard, and NO heavy-timeout wrapper.
    expect(src).toContain('LIMIT $2');
    expect(src).toContain('ORDER BY created_at');
    expect(src).toContain('if (!Number.isFinite(retentionDays) || retentionDays <= 0) return 0;');
    expect(src).not.toContain('runWithStatementTimeout');
  });

  it('dereferences the ./db pool only inside function bodies, so the cycle is safe at boot', () => {
    // The module imports `pool` back from ./db (the character_lease_db.ts and
    // character_create_db.ts shape). That is a real ESM cycle and it is safe
    // ONLY while no top-level statement reads the binding: a module-scope
    // `pool.query(...)` or a `const x = pool` would observe a partly evaluated
    // db.ts at boot. Every occurrence must sit at a function's indentation.
    const src = codeOnly(read('server/client_perf_reports_db.ts'));
    const uses = src.split('\n').filter((line) => /\bpool\b/.test(line));
    expect(uses.length, 'the pool is imported and used').toBeGreaterThan(1);
    for (const line of uses) {
      if (line.startsWith('import ')) continue;
      expect(line, `top-level pool read: ${line}`).toMatch(/^\s{2,}/);
    }
  });
});
