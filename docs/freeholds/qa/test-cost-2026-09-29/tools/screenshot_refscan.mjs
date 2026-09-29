// File-level reference scan of docs/screenshots (measurement, scratchpad).
// Index pass: every tracked text file is scanned ONCE for
//  (a) file-name tokens (name.ext) that equal a screenshot basename, recording the
//      path text right before the token (to tell which directory it names), and
//  (b) every `screenshots/<path>` span (directory or file references).
// A screenshot is referenced BY PATH when a type-(b) span equals its path under
// docs/screenshots, or a type-(a) token's preceding path text ends with its parent
// directory name (dir/file), or the referencing file sits in the SAME directory
// (a sibling README or manifest naming it bare). Referenced BY BASE ONLY when only the
// bare name matched somewhere else. DIR-ONLY when some span names its directory (or an
// ancestor below docs/screenshots) but nothing names the file.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
const out = process.argv[3];
const ls = execFileSync('git', ['-C', root, 'ls-tree', '-r', '-l', 'HEAD'], {
  maxBuffer: 1 << 30,
  encoding: 'utf8',
});
const all = [];
for (const line of ls.split('\n')) {
  if (!line) continue;
  const tab = line.indexOf('\t');
  const meta = line.slice(0, tab).split(/\s+/);
  all.push({ path: line.slice(tab + 1), size: Number(meta[3]) || 0 });
}
const PREFIX = 'docs/screenshots/';
const shots = all.filter((f) => f.path.startsWith(PREFIX));
const byBase = new Map();
for (const s of shots) {
  const b = path.basename(s.path);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(s);
}
const TEXT = /\.(md|ts|mts|mjs|cjs|js|json|yml|yaml|txt|html|svelte|css|sh|py|toml|tsv|csv|log)$/i;
const texts = all.filter((f) => TEXT.test(f.path) && f.size < 40_000_000);
const refsBy = new Map(); // shot path -> Set(referencing files) by path
const baseBy = new Map(); // shot path -> Set(files) by bare basename only
const spanSet = new Map(); // span under screenshots -> Set(files)
const add = (m, k, v) => {
  if (!m.has(k)) m.set(k, new Set());
  m.get(k).add(v);
};
const NAME = /[\w.@%+\-]+\.(?:png|jpe?g|webp|gif|mp4|webm|json|md|txt|html|mjs|js|ts|log|csv|tsv|svg|glb|ya?ml|jsonl|wav|mp3|ogg)\b/gi;
const SPAN = /screenshots\/([\w.@%+\-\/]+)/g;
for (const t of texts) {
  let body;
  try {
    body = fs.readFileSync(path.join(root, t.path), 'utf8');
  } catch {
    continue;
  }
  const selfDir = path.dirname(t.path);
  for (const m of body.matchAll(SPAN)) add(spanSet, m[1].replace(/[.)]+$/, ''), t.path);
  for (const m of body.matchAll(NAME)) {
    const cands = byBase.get(m[0]);
    if (!cands) continue;
    const before = body.slice(Math.max(0, m.index - 300), m.index);
    for (const s of cands) {
      if (s.path === t.path) continue;
      const parent = path.basename(path.dirname(s.path));
      if (before.endsWith(`${parent}/`) || path.dirname(s.path) === selfDir) add(refsBy, s.path, t.path);
      else add(baseBy, s.path, t.path);
    }
  }
}
for (const [span, files] of spanSet) {
  const full = PREFIX + span;
  for (const f of files) if (f !== full) add(refsBy, full, f);
}
const dirSpans = [...spanSet.keys()];
const results = shots.map((s) => {
  const rel = s.path.slice(PREFIX.length);
  const refs = [...(refsBy.get(s.path) ?? [])];
  const base = [...(baseBy.get(s.path) ?? [])];
  const dirs = dirSpans.filter((d) => rel.startsWith(`${d.replace(/\/$/, '')}/`));
  const dirRefFiles = new Set();
  for (const d of dirs) for (const f of spanSet.get(d)) dirRefFiles.add(f);
  return { path: s.path, size: s.size, refs, base, dirRefs: [...dirRefFiles].slice(0, 30) };
});
fs.writeFileSync(out, JSON.stringify(results));
const sum = (a) => a.reduce((x, y) => x + y.size, 0);
const byPath = results.filter((r) => r.refs.length);
const baseOnly = results.filter((r) => !r.refs.length && r.base.length);
const dirOnly = results.filter((r) => !r.refs.length && !r.base.length && r.dirRefs.length);
const none = results.filter((r) => !r.refs.length && !r.base.length && !r.dirRefs.length);
for (const [k, v] of Object.entries({ byPath, baseOnly, dirOnly, none }))
  console.log(k, v.length, (sum(v) / 1e6).toFixed(1), 'MB');
