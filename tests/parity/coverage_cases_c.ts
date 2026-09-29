// Coverage proof: each scenario must ACTUALLY fire its target subsystem (not just
// name it in a comment). These assertions inspect the live events + final state of
// a recorded run. If a future content change breaks a recipe, this fails loudly so
// the golden never silently stops exercising a system.
// Display-name literals follow the LOCKED NAME-MAP (authorized gate-text edit per the
// OPERATOR RULING, 2026-07-02, ip-refactor/02-WORKING-MEMORY.md); ability/aura IDS are frozen.
// Case block c of the coverage suite. The cases register through the `it`
// the parity runner passes in (run_scenarios.ts), which runs each one right
// after the gate case of the scenario it reads, on the SAME recording the
// gate compared with its golden (recording_cache.ts). Assertions are
// unchanged from the per-file suite they came from.

import { expect } from 'vitest';
import {
  HEROIC_DUNGEON_TUNING,
  HEROIC_MARK_ITEM_ID,
  NYTHRAXIS_HEROIC_COPPER,
} from '../../src/sim/content/dungeon_difficulty';
import { HEROIC_BOSS_LOOT } from '../../src/sim/content/heroic_loot';
import { heroicVariantId } from '../../src/sim/content/heroic_variants';
import { ITEMS } from '../../src/sim/data';
import { type CoverageIt, type Ev, entities, recordShared as record, run } from './recording_cache';
import { SCENARIOS } from './scenarios';

export function coverageCasesC(it: CoverageIt): void {
  it('mob_lifecycle: frenzy + death-throes arm/detonate + wild respawn (despawn adds) + dungeon stays dead', () => {
    const rec = run('mob_lifecycle');
    const n = rec.notes as Record<string, any>;
    const ev = rec.allEvents as Ev[];
    // frenzyPackmates: same-template hostile neighbors gained Pack Frenzy; the boar did not.
    expect(n.wolfBFrenzied).toBe(true);
    expect(n.wolfCFrenzied).toBe(true);
    expect(n.boarFrenzied).toBe(false);
    expect(
      ev.some(
        (e) =>
          e.type === 'log' && typeof e.text === 'string' && e.text.includes('flies into a frenzy'),
      ),
    ).toBe(true);
    // armDeathThroes armed the fuse (delay 1.5) + emitted the swell telegraph.
    expect(n.bogArmed).toBeCloseTo(1.5, 5);
    expect(
      ev.some(
        (e) => e.type === 'log' && typeof e.text === 'string' && e.text.includes('begins to swell'),
      ),
    ).toBe(true);
    // detonateCorpse fired once (timer -> Infinity), burst the in-radius player, logged the cloud.
    expect(n.bogDetonated).toBe(true);
    expect(
      ev.some(
        (e) =>
          e.type === 'log' && typeof e.text === 'string' && e.text.includes('bursts in a cloud of'),
      ),
    ).toBe(true);
    // respawnMob: the wild mob came back to life at its spawn point, idle, and despawnSummonedAdds dropped the add.
    expect(n.wildRespawned).toBe(true);
    expect(n.wildState).toBe('idle');
    expect(n.wildAtSpawn).toBe(true);
    expect(n.addDespawned).toBe(true);
    // the dungeon-x mob never respawned.
    expect(n.dungeonStaysDead).toBe(true);
  });

  it('targeting_markers: selectors set a target without arming auto-attack, marker set + death-strip', () => {
    const rec = run('targeting_markers');
    const sim = rec.sim as any;
    const aPid = rec.notes.aPid as number;
    const ae = sim.entities.get(aPid);
    // the tab / nearest / friendly selectors landed a target on the player...
    expect(typeof ae.targetId).toBe('number');
    // ...and friendly cycling never armed auto-attack.
    expect(ae.autoAttack).toBe(false);
    // the killed mob carried a mark before its death; clearEntityMarker stripped
    // exactly that mob's mark, while a still-live marked mob keeps its symbol.
    const marked = rec.notes.markedBeforeKill as Record<number, number>;
    const m2Id = rec.notes.m2Id as number;
    const m3Id = rec.notes.m3Id as number;
    expect(marked[m2Id]).toBeDefined(); // SKULL was on the (soon dead) mob
    const after = sim.markersFor(aPid);
    expect(after[m2Id]).toBeUndefined(); // death-strip removed the dead mob's mark
    expect(after[m3Id]).toBeDefined(); // a live mob's mark survives
    expect((rec.allEvents as Ev[]).some((e) => e.type === 'death')).toBe(true);
  });

  it('c4b_effect_dispatch: runEffects fans across sunder/aoe/finisher/fear/groundAoE/summon/form', () => {
    const rec = run('c4b_effect_dispatch');
    const ev = rec.allEvents as Ev[];
    const ents = entities(rec);
    // warrior sunder_armor: the sunder aura landed (or a miss event fired) on its mob.
    const warriorMob = ents.find(
      (e) => e.templateId === 'forest_wolf' && e.auras?.some((a: Ev) => a.kind === 'sunder'),
    );
    const sunderMiss = ev.some(
      (e) =>
        e.type === 'damage' &&
        e.kind === 'miss' &&
        typeof e.ability === 'string' &&
        e.ability.toLowerCase().includes('shear'),
    );
    expect(Boolean(warriorMob) || sunderMiss).toBe(true);
    // mage arcane_explosion: the per-target aoeDamage hit BOTH in-radius mobs.
    const aoeMobIds = rec.notes.aoeMobIds as number[];
    const arcaneTargets = new Set(
      ev
        .filter(
          (e) => e.type === 'damage' && e.school === 'arcane' && aoeMobIds.includes(e.targetId),
        )
        .map((e) => e.targetId),
    );
    expect(arcaneTargets.size).toBe(2);
    // rogue eviscerate: finisher dealt physical damage AND the combo-spend reset fired.
    const rogue = rec.notes.rogueId as number;
    expect(
      ev.some((e) => e.type === 'damage' && e.sourceId === rogue && e.school === 'physical'),
    ).toBe(true);
    expect(ev.some((e) => e.type === 'comboPoint' && e.pid === rogue && e.points === 0)).toBe(true);
    // paladin consecration: holy damage came from the Paladin.
    const paladin = rec.notes.paladinId as number;
    expect(
      ev.some((e) => e.type === 'damage' && e.sourceId === paladin && e.school === 'holy'),
    ).toBe(true);
    // paladin consecration: a ground AoE was pushed (on-cast pulse path).
    expect((rec.sim as any).groundAoEs.length).toBeGreaterThanOrEqual(1);
    // warlock fear: the incapacitate aura landed on the warlock's mob (fear-angle draw).
    // Harrow is now a 5s fear, so the final snapshot can arrive after expiry.
    expect(rec.notes.warlockFearApplied).toBe(true);
    // warlock summon_imp: a pet now belongs to the warlock (summonDemon -> summonPet).
    expect(ents.some((e) => e.ownerId === rec.notes.warlockId)).toBe(true);
    // druid form switch: cat replaced bear (exclusive), read at the instant of
    // the switch because the Second Bloom that follows is a healing spell and
    // auto-unshifts out of cat (src/sim/combat/form_auto_unshift.ts).
    expect(rec.notes.druidCatFormActive).toBe(true);
    expect(rec.notes.druidBearFormStripped).toBe(true);
    // ...and that auto-unshift is what the closing state pins: no form left,
    // and the heal-over-time the cast went on to plant.
    const druid = ents.find((e) => e.id === rec.notes.druidId);
    expect(druid?.auras?.some((a: Ev) => String(a.kind).startsWith('form_'))).toBe(false);
    expect(druid?.auras?.some((a: Ev) => a.id === 'rejuvenation')).toBe(true);
  });

  it('hit_rating_heroic pair: gear changes the threshold, never the RNG draw order', () => {
    const ungearedScenario = SCENARIOS.find((s) => s.name === 'hit_rating_heroic_ungeared')!;
    const gearedScenario = SCENARIOS.find((s) => s.name === 'hit_rating_heroic_geared')!;
    const ungeared = record(ungearedScenario);
    const geared = record(gearedScenario);

    expect(ungeared.rec.sim.player.hitRating).toBe(0);
    expect(geared.rec.sim.player.hitRating).toBe(170);
    const gearedMob = (geared.rec.sim as any).entities.get(geared.rec.notes.mobId);
    expect(gearedMob.level - geared.rec.sim.player.level).toBe(3);
    expect(
      geared.rec.allEvents.some(
        (e: Ev) => e.type === 'damage' && e.sourceId === geared.rec.sim.player.id,
      ),
    ).toBe(true);

    expect(geared.trace.draws).toBe(ungeared.trace.draws);
    expect(geared.trace.drawDigest).toBe(ungeared.trace.drawDigest);
  });

  it('c5_auto_attack: melee swing table + ranged Auto Shot + wand + queued on-swing fire', () => {
    const rec = run('c5_auto_attack');
    const ev = rec.allEvents as Ev[];
    // ranged white swings carry their hardcoded labels in the damage-event ability field.
    expect(ev.some((e) => e.type === 'damage' && e.ability === 'Auto Shot')).toBe(true); // hunter ranged path
    expect(ev.some((e) => e.type === 'damage' && e.ability === 'Wand')).toBe(true); // mage wand path (no dead zone)
    // melee auto-attack produced physical white-hit outcomes (the single-roll table).
    expect(
      ev.some(
        (e) =>
          e.type === 'damage' &&
          e.school === 'physical' &&
          (e.kind === 'hit' || e.kind === 'miss' || e.kind === 'dodge'),
      ),
    ).toBe(true);
    // a queued on-next-swing ability was consumed in the swing path (its name rode through).
    expect(
      ev.some(
        (e) =>
          e.type === 'damage' && (e.ability === 'Reaver Strike' || e.ability === 'Gutting Strike'),
      ),
    ).toBe(true);
  });

  it('market_round_trip: list/buy/cancel/expire/collect all fire and coin + goods move', () => {
    const rec = run('market_round_trip');
    const sim = rec.sim as any;
    const ev = rec.allEvents as Ev[];
    const seller = rec.notes.seller as number;
    const buyer = rec.notes.buyer as number;
    const loot = (re: RegExp) =>
      ev.some((e) => e.type === 'loot' && typeof e.text === 'string' && re.test(e.text));
    // marketList escrow + the listing emit.
    expect(loot(/^Listed /)).toBe(true);
    // marketBuy cross-player sale: the seller's notice and the buyer's confirmation.
    expect(loot(/bought your /)).toBe(true);
    expect(loot(/^Bought /)).toBe(true);
    // marketCancel reclaim.
    expect(loot(/^Reclaimed /)).toBe(true);
    // updateMarket once-a-second expiry sweep returned the third stack to collection.
    expect(
      ev.some(
        (e) => e.type === 'log' && typeof e.text === 'string' && /expired and waits/.test(e.text),
      ),
    ).toBe(true);
    // marketCollect moved the proceeds into the seller's purse.
    expect(loot(/^You collect /)).toBe(true);
    expect(sim.players.get(seller)?.copper).toBe(285); // 300 sale - 5% cut
    expect(sim.players.get(buyer)?.copper).toBe(4700); // 5000 - 300
  });

  it('g1b_xp_prestige: rested XP accrues in the inn, then prestige resets the bar and bumps rank', () => {
    const rec = run('g1b_xp_prestige');
    // updateRested (+ isResting) accrued a positive rested pool while parked in the inn.
    expect(rec.notes.restedAfterAccrual as number).toBeGreaterThan(0);
    // the kill-flagged award doubled up off the seeded pool and drew it down (1000 -> 920).
    expect(rec.notes.restedAfterConsume as number).toBe(920);
    // prestige fired: the first call accepted, the below-threshold second was refused.
    expect(rec.notes.prestigeAccepted).toBe(true);
    expect(rec.notes.prestigeRejected).toBe(false);
    // the gold prestige log emit fired through ctx.emit.
    expect(
      (rec.allEvents as Ev[]).some(
        (e) => e.type === 'log' && typeof e.text === 'string' && e.text.includes('prestiged'),
      ),
    ).toBe(true);
    // the anti-abuse cap held: rank is exactly 1, never inflated by the second call.
    expect((rec.sim as any).prestigeRank).toBe(1);
  });

  it('player_trade: items + copper swap both ways; cancel + drift sweep clear the session', () => {
    const rec = run('player_trade');
    const sim = rec.sim as any;
    const a = rec.notes.a as number;
    const b = rec.notes.b as number;
    // atomic swap moved goods + coin both directions.
    expect(sim.countItem('wolf_fang', a)).toBe(1); // 3 - 2
    expect(sim.countItem('wolf_fang', b)).toBe(2);
    expect(sim.countItem('baked_bread', a)).toBe(6); // 5 starter + 1 traded
    expect(sim.countItem('baked_bread', b)).toBe(6); // 5 starter + 2 - 1
    expect(sim.players.get(a)?.copper).toBe(80); // 100 - 30 + 10
    expect(sim.players.get(b)?.copper).toBe(70); // 50 - 10 + 30
    // every session ended cleared (swap close + explicit cancel + drift sweep).
    expect(sim.tradeFor(a)).toBe(null);
    expect(sim.tradeFor(b)).toBe(null);
    const ev = rec.allEvents as Ev[];
    expect(ev.some((e) => e.type === 'tradeDone')).toBe(true);
    // 'Trade cancelled.' fires twice per cancel (both pids): the explicit cancel
    // and the out-of-range drift cancel each emit it.
    expect(
      ev.filter((e) => e.type === 'log' && e.text === 'Trade cancelled.').length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('chat_social: channels route, whisper round-trips, emotes broadcast, throttle fires', () => {
    const rec = run('chat_social');
    const ev = rec.allEvents as Ev[];
    const a = rec.notes.a as number;
    const b = rec.notes.b as number;
    const chats = ev.filter((e) => e.type === 'chat');
    // each channel delivered at least one chat event.
    for (const ch of ['say', 'yell', 'party', 'general', 'world', 'lfg', 'whisper', 'emote']) {
      expect(
        chats.some((e) => e.channel === ch),
        `no ${ch} chat`,
      ).toBe(true);
    }
    // whisper round-trip: a -> b then the /r reply resolves back to a.
    expect(chats.some((e) => e.channel === 'whisper' && e.from === 'Aleph' && e.pid === b)).toBe(
      true,
    );
    expect(chats.some((e) => e.channel === 'whisper' && e.from === 'Bet' && e.pid === a)).toBe(
      true,
    );
    // token-bucket throttle fired once c exhausted its burst.
    expect(
      ev.filter((e) => e.type === 'error' && e.text === 'You are sending messages too quickly.')
        .length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('nythraxis_full_pull: every phase fires (transition + soul rend + deathless interrupt + lockout + death dialogue)', () => {
    const rec = run('nythraxis_full_pull');
    const ev = rec.allEvents as Ev[];
    const n = rec.notes as Record<string, any>;
    const sim = rec.sim as any;
    const chats = ev.filter((e) => e.type === 'chat');
    const auras = ev.filter((e) => e.type === 'aura' && e.gained);
    // No phase 1 raise-fallen wave (the redo fields no adds, NYTHRAXIS_ADDS_ENABLED
    // in src/sim/types.ts), plus the three wardstones the transition lit.
    expect(n.addIds.length).toBe(0);
    expect(n.wardIds.length).toBe(3);
    // Transition: Shuddering Stomp room stun + Brother Aldric spawned and still present.
    expect(auras.some((e) => e.name === 'Shuddering Stomp')).toBe(true);
    expect(entities(rec).some((e) => e.templateId === 'brother_aldric_raid')).toBe(true);
    // Soul Rend marks pick (the rng.int callout) + Deathless Rage interrupt self-stun.
    expect(chats.some((e) => e.text === 'Your spirit belongs to me')).toBe(true);
    expect(auras.some((e) => e.name === 'Deathless Rage Interrupted')).toBe(true);
    // Phase 3: The King's Wrath, a Bone Storm (its whirl and a Bone Slam; no
    // spike lands while he storms), and The Crown Endures enrage.
    expect(auras.some((e) => e.name === "King's Wrath")).toBe(true);
    expect(auras.some((e) => e.name === 'Bone Storm')).toBe(true);
    expect(auras.some((e) => e.name === 'The Crown Endures')).toBe(true);
    // The mechanics redo: Dread Curse landed on the tank, two raiders were
    // impaled and freed when their spikes died, and the eruption burst then burned.
    expect(n.spikeIds.length).toBe(2);
    expect(auras.some((e) => e.name === 'Dread Curse')).toBe(true);
    // Two from the forced slice 1 cast; the storm spikes nobody.
    expect(auras.filter((e) => e.name === 'Impaled').length).toBe(2);
    const callouts = ev.filter((e) => e.type === 'nythraxisCallout') as Array<{ call: string }>;
    expect(callouts.some((e) => e.call === 'youAreImpaled')).toBe(true);
    expect(callouts.some((e) => e.call === 'spikeBroken')).toBe(true);
    const damage = ev.filter((e) => e.type === 'damage') as Array<{ ability: string | null }>;
    expect(damage.some((e) => e.ability === 'Bone Spike')).toBe(true);
    expect(damage.some((e) => e.ability === 'Grave Eruption')).toBe(true);
    expect(damage.some((e) => e.ability === 'Grave Flame')).toBe(true);
    // Slice 2: the Soul Rend detonation left no fire (Soulfire retired in
    // v0.42.2, so no Soulfire tick may appear in the trace), and the sigil
    // flared beside the boss and was bound.
    expect(damage.some((e) => e.ability === 'Soulfire')).toBe(false);
    // Gravefire retired in v0.42.2: the due timer in the scenario lights no
    // line, so no Gravefire tick and no target callout may appear.
    expect(damage.some((e) => e.ability === 'Gravefire')).toBe(false);
    expect(callouts.some((e) => e.call === 'gravefireTarget')).toBe(false);
    expect(callouts.some((e) => e.call === 'sigilAppears')).toBe(true);
    expect(callouts.some((e) => e.call === 'sigilBound')).toBe(true);
    expect(callouts.some((e) => e.call === 'kingsWrath')).toBe(true);
    expect(callouts.some((e) => e.call === 'boneStormBegins')).toBe(true);
    expect(callouts.some((e) => e.call === 'boneStormCharge')).toBe(true);
    expect(callouts.some((e) => e.call === 'boneStormEnds')).toBe(true);
    expect(callouts.some((e) => e.call === 'crownEndures')).toBe(true);
    expect(damage.some((e) => e.ability === 'Bone Storm')).toBe(true);
    expect(damage.some((e) => e.ability === 'Bone Slam')).toBe(true);
    expect(auras.some((e) => e.name === 'Deathless Ascension')).toBe(true);
    expect(auras.some((e) => e.name === 'Bound')).toBe(true);
    // Kill: raid lockout granted to the tank + the death-dialogue first line emitted.
    const boss = sim.entities.get(n.bossId);
    expect(boss.dead).toBe(true);
    expect(boss.nythraxis?.phase).toBe('dead');
    const tankMeta = [...sim.players.values()].find((m: any) => m.name === 'NyxTank') as any;
    expect(tankMeta.raidLockouts.has('nythraxis_boss_arena')).toBe(true);
    expect(chats.some((e) => e.text === 'Malric...')).toBe(true);
    // The sibling-distinguishing arm (the rift ladder's fourth-arm idiom): this
    // scenario's claim is NORMAL, which is precisely why it cannot cover a
    // heroic loot stream and why nythraxis_heroic_claim below exists. If a
    // future edit ever makes this pull heroic, BOTH scenarios would cover the
    // same arm and the heroic one would silently stop being the only witness.
    expect(
      sim.instances.some(
        (i: any) => i.partyKey !== null && i.mobIds.includes(n.bossId) && i.difficulty === 'heroic',
      ),
    ).toBe(false);
  }, 90_000);

  it('nythraxis_heroic_claim: the heroic loot arm (variant swap + heroic-only weapon + raised money base + marks)', () => {
    const rec = run('nythraxis_heroic_claim');
    const sim = rec.sim as any;
    const n = rec.notes as Record<string, any>;
    const boss = sim.entities.get(n.bossId);
    expect(boss.dead).toBe(true);
    // The claim really is heroic: the exact predicate rollLoot resolves.
    expect(
      sim.instances.some(
        (i: any) => i.partyKey !== null && i.mobIds.includes(n.bossId) && i.difficulty === 'heroic',
      ),
    ).toBe(true);

    const items: string[] = (boss.loot?.items ?? []).map((s: any) => s.itemId);
    expect(items.length).toBeGreaterThan(0);

    // EXACTLY ONE heroic-only weapon: the nythraxis_heroic_weapon group sums to
    // 1.0, so a heroic kill always sheds one and a normal kill never can. The
    // id set is DERIVED from the shipped table, never listed here, so a table
    // re-cut moves this arm instead of leaving it green over a stale trio.
    const heroicOnlyWeaponIds = HEROIC_BOSS_LOOT.nythraxis_scourge_of_thornpeak
      .filter((e) => e.rollGroup !== undefined)
      .map((e) => e.itemId as string);
    expect(heroicOnlyWeaponIds.length).toBeGreaterThan(0);
    expect(items.filter((id) => heroicOnlyWeaponIds.includes(id)).length).toBe(1);

    // heroicItem() fired on the base table: every drop that HAS a raid-tier
    // heroic variant came out as that variant. Asserted as a whole-list
    // property rather than "at least one", so a swap that stopped firing for a
    // single slot reds. The eligibility test is heroicVariantId's own index
    // lookup, the exact question heroicItem asks, NOT a kind filter: a table
    // that later sheds a plain junk or recipe row (the Phase 11f farming seeds
    // and patterns are both) has no variant to swap to and must not be read as
    // a swap that failed.
    const missedSwap = items.filter(
      (id) => !heroicOnlyWeaponIds.includes(id) && ITEMS[heroicVariantId(id)] !== undefined,
    );
    expect(
      missedSwap,
      `every drop with a heroic variant must BE that variant: ${missedSwap}`,
    ).toEqual([]);
    expect(items.filter((id) => id.startsWith('heroic_')).length).toBeGreaterThan(0);

    // The heroicCopper substitution, and the reason the seed was hunted: the
    // normal base rolls at most ceil(150000 * 1.4) = 210 000, so a roll above
    // that could only have come off NYTHRAXIS_HEROIC_COPPER. The upper bound is
    // pinned too, so a base re-tune cannot widen this arm into always-true.
    expect(boss.loot.copper).toBeGreaterThan(Math.ceil(150_000 * 1.4));
    expect(boss.loot.copper).toBeLessThanOrEqual(Math.ceil(NYTHRAXIS_HEROIC_COPPER * 1.4));

    // awardHeroicMarks paid the whole raid, which only a heroic claim reaches.
    const tuning = HEROIC_DUNGEON_TUNING.nythraxis_boss_arena;
    const raid = [...sim.players.values()] as any[];
    expect(raid.length).toBe(5);
    for (const meta of raid) {
      expect(sim.countItem(HEROIC_MARK_ITEM_ID, meta.entityId), `${meta.name} heroic marks`).toBe(
        tuning.marksPerParticipant,
      );
    }
  }, 90_000);

  it('warrior_row_capstones: intervene, thresholded fear, victory rush heal, bladestorm ticks', () => {
    const rec = run('warrior_row_capstones');
    const sim = rec.sim as any;
    const pid = sim.playerId;
    const ev = rec.allEvents as Ev[];
    // The hostile Onrush keeps both side effects...
    expect(rec.notes.onrushRage).toBe(true);
    expect(rec.notes.onrushInCombat).toBe(true);
    // ...and the friendly Intervene takes neither, while shielding the ally.
    expect(rec.notes.interveneShield).toBe(50);
    expect(rec.notes.interveneClosed).toBe(true);
    expect(rec.notes.interveneRage).toBe(0);
    expect(rec.notes.interveneInCombat).toBe(false);
    expect(rec.notes.interveneAutoAttack).toBe(false);
    // Read at APPLY, not from end-of-run state: the legs after the shout run over
    // five seconds, so anything shorter than the old 8 sec fear has expired by the
    // end and an end-state lookup quietly finds nothing to assert.
    expect(rec.notes.fearApplied).toBe(true);
    expect(rec.notes.fearDuration).toBe(4);
    expect(rec.notes.fearBreaksOnDamage).toBe(true);
    // Lingering Dread's soak, 10% of the wolf's max health.
    expect(rec.notes.fearBreakThreshold).toBeGreaterThan(0);
    expect(ev.some((e) => (e.type === 'heal' || e.type === 'heal2') && e.targetId === pid)).toBe(
      true,
    );
    expect(ev.some((e) => e.type === 'damage' && e.ability === 'Bladestorm')).toBe(true);
  });

  it('professions_craft: denial draws nothing, each craft draws once, and the vestments proc mints + surfaces a masterwork', () => {
    const { trace, rec } = record(SCENARIOS.find((s) => s.name === 'professions_craft')!);
    const ev = rec.allEvents as Ev[];
    const pid = rec.notes.pid as number;
    const crafts = ev.filter((e) => e.type === 'craftResult');

    expect(crafts.some((e) => e.ok === false && e.reason === 'insufficient_materials')).toBe(true);
    expect(
      crafts.some((e) => e.ok === true && e.quality === 'common' && e.masterwork === undefined),
    ).toBe(true);

    const mw = ev.find((e) => e.type === 'masterwork');
    expect(mw, 'masterwork event did not fire (proc missed for the pinned seed)').toBeTruthy();
    expect(mw!.recipeId).toBe('recipe_eastbrook_ritual_vestments');
    expect(mw!.itemId).toBe('eastbrook_ritual_vestments');
    expect(mw!.crafter).toBe(pid);
    expect(mw!.pid).toBe(pid);
    expect(
      crafts.some(
        (e) =>
          e.ok === true &&
          e.itemId === 'eastbrook_ritual_vestments' &&
          e.quality === 'uncommon' &&
          e.masterwork === true,
      ),
    ).toBe(true);

    const meta = (rec.sim as any).players.get(pid);
    const slots = meta.inventory.filter((s: any) => s.itemId === 'eastbrook_ritual_vestments');
    expect(slots.length).toBe(1);
    expect(slots[0].instance?.rolled?.masterwork).toBe(true);
    expect(meta.lastMasterwork).toMatchObject({
      recipeId: 'recipe_eastbrook_ritual_vestments',
      itemId: 'eastbrook_ritual_vestments',
      crafter: pid,
    });

    // The phase 07 daily-gate arm (step 4b): the catalyst success stamps
    // craftDaily with real content and draws once like every success; the
    // daily_limit re-attempt returns BEFORE any draw and leaves the stamp
    // unmutated, so the scenario's total stays at exactly four draws (three
    // pre-existing crafts + the catalyst; the two denials contribute zero).
    expect(
      crafts.some(
        (e) => e.ok === true && e.itemId === 'quickening_catalyst' && e.masterwork === undefined,
      ),
    ).toBe(true);
    expect(crafts.some((e) => e.ok === false && e.reason === 'daily_limit')).toBe(true);
    expect(meta.craftDaily).toEqual({
      date: '2099-06-25',
      crafted: new Set(['recipe_quickening_catalyst']),
    });
    expect(trace.draws).toBe(4);
  });

  it('professions_gather: two draws per harvest, zero-draw denial, zone materials, and the hunted rare event fires', () => {
    const { trace, rec } = record(SCENARIOS.find((s) => s.name === 'professions_gather')!);
    const ev = rec.allEvents as Ev[];
    const pid = (rec.sim as any).playerId as number;
    const meta = (rec.sim as any).players.get(pid);

    const gathers = ev.filter((e) => e.type === 'gatherResult');
    expect(gathers).toHaveLength(102);
    expect(ev.some((e) => e.type === 'error' && e.text === 'Your bags are full.')).toBe(false);

    const phase1 = trace.frames.find((f) => f.label === 'harvest-ore-common-and-denial');
    expect(phase1, 'missing the phase 1 frame').toBeTruthy();
    expect(phase1!.rng.draws).toBe(2);
    expect(
      ev.some(
        (e) => e.type === 'error' && e.text === 'This resource node has not respawned for you yet.',
      ),
    ).toBe(true);

    expect(gathers[0].itemId).toBe('copper_ore');
    expect(gathers[0].rarity).toBe('common');
    const wood = gathers.find((e) => e.itemId === 'ironbark_log');
    expect(wood, 'wood harvest missing').toBeTruthy();
    expect(wood!.rarity).not.toBe('common');

    const rare = ev.find((e) => e.type === 'gatherRareEvent');
    expect(rare, 'rare event did not fire (hunted seed regressed)').toBeTruthy();
    expect(rare!.finderPid).toBe(pid);
    const flavorByType: Record<string, string> = {
      ore: 'pristine_vein',
      wood: 'ancient_heartwood',
      herb: 'moonlit_bloom',
    };
    expect(rare!.flavor).toBe(flavorByType[rare!.nodeType]);
    const rareGather = gathers.find((e) => e.rareEvent === rare!.flavor);
    expect(rareGather, 'no gatherResult paired with the rare event').toBeTruthy();
    const qtyByRarity: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 2,
      epic: 3,
      legendary: 4,
    };
    expect(rareGather!.qty).toBe(qtyByRarity[rareGather!.rarity] * 5);
    // The premium mark now rides the granted stack's materialSources bucket
    // (material_gatherer.ts gatheredMaterialSources) instead of a distinct
    // instance.signer payload, so a signed grant merges into the same mixed
    // slot plain gather already occupies. Select the slots that carry a
    // bucket signed by this player, then count ONLY the signed units inside
    // each selected slot, never the slot's whole (mixed) count.
    const mixedSlots = meta.inventory.filter(
      (s: any) =>
        s.itemId === rare!.itemId &&
        s.materialSources?.some((bucket: any) => bucket.source.signer === meta.name),
    );
    const signedUnits = mixedSlots.reduce(
      (n: number, s: any) =>
        n +
        s.materialSources
          .filter((bucket: any) => bucket.source.signer === meta.name)
          .reduce((m: number, bucket: any) => m + bucket.count, 0),
      0,
    );
    expect(signedUnits).toBeGreaterThanOrEqual(rareGather!.qty);
    // Packing ceiling: a mixed slot's cap (20) bounds ALL units it holds,
    // signed and plain alike, so the slot count is measured against the
    // slots' total count, not the narrower signed-unit count above.
    const mixedSlotUnits = mixedSlots.reduce((n: number, s: any) => n + s.count, 0);
    expect(mixedSlots.length).toBeLessThanOrEqual(Math.ceil(mixedSlotUnits / 20));
    // The old per-instance premium payload is retired: no slot of this item
    // carries a signer on its instance payload anymore.
    expect(
      meta.inventory.every(
        (s: any) => s.itemId !== rare!.itemId || s.instance?.signer === undefined,
      ),
    ).toBe(true);
  });
}
