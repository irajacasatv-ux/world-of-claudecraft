import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withFixture(run: (fixture: HookFixture) => void) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'woc-codex-hooks-'));
  try {
    run(new HookFixture(directory));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

class HookFixture {
  readonly repo: string;
  readonly env: NodeJS.ProcessEnv;
  readonly globalConfig: string;

  constructor(readonly directory: string) {
    this.repo = path.join(directory, 'repo');
    // Neither inherited Git configuration nor an installed hook may affect a fixture.
    this.env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !key.startsWith('GIT_') && key !== 'CLAUDE_PROJECT_DIR',
      ),
    );
    this.globalConfig = path.join(directory, 'global.gitconfig');
    this.env.GIT_CONFIG_GLOBAL = this.globalConfig;
    this.env.GIT_CONFIG_NOSYSTEM = '1';
    this.env.GIT_TERMINAL_PROMPT = '0';
    fs.writeFileSync(this.env.GIT_CONFIG_GLOBAL, '');
    fs.mkdirSync(this.repo);
    fs.mkdirSync(path.join(directory, 'empty-template'));
    fs.mkdirSync(path.join(directory, 'empty-hooks'));
    this.git('init', '--quiet', `--template=${path.join(directory, 'empty-template')}`);
    for (const script of ['qa-stop.sh', 'ensure-hooks.sh']) {
      this.write(
        `.claude/hooks/${script}`,
        fs.readFileSync(path.join(root, '.claude/hooks', script), 'utf8'),
      );
    }
    this.write(
      '.codex/hooks/qa-stop.sh',
      fs.readFileSync(path.join(root, '.codex/hooks/qa-stop.sh'), 'utf8'),
    );
    this.write('.githooks/pre-push', '#!/bin/sh\nexit 1\n');
    for (const extension of ['mts', 'cts']) {
      this.write(`src/helper.${extension}`, 'export const clean = true;\n');
      this.write(`src/example.test.${extension}`, 'export const clean = true;\n');
    }
    this.git('add', '.');
    this.git(
      '-c',
      'user.name=Codex Fixture',
      '-c',
      'user.email=codex-fixture@example.invalid',
      '-c',
      `core.hooksPath=${path.join(directory, 'empty-hooks')}`,
      'commit',
      '--quiet',
      '-m',
      'fixture',
    );
  }

  write(relative: string, text: string) {
    const target = path.join(this.repo, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }

  git(...args: string[]) {
    const result = this.gitResult(...args);
    expect(result.status, result.stderr).toBe(0);
    return result.stdout.trim();
  }

  gitResult(...args: string[]) {
    return spawnSync('git', args, { cwd: this.repo, env: this.env, encoding: 'utf8' });
  }

  stop(input = '{"stop_hook_active":false}') {
    return spawnSync('bash', [path.join(this.repo, '.codex/hooks/qa-stop.sh')], {
      cwd: this.repo,
      env: this.env,
      input,
      encoding: 'utf8',
    });
  }

  start(nested = false, inheritedProjectDir?: string) {
    // Exercise the registered command, with every referenced script copied into the fixture.
    const wrapper = path.join(root, '.codex/hooks/ensure-hooks.sh');
    if (fs.existsSync(wrapper)) {
      this.write('.codex/hooks/ensure-hooks.sh', fs.readFileSync(wrapper, 'utf8'));
    }
    const config = JSON.parse(fs.readFileSync(path.join(root, '.codex/hooks.json'), 'utf8'));
    const command = config.hooks.SessionStart[0].hooks[0].command as string;
    return spawnSync('bash', ['-c', command], {
      cwd: nested ? path.join(this.repo, 'src') : this.repo,
      env: inheritedProjectDir
        ? { ...this.env, CLAUDE_PROJECT_DIR: inheritedProjectDir }
        : this.env,
      encoding: 'utf8',
    });
  }
}

describe('Codex Stop hook subprocess contract', () => {
  for (const extension of ['mts', 'cts']) {
    for (const state of ['staged', 'unstaged', 'untracked']) {
      for (const rule of ['debugger', 'focused test']) {
        it(`blocks ${state} ${extension} ${rule} outside the tests directory`, () => {
          withFixture((fixture) => {
            const stem = rule === 'debugger' ? 'helper' : 'example.test';
            const file = `src/${state === 'untracked' ? 'new-' : ''}${stem}.${extension}`;
            const line =
              rule === 'debugger'
                ? 'debugger;\n'
                : `${['test', 'only'].join('.')}('focused', () => {});\n`;
            fixture.write(file, line);
            if (state === 'staged') fixture.git('add', file);
            const result = fixture.stop();
            expect(result.status, result.stderr).toBe(0);
            const output = JSON.parse(result.stdout);
            expect(output.decision).toBe('block');
            expect(output.reason).toContain(file);
            expect(output.reason).toContain(
              rule === 'debugger' ? 'leftover debugger' : 'stray .only(',
            );
          });
        });
      }
    }
  }

  it('returns parseable block JSON for TOML copy with quotes and backslashes', () => {
    withFixture((fixture) => {
      const copy = `name = "bad \\ copy ${String.fromCodePoint(0x2014)}"`;
      fixture.write('.codex/agents/example.toml', `${copy}\n`);
      const result = fixture.stop();
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        decision: 'block',
        reason: expect.stringContaining(copy),
      });
    });
  });

  it('keeps the shared TypeScript determinism check active', () => {
    withFixture((fixture) => {
      fixture.write('src/sim/example.ts', 'const clock = Date.now();\n');
      const result = fixture.stop();
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout).reason).toContain('wall-clock or Math.random in sim code');
    });
  });

  it('is silent for clean files and when a prior Stop hook is already active', () => {
    withFixture((fixture) => {
      fixture.write('.codex/agents/example.toml', 'name = "clean"\n');
      const clean = fixture.stop();
      expect(clean.status, clean.stderr).toBe(0);
      expect(clean.stdout).toBe('');
      fixture.write('src/helper.mts', 'debugger;\n');
      fixture.git('add', 'src/helper.mts');
      const active = fixture.stop('{ "stop_hook_active" : true }');
      expect(active.status, active.stderr).toBe(0);
      expect(active.stdout).toBe('');
    });
  });
});

describe('Codex SessionStart hook ownership', () => {
  for (const nested of [false, true]) {
    it(`installs the shared hooks once from ${nested ? 'a nested directory' : 'the root'}`, () => {
      withFixture((fixture) => {
        const first = fixture.start(nested);
        expect(first.status, first.stderr).toBe(0);
        expect(fixture.git('config', '--local', '--get', 'core.hooksPath')).toBe('.githooks');
        expect(first.stderr).toContain('enabled .githooks');
        const second = fixture.start(nested);
        expect(second.status, second.stderr).toBe(0);
        expect(second.stderr).toBe('');
      });
    });
  }

  for (const scope of ['global', 'local', 'worktree', 'command']) {
    it(`preserves the effective ${scope} hook owner and configuration bytes`, () => {
      withFixture((fixture) => {
        if (scope === 'worktree')
          fixture.git('config', '--local', 'extensions.worktreeConfig', 'true');
        const owner = path.join(fixture.directory, `${scope}-hooks`);
        if (scope === 'command') {
          fixture.env.GIT_CONFIG_COUNT = '1';
          fixture.env.GIT_CONFIG_KEY_0 = 'core.hooksPath';
          fixture.env.GIT_CONFIG_VALUE_0 = owner;
        } else {
          fixture.git('config', `--${scope}`, 'core.hooksPath', owner);
        }
        const config = path.join(fixture.repo, '.git/config');
        const before = fs.readFileSync(config, 'utf8');
        const global = fs.readFileSync(fixture.globalConfig, 'utf8');
        const worktreeConfig = path.join(fixture.repo, '.git/config.worktree');
        const worktreeBefore = fs.existsSync(worktreeConfig)
          ? fs.readFileSync(worktreeConfig, 'utf8')
          : undefined;
        for (let invocation = 0; invocation < 2; invocation++) {
          const result = fixture.start(invocation === 1);
          expect(result.status, result.stderr).toBe(0);
          expect(result.stderr).toBe('');
        }
        expect(fixture.git('config', '--get', 'core.hooksPath')).toBe(owner);
        expect(fs.readFileSync(config, 'utf8')).toBe(before);
        expect(fs.readFileSync(fixture.globalConfig, 'utf8')).toBe(global);
        expect(
          fs.existsSync(worktreeConfig) ? fs.readFileSync(worktreeConfig, 'utf8') : undefined,
        ).toBe(worktreeBefore);
      });
    });
  }

  it('does not install or mutate configuration after an effective-config lookup error', () => {
    withFixture((fixture) => {
      const config = path.join(fixture.repo, '.git/config');
      const before = fs.readFileSync(config, 'utf8');
      const bin = path.join(fixture.directory, 'bin');
      fs.mkdirSync(bin);
      const marker = path.join(fixture.directory, 'unexpected-git-call');
      const lookup = path.join(fixture.directory, 'config-lookup');
      fs.writeFileSync(
        path.join(bin, 'git'),
        `#!/bin/sh
case "$*" in
  "rev-parse --show-toplevel") printf '%s\\n' "$WOC_FIXTURE_ROOT" ;;
  "config --get core.hooksPath") : > "$WOC_FIXTURE_LOOKUP"; exit 3 ;;
  *) : > "$WOC_FIXTURE_MARKER"; exit 1 ;;
esac
`,
        { mode: 0o755 },
      );
      fixture.env.PATH = `${bin}${path.delimiter}${fixture.env.PATH}`;
      fixture.env.WOC_FIXTURE_ROOT = fixture.repo;
      fixture.env.WOC_FIXTURE_MARKER = marker;
      fixture.env.WOC_FIXTURE_LOOKUP = lookup;
      expect(fixture.start().status).toBe(0);
      expect(fs.existsSync(lookup)).toBe(true);
      expect(fs.existsSync(marker)).toBe(false);
      expect(fs.readFileSync(config, 'utf8')).toBe(before);
    });
  });

  it('resolves the Git root instead of trusting an inherited Claude project directory', () => {
    withFixture((fixture) => {
      const result = fixture.start(true, path.join(fixture.directory, 'unrelated'));
      expect(result.status, result.stderr).toBe(0);
      expect(fixture.git('config', '--local', '--get', 'core.hooksPath')).toBe('.githooks');
    });
  });

  it('respects an explicitly empty effective hook path', () => {
    withFixture((fixture) => {
      fixture.git('config', '--global', 'core.hooksPath', '');
      const result = fixture.start();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toBe('');
      expect(fixture.git('config', '--get', 'core.hooksPath')).toBe('');
      expect(fixture.gitResult('config', '--local', '--get', 'core.hooksPath').status).toBe(1);
    });
  });

  it('warns about another checkout without replacing its effective hooks', () => {
    withFixture((fixture) => {
      const owner = path.join(fixture.directory, 'another-checkout/.githooks');
      fixture.git('config', '--global', 'core.hooksPath', owner);
      const result = fixture.start();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toContain("another checkout's .githooks");
      expect(result.stderr).toContain(owner);
      expect(fixture.git('config', '--get', 'core.hooksPath')).toBe(owner);
      expect(fixture.gitResult('config', '--local', '--get', 'core.hooksPath').status).toBe(1);
    });
  });
});
