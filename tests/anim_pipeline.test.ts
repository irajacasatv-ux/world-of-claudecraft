// The shipped-GLB-plus-manifest-source contract pins of the large-scale animation
// authoring initiative (issue #2889): every donor GLB it ships and every manifest
// wiring that consumes one. Merged on 2026-09-27 from the 26 per-batch
// tests/anim_pipeline_*.test.ts files so the suite pays for one module graph instead
// of 26. Each former file is one describe below, named after its old suffix, with its
// cases and comments intact; the one case every file repeated (a donor GLB ships
// exactly its clips and no mesh) is the single table at the top. Every clip is
// authored by pose-sample-and-blend (scripts/anim/pose_blend.mjs plus a per-family
// scripts/build_*_anims.mjs), the technique documented in
// .claude/skills/blender-anim-pipeline/SKILL.md, and the pattern itself follows
// tests/weapon_skins.test.ts's "bow skin attack animation" describe block.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { AbilityVfxDeps } from '../src/render/ability_vfx/painter';
import { AbilityVfx } from '../src/render/ability_vfx/painter';
import { VISUALS } from '../src/render/characters/manifest';
import { PALADIN_BASTION_SWEEP_CLIP } from '../src/render/characters/paladin_bastion_sweep_clip';
import { PALADIN_TEMPLARS_VERDICT_CLIP } from '../src/render/characters/paladin_templars_verdict_clip';
import { ABILITIES } from '../src/sim/data';

const ROOT = join(__dirname, '..');

function clipNamesOf(glbPath: string): string[] {
  const glb = readFileSync(join(ROOT, glbPath));
  const jsonLen = glb.readUInt32LE(12);
  const doc = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  return (doc.animations ?? []).map((a: { name?: string }) => a.name);
}

function meshCountOf(glbPath: string): number {
  const glb = readFileSync(join(ROOT, glbPath));
  const jsonLen = glb.readUInt32LE(12);
  const doc = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  return (doc.meshes ?? []).length;
}

function channelCountOf(glbPath: string, clipName: string): number {
  const glb = readFileSync(join(ROOT, glbPath));
  const jsonLen = glb.readUInt32LE(12);
  const doc = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  const anim = (doc.animations ?? []).find((a: { name?: string }) => a.name === clipName);
  expect(anim, `clip '${clipName}' not found in ${glbPath}`).toBeTruthy();
  return anim.channels.length;
}

// "node|path" for every channel baked into the clip's one animation, e.g.
// "Head|rotation". Catches a channel silently dropped mid-blend (bakeClip
// breaks out of its values-collection loop on the first null pose value and
// drops that channel with no warning): asserting only the clip name and mesh
// count would stay green even if half the donor motion never made it in.
function channelTargetsOf(glbPath: string): string[] {
  const glb = readFileSync(join(ROOT, glbPath));
  const jsonLen = glb.readUInt32LE(12);
  const doc = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  const anim = (doc.animations ?? [])[0];
  if (!anim) return [];
  return anim.channels.map((ch: { target: { node: number; path: string } }) => {
    const node = doc.nodes[ch.target.node];
    return `${node?.name ?? ch.target.node}|${ch.target.path}`;
  });
}

const MANIFEST_SRC = readFileSync(join(ROOT, 'src/render/characters/manifest.ts'), 'utf8');

function manifestBlock(startAnchor: string, endAnchor: string): string {
  const start = MANIFEST_SRC.indexOf(startAnchor);
  expect(start, startAnchor).toBeGreaterThanOrEqual(0);
  const end = MANIFEST_SRC.indexOf(endAnchor, start);
  expect(end, `${startAnchor} .. ${endAnchor}`).toBeGreaterThan(start);
  return MANIFEST_SRC.slice(start, end);
}

// One top-level VisualDef's block, from `  <key>: {` to its closing `\n  },`.
function visualDefBlock(key: string): string {
  const idx = MANIFEST_SRC.indexOf(`  ${key}: {`);
  expect(idx, key).toBeGreaterThanOrEqual(0);
  const end = MANIFEST_SRC.indexOf('\n  },', idx);
  return MANIFEST_SRC.slice(idx, end);
}

// The `attackByAbility: { ... }` rows of one class VisualDef block, matched by the
// caller's own row pattern (its clip-name alphabet differs per class).
function attackByAbilityRows(visualBlock: string, row: RegExp) {
  const abilityStart = visualBlock.indexOf('attackByAbility: {');
  expect(abilityStart).toBeGreaterThanOrEqual(0);
  const abilityEnd = visualBlock.indexOf('\n      },', abilityStart);
  expect(abilityEnd).toBeGreaterThan(abilityStart);
  const block = visualBlock.slice(abilityStart, abilityEnd);
  return [...block.matchAll(row)];
}

const MAGE_CAST_CLIPS = ['Cast_Fire', 'Cast_Frost', 'Cast_Arcane', 'Cast_Nova', 'Cast_Polymorph'];

const BIPED14_DONOR_GLBS = [
  'public/models/creatures/yetialt_hit_variety_anims.glb',
  'public/models/creatures/frog_hit_variety_anims.glb',
  'public/models/creatures/orc_hit_variety_anims.glb',
  'public/models/creatures/demonalt_hit_variety_anims.glb',
];

const DRUID_CAST_CLIPS = [
  'Cast_Nature',
  'Cast_Starfall',
  'Cast_Nurture',
  'Cast_Roots',
  'Cast_Storm',
];

// giant_hit_variety_anims.glb was retired with the authored ogre body:
// mob_ogre (the giant donor's only consumer) now ships its own authored Hit
// clip inside ogre.glb and reads the OGRE ClipMap, not ENEMY7.
const ENEMY7_DONOR_GLBS = ['public/models/creatures/goblin_hit_variety_anims.glb'];

// crabenemy.glb and yeti.glb are confirmed different rigs (disjoint channel-key
// sets, different clip durations), so this is two independently baked donor
// files, not one shared file.
const ENEMY_BITE_DONOR_GLBS = [
  'public/models/creatures/crabenemy_hit_variety_anims.glb',
  'public/models/creatures/yeti_hit_variety_anims.glb',
];

const HUNTER_BAKED_CLIPS = [
  'Hunter_Melee_Gut',
  'Hunter_Melee_Counter',
  'Hunter_Melee_Clip',
  'Hunter_Shot_Snap',
  'Hunter_Shot_LongDraw',
  'Hunter_Shot_Volley',
];
// aspect_of_the_hawk/monkey/cheetah and rapid_fire point straight at
// ranger.glb's own already-baked Spellcast_Raise clip (no new clip authored
// for them, the same no-bake pattern player_warrior's sanguine_aura uses).
const HUNTER_MAPPED_CLIPS = [...HUNTER_BAKED_CLIPS, 'Spellcast_Raise'];

const KAYKIT_DONOR_GLBS = [
  'public/models/chars/players/knight_hit_variety_anims.glb',
  'public/models/chars/players/paladin_hit_variety_anims.glb',
  'public/models/chars/players/ranger_hit_variety_anims.glb',
  'public/models/chars/players/rogue_hit_variety_anims.glb',
  'public/models/chars/players/mage_hit_variety_anims.glb',
  'public/models/chars/players/barbarian_hit_variety_anims.glb',
  'public/models/chars/players/druid_hit_variety_anims.glb',
  'public/models/chars/players/mage_classic_hit_variety_anims.glb',
  'public/models/chars/players/rogue_hooded_hit_variety_anims.glb',
  'public/models/chars/players/Mech/characters/CombatMech_hit_variety_anims.glb',
  'public/models/chars/enemies/skeleton_minion_hit_variety_anims.glb',
  'public/models/chars/enemies/skeleton_rogue_hit_variety_anims.glb',
  'public/models/chars/enemies/skeleton_warrior_hit_variety_anims.glb',
  'public/models/chars/enemies/skeleton_mage_hit_variety_anims.glb',
  'public/models/chars/enemies/necromancer_hit_variety_anims.glb',
];

const PALADIN_CLIPS = [
  'Cast_Verdict',
  'Cast_Consecrate',
  'Cast_HammerBash',
  'Cast_Ward',
  'Cast_Blessing',
  'Cast_HolyMend',
];

const ROGUE_NEW_CLIPS = [
  'Rogue_Quick_Strike',
  'Rogue_Backstab',
  'Rogue_Ambush',
  'Rogue_Low_Blow',
  'Rogue_Finisher_Slash',
];
// Pre-existing bespoke clips (an earlier, unrelated generation) baked
// directly into rogue.glb itself: this batch must not touch or duplicate
// them, only add alongside.
const ROGUE_PRIOR_CLIPS = ['Garrote_Choke', 'Kick_A', 'Dirt_Throw'];
// Already-shipped rogue.glb clips this batch reuses with no baking (a
// defensive guard and a raise gesture, the same no-bake pattern player_
// warrior's raised_guard/sanguine_aura and the hunter batch's aspect
// toggles use).
const ROGUE_NOBAKE_CLIPS = ['Block', 'Spellcast_Raise'];

const SHAMAN_CAST_CLIPS = ['Cast_Bolt', 'Cast_Shock', 'Cast_Heal', 'Cast_Quake', 'Storm_Strike'];

const WARLOCK_CAST_CLIPS = [
  'Warlock_Cast_Shadow',
  'Warlock_Cast_Fire',
  'Warlock_Cast_Drain',
  'Warlock_Cast_Burst',
];

const WARRIOR_NEW_CLIPS = ['Warrior_Heroic_Leap', 'Warrior_Rush_Loop', 'Warrior_Onrush_Arrival'];

const WILDHEART_HIT_DONOR_GLBS = [
  'public/models/creatures/wildheart_stalker_hit_variety_anims.glb',
  'public/models/creatures/wildheart_ravager_hit_variety_anims.glb',
  'public/models/creatures/wildheart_hexcaller_hit_variety_anims.glb',
  'public/models/creatures/wildheart_beastmaster_hit_variety_anims.glb',
  'public/models/creatures/wildheart_high_priest_hit_variety_anims.glb',
];

// One row per shipped donor GLB, in the order of the former files: the exact clip
// list it carries, and whether its clips are compared in shipped order ('exact') or
// as a set ('sorted', the multi-clip class donors).
type DonorRow = [glbPath: string, clips: readonly string[], order: 'exact' | 'sorted'];
const exactly =
  (clips: readonly string[]) =>
  (glbPath: string): DonorRow => [glbPath, clips, 'exact'];

const DONOR_ROWS: DonorRow[] = [
  // batch1
  ['public/models/chars/players/mage_ability_anims.glb', MAGE_CAST_CLIPS, 'sorted'],
  ['public/models/creatures/elemental_ability_anims.glb', ['Elemental_Attack'], 'exact'],
  // bear
  ['public/models/creatures/bear_ability_anims.glb', ['Bear_Attack'], 'exact'],
  // biped14_hit_variety
  ...BIPED14_DONOR_GLBS.map(exactly(['HitReact_Heavy'])),
  // crab
  ['public/models/creatures/crab_ability_anims.glb', ['Crab_Attack'], 'exact'],
  // demon
  ['public/models/creatures/demon_ability_anims.glb', ['Demon_Attack'], 'exact'],
  // druid_dragonkin
  ['public/models/chars/players/druid_ability_anims.glb', DRUID_CAST_CLIPS, 'sorted'],
  ['public/models/creatures/dragonkin_ability_anims.glb', ['Dragonkin_Attack'], 'exact'],
  // enemy7_hit_variety
  ...ENEMY7_DONOR_GLBS.map(exactly(['HitRecieve_Heavy'])),
  // enemy_bite_hit_variety
  ...ENEMY_BITE_DONOR_GLBS.map(exactly(['HitRecieve_Dazed'])),
  // glub
  ['public/models/creatures/glub_ability_anims.glb', ['Glub_Attack'], 'exact'],
  // greyjaw
  ['public/models/creatures/greyjaw_ability_anims.glb', ['Greyjaw_Attack'], 'exact'],
  // hunter_ghost
  ['public/models/chars/players/hunter_ability_anims.glb', HUNTER_BAKED_CLIPS, 'sorted'],
  ['public/models/creatures/ghost_ability_anims.glb', ['Ghost_Attack'], 'exact'],
  // kaykit_hit_variety
  ...KAYKIT_DONOR_GLBS.map(exactly(['Hit_B_Stagger'])),
  // murloc
  ['public/models/creatures/murloc_ability_anims.glb', ['Murloc_Attack'], 'exact'],
  // paladin_undead
  ['public/models/chars/players/paladin_ability_anims.glb', PALADIN_CLIPS, 'sorted'],
  ['public/models/chars/enemies/skeleton_golem_anims.glb', ['Golem_Slam'], 'exact'],
  // rogue_troll
  ['public/models/chars/players/rogue_ability_anims.glb', ROGUE_NEW_CLIPS, 'sorted'],
  ['public/models/creatures/troll_ability_anims.glb', ['Troll_Smash'], 'exact'],
  // shaman_demonflying
  ['public/models/chars/players/shaman_ability_anims.glb', SHAMAN_CAST_CLIPS, 'sorted'],
  ['public/models/creatures/demon_flying_anims.glb', ['DemonFlying_Attack'], 'exact'],
  // skelboss_stag
  ['public/models/chars/enemies/skelboss_ability_anims.glb', ['SkelBoss_Attack'], 'exact'],
  ['public/models/creatures/stag_ability_anims.glb', ['Stag_Attack_Charge'], 'exact'],
  // treant
  ['public/models/creatures/treant_ability_anims.glb', ['Treant_Attack'], 'exact'],
  // warlock_nightkin
  ['public/models/chars/players/warlock_ability_anims.glb', WARLOCK_CAST_CLIPS, 'sorted'],
  ['public/models/creatures/nightkin_ability_anims.glb', ['Nightkin_Attack'], 'exact'],
  // warrior_kobold
  ['public/models/chars/players/warrior_ability_anims.glb', WARRIOR_NEW_CLIPS, 'exact'],
  ['public/models/creatures/kobold_ability_anims.glb', ['Kobold_Pounce'], 'exact'],
  // wildheart_hexcaller
  [
    'public/models/creatures/wildheart_hexcaller_ability_anims.glb',
    ['Wildheart_Hexcaller_Attack'],
    'exact',
  ],
  // wildheart_high_priest
  [
    'public/models/creatures/wildheart_high_priest_ability_anims.glb',
    ['Wildheart_High_Priest_Attack'],
    'exact',
  ],
  // wildheart_hit_stagger
  ...WILDHEART_HIT_DONOR_GLBS.map(exactly(['Hit_Stagger'])),
  // wildheart_ravager
  [
    'public/models/creatures/wildheart_ravager_ability_anims.glb',
    ['Wildheart_Ravager_Attack'],
    'exact',
  ],
  // wildheart_stalker
  [
    'public/models/creatures/wildheart_stalker_ability_anims.glb',
    ['Wildheart_Stalker_Attack'],
    'exact',
  ],
  // yeti
  ['public/models/creatures/yeti_ability_anims.glb', ['Yeti_Attack'], 'exact'],
];

describe('shipped donor GLBs (issue #2889)', () => {
  it.each(DONOR_ROWS)(
    '%s ships exactly its clips in a mesh-free donor GLB',
    (glbPath, clips, order) => {
      if (order === 'sorted') expect(clipNamesOf(glbPath).sort()).toEqual([...clips].sort());
      else expect(clipNamesOf(glbPath)).toEqual(clips);
      expect(meshCountOf(glbPath)).toBe(0);
    },
  );
});

// Batch 1: mage ability-specific spellcasts + the elemental family's bespoke attack
// (scripts/build_mage_ability_anims.mjs, scripts/build_elemental_anims.mjs).
describe('batch1', () => {
  describe('mage ability-specific spellcasts (issue #2889 batch 1)', () => {
    it('wires the donor GLB and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_mage: swims({', 'player_warlock: swims({');
      expect(block).toContain('mage_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of MAGE_CAST_CLIPS) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real mage ability, and every referenced clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_mage: swims({', 'player_warlock: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      expect(rows.length).toBeGreaterThan(15); // catches a wholesale accidental deletion
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(
          MAGE_CAST_CLIPS,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped clip`,
        ).toContain(clip);
      }
      // Polymorph names its own clip; the three point-blank AoE bursts share Cast_Nova.
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      expect(map.polymorph).toBe('Cast_Polymorph');
      expect(map.frost_nova).toBe('Cast_Nova');
      expect(map.arcane_explosion).toBe('Cast_Nova');
      expect(map.dragons_breath).toBe('Cast_Nova');
    });
  });

  describe('elemental family bespoke attack (issue #2889 batch 1)', () => {
    it('gives mob_elemental its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const elementalBlock = manifestBlock('mob_elemental: {', 'mob_water_elemental: {');
      expect(elementalBlock).toContain('elemental_ability_anims.glb');
      expect(elementalBlock).toContain('clips: ELEMENTAL_FLOATING');
      expect(elementalBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: the families sharing it by
      // reference must be untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");

      // Every other VisualDef still pointing at the shared constant is untouched
      // by THIS migration. The exact count also reflects any other family this
      // same batched initiative (issue #2889) has since migrated off FLOATING:
      // 9 originally, minus the one migrated to ELEMENTAL_FLOATING here, minus
      // the ghost family's own follow-up migration to GHOST_FLOATING
      // (the hunter_ghost block, stacked on this same batch), minus the
      // nightkin family's migration to NIGHTKIN_FLOATING (the warlock_nightkin
      // block), minus the glub family's migration to GLUB_FLOATING by a later
      // round-2 PR (issue #2889, mob_glub's own Glub_Attack: see the glub
      // block), minus the dragonkin family's migration to DRAGONKIN_FLOATING
      // (the druid_dragonkin block), minus the flying demon family's own
      // migration to DEMON_FLYING_FLOATING (the shaman_demonflying block,
      // stacked on this same batch), leaves 3 remaining direct
      // `clips: FLOATING,` usages. This pin tracks this branch's own state, not
      // a repo-wide invariant other batches must hold to.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });
  });
});

// Area B (issue #2889 round 2): mob_bear's bespoke "ground-swipe maul" attack
// (scripts/build_bear_anims.mjs).
describe('bear', () => {
  describe('bear family bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_bear its own ClipMap instead of mutating the shared BIPED14 constant', () => {
      const bearBlock = manifestBlock('mob_bear: {', 'mob_yeti: {');
      expect(bearBlock).toContain('bear_ability_anims.glb');
      expect(bearBlock).toContain('clips: BEAR_BIPED14');
      expect(bearBlock).not.toContain('clips: BIPED14,');

      // BIPED14 itself (the constant definition, not a VisualDef using it)
      // must still read the original shared attack.
      const bipedConstBlock = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(bipedConstBlock).toContain("attack: ['Punch', 'Weapon']");

      // No remaining direct `clips: BIPED14,` usages (6 originally: mob_bear,
      // mob_yeti, mob_murloc, mob_troll, mob_demon, mob_demonalt, all now
      // migrated to their own bespoke ClipMap: BEAR_BIPED14 above,
      // TROLL_BIPED14, YETI_BIPED14, MURLOC_BIPED14, and DEMON_BIPED14 for
      // both mob_demon and mob_demonalt, #2889).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: BIPED14,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});

// BIPED14 hit-reaction stagger (issue #2889 round 2, Area C): HitReact_Heavy,
// authored off each rig's own HitReact/Duck/Idle donor poses
// (scripts/build_biped14_hit_variety_anims.mjs).
describe('biped14_hit_variety', () => {
  describe('BIPED14 hit-reaction stagger (issue #2889 round 2)', () => {
    it("adds HitReact_Heavy to BIPED14's hit array without touching its other fields", () => {
      const block = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(block).toContain("hit: ['HitReact', 'HitReact_Heavy']");
      expect(block).toContain("idle: 'Idle'");
      expect(block).toContain("walk: 'Walk'");
      expect(block).toContain("run: 'Run'");
      expect(block).toContain("attack: ['Punch', 'Weapon']");
      expect(block).toContain("death: 'Death'");
    });

    it('wires a matching animUrls entry onto every BIPED14 consumer', () => {
      const consumers: [string, string][] = [
        ['mob_bear', 'yetialt_hit_variety_anims.glb'],
        ['mob_yeti', 'yetialt_hit_variety_anims.glb'],
        ['mob_murloc', 'frog_hit_variety_anims.glb'],
        ['mob_troll', 'orc_hit_variety_anims.glb'],
        ['mob_demon', 'demonalt_hit_variety_anims.glb'],
        ['mob_demonalt', 'demonalt_hit_variety_anims.glb'],
      ];
      for (const [key, file] of consumers) {
        const block = visualDefBlock(key);
        // mob_troll, mob_yeti, mob_murloc, mob_bear, mob_demon, and
        // mob_demonalt each wire their own `{ ...BIPED14, attack: [...] }`
        // variant (TROLL_BIPED14, YETI_BIPED14, MURLOC_BIPED14, BEAR_BIPED14,
        // DEMON_BIPED14, issue #2889): each inherits BIPED14's hit array
        // unchanged, so they still qualify as BIPED14 consumers for
        // HitReact_Heavy.
        const BIPED14_VARIANTS: Record<string, string> = {
          mob_troll: 'TROLL_BIPED14',
          mob_yeti: 'YETI_BIPED14',
          mob_murloc: 'MURLOC_BIPED14',
          mob_bear: 'BEAR_BIPED14',
          mob_demon: 'DEMON_BIPED14',
          mob_demonalt: 'DEMON_BIPED14',
        };
        const clipsOk = block.includes(`clips: ${BIPED14_VARIANTS[key] ?? 'BIPED14'}`);
        expect(clipsOk, key).toBe(true);
        expect(block, `${key} animUrls`).toContain(file);
      }
      // Exactly 6 BIPED14-family consumers touched: a stray extra or missing
      // wiring changes this count. Scoped to this family's own donor
      // basenames rather than every `_hit_variety_anims.glb` in the manifest,
      // since unrelated families (KayKit's kaykit()/skeletonClips(),
      // ENEMY_BITE/CRAB_ENEMY_BITE, the enemy7 hit-variety batch, etc, issue
      // #2889) land their own donors independently and would otherwise break
      // this pin.
      const occurrences = [
        ...MANIFEST_SRC.matchAll(/(?:yetialt|frog|orc|demonalt)_hit_variety_anims\.glb/g),
      ].length;
      expect(occurrences).toBe(6);
    });
  });
});

// mob_crab's bespoke attack (issue #2889 round 2, scripts/build_crab_anims.mjs).
describe('crab', () => {
  describe('mob_crab bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_crab its own ClipMap instead of mutating the shared ENEMY_BITE constant', () => {
      const crabBlock = manifestBlock('mob_crab: {', 'mob_bull: {');
      expect(crabBlock).toContain('crab_ability_anims.glb');
      expect(crabBlock).toContain('clips: CRAB_ENEMY_BITE');
      expect(crabBlock).not.toContain('clips: ENEMY_BITE,');

      // ENEMY_BITE itself (the constant definition, not a VisualDef using it)
      // must still read the original shared attack: mob_treant, the other
      // family sharing it by reference, must be untouched by this change.
      const enemyBiteConstBlock = manifestBlock('const ENEMY_BITE: ClipMap = {', '};');
      expect(enemyBiteConstBlock).toContain("attack: ['Bite_Front']");

      // Exactly 0 remaining direct `clips: ENEMY_BITE,` usages (2 as of this
      // branch's base off upstream/release/v0.35.0: mob_treant was migrated to
      // TREANT_ENEMY_BITE in parallel, and mob_crab is migrated to
      // CRAB_ENEMY_BITE above).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: ENEMY_BITE,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});

// Area B (issue #2889 round 2): the warlock demon pet family's (mob_demon +
// mob_demonalt) bespoke "nod-and-slash" attack (scripts/build_demon_anims.mjs).
describe('demon', () => {
  describe('warlock demon pet family bespoke attack (issue #2889 round 2)', () => {
    it('gives BOTH mob_demon and mob_demonalt the shared new ClipMap instead of mutating BIPED14', () => {
      const demonBlock = manifestBlock('mob_demon: {', 'mob_demon_flying: {');
      expect(demonBlock).toContain('demon_ability_anims.glb');
      expect(demonBlock).toContain('clips: DEMON_BIPED14');
      expect(demonBlock).not.toContain('clips: BIPED14,');

      const demonaltBlock = manifestBlock('mob_demonalt: {', 'delve_skel_wraith: {');
      expect(demonaltBlock).toContain('demon_ability_anims.glb');
      expect(demonaltBlock).toContain('clips: DEMON_BIPED14');
      expect(demonaltBlock).not.toContain('clips: BIPED14,');

      // BIPED14 itself (the constant definition, not a VisualDef using it)
      // must still read the original shared attack.
      const bipedConstBlock = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(bipedConstBlock).toContain("attack: ['Punch', 'Weapon']");

      // No remaining direct `clips: BIPED14,` usages. mob_troll, mob_yeti,
      // mob_murloc, and mob_bear already moved to their own TROLL_BIPED14 /
      // YETI_BIPED14 / MURLOC_BIPED14 / BEAR_BIPED14 clip maps, and
      // mob_demon / mob_demonalt are the TWO migrated to DEMON_BIPED14 above.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: BIPED14,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});

// Druid caster-side ability-specific spellcasts + the dragonkin family's bespoke
// attack, stacked on batch 1 (#2954) (scripts/build_druid_ability_anims.mjs,
// scripts/build_dragonkin_anims.mjs).
describe('druid_dragonkin', () => {
  describe('druid caster-side ability-specific spellcasts (issue #2889)', () => {
    it('wires the donor GLB and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_druid: swims({', 'player_mech: swims({');
      expect(block).toContain('druid_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of DRUID_CAST_CLIPS) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real druid ability, and every referenced clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_druid: swims({', 'player_mech: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      expect(rows.length).toBe(13);
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(ABILITIES[abilityId]?.class, `'${abilityId}' is not a druid ability`).toBe('druid');
        expect(
          DRUID_CAST_CLIPS,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped clip`,
        ).toContain(clip);
      }
      // Primary signal is school (nature vs arcane); heal, root/CC, and channel
      // roles are the named exceptions within the nature school.
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      expect(map.moonfire).toBe('Cast_Starfall');
      expect(map.starfire).toBe('Cast_Starfall');
      expect(map.healing_touch).toBe('Cast_Nurture');
      expect(map.regrowth).toBe('Cast_Nurture');
      expect(map.rejuvenation).toBe('Cast_Nurture');
      expect(map.entangling_roots).toBe('Cast_Roots');
      expect(map.hibernate).toBe('Cast_Roots');
      expect(map.hurricane).toBe('Cast_Storm');
      expect(map.wrath).toBe('Cast_Nature');
    });
  });

  describe('dragonkin family bespoke attack (issue #2889)', () => {
    it('gives mob_dragonkin its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const dragonkinBlock = manifestBlock('mob_dragonkin: {', 'mob_dragonkin_broodlord: {');
      expect(dragonkinBlock).toContain('dragonkin_ability_anims.glb');
      expect(dragonkinBlock).toContain('clips: DRAGONKIN_FLOATING');
      expect(dragonkinBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: the other families sharing it
      // by reference (after batch 1's elemental migration, the ghost and
      // nightkin follow-ups, and this batch's dragonkin migration) must be
      // untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");

      // Every other VisualDef still pointing at the shared constant is
      // untouched: exactly 3 remaining direct `clips: FLOATING,` usages (9
      // originally, minus batch 1's elemental migration, minus the ghost,
      // nightkin, round-2 glub, and flying demon follow-up migrations, minus
      // this batch's dragonkin migration).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });

    it('does not touch the mage or elemental object literals from batch 1', () => {
      // Disjointness guard: this batch's manifest edits must not clash with
      // batch 1's (#2954) player_mage / mob_elemental blocks, or the other two
      // in-flight batches' player_paladin / mob_undead and player_hunter /
      // mob_ghost families.
      const mageBlock = manifestBlock('player_mage: swims({', 'player_warlock: swims({');
      expect(mageBlock).not.toContain('druid_ability_anims.glb');
      expect(mageBlock).not.toContain('Cast_Nature');

      const elementalBlock = manifestBlock('mob_elemental: {', 'mob_water_elemental: {');
      expect(elementalBlock).not.toContain('dragonkin_ability_anims.glb');
      expect(elementalBlock).toContain('clips: ELEMENTAL_FLOATING');
    });
  });
});

// ENEMY7 hit-reaction stagger (issue #2889 round 2, Area C): HitRecieve_Heavy,
// authored off each rig's own Idle/HitRecieve donor poses
// (scripts/build_enemy7_hit_variety_anims.mjs).
describe('enemy7_hit_variety', () => {
  describe('ENEMY7 hit-reaction stagger (issue #2889 round 2)', () => {
    it("adds HitRecieve_Heavy to ENEMY7's hit array without touching its other fields", () => {
      const block = manifestBlock('const ENEMY7: ClipMap = {', '};');
      expect(block).toContain("hit: ['HitRecieve', 'HitRecieve_Heavy']");
      expect(block).toContain("idle: 'Idle'");
      expect(block).toContain("walk: 'Walk'");
      expect(block).toContain("run: 'Run'");
      expect(block).toContain("attack: ['Attack']");
      expect(block).toContain("death: 'Death'");
    });

    it('wires a matching animUrls entry onto every ENEMY7 consumer', () => {
      const consumers: [string, string, string][] = [
        // mob_kobold is the only consumer left, from BOTH sides of the v0.39.0
        // merge. mob_ogre took its own authored body and Hit clip (so the giant
        // donor retired with it), and upstream cut mob_grix's animUrls outright
        // because the goblin donor's tracks bind nothing on his mixamorig rig
        // (see the GRIX ClipMap comment, and note his hit slot is now empty).
        ['mob_kobold', 'goblin_hit_variety_anims.glb', 'clips: KOBOLD_ENEMY7'],
      ];
      for (const [key, file, clipsLine] of consumers) {
        const block = visualDefBlock(key);
        expect(block, key).toContain(clipsLine);
        expect(block, `${key} animUrls`).toContain(file);
      }
      // The two authored mixamorig drops (kobold.glb, grix.glb) must NOT consume
      // the goblin-rig donor: its tracks target Head/Arm.L/Arm.R/Body, none of
      // which exist on a mixamorig skeleton, so on these bodies the clip
      // resolved by name and bound nothing, freezing the rig mid-pose on every
      // hit taken (the Grix the Tunnelking statue). The binding gate in
      // tests/character_clipmaps.test.ts owns the general rule; these pins keep
      // the two known-bad wirings from quietly returning.
      const nonConsumers: [string, string][] = [
        ['mob_kobold_digger', 'clips: KOBOLD_DIGGER'],
        ['mob_grix', 'clips: GRIX'],
      ];
      for (const [key, clipsLine] of nonConsumers) {
        const block = visualDefBlock(key);
        expect(block, key).toContain(clipsLine);
        expect(block, `${key} must not wire the goblin-rig donor`).not.toContain(
          'goblin_hit_variety_anims.glb',
        );
      }
      // Scoped to this family's own donor basenames: an unscoped
      // `_hit_variety_anims.glb` count also picks up unrelated families
      // (e.g. BIPED14's yetialt/frog/orc/demonalt donors) whenever they land
      // their own hit-variety clips, which happens constantly in this repo.
      //
      // And anchored to the `${CREATURES}/` template prefix every real wiring is
      // written with, so this counts CODE and not prose: the kobold/grix defs
      // carry comments that NAME the goblin donor while explaining their wiring,
      // and a bare-basename count would tally those sentences as consumers.
      const occurrences = [
        ...MANIFEST_SRC.matchAll(/\$\{CREATURES\}\/goblin_hit_variety_anims\.glb/g),
      ].length;
      expect(occurrences).toBe(consumers.length);
    });
  });
});

// ENEMY_BITE hit-reaction stagger (issue #2889 round 2, Area C): HitRecieve_Dazed,
// authored off each rig's own HitRecieve/Dance/Idle donor poses
// (scripts/build_enemy_bite_hit_variety_anims.mjs).
describe('enemy_bite_hit_variety', () => {
  describe('ENEMY_BITE hit-reaction stagger (issue #2889 round 2)', () => {
    it("adds HitRecieve_Dazed to ENEMY_BITE's hit array without touching its other fields", () => {
      const block = manifestBlock('const ENEMY_BITE: ClipMap = {', '};');
      expect(block).toContain("hit: ['HitRecieve', 'HitRecieve_Dazed']");
      expect(block).toContain("idle: 'Idle'");
      expect(block).toContain("walk: 'Walk'");
      expect(block).toContain("run: 'Walk'");
      expect(block).toContain("attack: ['Bite_Front']");
      expect(block).toContain("death: 'Death'");
    });

    it('wires a matching animUrls entry onto both ENEMY_BITE consumers', () => {
      const consumers: [string, string][] = [
        ['mob_crab', 'crabenemy_hit_variety_anims.glb'],
        ['mob_treant', 'yeti_hit_variety_anims.glb'],
      ];
      for (const [key, file] of consumers) {
        const block = visualDefBlock(key);
        // mob_crab wires its own CRAB_ENEMY_BITE and mob_treant its own
        // TREANT_ENEMY_BITE (both `{ ...ENEMY_BITE, attack: [...] }`, issue
        // #2889): each inherits ENEMY_BITE's hit array unchanged, so both still
        // qualify as ENEMY_BITE consumers for HitRecieve_Dazed.
        const ENEMY_BITE_VARIANTS: Record<string, string> = {
          mob_crab: 'CRAB_ENEMY_BITE',
          mob_treant: 'TREANT_ENEMY_BITE',
        };
        const clipsOk = block.includes(`clips: ${ENEMY_BITE_VARIANTS[key] ?? 'ENEMY_BITE'}`);
        expect(clipsOk, key).toBe(true);
        expect(block, `${key} animUrls`).toContain(file);
      }
      // Exactly 2 ENEMY_BITE consumers wire a hit-variety donor GLB: a stray
      // extra or missing wiring on either family changes this count. (Other
      // BIPED14 families independently wire their own `_hit_variety_anims.glb`
      // donors in the same batch, issue #2889, so this only counts ENEMY_BITE
      // consumers, not every `_hit_variety_anims.glb` occurrence repo-wide.)
      const occurrences = [
        ...MANIFEST_SRC.matchAll(/clips: (ENEMY_BITE|CRAB_ENEMY_BITE|TREANT_ENEMY_BITE),/g),
      ].length;
      expect(occurrences).toBe(2);
    });
  });
});

// Area B (issue #2889 round 2): mob_glub's bespoke "spore burst" attack
// (scripts/build_glub_anims.mjs).
describe('glub', () => {
  describe('glub family bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_glub its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const glubBlock = manifestBlock('mob_glub: {', 'mob_crab: {');
      expect(glubBlock).toContain('glub_ability_anims.glb');
      expect(glubBlock).toContain('clips: GLUB_FLOATING');
      expect(glubBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it)
      // must still read the original shared attack: the other families
      // sharing it by reference must be untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");

      // Exactly 3 remaining direct `clips: FLOATING,` usages: mob_choir_thrall,
      // mob_glimmerwisp, mob_duskwisp.
      // mob_nightkin, mob_ghost, mob_demon_flying, and mob_dragonkin already
      // migrated off FLOATING on this branch's base; mob_glub migrates off it
      // above.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });
  });
});

// greyjaw's bespoke attack (issue #2889 round 2, scripts/build_greyjaw_anims.mjs).
describe('greyjaw', () => {
  describe('greyjaw bespoke attack (issue #2889 round 2)', () => {
    it('gives greyjaw its own ClipMap instead of mutating the shared WOLF_BAKED constant', () => {
      const greyjawBlock = manifestBlock('greyjaw: {', 'mob_boar: {');
      expect(greyjawBlock).toContain('greyjaw_ability_anims.glb');
      expect(greyjawBlock).toContain('clips: GREYJAW_WOLF');
      expect(greyjawBlock).not.toContain('clips: WOLF_BAKED,');

      // WOLF_BAKED itself (the constant definition) must still build off the
      // shared animal() core with the plain Attack: mob_wolf and form_cat, the
      // other two families sharing it by reference, must be untouched.
      const wolfBakedConstBlock = manifestBlock('const WOLF_BAKED: ClipMap = {', '};');
      expect(wolfBakedConstBlock).toContain("...animal(['Attack'])");

      // Exactly 2 remaining direct `clips: WOLF_BAKED,` usages (3 as of this
      // branch's base off upstream/release/v0.35.0, minus the one migrated to
      // GREYJAW_WOLF above): mob_wolf, form_cat.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: WOLF_BAKED,/g)].length;
      expect(remaining).toBe(2);
    });

    it('is attack-only: greyjaw already wires both hit-react clips via animal(), no hit-variety change needed', () => {
      const greyjawBlock = manifestBlock('greyjaw: {', 'mob_boar: {');
      expect(greyjawBlock).not.toContain('hit:');
      const wolfBakedConstBlock = manifestBlock('const WOLF_BAKED: ClipMap = {', '};');
      expect(wolfBakedConstBlock).not.toContain('hit:');
      const animalFactoryBlock = manifestBlock(
        'const animal = (attack: string[]): ClipMap => ({',
        '});',
      );
      expect(animalFactoryBlock).toContain("hit: ['Idle_HitReact_Left', 'Idle_HitReact_Right']");
    });
  });
});

// Hunter ability-specific attacks plus the ghost family's bespoke attack, stacked on
// batch 1 (scripts/build_hunter_ability_anims.mjs, scripts/build_ghost_anims.mjs).
describe('hunter_ghost', () => {
  describe('hunter ability-specific attacks (issue #2889 follow-up batch)', () => {
    it('wires both donor GLBs (the pre-existing bow_anims.glb and the new one) and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_hunter: swims({', 'player_rogue: swims({');
      expect(block).toContain('bow_anims.glb');
      expect(block).toContain('hunter_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of HUNTER_BAKED_CLIPS) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real hunter ability, and every referenced clip is shipped or an existing rig clip', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_hunter: swims({', 'player_rogue: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      expect(rows.length).toBeGreaterThan(10); // catches a wholesale accidental deletion
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(ABILITIES[abilityId]?.class, `'${abilityId}' is not a hunter ability`).toBe(
          'hunter',
        );
        expect(
          HUNTER_MAPPED_CLIPS,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped or existing clip`,
        ).toContain(clip);
      }
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      // The three melee abilities each get their own bespoke swing.
      expect(map.raptor_strike).toBe('Hunter_Melee_Gut');
      expect(map.mongoose_bite).toBe('Hunter_Melee_Counter');
      expect(map.wing_clip).toBe('Hunter_Melee_Clip');
      // Long Draw names the slow full-draw clip; Volley gets its own barrage.
      expect(map.aimed_shot).toBe('Hunter_Shot_LongDraw');
      expect(map.volley).toBe('Hunter_Shot_Volley');
      // The three aspects and Fevered Draw share the raw, unbaked Spellcast_Raise.
      expect(map.aspect_of_the_hawk).toBe('Spellcast_Raise');
      expect(map.aspect_of_the_monkey).toBe('Spellcast_Raise');
      expect(map.aspect_of_the_cheetah).toBe('Spellcast_Raise');
      expect(map.rapid_fire).toBe('Spellcast_Raise');
      // Pet-command channels have no combat swing to author.
      expect(map.tame_beast).toBeUndefined();
      expect(map.dismiss_pet).toBeUndefined();
      expect(map.revive_pet).toBeUndefined();
    });
  });

  describe('ghost family bespoke attack (issue #2889 follow-up batch)', () => {
    it('gives mob_ghost its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const ghostBlock = manifestBlock('mob_ghost: {', 'mob_glimmerwisp: {');
      expect(ghostBlock).toContain('ghost_ability_anims.glb');
      expect(ghostBlock).toContain('clips: GHOST_FLOATING');
      expect(ghostBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: every OTHER family sharing it by
      // reference (including the elemental's own already-migrated constant)
      // must be untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");
      const elementalConstBlock = manifestBlock('const ELEMENTAL_FLOATING: ClipMap = {', '};');
      expect(elementalConstBlock).toContain("attack: ['Elemental_Attack']");

      // The wisps (mob_glimmerwisp/mob_duskwisp) are unrigged bespoke meshes on
      // a DIFFERENT GLB where FLOATING simply no-ops; they, mob_choir_thrall
      // (a separate ghost.glb user), and every other FLOATING family stay on
      // the shared constant. 9 families shared FLOATING/ELEMENTAL_FLOATING
      // originally (batch 1's own pin); this batch migrates one more
      // (mob_ghost), and the nightkin family's own follow-up migration to
      // NIGHTKIN_FLOATING (the warlock_nightkin block) takes one more, and the
      // round-2 glub migration (the glub block) takes one more still, and the
      // dragonkin family's own follow-up migration to DRAGONKIN_FLOATING (the
      // druid_dragonkin block) takes one more, and the flying demon's own
      // migration to DEMON_FLYING_FLOATING (the shaman_demonflying block) takes
      // one more still, leaving 3 remaining direct `clips: FLOATING,` usages.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });
  });
});

// KayKit hit-reaction stagger (issue #2889 round 2, Area C): Hit_B_Stagger,
// authored off each rig's own Idle/Running_Strafe_Right donor poses
// (scripts/build_kaykit_hit_variety_anims.mjs).
describe('kaykit_hit_variety', () => {
  describe('KayKit hit-reaction stagger (issue #2889 round 2)', () => {
    it("adds Hit_B_Stagger to kaykit()'s hit array without touching its other fields", () => {
      const block = manifestBlock(
        "const kaykit = (attack: string[], idle = 'Idle'): ClipMap => ({",
        '});',
      );
      expect(block).toContain("hit: ['Hit_A', 'Hit_B_Stagger']");
      // Every other field stays exactly as before.
      expect(block).toContain("walk: 'Walking_A'");
      expect(block).toContain("run: 'Running_A'");
      expect(block).toContain("walkBack: 'Walking_Backwards'");
      expect(block).toContain("death: 'Death_A'");
      expect(block).toContain("cast: 'Spellcasting'");
      expect(block).toContain("sitDown: 'Sit_Floor_Down'");
      expect(block).toContain("sitIdle: 'Sit_Floor_Idle'");
      expect(block).toContain("swim: 'Lie_Idle'");
      expect(block).toContain("jump: 'Jump_Idle'");
      expect(block).toContain("stow: '1H_Melee_Attack_Chop'");
      expect(block).toContain('emote: KAYKIT_EMOTES');

      // skeletonLargeClips is a DIFFERENT factory sharing the visually similar
      // `hit: ['Hit_A'],` line; this task must not have touched it.
      const largeBlock = manifestBlock(
        'const skeletonLargeClips = (attack: string[]): ClipMap => ({',
        '});',
      );
      expect(largeBlock).toContain("hit: ['Hit_A'],");
      expect(largeBlock).not.toContain('Hit_B_Stagger');
    });

    it('wires a matching animUrls entry onto every kaykit()/skeletonClips() consumer', () => {
      // Count textual occurrences of exactly these 15 KayKit donor basenames
      // (a few, e.g. mage.glb, back multiple VisualDef entries, so this is not
      // the same as KAYKIT_DONOR_GLBS.length). Scoped to the KayKit family's own
      // donor filenames rather than every `_hit_variety_anims.glb` in the
      // manifest: other families (BIPED14/YETI_BIPED14/TROLL_BIPED14, ENEMY_BITE/
      // CRAB_ENEMY_BITE, etc, issue #2889) independently wire their own
      // hit-variety donors in the same batch and would otherwise inflate an
      // unscoped count every time one of them lands.
      const donorPattern = new RegExp(
        KAYKIT_DONOR_GLBS.map((p) => p.split('/').pop()).join('|'),
        'g',
      );
      const occurrences = [...MANIFEST_SRC.matchAll(donorPattern)].length;
      // 37 since the composed-NPC defs landed: the `npc_modular_<propSet>` loop
      // is one more kaykit() consumer, and it wires the rogue donor exactly as
      // this test requires (its bodies would otherwise have no Hit_B_Stagger).
      // One literal in the loop covers every derived def, so the count moved by
      // one rather than by the number of prop sets.
      expect(occurrences).toBe(37);

      // Spot-check the two entries that already had an animUrls array before
      // this task (must be APPENDED to, not overwritten).
      const hunterBlock = manifestBlock('player_hunter: swims({', 'player_rogue: swims({');
      expect(hunterBlock).toContain('bow_anims.glb');
      expect(hunterBlock).toContain('ranger_hit_variety_anims.glb');

      const mageBlock = manifestBlock('player_mage: swims({', 'player_warlock: swims({');
      expect(mageBlock).toContain('mage_ability_anims.glb');
      expect(mageBlock).toContain('mage_hit_variety_anims.glb');

      // Spot-check one skeleton-family entry.
      const bossBlock = manifestBlock('skel_boss: {', 'skel_necromancer: {');
      expect(bossBlock).toContain('skeleton_mage_hit_variety_anims.glb');
    });
  });
});

// Area B (issue #2889 round 2): mob_murloc's bespoke "slap/flop combo" attack
// (scripts/build_murloc_anims.mjs).
describe('murloc', () => {
  describe('murloc family bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_murloc its own ClipMap instead of mutating the shared BIPED14 constant', () => {
      const murlocBlock = manifestBlock('mob_murloc: {', 'mob_kobold: {');
      expect(murlocBlock).toContain('murloc_ability_anims.glb');
      expect(murlocBlock).toContain('clips: MURLOC_BIPED14');
      expect(murlocBlock).not.toContain('clips: BIPED14,');

      const bipedConstBlock = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(bipedConstBlock).toContain("attack: ['Punch', 'Weapon']");

      // No remaining direct `clips: BIPED14,` usages. mob_yeti, mob_troll,
      // mob_bear, and mob_demon / mob_demonalt already migrated off BIPED14
      // (to YETI_BIPED14, TROLL_BIPED14, BEAR_BIPED14, and DEMON_BIPED14
      // respectively); mob_murloc migrates off it above.
      const remaining = [...MANIFEST_SRC.matchAll(/clips: BIPED14,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});

// Paladin ability-specific clips + the skeleton golem's bespoke attack
// (scripts/build_paladin_ability_anims.mjs, scripts/build_skeleton_golem_anims.mjs).
describe('paladin_undead', () => {
  describe('paladin ability-specific clips (issue #2889 follow-up batch)', () => {
    it('wires the donor GLB and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_paladin: swims({', 'player_hunter: swims({');
      expect(block).toContain('paladin_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      // Cast_Verdict still ships in the donor but is unmapped on the composed
      // tree: its client (judgement) was retired by the Dawnreaver overhaul and
      // final_edict, its successor, carries the overhaul's own synthesized
      // Templars Verdict clip instead.
      const mappedDonorClips = PALADIN_CLIPS.filter((clip) => clip !== 'Cast_Verdict');
      for (const clip of mappedDonorClips) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real paladin ability, and every referenced clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_paladin: swims({', 'player_hunter: swims({'),
        /^\s*([a-z_]+): '([A-Za-z0-9_]+)',$/gm,
      );
      expect(rows.length).toBeGreaterThan(8); // catches a wholesale accidental deletion
      // A mapped clip is legal from any of the three real sources on the
      // composed tree: the #2889 donor GLB, the base paladin rig's own clips,
      // or the two overhaul clips synthesized at runtime
      // (paladin_templars_verdict_clip.ts / paladin_bastion_sweep_clip.ts).
      const rigClips = clipNamesOf('public/models/chars/players/paladin.glb');
      const legalClips = [
        ...PALADIN_CLIPS,
        ...rigClips,
        PALADIN_TEMPLARS_VERDICT_CLIP,
        PALADIN_BASTION_SWEEP_CLIP,
      ];
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(ABILITIES[abilityId]?.class, `'${abilityId}' is not a paladin ability`).toBe(
          'paladin',
        );
        expect(
          legalClips,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped or synthesized clip`,
        ).toContain(clip);
      }
      // Final Edict (judgement's overhaul successor) carries the synthesized
      // Templars Verdict clip; Consecration (the ground AoE) names its own
      // donor clip; the two defensive cooldowns share Cast_Ward and the
      // buff/aura abilities share Cast_Blessing.
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      expect(map.final_edict).toBe(PALADIN_TEMPLARS_VERDICT_CLIP);
      expect(map.bastion_sweep).toBe(PALADIN_BASTION_SWEEP_CLIP);
      expect(map.consecration).toBe('Cast_Consecrate');
      expect(map.hammer_of_justice).toBe('Cast_HammerBash');
      expect(map.divine_protection).toBe('Cast_Ward');
      expect(map.sacred_bulwark).toBe('Cast_Ward');
      expect(map.holy_light).toBe('Cast_HolyMend');
      expect(map.flash_of_light).toBe('Cast_HolyMend');
      expect(map.lay_on_hands).toBe('Cast_HolyMend');
    });
  });

  describe('skeleton golem bespoke attack (issue #2889 follow-up batch)', () => {
    it('gives skel_golem its own bespoke attack instead of the generic two-hand swing', () => {
      const golemBlock = manifestBlock('skel_golem: {', 'mob_bandit: {');
      expect(golemBlock).toContain('skeleton_golem_anims.glb');
      // The clips object OVERRIDES attack to the bespoke clip; the underlying
      // spread call still names the original generic pair it replaces (the
      // same shape ELEMENTAL_FLOATING uses over the shared FLOATING constant:
      // spread the old value, override just the changed field).
      expect(golemBlock).toContain(
        "...skeletonLargeClips(['2H_Melee_Attack_Chop', '1H_Melee_Attack_Chop'])",
      );
      expect(golemBlock).toContain("attack: ['Golem_Slam']");

      // skel_golem is the ONLY VisualDef calling skeletonLargeClips; the other
      // skeleton VisualDefs share the smaller 41-joint rig via skeletonClips()
      // instead and are untouched by this change.
      const largeClipsCallers = [
        ...MANIFEST_SRC.matchAll(/clips: \{\s*\.\.\.skeletonLargeClips\(/g),
      ].length;
      expect(largeClipsCallers).toBe(1);
      const skeletonClipsCallers = [...MANIFEST_SRC.matchAll(/clips: skeletonClips\(/g)].length;
      expect(skeletonClipsCallers).toBeGreaterThanOrEqual(10);
    });

    it('is wired to a real boss/rare mob (a dungeon final boss among them)', () => {
      const mobKeysBlock = manifestBlock('nythraxis_scourge_of_thornpeak:', '\n  ');
      expect(mobKeysBlock).toContain("'skel_golem'");
    });
  });
});

// The rest of the rogue's ability kit (beyond its existing garrote/kick/blind trio)
// plus mob_troll's bespoke attack (scripts/build_rogue_ability_anims.mjs,
// scripts/build_troll_anims.mjs).
describe('rogue_troll', () => {
  describe('rogue ability-specific attacks (issue #2889 rogue-troll batch)', () => {
    it('the pre-existing bespoke clips and the no-bake reuses are shipped in rogue.glb itself', () => {
      const names = clipNamesOf('public/models/chars/players/rogue.glb');
      for (const clip of [...ROGUE_PRIOR_CLIPS, ...ROGUE_NOBAKE_CLIPS]) {
        expect(names, `rogue.glb missing '${clip}'`).toContain(clip);
      }
    });

    it('wires the donor GLB and every new clip on player_rogue, leaving the prior 3 entries untouched', () => {
      const block = manifestBlock('player_rogue: swims({', 'player_priest: swims({');
      expect(block).toContain('rogue_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of ROGUE_NEW_CLIPS) expect(block).toContain(`'${clip}'`);
      // The 3 prior entries (an earlier, unrelated generation) are untouched.
      expect(block).toContain("garrote: 'Garrote_Choke'");
      expect(block).toContain("kick: 'Kick_A'");
      expect(block).toContain("blind: 'Dirt_Throw'");
    });

    it('every mapped ability id is a real rogue ability, and every referenced clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_rogue: swims({', 'player_priest: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      // 3 prior entries plus at least 10 new ones this batch adds.
      expect(rows.length).toBeGreaterThan(12);
      const knownClips = [...ROGUE_NEW_CLIPS, ...ROGUE_PRIOR_CLIPS, ...ROGUE_NOBAKE_CLIPS];
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(
          ABILITIES[abilityId]?.class,
          `attackByAbility key '${abilityId}' is not a rogue ability`,
        ).toBe('rogue');
        expect(
          knownClips,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped clip`,
        ).toContain(clip);
      }
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      // Representative spot-checks: the positional opener, the kit's biggest
      // stealth hit, and a combo-spending finisher land on distinct clips.
      expect(map.backstab).toBe('Rogue_Backstab');
      expect(map.ambush).toBe('Rogue_Ambush');
      expect(map.eviscerate).toBe('Rogue_Finisher_Slash');
      expect(map.rupture).toBe('Rogue_Finisher_Slash');
      expect(map.evasion).toBe('Block');
      expect(map.stealth).toBe('Spellcast_Raise');
      // instant_poison/deadly_poison (the weapon-imbue self-buffs) are
      // deliberately excluded from this batch, no entry at all.
      expect(map.instant_poison).toBeUndefined();
      expect(map.deadly_poison).toBeUndefined();
    });
  });

  describe('mob_troll bespoke attack (issue #2889 rogue-troll batch)', () => {
    it('gives mob_troll its own ClipMap instead of mutating the shared BIPED14 constant', () => {
      const trollBlock = manifestBlock('mob_troll: {', 'mob_ogre: {');
      expect(trollBlock).toContain('troll_ability_anims.glb');
      expect(trollBlock).toContain('clips: TROLL_BIPED14');
      expect(trollBlock).not.toContain('clips: BIPED14,');

      // BIPED14 itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: every other family sharing it
      // by reference must be untouched by this change.
      const biped14ConstBlock = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(biped14ConstBlock).toContain("attack: ['Punch', 'Weapon']");

      // mob_yeti, mob_murloc, mob_bear, and mob_demon were all later migrated
      // off the shared constant too (issue #2889 round 2, their own bespoke
      // attacks), completing the migration: no consumer references the raw
      // BIPED14 constant directly anymore, only via a spread into its own
      // derived per-family constant (TROLL_BIPED14, DEMON_BIPED14, etc).
      expect(MANIFEST_SRC).not.toContain('clips: BIPED14,');
    });
  });
});

// Shaman ability-specific spellcasts and the flying demon family's bespoke attack
// (scripts/build_shaman_ability_anims.mjs, scripts/build_demon_flying_anims.mjs).
describe('shaman_demonflying', () => {
  describe('shaman ability-specific spellcasts (issue #2889)', () => {
    it('wires the donor GLB and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_shaman: swims({', 'player_mage: swims({');
      expect(block).toContain('shaman_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of SHAMAN_CAST_CLIPS) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real shaman ability, and every referenced bespoke clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_shaman: swims({', 'player_mage: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      // 14 real shaman-tagged abilities exist in classes.ts (base kit plus the
      // Thundercall/Spiritcall spec signatures); this batch maps every one.
      expect(rows.length).toBe(14);
      for (const [, abilityId, clip] of rows) {
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(ABILITIES[abilityId]?.class, `'${abilityId}' is not a shaman ability`).toBe(
          'shaman',
        );
        const isBespoke = SHAMAN_CAST_CLIPS.includes(clip);
        const isNoBakeGesture = clip === 'Spellcast_Raise' || clip === 'Block';
        expect(
          isBespoke || isNoBakeGesture,
          `attackByAbility value '${clip}' for '${abilityId}' is neither a shipped bespoke clip nor a known no-bake gesture`,
        ).toBe(true);
      }
      // Every school-differentiated damage/heal spell gets its own bespoke
      // clip; the instant shocks share one gesture (VFX carries the school),
      // and the weapon imbues/short self buffs stay on existing gestures
      // (no swing to author).
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      expect(map.lightning_bolt).toBe('Cast_Bolt');
      expect(map.earth_shock).toBe('Cast_Shock');
      expect(map.flame_shock).toBe('Cast_Shock');
      expect(map.frost_shock).toBe('Cast_Shock');
      expect(map.healing_wave).toBe('Cast_Heal');
      expect(map.chain_heal).toBe('Cast_Heal');
      expect(map.earthquake).toBe('Cast_Quake');
      expect(map.stormstrike).toBe('Storm_Strike');
      expect(map.rockbiter_weapon).toBe('Spellcast_Raise');
      expect(map.flametongue_weapon).toBe('Spellcast_Raise');
      expect(map.frostbrand_weapon).toBe('Spellcast_Raise');
      expect(map.ghost_wolf).toBe('Spellcast_Raise');
      expect(map.elemental_mastery).toBe('Spellcast_Raise');
      expect(map.lightning_shield).toBe('Block');
    });
  });

  describe('mob_demon_flying bespoke attack (issue #2889)', () => {
    it('covers every donor channel, not just the No/Yes gesture subset (review #2961)', () => {
      // The initial timeline row must fall back to the merged P_all pose, not a
      // single donor pose: a channel only Punch (23 channels) contributes gets
      // dropped by bakeClip before the later ramps if the seed row's fallback
      // is missing it, even though those ramps do supply P_all. Regression for
      // that exact bug: the clip shipped with only 14 channels (No/Yes
      // coverage) instead of the full 24-channel donor union.
      const glbPath = 'public/models/creatures/demon_flying_anims.glb';
      expect(channelCountOf(glbPath, 'DemonFlying_Attack')).toBe(24);
    });

    it('gives mob_demon_flying its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const demonBlock = manifestBlock('mob_demon_flying: {', 'mob_alpaca: {');
      expect(demonBlock).toContain('demon_flying_anims.glb');
      expect(demonBlock).toContain('clips: DEMON_FLYING_FLOATING');
      expect(demonBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: every other family sharing it by
      // reference must be untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");

      // Every other VisualDef still pointing at the shared constant is
      // untouched: exactly 3 remaining direct `clips: FLOATING,` usages (9
      // originally across the whole multi-batch initiative, minus the
      // elemental's ELEMENTAL_FLOATING migration, the ghost's GHOST_FLOATING
      // migration, the nightkin's NIGHTKIN_FLOATING migration, the glub's
      // GLUB_FLOATING migration, the dragonkin's DRAGONKIN_FLOATING migration,
      // and the flying demon's own DEMON_FLYING_FLOATING migration here).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });
  });
});

// skel_boss's (Morthen the Gravecaller) bespoke ritual-strike attack plus mob_stag's
// bespoke charge attack (scripts/build_skelboss_anims.mjs, scripts/build_stag_anims.mjs).
describe('skelboss_stag', () => {
  describe('skel_boss bespoke attack (issue #2889)', () => {
    it('gives skel_boss its own attack instead of the shared skeletonClips() chop', () => {
      const bossBlock = manifestBlock('skel_boss: {', 'skel_necromancer: {');
      expect(bossBlock).toContain('skelboss_ability_anims.glb');
      expect(bossBlock).toContain('skeletonClips(');
      expect(bossBlock).toContain("attack: ['SkelBoss_Attack']");
      expect(bossBlock).not.toContain("clips: skeletonClips(['2H_Melee_Attack_Chop'], 'Taunt'),");

      // Every clip named on this VisualDef must be a real clip shipped by the
      // new donor GLB (catches a copy-paste stray).
      expect(clipNamesOf('public/models/chars/enemies/skelboss_ability_anims.glb')).toContain(
        'SkelBoss_Attack',
      );

      // skel_mage, the other VisualDef on the SAME skeleton_mage.glb rig
      // sharing skeletonClips()'s plain '2H_Melee_Attack_Chop' vocabulary, is
      // untouched.
      const mageBlock = manifestBlock('skel_mage: {', 'skel_boss: {');
      expect(mageBlock).toContain("clips: skeletonClips(['2H_Melee_Attack_Chop']),");
    });

    it('delve_skel_varric (the other Taunt-flourish skeleton_mage.glb boss) still shares the plain chop', () => {
      const varricBlock = manifestBlock('delve_skel_varric: {', 'skel_minion: {');
      expect(varricBlock).toContain("clips: skeletonClips(['2H_Melee_Attack_Chop'], 'Taunt'),");
      expect(varricBlock).not.toContain('SkelBoss_Attack');
    });
  });

  describe('mob_stag bespoke attack (issue #2889)', () => {
    it('gives mob_stag its own attack instead of the standing Headbutt/Kick pair', () => {
      const stagBlock = manifestBlock('mob_stag: {', 'mob_veiled_stag: {');
      expect(stagBlock).toContain('stag_ability_anims.glb');
      expect(stagBlock).toContain("attack: ['Stag_Attack_Charge']");
      expect(stagBlock).not.toContain("clips: animal(['Attack_Headbutt', 'Attack_Kick']),");
    });

    it('leaves the repainted rig siblings on the shared standing Headbutt/Kick pair', () => {
      // veiled_stag, gleamstag, veiled_doe and aurelhorn are the same Quaternius
      // rig re-skinned into separate GLB files, all calling animal() with the
      // identical array by convention. None of them share mob_stag's new clip.
      for (const [start, end] of [
        ['mob_veiled_stag: {', 'mob_gleamstag: {'],
        ['mob_gleamstag: {', 'mob_veiled_doe: {'],
        ['mob_aurelhorn: {', 'mob_training_dummy: {'],
      ]) {
        const block = manifestBlock(start, end);
        expect(block).toContain("clips: animal(['Attack_Headbutt', 'Attack_Kick']),");
        expect(block).not.toContain('Stag_Attack_Charge');
        expect(block).not.toContain('stag_ability_anims.glb');
      }
    });
  });

  describe('shared module reuse (issue #2889)', () => {
    it('both new build scripts import the shared pose_blend module, not a duplicate', () => {
      const skelboss = readFileSync(join(ROOT, 'scripts/build_skelboss_anims.mjs'), 'utf8');
      const stag = readFileSync(join(ROOT, 'scripts/build_stag_anims.mjs'), 'utf8');
      for (const src of [skelboss, stag]) {
        expect(src).toContain("from './anim/pose_blend.mjs'");
        expect(src).toContain('mergePoses');
      }
    });
  });

  // Neither new clip is dispatched by ability id (both are plain creature
  // attack-array overrides, not a class attackByAbility set), but ABILITIES
  // stays imported to match the shared contract-test shape used by sibling
  // batches and to catch an accidental future attackByAbility addition on
  // either VisualDef without a matching real ability id.
  describe('no stray attackByAbility on either VisualDef (issue #2889)', () => {
    it('skel_boss and mob_stag carry no attackByAbility overrides', () => {
      const bossBlock = manifestBlock('skel_boss: {', 'skel_necromancer: {');
      expect(bossBlock).not.toContain('attackByAbility');
      const stagBlock = manifestBlock('mob_stag: {', 'mob_veiled_stag: {');
      expect(stagBlock).not.toContain('attackByAbility');
      expect(Object.keys(ABILITIES).length).toBeGreaterThan(0);
    });
  });
});

// mob_treant's bespoke attack (issue #2889 round 2, scripts/build_treant_anims.mjs).
describe('treant', () => {
  describe('mob_treant bespoke attack (issue #2889 round 2)', () => {
    it('bakes all 4 donor channels, including the slam lean and the sway', () => {
      // yeti.glb's Idle donor only animates 2 of the 4 candidate channels
      // (Head|translation, Head3|rotation); Head|rotation is Bite_Front's
      // downward lean (the actual "slam"), Head2|rotation is Dance's sway.
      // Both must survive the bake, not just the 2 Idle already carries.
      const glbPath = 'public/models/creatures/treant_ability_anims.glb';
      const targets = channelTargetsOf(glbPath);
      expect(targets.sort()).toEqual(
        ['Head|translation', 'Head|rotation', 'Head2|rotation', 'Head3|rotation'].sort(),
      );
    });

    it('gives mob_treant its own ClipMap instead of mutating the shared ENEMY_BITE constant', () => {
      const treantBlock = manifestBlock('mob_treant: {', 'mob_demonalt: {');
      expect(treantBlock).toContain('treant_ability_anims.glb');
      expect(treantBlock).toContain('clips: TREANT_ENEMY_BITE');
      expect(treantBlock).not.toContain('clips: ENEMY_BITE,');

      // ENEMY_BITE itself (the constant definition, not a VisualDef using it)
      // must still read the original shared attack: mob_crab, the other
      // family sharing it by reference, must be untouched by this change.
      const enemyBiteConstBlock = manifestBlock('const ENEMY_BITE: ClipMap = {', '};');
      expect(enemyBiteConstBlock).toContain("attack: ['Bite_Front']");

      // Exactly 0 remaining direct `clips: ENEMY_BITE,` usages (2 as of this
      // branch's base off upstream/release/v0.35.0: mob_crab was migrated to
      // CRAB_ENEMY_BITE in parallel, and mob_treant is migrated to
      // TREANT_ENEMY_BITE above).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: ENEMY_BITE,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});

// Warlock ability-specific spellcasts + the nightkin family's bespoke attack
// (scripts/build_warlock_ability_anims.mjs, scripts/build_nightkin_anims.mjs).
describe('warlock_nightkin', () => {
  describe('warlock ability-specific spellcasts (issue #2889)', () => {
    it('wires the donor GLB and an attackByAbility override for every mapped ability', () => {
      const block = manifestBlock('player_warlock: swims({', 'player_druid: swims({');
      expect(block).toContain('warlock_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of WARLOCK_CAST_CLIPS) expect(block).toContain(`'${clip}'`);
    });

    it('every mapped ability id is a real warlock ability, and every referenced clip is shipped', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_warlock: swims({', 'player_druid: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_]+)',$/gm,
      );
      expect(rows.length).toBe(12); // catches a wholesale accidental deletion
      for (const [, abilityId, clip] of rows) {
        const ability = ABILITIES[abilityId];
        expect(ability, `attackByAbility key '${abilityId}' is not a real ability id`).toBeTruthy();
        expect(ability?.class, `attackByAbility key '${abilityId}' is not a warlock ability`).toBe(
          'warlock',
        );
        expect(
          WARLOCK_CAST_CLIPS,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped clip`,
        ).toContain(clip);
      }
      // Every non-pet warlock ability is mapped; the pet-summon channels
      // (summon_imp/voidwalker/succubus/felhunter/felguard/infernal/doomguard)
      // have no combat swing and stay unmapped.
      const map = Object.fromEntries(rows.map(([, id, clip]) => [id, clip]));
      expect(map.shadow_bolt).toBe('Warlock_Cast_Shadow');
      expect(map.corruption).toBe('Warlock_Cast_Shadow');
      expect(map.curse_of_agony).toBe('Warlock_Cast_Shadow');
      expect(map.immolate).toBe('Warlock_Cast_Fire');
      expect(map.searing_pain).toBe('Warlock_Cast_Fire');
      expect(map.rain_of_fire).toBe('Warlock_Cast_Fire');
      expect(map.drain_life).toBe('Warlock_Cast_Drain');
      expect(map.shadowburn).toBe('Warlock_Cast_Burst');
      expect(map.fear).toBe('Warlock_Cast_Burst');
      expect(map.life_tap).toBe('Warlock_Cast_Burst');
      expect(map.demon_skin).toBe('Warlock_Cast_Burst');
      expect(map.spell_lock).toBe('Warlock_Cast_Burst');
      // The seven pet-summon abilities stay on the default wand zap.
      for (const petAbility of [
        'summon_imp',
        'summon_voidwalker',
        'summon_succubus',
        'summon_felhunter',
        'summon_felguard',
        'summon_infernal',
        'summon_doomguard',
      ]) {
        expect(
          map[petAbility],
          `${petAbility} should not have an authored cast clip`,
        ).toBeUndefined();
      }
    });
  });

  describe('nightkin family bespoke attack (issue #2889)', () => {
    it('gives mob_nightkin its own ClipMap instead of mutating the shared FLOATING constant', () => {
      const nightkinBlock = manifestBlock('mob_nightkin: {', 'mob_ghost: {');
      expect(nightkinBlock).toContain('nightkin_ability_anims.glb');
      expect(nightkinBlock).toContain('clips: NIGHTKIN_FLOATING');
      expect(nightkinBlock).not.toContain('clips: FLOATING,');

      // FLOATING itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: every other family sharing it by
      // reference must be untouched by this change.
      const floatingConstBlock = manifestBlock('const FLOATING: ClipMap = {', '};');
      expect(floatingConstBlock).toContain("attack: ['Headbutt', 'Punch']");

      // Every other VisualDef still pointing at the shared constant is untouched
      // by THIS migration. The ghost family's own follow-up migration to
      // GHOST_FLOATING (the hunter_ghost block), the round-2 glub migration
      // (the glub block), the dragonkin family's own follow-up migration to
      // DRAGONKIN_FLOATING (the druid_dragonkin block), and the flying demon's
      // own migration to DEMON_FLYING_FLOATING (the shaman_demonflying block)
      // also land on this branch, leaving exactly 3 remaining direct
      // `clips: FLOATING,` usages (other batches migrating other members land
      // as separate PRs).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: FLOATING,/g)].length;
      expect(remaining).toBe(3);
    });
  });
});

// Warrior movement and native ability dispatch, plus the kobold family's own attack
// clip off the ENEMY7-sharing goblin.glb. Heroic Leap and Rush share the movement
// library; Gyre and Storm Bolt have native attack overrides. Shouts support authored
// gestures and retain an emote fallback when unmapped
// (scripts/build_warrior_ability_anims.mjs, scripts/build_kobold_anims.mjs).
describe('warrior_kobold', () => {
  describe('warrior bespoke movement clip (issue #2889 warrior/kobold batch)', () => {
    it('wires the donor GLB into animUrls and keeps every pre-existing attackByAbility entry', () => {
      const block = manifestBlock('player_warrior: swims({', 'player_paladin: swims({');
      expect(block).toContain('warrior_ability_anims.glb');
      expect(block).toContain('attackByAbility');
      for (const clip of WARRIOR_NEW_CLIPS) expect(block).toContain(`'${clip}'`);
      // Pre-existing entries from earlier PRs must survive this change untouched.
      const preExisting = [
        'mortal_strike',
        'execute',
        'slam',
        'red_harvest',
        'breachmaker',
        'shield_slam',
        'raging_gale',
        'bloodthirst',
        'cleave',
        'revenge',
        'thunder_clap',
        'faultline',
        'heroic_strike',
        'overpower',
        'hamstring',
        'sanguine_aura',
        'raised_guard',
        'pummel',
      ];
      for (const id of preExisting) expect(block).toContain(`${id}:`);
    });

    it('every mapped ability id is a real warrior ability, and every referenced clip is a shipped or pre-existing donor', () => {
      const rows = attackByAbilityRows(
        manifestBlock('player_warrior: swims({', 'player_paladin: swims({'),
        /^\s*([a-z_]+): '([A-Za-z_0-9]+)',$/gm,
      );
      expect(rows.length).toBeGreaterThan(23); // 18 pre-existing + this batch's 7 additions
      // Read the actual delivered libraries; a handwritten donor allowlist can
      // claim a missing clip exists and becomes stale when a new bake ships.
      const visual = VISUALS.player_warrior;
      const knightClips = new Set(
        [visual.url, ...(visual.animUrls ?? [])].flatMap((url) => clipNamesOf(join('public', url))),
      );
      const map: Record<string, string> = {};
      for (const [, abilityId, clip] of rows) {
        map[abilityId] = clip;
        expect(
          ABILITIES[abilityId],
          `attackByAbility key '${abilityId}' is not a real ability id`,
        ).toBeTruthy();
        expect(
          knightClips,
          `attackByAbility value '${clip}' for '${abilityId}' is not a shipped or pre-existing donor clip`,
        ).toContain(clip);
      }
      // This batch's real additions, spot-checked: every one verified to
      // actually reach playAttack (see the build script's header trace).
      expect(map.heroic_leap).toBe('Warrior_Heroic_Leap');
      expect(map.victory_rush).toBe('Warrior_Victory_Rush');
      expect(map.berserker_rage).toBe('Warrior_Seething_Fury');
      expect(map.recklessness).toBe('Warrior_Recklessness');
      expect(map.die_by_sword).toBe('Warrior_Sword_Guard');
      expect(map.avatar).toBe('Warrior_Avatar');
      expect(map.whirlwind).toBe('Warrior_Bladed_Gyre');
      expect(map.taunt).toBe('Warrior_Goad');
      expect(map.furious_mending).toBe('Warrior_Furious_Mending');
      expect(map.piercing_howl).toBe('Warrior_Piercing_Howl');
      expect(map.storm_bolt).toBe('Warrior_Storm_Bolt');
      expect(map.charge).toBe('Warrior_Rush_Loop');
      expect(map.intervene).toBe('Warrior_Rush_Loop');
      // Bladestorm remains a channel. All seven voices now have shipped native performances.
      expect(VISUALS.player_warrior.clips.castByAbility?.bladestorm).toBe(
        'Warrior_Bladestorm_Loop',
      );
      expect(map.bladestorm).toBeUndefined();
      for (const [id, clip] of Object.entries({
        battle_shout: 'Warrior_Iron_Bellow',
        demoralizing_shout: 'Warrior_Direhowl',
        emboldening_roar: 'Warrior_Emboldening_Roar',
        defiant_bellow: 'Warrior_Defiant_Bellow',
        rallying_cry: 'Warrior_Valor_Roar',
        intimidating_shout: 'Warrior_Intimidating_Shout',
      }))
        expect(map[id], `${id} owns its native voice performance`).toBe(clip);
    });
  });

  describe('heroic_leap and piercing_howl reach triggerAttack through the real selfCast gate', () => {
    // Regression for the CHANGES_REQUESTED review on PR #2964: both ids are
    // untargeted (targetId === sourceId), full-spec archetypes 'dash' and
    // 'shout' respectively, with no castFx of their own. Before this fix, the
    // selfCast gate in handleSpellfx only claimed ceremonial archetypes
    // (buff/summon/cc/heal/spirit) or TARGETED strike/cc/burst/shout utility,
    // so both fell through unclaimed and triggerAttack was never called, i.e.
    // no attackByAbility gesture ever played (heroic_leap's leap, piercing_howl's
    // Spellcast_Raise).
    function makePainter(hasGestureClip = true) {
      const triggerAttack = vi.fn();
      const playShoutAnim = vi.fn();
      const bakedAt = vi.fn();
      const fragmentsAt = vi.fn();
      const deps = {
        vfx: {
          shoutwave: vi.fn(),
          nova: vi.fn(),
          tick: vi.fn(),
          projectile: vi.fn(),
          lightningProjectile: vi.fn(),
          burst: vi.fn(),
          buffSwirl: vi.fn(),
          beam: vi.fn(),
        },
        fx: {
          anchorOf: () => ({ x: 0, y: 0, z: 0 }),
          groundYAt: () => 0,
          bakedAt,
          fragmentsAt,
          setDelegates: vi.fn(),
          warmSpiritsForClass: vi.fn(),
          windup: vi.fn().mockReturnValue(false),
          holdShell: vi.fn(),
          holdGroundAura: vi.fn().mockReturnValue(true),
          orbit: vi.fn().mockReturnValue(true),
          bodyGlow: vi.fn(),
          sleepEntity: vi.fn(),
          update: vi.fn(),
          sequenceInstant: vi.fn(),
        },
        anchor: () => ({ x: 0, y: 0, z: 0 }),
        spawnAoeRing: vi.fn(),
        triggerAttack,
        playShoutAnim,
        hasGestureClip: () => hasGestureClip,
      } as unknown as AbilityVfxDeps;
      const painter = new AbilityVfx(deps, () => 0);
      return { painter, triggerAttack, playShoutAnim, bakedAt, fragmentsAt };
    }

    it('claims heroic_leap selfCast and triggers its attack clip', () => {
      const { painter, triggerAttack, bakedAt, fragmentsAt } = makePainter();

      const claimed = painter.handleSpellfx({
        type: 'spellfx',
        sourceId: 1,
        targetId: 1,
        school: 'physical',
        fx: 'selfCast',
        ability: 'heroic_leap',
      } as never);

      expect(claimed).toBe(true);
      expect(triggerAttack).toHaveBeenCalledWith(1, 'heroic_leap');
      expect(bakedAt).toHaveBeenCalledTimes(2);
      expect(fragmentsAt).toHaveBeenCalledTimes(2);
    });

    it('dispatches Storm Bolt windup to its mapped native attack', () => {
      const { painter, triggerAttack } = makePainter();
      expect(
        painter.handleSpellfx({
          type: 'spellfx',
          sourceId: 1,
          targetId: 2,
          school: 'physical',
          fx: 'windup',
          ability: 'storm_bolt',
        } as never),
      ).toBe(true);
      expect(triggerAttack).toHaveBeenCalledExactlyOnceWith(1, 'storm_bolt');
    });

    it.each([
      'battle_shout',
      'demoralizing_shout',
      'emboldening_roar',
      'defiant_bellow',
      'rallying_cry',
      'intimidating_shout',
    ])('dispatches %s to its gesture or emote, never both', (ability) => {
      expect(ABILITIES[ability].castFx).toBe('shout');
      for (const hasGesture of [false, true]) {
        const { painter, triggerAttack, playShoutAnim } = makePainter(hasGesture);
        expect(
          painter.handleSpellfx({
            type: 'spellfx',
            sourceId: 1,
            targetId: 1,
            school: 'physical',
            fx: 'shout',
            ability,
          } as never),
        ).toBe(true);
        if (hasGesture) {
          expect(triggerAttack).toHaveBeenCalledExactlyOnceWith(1, ability);
          expect(playShoutAnim).not.toHaveBeenCalled();
        } else {
          expect(playShoutAnim).toHaveBeenCalledExactlyOnceWith(1);
          expect(triggerAttack).not.toHaveBeenCalled();
        }
      }
    });

    it('plays one native Intimidating Shout gesture across both authoritative cast phases', () => {
      for (const phases of [
        ['shout', 'nova'],
        ['nova', 'shout'],
      ]) {
        const { painter, triggerAttack, playShoutAnim } = makePainter();
        for (const fx of phases)
          expect(
            painter.handleSpellfx({
              type: 'spellfx',
              sourceId: 1,
              targetId: 1,
              school: 'physical',
              fx,
              ability: 'intimidating_shout',
            } as never),
          ).toBe(true);
        expect(triggerAttack).toHaveBeenCalledExactlyOnceWith(1, 'intimidating_shout');
        expect(playShoutAnim).not.toHaveBeenCalled();
      }
    });

    it('claims piercing_howl selfCast and triggers its attack clip', () => {
      const { painter, triggerAttack } = makePainter();

      const claimed = painter.handleSpellfx({
        type: 'spellfx',
        sourceId: 3,
        targetId: 3,
        school: 'physical',
        fx: 'selfCast',
        ability: 'piercing_howl',
      } as never);

      expect(claimed).toBe(true);
      expect(triggerAttack).toHaveBeenCalledWith(3, 'piercing_howl');
    });
  });

  describe('kobold family bespoke attack (issue #2889 warrior/kobold batch)', () => {
    it('gives mob_kobold its own ClipMap instead of mutating the shared ENEMY7 constant', () => {
      const kobold = manifestBlock('mob_kobold: {', 'mob_grubjaw: {');
      expect(kobold).toContain('kobold_ability_anims.glb');
      expect(kobold).toContain('clips: KOBOLD_ENEMY7');
      expect(kobold).not.toContain('clips: ENEMY7,');

      // ENEMY7 itself (the constant definition, not a VisualDef using it) must
      // still read the original shared attack: its remaining consumers
      // (mob_goblin, mob_kobold_digger) share the SAME constant by reference
      // and must be untouched by this change. mob_ogre, once the motivating
      // shared-by-reference case, now rides its own authored body and OGRE
      // ClipMap (ogre.glb), so the pin on it moved from ENEMY7 to OGRE.
      const enemy7ConstBlock = manifestBlock('const ENEMY7: ClipMap = {', '};');
      expect(enemy7ConstBlock).toContain("attack: ['Attack']");

      const ogreBlock = manifestBlock('mob_ogre: {', '};');
      expect(ogreBlock).toContain('clips: OGRE,');
    });
  });
});

// Wildheart Basin round 2 (issue #2889): the Sunbone Hexcaller's own bespoke
// attack/cast clip, off the rig's own Cast and Attack donors
// (scripts/build_wildheart_hexcaller_anims.mjs). mob_wildheart_hexcaller shared the
// literal TRIPO_BIPED_FULL_RIG ClipMap object, by reference, with the other 4
// Wildheart Basin mobs.
describe('wildheart_hexcaller', () => {
  describe('Sunbone Hexcaller bespoke attack/cast (issue #2889 round 2)', () => {
    it('gives mob_wildheart_hexcaller its own ClipMap (attack and cast) instead of mutating the shared TRIPO_BIPED_FULL_RIG constant', () => {
      const hexcallerBlock = manifestBlock(
        'mob_wildheart_hexcaller: {',
        'mob_wildheart_beastmaster: {',
      );
      expect(hexcallerBlock).toContain('wildheart_hexcaller_ability_anims.glb');
      expect(hexcallerBlock).toContain('clips: WILDHEART_HEXCALLER');
      expect(hexcallerBlock).not.toContain('clips: TRIPO_BIPED_FULL_RIG,');

      const hexcallerConstBlock = manifestBlock('const WILDHEART_HEXCALLER: ClipMap = {', '};');
      expect(hexcallerConstBlock).toContain("attack: ['Wildheart_Hexcaller_Attack']");
      expect(hexcallerConstBlock).toContain("cast: 'Wildheart_Hexcaller_Attack'");

      // TRIPO_BIPED_FULL_RIG itself (the constant definition, not a VisualDef using it) must
      // still read the original shared Attack and Cast clips: the other 4 Wildheart mobs
      // sharing it by reference must be untouched by this change.
      const rigConstBlock = manifestBlock('const TRIPO_BIPED_FULL_RIG: ClipMap = {', '};');
      expect(rigConstBlock).toContain("attack: ['Attack']");
      expect(rigConstBlock).toContain("cast: 'Cast'");

      // Every other VisualDef still pointing at the shared constant is untouched: exactly 1
      // remaining direct `clips: TRIPO_BIPED_FULL_RIG,` usage (mob_wildheart_beastmaster; 5
      // originally, minus the ones migrated to WILDHEART_HEXCALLER above, WILDHEART_STALKER,
      // WILDHEART_RAVAGER, and WILDHEART_HIGH_PRIEST, issue #2889 round 2).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: TRIPO_BIPED_FULL_RIG,/g)].length;
      expect(remaining).toBe(1);
    });
  });
});

// Wildheart Basin round 2 (issue #2889): Zulgar, Voice of the Basin's own bespoke
// attack/cast clip, off the rig's own Cast and Jump donors
// (scripts/build_wildheart_high_priest_anims.mjs). mob_wildheart_high_priest shared
// the literal TRIPO_BIPED_FULL_RIG ClipMap object, by reference, with the other 4
// Wildheart Basin mobs.
describe('wildheart_high_priest', () => {
  describe('Zulgar, Voice of the Basin bespoke attack/cast (issue #2889 round 2)', () => {
    it('gives mob_wildheart_high_priest its own ClipMap (attack and cast) instead of mutating the shared TRIPO_BIPED_FULL_RIG constant', () => {
      const highPriestBlock = manifestBlock('mob_wildheart_high_priest: {', 'mob_elemental: {');
      expect(highPriestBlock).toContain('wildheart_high_priest_ability_anims.glb');
      expect(highPriestBlock).toContain('clips: WILDHEART_HIGH_PRIEST');
      expect(highPriestBlock).not.toContain('clips: TRIPO_BIPED_FULL_RIG,');

      const highPriestConstBlock = manifestBlock('const WILDHEART_HIGH_PRIEST: ClipMap = {', '};');
      expect(highPriestConstBlock).toContain("attack: ['Wildheart_High_Priest_Attack']");
      expect(highPriestConstBlock).toContain("cast: 'Wildheart_High_Priest_Attack'");

      // TRIPO_BIPED_FULL_RIG itself (the constant definition, not a VisualDef using it) must
      // still read the original shared Attack and Cast clips: the other 4 Wildheart mobs
      // sharing it by reference must be untouched by this change.
      const rigConstBlock = manifestBlock('const TRIPO_BIPED_FULL_RIG: ClipMap = {', '};');
      expect(rigConstBlock).toContain("attack: ['Attack']");
      expect(rigConstBlock).toContain("cast: 'Cast'");

      // Every other VisualDef still pointing at the shared constant is untouched: exactly 1
      // remaining direct `clips: TRIPO_BIPED_FULL_RIG,` usage (mob_wildheart_beastmaster; 5
      // originally, minus the ones migrated to WILDHEART_STALKER, WILDHEART_RAVAGER,
      // WILDHEART_HEXCALLER, and WILDHEART_HIGH_PRIEST above).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: TRIPO_BIPED_FULL_RIG,/g)].length;
      expect(remaining).toBe(1);
    });
  });
});

// TRIPO_BIPED_FULL_RIG hit-reaction stagger (issue #2889 round 2, Area C): Hit_Stagger,
// authored off each rig's own Hit/Idle donor poses
// (scripts/build_wildheart_hit_stagger_anims.mjs). No unused bonus clips on these 5
// rigs, so the whole clip is a re-timed blend of donors already in use.
describe('wildheart_hit_stagger', () => {
  describe('TRIPO_BIPED_FULL_RIG hit-reaction stagger (issue #2889 round 2)', () => {
    it("adds Hit_Stagger to TRIPO_BIPED_FULL_RIG's hit array without touching its other fields", () => {
      const block = manifestBlock('const TRIPO_BIPED_FULL_RIG: ClipMap = {', '};');
      expect(block).toContain("hit: ['Hit', 'Hit_Stagger']");
      expect(block).toContain("idle: 'Idle'");
      expect(block).toContain("walk: 'Walk'");
      expect(block).toContain("run: 'Run'");
      expect(block).toContain("attack: ['Attack']");
      expect(block).toContain("death: 'Death'");
      expect(block).toContain("cast: 'Cast'");
      expect(block).toContain("jump: 'Jump'");
    });

    it('wires a matching animUrls entry onto every TRIPO_BIPED_FULL_RIG consumer', () => {
      // mob_wildheart_stalker, mob_wildheart_ravager, mob_wildheart_hexcaller, and
      // mob_wildheart_high_priest were each split onto their own clips const
      // (WILDHEART_STALKER / WILDHEART_RAVAGER / WILDHEART_HEXCALLER /
      // WILDHEART_HIGH_PRIEST) for their own attack clip; all spread
      // TRIPO_BIPED_FULL_RIG (including the shared Hit_Stagger hit array), so they
      // still count as consumers, just under their own clips constant.
      const consumers: [string, string, string][] = [
        [
          'mob_wildheart_stalker',
          'wildheart_stalker_hit_variety_anims.glb',
          'clips: WILDHEART_STALKER',
        ],
        [
          'mob_wildheart_ravager',
          'wildheart_ravager_hit_variety_anims.glb',
          'clips: WILDHEART_RAVAGER',
        ],
        [
          'mob_wildheart_hexcaller',
          'wildheart_hexcaller_hit_variety_anims.glb',
          'clips: WILDHEART_HEXCALLER',
        ],
        [
          'mob_wildheart_beastmaster',
          'wildheart_beastmaster_hit_variety_anims.glb',
          'clips: TRIPO_BIPED_FULL_RIG',
        ],
        [
          'mob_wildheart_high_priest',
          'wildheart_high_priest_hit_variety_anims.glb',
          'clips: WILDHEART_HIGH_PRIEST',
        ],
      ];
      for (const [key, file, clipsRef] of consumers) {
        const block = visualDefBlock(key);
        expect(block, key).toContain(clipsRef);
        expect(block, `${key} animUrls`).toContain(file);
      }
      // Exactly 5 Wildheart consumers touched (other rig families, e.g. yeti/frog/orc/demon,
      // ship their own unrelated *_hit_variety_anims.glb donors from other issues).
      const occurrences = [...MANIFEST_SRC.matchAll(/wildheart_\w+_hit_variety_anims\.glb/g)]
        .length;
      expect(occurrences).toBe(5);
    });
  });
});

// Wildheart Basin round 2 (issue #2889): the Bloodmane Ravager's own bespoke attack,
// off the rig's own Attack and Hit donors (scripts/build_wildheart_ravager_anims.mjs).
// mob_wildheart_ravager shared the literal TRIPO_BIPED_FULL_RIG ClipMap object, by
// reference, with the other 4 Wildheart Basin mobs.
describe('wildheart_ravager', () => {
  describe('Bloodmane Ravager bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_wildheart_ravager its own ClipMap instead of mutating the shared TRIPO_BIPED_FULL_RIG constant', () => {
      const ravagerBlock = manifestBlock('mob_wildheart_ravager: {', 'mob_wildheart_hexcaller: {');
      expect(ravagerBlock).toContain('wildheart_ravager_ability_anims.glb');
      expect(ravagerBlock).toContain('clips: WILDHEART_RAVAGER');
      expect(ravagerBlock).not.toContain('clips: TRIPO_BIPED_FULL_RIG,');

      // TRIPO_BIPED_FULL_RIG itself (the constant definition, not a VisualDef using it) must
      // still read the original shared Attack clip: the other 4 Wildheart mobs sharing it by
      // reference must be untouched by this change.
      const rigConstBlock = manifestBlock('const TRIPO_BIPED_FULL_RIG: ClipMap = {', '};');
      expect(rigConstBlock).toContain("attack: ['Attack']");

      // Every other VisualDef still pointing at the shared constant is untouched: exactly 1
      // remaining direct `clips: TRIPO_BIPED_FULL_RIG,` usage (mob_wildheart_beastmaster; 5
      // originally, minus the one migrated to WILDHEART_RAVAGER above, minus
      // mob_wildheart_stalker's, mob_wildheart_hexcaller's, and mob_wildheart_high_priest's
      // parallel migrations to WILDHEART_STALKER, WILDHEART_HEXCALLER, and
      // WILDHEART_HIGH_PRIEST, issue #2889 round 2).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: TRIPO_BIPED_FULL_RIG,/g)].length;
      expect(remaining).toBe(1);
    });
  });
});

// Wildheart Basin round 2 (issue #2889): the Vineclaw Stalker's own bespoke attack,
// off the rig's own Attack donor (scripts/build_wildheart_stalker_anims.mjs).
// mob_wildheart_stalker shared the literal TRIPO_BIPED_FULL_RIG ClipMap object, by
// reference, with the other 4 Wildheart Basin mobs.
describe('wildheart_stalker', () => {
  describe('Vineclaw Stalker bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_wildheart_stalker its own ClipMap instead of mutating the shared TRIPO_BIPED_FULL_RIG constant', () => {
      const stalkerBlock = manifestBlock('mob_wildheart_stalker: {', 'mob_wildheart_ravager: {');
      expect(stalkerBlock).toContain('wildheart_stalker_ability_anims.glb');
      expect(stalkerBlock).toContain('clips: WILDHEART_STALKER');
      expect(stalkerBlock).not.toContain('clips: TRIPO_BIPED_FULL_RIG,');

      // TRIPO_BIPED_FULL_RIG itself (the constant definition, not a VisualDef using it) must
      // still read the original shared Attack clip: the other 4 Wildheart mobs sharing it by
      // reference must be untouched by this change.
      const rigConstBlock = manifestBlock('const TRIPO_BIPED_FULL_RIG: ClipMap = {', '};');
      expect(rigConstBlock).toContain("attack: ['Attack']");

      // Every other VisualDef still pointing at the shared constant is untouched: exactly 1
      // remaining direct `clips: TRIPO_BIPED_FULL_RIG,` usage (mob_wildheart_beastmaster; 5
      // originally, minus the one migrated to WILDHEART_STALKER above, minus
      // mob_wildheart_hexcaller's, mob_wildheart_ravager's, and mob_wildheart_high_priest's
      // parallel migrations to WILDHEART_HEXCALLER, WILDHEART_RAVAGER, and
      // WILDHEART_HIGH_PRIEST, issue #2889 round 2).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: TRIPO_BIPED_FULL_RIG,/g)].length;
      expect(remaining).toBe(1);
    });
  });
});

// Area B (issue #2889 round 2): mob_yeti's bespoke "icy roar-and-swipe" attack
// (scripts/build_yeti_anims.mjs).
describe('yeti', () => {
  describe('yeti family bespoke attack (issue #2889 round 2)', () => {
    it('gives mob_yeti its own ClipMap instead of mutating the shared BIPED14 constant', () => {
      const yetiBlock = manifestBlock('mob_yeti: {', 'mob_spider: {');
      expect(yetiBlock).toContain('yeti_ability_anims.glb');
      expect(yetiBlock).toContain('clips: YETI_BIPED14');
      expect(yetiBlock).not.toContain('clips: BIPED14,');

      const bipedConstBlock = manifestBlock('const BIPED14: ClipMap = {', '};');
      expect(bipedConstBlock).toContain("attack: ['Punch', 'Weapon']");

      // No remaining direct `clips: BIPED14,` usages. mob_yeti moved to
      // YETI_BIPED14 above, mob_troll moved to TROLL_BIPED14 (issue #2889),
      // mob_murloc moved to MURLOC_BIPED14 (issue #2889 round 2), mob_bear
      // moved to BEAR_BIPED14, and mob_demon / mob_demonalt moved to
      // DEMON_BIPED14 (the warlock demon pet bespoke-attack change).
      const remaining = [...MANIFEST_SRC.matchAll(/clips: BIPED14,/g)].length;
      expect(remaining).toBe(0);
    });
  });
});
