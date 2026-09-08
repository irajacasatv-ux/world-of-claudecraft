import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Guards `server.watch.ignored` in vite.config.ts, the only thing keeping the dev
// server from reloading the served game for a file that cannot reach it.
//
// Vite's own default ignore list is just .git, node_modules, test-results, cacheDir
// and outDir, so without this the watcher descends into every agent runtime directory
// at the repo root. A linked worktree parked under one of those is a second full
// checkout, and two of its files reload the page even though neither is in the module
// graph: ANY watched *.html sends a full-reload, and ANY watched tsconfig.json sends a
// full-reload after invalidating every module graph. Creating a worktree, deleting it,
// or switching its branch rewrites all of them at once.
//
// The list therefore has to hold three properties at once, one `it` each: it names the
// agent and scratch directories, it stays directory-scoped so it can only ever prune a
// directory, and none of the directories it prunes holds a file the dev server serves.

const root = fileURLToPath(new URL('..', import.meta.url));
const configPath = fileURLToPath(new URL('../vite.config.ts', import.meta.url));
const config = ts.createSourceFile(
  'vite.config.ts',
  readFileSync(configPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);

function defineConfigObject(): ts.ObjectLiteralExpression {
  let found: ts.ObjectLiteralExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (
      !found &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineConfig' &&
      node.arguments.length === 1 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      found = node.arguments[0];
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(config);
  if (!found) throw new Error('vite.config.ts: no defineConfig({ ... }) object literal found');
  return found;
}

function propertyValue(obj: ts.ObjectLiteralExpression, name: string): ts.Expression {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : '';
    if (key === name) return prop.initializer;
  }
  throw new Error(`vite.config.ts: property "${name}" not found`);
}

// Reads a string[] at a dotted path under defineConfig({ ... }). Parsed from the AST
// rather than imported: vite.config.ts sits outside tsconfig `include` on purpose (it
// imports untyped scripts/*.mjs helpers), so importing it here would drag it into the
// type-checked program.
function stringArrayAt(path: string): string[] {
  const segments = path.split('.');
  let node: ts.Expression = defineConfigObject();
  for (const segment of segments) {
    if (!ts.isObjectLiteralExpression(node)) {
      throw new Error(`vite.config.ts: "${path}" traverses a non-object at "${segment}"`);
    }
    node = propertyValue(node, segment);
  }
  if (!ts.isArrayLiteralExpression(node)) throw new Error(`vite.config.ts: "${path}" is not array`);
  return node.elements.map((element) => {
    if (!ts.isStringLiteral(element)) {
      throw new Error(`vite.config.ts: "${path}" holds a non-literal element`);
    }
    return element.text;
  });
}

// '**/.claude/**' and 'tmp/**' both name one directory; anything else returns undefined
// so a future non-directory pattern cannot be silently read as a directory name.
const DIRECTORY_GLOB = /^(?:\*\*\/)?([^*/]+)\/\*\*$/;
const directoryOf = (glob: string): string | undefined => DIRECTORY_GLOB.exec(glob)?.[1];

const watchIgnored = stringArrayAt('server.watch.ignored');
const watchIgnoredDirs = watchIgnored.map(directoryOf).filter((dir) => dir !== undefined);
const testExcluded = stringArrayAt('test.exclude');
const testExcludedDirs = testExcluded.map(directoryOf).filter((dir) => dir !== undefined);

describe('vite dev-server watch ignore list', () => {
  it('unwatches every agent runtime and scratch directory', () => {
    expect(new Set(watchIgnored)).toEqual(
      new Set([
        '**/.claude/**',
        '**/.codex/**',
        '**/.agents/**',
        '**/.worktrees/**',
        '**/.wt/**',
        '**/.venv/**',
        '**/tmp/**',
      ]),
    );
  });

  // The same directories vitest already refuses to collect tests from, for the same
  // stated reason (a linked worktree parked under one of them is a second checkout).
  // Adding a new agent directory to one list and not the other is the drift this pins:
  // vitest would stop running its frozen copy while Vite kept reloading the game for it.
  it('covers every agent directory that test.exclude already lists', () => {
    const excluded = testExcludedDirs.filter((dir) => dir.startsWith('.') || dir === 'tmp');
    expect(excluded.length).toBeGreaterThanOrEqual(6);
    for (const dir of excluded) expect(watchIgnoredDirs).toContain(dir);
  });

  it('keeps vitest agent-directory excludes root-relative for linked worktrees', () => {
    for (const dir of ['.claude', '.codex', '.agents', '.worktrees', '.wt', '.venv']) {
      expect(testExcluded).toContain(`${dir}/**`);
      expect(testExcluded).not.toContain(`**/${dir}/**`);
    }
  });

  // A pattern that is not `**/<dir>/**` could match files scattered anywhere, and an
  // over-broad one would silently kill HMR for real sources instead of merely quieting
  // it. Keeping every entry directory-scoped is what makes the next check total.
  it('keeps every pattern directory-scoped, and never over a source root', () => {
    for (const glob of watchIgnored) expect(directoryOf(glob)).toBeDefined();
    for (const sourceRoot of ['src', 'server', 'public', 'scripts', 'headless', 'electron']) {
      expect(watchIgnoredDirs).not.toContain(sourceRoot);
    }
  });

  // The load-bearing one. Ignoring a directory is only safe while nothing the dev server
  // would serve lives in it: the moment a tracked module, stylesheet or HTML entry lands
  // under one of these, editing it stops triggering HMR and the change looks like it did
  // not apply. Tracked files only, so the untracked worktree copies stay out of the walk.
  it('prunes no directory that holds a file the dev server would serve', () => {
    const tracked = execFileSync('git', ['ls-files', '-z', '--', ...watchIgnoredDirs], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\0')
      .filter(Boolean);
    expect(tracked.length).toBeGreaterThan(0);
    expect(tracked.filter((file) => /\.(ts|tsx|js|mjs|cjs|css|html|svelte)$/.test(file))).toEqual(
      [],
    );
  });
});

// The Freehold development grant bridge (D81) rides the same config. Its text
// pin lives in tests/freehold_dev_authorization.test.ts; this is the AST half:
// the spread sits INSIDE the defineConfig({ ... }) plugins array (so the
// single-object-literal shape the walker above depends on is preserved), its
// condition is the module's own strict flag predicate over process.env (one
// rule, one spelling: the eight strict-flag cases in the module's suite are
// what protect production admission), the true arm is the one enabled call,
// the false arm is empty, and neither identifier appears anywhere else.
describe('vite dev-server freehold dev authorization admission', () => {
  const plugins = propertyValue(defineConfigObject(), 'plugins');
  if (!ts.isArrayLiteralExpression(plugins))
    throw new Error('vite.config.ts: plugins is not array');
  const mentions = (node: ts.Node): boolean =>
    node.getText(config).includes('freeholdDevAuthorizationPlugin');
  const admissions = plugins.elements.filter(mentions);
  const identifierSites = (name: string): ts.Node[] => {
    const sites: ts.Node[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && node.text === name) sites.push(node);
      ts.forEachChild(node, visit);
    };
    visit(config);
    return sites;
  };
  const importDeclarationOf = (specifier: ts.Node | undefined): ts.ImportDeclaration => {
    // ImportSpecifier -> NamedImports -> ImportClause -> ImportDeclaration.
    const decl = specifier?.parent.parent.parent.parent;
    if (!decl || !ts.isImportDeclaration(decl)) throw new Error('not an import specifier');
    return decl;
  };

  it('admits the plugin through exactly one conditional spread inside plugins', () => {
    expect(admissions).toHaveLength(1);
    const [spread] = admissions;
    if (!spread || !ts.isSpreadElement(spread)) throw new Error('admission is not a spread');
    const inner = ts.isParenthesizedExpression(spread.expression)
      ? spread.expression.expression
      : spread.expression;
    if (!ts.isConditionalExpression(inner)) throw new Error('admission is not conditional');
    expect(inner.condition.getText(config).replace(/\s+/g, ' ')).toBe(
      'freeholdDevAuthorizationEnabled(process.env)',
    );
    expect(inner.whenTrue.getText(config).replace(/\s+/g, ' ')).toBe(
      '[freeholdDevAuthorizationPlugin({ enabled: true })]',
    );
    expect(inner.whenFalse.getText(config)).toBe('[]');
  });

  it('names the plugin identifier only at the import and that one admission', () => {
    const sites = identifierSites('freeholdDevAuthorizationPlugin');
    expect(sites).toHaveLength(2);
    const [imported, admitted] = sites;
    expect(imported && ts.isImportSpecifier(imported.parent)).toBe(true);
    expect(admitted && ts.isCallExpression(admitted.parent)).toBe(true);
    expect(importDeclarationOf(imported).moduleSpecifier.getText(config)).toBe(
      "'./scripts/lib/freehold_dev_authorization.mjs'",
    );
  });

  it('names the flag predicate only at the same import and the admission condition', () => {
    const sites = identifierSites('freeholdDevAuthorizationEnabled');
    expect(sites).toHaveLength(2);
    const [imported, called] = sites;
    expect(imported && ts.isImportSpecifier(imported.parent)).toBe(true);
    expect(called && ts.isCallExpression(called.parent)).toBe(true);
    // The call's one argument is the live process.env, never a captured copy
    // or a hand-built object.
    if (called && ts.isCallExpression(called.parent)) {
      expect(called.parent.arguments.map((arg) => arg.getText(config))).toEqual(['process.env']);
    }
    expect(importDeclarationOf(imported).moduleSpecifier.getText(config)).toBe(
      "'./scripts/lib/freehold_dev_authorization.mjs'",
    );
    // The config itself never spells the flag: the module's read is the rule.
    expect(identifierSites('ALLOW_DEV_COMMANDS')).toHaveLength(0);
    expect(config.text).not.toContain('ALLOW_DEV_COMMANDS');
  });
});
