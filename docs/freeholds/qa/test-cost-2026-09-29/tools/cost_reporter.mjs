// Per-file and per-test cost reporter (measurement only, scratchpad).
// Writes COST_OUT (JSON): every test module's diagnostic split (environment,
// prepare, collect = import + suite callbacks, setup, duration = tests + hooks),
// its tests' durations, its top imports by self time, and an aggregate of
// every source module's self time across all files.
import fs from 'node:fs';
import path from 'node:path';

export default class CostReporter {
  constructor() {
    this.files = [];
    this.modules = new Map();
    this.root = process.cwd();
  }
  onInit(vitest) {
    this.root = vitest.config.root;
  }
  onTestModuleEnd(testModule) {
    const d = testModule.diagnostic();
    const rel = path.relative(this.root, testModule.moduleId);
    const tests = [];
    for (const t of testModule.children.allTests()) {
      const r = t.result();
      const td = t.diagnostic();
      tests.push({ name: t.fullName, state: r.state, ms: td ? Math.round(td.duration) : 0 });
    }
    const imports = Object.entries(d.importDurations || {});
    for (const [id, v] of imports) {
      const key = path.relative(this.root, id.split('?')[0]);
      const m = this.modules.get(key) || { self: 0, total: 0, files: 0, external: !!v.external };
      m.self += v.selfTime;
      m.total += v.totalTime;
      m.files += 1;
      this.modules.set(key, m);
    }
    const top = imports
      .map(([id, v]) => [path.relative(this.root, id.split('?')[0]), Math.round(v.selfTime), Math.round(v.totalTime)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    this.files.push({
      file: rel,
      state: testModule.state(),
      env: Math.round(d.environmentSetupDuration),
      prepare: Math.round(d.prepareDuration),
      collect: Math.round(d.collectDuration),
      setup: Math.round(d.setupDuration),
      duration: Math.round(d.duration),
      heap: d.heap ?? null,
      testCount: tests.length,
      tests,
      top,
    });
  }
  onTestRunEnd() {
    const out = process.env.COST_OUT || 'cost.json';
    const modules = [...this.modules.entries()]
      .map(([k, v]) => ({ module: k, self: Math.round(v.self), total: Math.round(v.total), files: v.files, external: v.external }))
      .sort((a, b) => b.self - a.self);
    fs.writeFileSync(out, JSON.stringify({ root: this.root, files: this.files, modules }, null, 0));
    console.log(`[cost-reporter] wrote ${this.files.length} files to ${out}`);
  }
}
