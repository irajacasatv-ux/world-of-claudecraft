// Headless RL environment server.
// Speaks NDJSON over stdin/stdout: one JSON object per line in, one per line out.
//
//   -> {"cmd":"info"}
//   <- {"obs_size":...,"num_actions":...,"actions":[...]}  (sizes are content-dependent; query, don't hardcode)
//   -> {"cmd":"reset","seed":123,"player_class":"warrior","player_level":20,"talents":{"spec":"arms","rows":{}},"config":{...}}
//   <- {"obs":[...],"info":{...}}
//   -> {"cmd":"step","action":4}
//   <- {"obs":[...],"reward":0.01,"terminated":false,"truncated":false,"info":{...}}
//   -> {"cmd":"gathering","verb":"inspect"}
//   <- {"ok":true,"verb":"inspect","state":{...},"corpses":[...],"vendors":[...]}
//   -> {"cmd":"gathering_goal","verb":"inspect"}
//   <- {"ok":true,"verb":"inspect","goal":null}
//   -> {"cmd":"close"}
//
// The optional `gathering` command is a closed request union (inspect,
// buy_field_kit, set_preference, harvest) that never advances sim time or the
// episode step: no tick runs and no `step`-mutation happens on that path, only
// the existing `step`/noop advances casts. Exact request/result shapes and
// discovery are documented in `gathering_protocol.ts` and
// `docs/prd/intentional-gathering/headless-gathering-contract.md`; this header
// only names the wire shape, not the contract.
//
// The optional `gathering_goal` command (Intentional Gathering PR4) is a
// SEPARATE closed request union (inspect, track_recipe, track_commission,
// clear) for the one-goal tracking surface; same never-advances-time rule.
// Exact shapes: `gathering_goal_protocol.ts` and
// `docs/protocols/gathering-goal.md`.
//
// Run `node dist-env/env_server.cjs --bench` for a throughput benchmark.

import * as readline from 'node:readline';
import { ACTIONS, NUM_ACTIONS, obsSize } from '../src/sim/obs';
import { ALL_CLASSES, MAX_LEVEL } from '../src/sim/types';
import { DEFAULT_CONFIG, Env } from './env';
import { executeGatheringCommand } from './gathering_commands';
import { executeGatheringGoalCommand } from './gathering_goal_commands';
import { GATHERING_GOAL_CAPABILITY } from './gathering_goal_protocol';
import { GATHERING_CAPABILITY } from './gathering_protocol';
import {
  MAX_INPUT_LINE_LENGTH,
  parseTalentResetRequest,
  validateAction,
  validatePlayerClass,
} from './protocol';

function bench(): void {
  const env = new Env();
  env.reset(1, 'warrior', {});
  const targetSeconds = 20;
  let steps = 0;
  // exercise a realistic action mix
  const start = process.hrtime.bigint();
  let elapsed = 0;
  while (elapsed < targetSeconds) {
    const a = steps % 11 === 0 ? 8 : steps % 7 === 0 ? 9 : steps % 5 === 0 ? 10 : 1;
    const res = env.step(a);
    steps++;
    if (res.terminated || res.truncated) env.reset(steps, 'warrior', {});
    if (steps % 100 === 0) elapsed = Number(process.hrtime.bigint() - start) / 1e9;
  }
  elapsed = Number(process.hrtime.bigint() - start) / 1e9;
  const sps = Math.round(steps / elapsed);
  const tps = sps * DEFAULT_CONFIG.frameSkip;
  console.log(`steps: ${steps}, elapsed: ${elapsed.toFixed(2)}s`);
  console.log(`env steps/sec: ${sps} (${tps} sim ticks/sec) on a single core`);
}

function serve(): void {
  const env = new Env();
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const send = (obj: object) => process.stdout.write(JSON.stringify(obj) + '\n');

  rl.on('line', (line: string) => {
    if (line.length > MAX_INPUT_LINE_LENGTH) {
      send({ error: 'input line too large' });
      return;
    }
    line = line.trim();
    if (!line) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      send({ error: 'bad json' });
      return;
    }
    try {
      switch (msg.cmd) {
        case 'info':
          send({
            obs_size: obsSize(),
            num_actions: NUM_ACTIONS,
            actions: ACTIONS,
            max_level: MAX_LEVEL,
            gathering: GATHERING_CAPABILITY,
            gathering_goal: GATHERING_GOAL_CAPABILITY,
          });
          break;
        case 'reset':
          {
            const playerClass = validatePlayerClass(msg.player_class ?? 'warrior');
            if (playerClass === null) {
              send({ error: `invalid player_class: expected one of ${ALL_CLASSES.join(', ')}` });
              break;
            }
            const reset = parseTalentResetRequest(msg);
            if (!reset.ok) {
              send({ error: reset.error });
              break;
            }
            send(
              env.reset(
                msg.seed ?? 0,
                playerClass,
                msg.config ?? {},
                reset.playerLevel,
                reset.talents,
              ),
            );
          }
          break;
        case 'step':
          {
            const action = validateAction(msg.action ?? 0);
            if (action === null) {
              send({ error: `invalid action: expected integer 0-${NUM_ACTIONS - 1}` });
              break;
            }
            send(env.step(action));
          }
          break;
        case 'gathering':
          send(executeGatheringCommand(env.sim, msg));
          break;
        case 'gathering_goal':
          send(executeGatheringGoalCommand(env.sim, msg));
          break;
        case 'close':
          env.close();
          send({ ok: true });
          process.exit(0);
          break;
        default:
          send({ error: `unknown cmd: ${msg.cmd}` });
      }
    } catch (err: any) {
      send({ error: String(err?.message ?? err) });
    }
  });
  rl.on('close', () => {
    env.close();
    process.exit(0);
  });
}

if (process.argv.includes('--bench')) bench();
else serve();
