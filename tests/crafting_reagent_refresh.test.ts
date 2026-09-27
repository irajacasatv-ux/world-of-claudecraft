// @vitest-environment happy-dom

// Crafting window bag-freshness (issue #2375). The Craft gate is derived
// entirely from the bag, but the window is a COLD painter: before this suite
// an open window only repainted on the station-range edge, the craft/train
// event arms, and the profession-surface signature, none of which carries an
// inventory term. Buying, looting, or trading for the last reagent therefore
// left the row disabled until the player closed and reopened the window.
//
// Four layers are pinned here:
//  1. craftingReagentSig (pure): it moves exactly when the bag facts
//     buildCraftingView reads move, and stays put on churn the view ignores.
//  2. The HUD probe's behavior. Its signature half is openCraftingRefreshSig
//     (extracted from Hud.refreshOpenCraftingIfReagentsChanged into
//     crafting_view.ts), so it is driven through a harness that runs the
//     probe's two lines over that core (the harness spelling is pinned to
//     hud.ts below, so the two cannot drift): cold latch, elision, the repro
//     edge, and that a closed window reads nothing at all.
//  3. The wiring source pins for the three edges that call the probe, each
//     anchored to the REGION it must live in, not to the whole file, plus the
//     probe body itself and the reconnect hook's focus-target reset.
//  4. The painter carrying the tab strip's scroll offset across the rebuild,
//     since the window now repaints from causes the player did not initiate.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { ALL_RECIPES } from '../src/sim/content/recipes';
import { ITEMS as CATALOG_ITEMS } from '../src/sim/data';
import type { InvSlot, ItemDef } from '../src/sim/types';
import {
  buildCraftingView,
  craftingReagentSig,
  craftingWindowRefreshSig,
  openCraftingRefreshSig,
  type RecipeDefLike,
} from '../src/ui/hud/professions/crafting_view';
import { renderCraftingWindow } from '../src/ui/hud/professions/crafting_window';
import { bareClient } from './helpers/bare_client';

const VIEWER = 'Fernando';

// Real reagent ids (the signature is scoped to what ALL_RECIPES consumes, so
// synthetic ids would be filtered out and prove nothing) plus one real item
// that is NOT any recipe's reagent, for the quiet-churn assertions.
const REAGENT_A = 'copper_ore';
const REAGENT_B = 'linen_scrap';
const NON_REAGENT = 'wolf_pelt_scrap';

function item(id: string): ItemDef {
  return { id, name: id, quality: 'common', kind: 'junk', sellValue: 0 } as unknown as ItemDef;
}

// The issue's shape: a recipe needing two reagents, one of them already held.
// Synthetic recipe (the crafting_view.test.ts idiom) over REAL reagent ids, so
// content churn cannot rewrite what this suite proves.
const STEW: RecipeDefLike = {
  id: 'recipe_test_stew',
  professionId: 'cooking',
  resultItemId: 'test_stew',
  resultCount: 1,
  reagents: [
    { itemId: REAGENT_A, count: 1 },
    { itemId: REAGENT_B, count: 1 },
  ],
  skillReq: 0,
};

const ITEMS = Object.fromEntries(
  [REAGENT_A, REAGENT_B, NON_REAGENT, 'test_stew'].map((id) => [id, item(id)]),
);

/** One of the two reagents held: the state the player is in on the way to the
 *  shopkeeper. A factory (never a shared constant) so equality assertions
 *  compare two independently built arrays. */
function oneOfTwo(): InvSlot[] {
  return [{ itemId: REAGENT_A, count: 1 }];
}

function rowFor(recipe: RecipeDefLike, inventory: InvSlot[]) {
  return buildCraftingView([recipe], inventory, ITEMS, {}, undefined, undefined, VIEWER).recipes[0];
}

function craftableOf(inventory: InvSlot[]): boolean {
  return rowFor(STEW, inventory).craftable;
}

describe('craftingReagentSig', () => {
  it('rests on fixtures that really are (and are not) recipe reagents', () => {
    // The scoping assertions below are only meaningful while these fixture
    // ids keep their roles, and recipes.ts is live content. Fail HERE with the
    // reason rather than somewhere confusing downstream.
    const reagentIds = new Set(ALL_RECIPES.flatMap((r) => r.reagents.map((g) => g.itemId)));
    expect([...reagentIds]).toEqual(expect.arrayContaining([REAGENT_A, REAGENT_B]));
    expect(reagentIds.has(NON_REAGENT)).toBe(false);
    // The signature packs id:count:flag rows with ':' and '|', so a reagent id
    // carrying either delimiter could make two different bags share a string.
    // No authored id does; this is the guard that keeps it that way.
    for (const id of reagentIds) expect(id).not.toMatch(/[:|]/);
  });

  it('is stable across two independently built copies of the same bag', () => {
    // Distinct arrays holding distinct slot objects: a signature that only
    // ever compared a value with itself would pass here proving nothing.
    expect(craftingReagentSig(oneOfTwo(), VIEWER)).toBe(craftingReagentSig(oneOfTwo(), VIEWER));
  });

  it('moves when the LAST missing reagent lands, exactly as the Craft gate flips', () => {
    const before = oneOfTwo();
    const after = [...oneOfTwo(), { itemId: REAGENT_B, count: 1 }];
    // The bug in one place: the gate flips (the window has something new to
    // say) while nothing tells the HUD to repaint. The signature closes that
    // gap, so it must move on precisely this edge.
    expect(craftableOf(before)).toBe(false);
    expect(craftableOf(after)).toBe(true);
    expect(craftingReagentSig(after, VIEWER)).not.toBe(craftingReagentSig(before, VIEWER));
  });

  it('moves when a stack shrinks (a reagent spent or destroyed elsewhere)', () => {
    const before: InvSlot[] = [{ itemId: REAGENT_A, count: 2 }];
    const after: InvSlot[] = [{ itemId: REAGENT_A, count: 1 }];
    expect(craftingReagentSig(after, VIEWER)).not.toBe(craftingReagentSig(before, VIEWER));
  });

  // The #1145 self-signed reduction takes one off the listed count (floored at
  // 1), so it only bites on a reagent listed at 2 or more. This recipe exists
  // to make that discount observable: at count 3 the requirement drops to 2.
  const SIGNED_RECIPE: RecipeDefLike = { ...STEW, reagents: [{ itemId: REAGENT_A, count: 3 }] };

  it('moves when a stack turns SELF-signed, and the Craft gate moves with it', () => {
    const unsigned: InvSlot[] = [{ itemId: REAGENT_A, count: 2 }];
    const selfSigned: InvSlot[] = [{ itemId: REAGENT_A, count: 2, instance: { signer: VIEWER } }];
    // Same stack size, different answer: a counts-only signature would miss it.
    expect(rowFor(SIGNED_RECIPE, unsigned).reagents[0].required).toBe(3);
    expect(rowFor(SIGNED_RECIPE, unsigned).craftable).toBe(false);
    expect(rowFor(SIGNED_RECIPE, selfSigned).reagents[0].required).toBe(2);
    expect(rowFor(SIGNED_RECIPE, selfSigned).craftable).toBe(true);
    expect(craftingReagentSig(selfSigned, VIEWER)).not.toBe(craftingReagentSig(unsigned, VIEWER));
  });

  it('ignores a signer swap between two OTHER crafters (payload the view never reads)', () => {
    // holdsSelfSignedInstance only asks whether the VIEWER signed it, so a
    // stranger-signed stack changing hands must not churn a repaint.
    const alice: InvSlot[] = [{ itemId: REAGENT_A, count: 2, instance: { signer: 'Alice' } }];
    const bob: InvSlot[] = [{ itemId: REAGENT_A, count: 2, instance: { signer: 'Bob' } }];
    expect(craftingReagentSig(bob, VIEWER)).toBe(craftingReagentSig(alice, VIEWER));
    // ...and the view agrees: a stranger's signature earns no discount, so the
    // requirement stays the listed 3 (contrast the self-signed case above,
    // which drops it to 2).
    expect(rowFor(SIGNED_RECIPE, alice).reagents[0].required).toBe(3);
    expect(rowFor(SIGNED_RECIPE, bob).reagents[0].required).toBe(3);
  });

  it('sums a reagent split across stacks, exactly as countInInventory does', () => {
    const split: InvSlot[] = [
      { itemId: REAGENT_A, count: 1 },
      { itemId: REAGENT_A, count: 1 },
    ];
    const whole: InvSlot[] = [{ itemId: REAGENT_A, count: 2 }];
    expect(craftingReagentSig(split, VIEWER)).toBe(craftingReagentSig(whole, VIEWER));
    const three: InvSlot[] = [{ itemId: REAGENT_A, count: 3 }];
    expect(craftingReagentSig(three, VIEWER)).not.toBe(craftingReagentSig(whole, VIEWER));
  });

  it('stays put when a NON-reagent item is looted (no repaint under the player)', () => {
    const before = oneOfTwo();
    const after = [...oneOfTwo(), { itemId: NON_REAGENT, count: 4 }];
    expect(craftingReagentSig(after, VIEWER)).toBe(craftingReagentSig(before, VIEWER));
  });

  it('stays put when the bags are rearranged (order is not a crafting change)', () => {
    const before: InvSlot[] = [
      { itemId: REAGENT_A, count: 1, slot: 0 },
      { itemId: REAGENT_B, count: 2, slot: 1 },
    ];
    const after: InvSlot[] = [
      { itemId: REAGENT_B, count: 2, slot: 5 },
      { itemId: REAGENT_A, count: 1, slot: 9 },
    ];
    expect(craftingReagentSig(after, VIEWER)).toBe(craftingReagentSig(before, VIEWER));
  });

  it('distinguishes two different reagents held at the same count', () => {
    const a: InvSlot[] = [{ itemId: REAGENT_A, count: 1 }];
    const b: InvSlot[] = [{ itemId: REAGENT_B, count: 1 }];
    expect(craftingReagentSig(b, VIEWER)).not.toBe(craftingReagentSig(a, VIEWER));
  });
});

// ---------------------------------------------------------------------------
// The HUD probe. Hud.refreshOpenCraftingIfReagentsChanged is two lines over
// openCraftingRefreshSig: the signature of the window if it is open (null if
// closed, read off its display), then a repaint when that differs from the
// latched memo. The harness below runs exactly those two
// lines (the Hud spelling is pinned by 'the probe is the extracted core, open
// check first' in the wiring block), with renderCrafting stubbed. The stub
// re-arms the latch the way the real renderCrafting does (hud.ts, pinned by the
// source region below), so the call counts here measure the probe's own
// elision and nothing else.
// ---------------------------------------------------------------------------

interface CraftingRefreshHarness {
  sim: Parameters<typeof craftingWindowRefreshSig>[0];
  renderCrafting: Mock<() => void>;
  lastCraftingReagentSig: string;
  refreshOpenCraftingIfReagentsChanged(): void;
}

function makeHud(inventory: InvSlot[]): {
  hud: CraftingRefreshHarness;
  window: HTMLElement;
  /** How many times the probe has read the bag: the "a closed window costs
   *  nothing" claim is about this, not about the repaint count. */
  inventoryReads(): number;
  setInventory(next: InvSlot[]): void;
} {
  let bag = inventory;
  let reads = 0;
  const player = { name: VIEWER };
  document.getElementById('crafting-window')?.remove();
  const el = document.createElement('div');
  el.id = 'crafting-window';
  el.style.display = 'flex';
  document.body.appendChild(el);
  const hud: CraftingRefreshHarness = {
    sim: {
      cfg: { seed: 20061, playerClass: 'warrior' },
      craftVaultStock: null,
      get inventory() {
        reads++;
        return bag;
      },
      player,
    } as CraftingRefreshHarness['sim'],
    // Seed the latch the way the real field declares it ('' until the first
    // paint arms it).
    lastCraftingReagentSig: '',
    renderCrafting: vi.fn(() => {
      hud.lastCraftingReagentSig = craftingWindowRefreshSig(hud.sim);
    }),
    // Hud.refreshOpenCraftingIfReagentsChanged, line for line.
    refreshOpenCraftingIfReagentsChanged() {
      const sig = openCraftingRefreshSig(
        (document.getElementById('crafting-window') as HTMLElement).style.display === 'flex',
        this.sim,
      );
      if (sig !== null && sig !== this.lastCraftingReagentSig) this.renderCrafting();
    },
  };
  return {
    hud,
    window: el,
    inventoryReads: () => reads,
    setInventory: (next) => {
      bag = next;
    },
  };
}

describe('refreshOpenCraftingIfReagentsChanged', () => {
  it.each([false, true])(
    'repaints once after a capability-changing reconnect with unchanged materials (enabled %s)',
    (enabled) => {
      const world = bareClient(1, { inventory: oneOfTwo(), craftVaultStock: { iron_ore: 3 } });
      world.craftingIdentity.knownRecipes = ['recipe_freehold_weapon_rack'];
      const hello = (value: boolean) =>
        (world as unknown as { onMessage(raw: string): void }).onMessage(
          JSON.stringify({ t: 'hello', pid: 1, seed: 20061, freeholdsEnabled: value }),
        );
      hello(!enabled);
      const { hud } = makeHud([]);
      hud.sim = world;
      const displayed: string[][] = [];
      hud.renderCrafting = vi.fn(() => {
        hud.lastCraftingReagentSig = craftingWindowRefreshSig(world, world.craftVaultStock);
        const known = new Set(world.craftingIdentity.knownRecipes);
        displayed.push(
          buildCraftingView(
            world.recipeList.filter((row) => known.has(row.id)),
            world.inventory,
            CATALOG_ITEMS,
            {},
            undefined,
            undefined,
            world.player.name,
            world.craftVaultStock,
          ).recipes.map((row) => row.recipeId),
        );
      });
      // Hud.onInventoryChanged ends in the probe (pinned by 'the online
      // authoritative inventory delta converges it on the same frame' below),
      // so the delta hook is the probe here. The reconnect hook is counted:
      // Hud.resyncAfterReconnect is what main.ts chains onto it (its
      // focus-target reset is pinned in the wiring block).
      const onInventoryChanged = () => hud.refreshOpenCraftingIfReagentsChanged();
      let reconnects = 0;
      hud.refreshOpenCraftingIfReagentsChanged();
      expect(displayed.at(-1)).toEqual(enabled ? [] : ['recipe_freehold_weapon_rack']);
      hud.renderCrafting.mockClear();
      const before = JSON.stringify([
        world.inventory,
        world.craftVaultStock,
        world.player.pos,
        world.craftingIdentity.knownRecipes,
      ]);
      world.onReconnected = () => {
        reconnects += 1;
      };
      (world as unknown as { reconnectAttempts: number }).reconnectAttempts = 1;
      hello(enabled);
      onInventoryChanged();
      expect(
        JSON.stringify([
          world.inventory,
          world.craftVaultStock,
          world.player.pos,
          world.craftingIdentity.knownRecipes,
        ]),
      ).toBe(before);
      expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
      expect(reconnects).toBe(1);
      expect(displayed.at(-1)).toEqual(enabled ? ['recipe_freehold_weapon_rack'] : []);
      onInventoryChanged();
      hud.refreshOpenCraftingIfReagentsChanged();
      expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
      expect(world.craftingIdentity.knownRecipes).toEqual(['recipe_freehold_weapon_rack']);
    },
  );

  it('latches on the first probe, then elides an unchanged bag', () => {
    const { hud } = makeHud(oneOfTwo());
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
    hud.refreshOpenCraftingIfReagentsChanged();
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
  });

  it('repaints when the last reagent lands (the issue #2375 repro)', () => {
    const { hud, setInventory } = makeHud(oneOfTwo());
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
    // The shopkeeper hands over the missing reagent.
    const stocked = [...oneOfTwo(), { itemId: REAGENT_B, count: 1 }];
    setInventory(stocked);
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).toHaveBeenCalledTimes(2);
    expect(craftableOf(stocked)).toBe(true);
  });

  it('reads nothing at all while the window is CLOSED', () => {
    const { hud, window, inventoryReads, setInventory } = makeHud(oneOfTwo());
    window.style.display = 'none';
    hud.refreshOpenCraftingIfReagentsChanged();
    setInventory([...oneOfTwo(), { itemId: REAGENT_B, count: 1 }]);
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).not.toHaveBeenCalled();
    // The open-check must come FIRST: a guard reorder that built the signature
    // before testing display would cost every closed player a bag sweep per
    // slow tick, and a repaint-count assertion alone would not notice.
    expect(inventoryReads()).toBe(0);
  });

  it('does not repaint for a non-reagent pickup', () => {
    const { hud, setInventory } = makeHud(oneOfTwo());
    hud.refreshOpenCraftingIfReagentsChanged();
    setInventory([...oneOfTwo(), { itemId: NON_REAGENT, count: 1 }]);
    hud.refreshOpenCraftingIfReagentsChanged();
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Wiring. The three call sites live in code paths a unit test cannot execute
// (the per-frame update band, the online delta hook, the vendor closure), so
// they are pinned against comment-stripped source: prose alone must never
// satisfy a pin. Each pin is scoped to the REGION the call has to live in, so
// moving the code somewhere that changes its meaning reds the pin.
// ---------------------------------------------------------------------------

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const hud = stripComments(readFileSync(path.resolve(process.cwd(), 'src/ui/hud.ts'), 'utf8'));

/** Source between two unique anchors, asserted to exist so a rename fails
 *  loudly here instead of silently slicing an empty (vacuously passing) span. */
function region(from: string, to: string): string {
  const start = hud.indexOf(from);
  expect(start, `anchor not found: ${from}`).toBeGreaterThan(-1);
  const end = hud.indexOf(to, start + from.length);
  expect(end, `anchor not found after ${from}: ${to}`).toBeGreaterThan(start);
  return hud.slice(start, end);
}

describe('crafting window bag-freshness wiring (source pins)', () => {
  it('renderCrafting re-arms the latch on EVERY paint, whatever caused it', () => {
    // Scoped to the method: moving the latch into the probe would leave every
    // other paint cause (the station edge, a craft, a tab switch, the open
    // itself) un-armed, and a whole-file pin would not notice.
    const renderCrafting = region(
      'private renderCrafting(focusReturnRecipeId = ',
      'closeCrafting(): void {',
    );
    // Phase 04 (craft-from-vault) moved this pin: the latch now carries the
    // craftVaultStock term, read ONCE into a local so the signature and the
    // build cannot see different snapshots. Whitespace-tolerant on the call
    // so the formatter's wrap choice cannot re-break it.
    expect(renderCrafting).toContain('const craftVaultStock = this.sim.craftVaultStock;');
    expect(renderCrafting).toMatch(
      /this\.lastCraftingReagentSig = craftingWindowRefreshSig\(this\.sim,\s*craftVaultStock\)/,
    );
    // The single-read rule pinned DIRECTLY: exactly one getter read in the
    // whole method (comments stripped), so a regression that hands the BUILD
    // a second `this.sim.craftVaultStock` read (the two-snapshots-per-paint
    // shape the local exists to prevent) reds here even though the sig arm
    // above would still match.
    const code = renderCrafting.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code.match(/this\.sim\.craftVaultStock/g)).toHaveLength(1);
  });

  it('the slow band converges an open window in BOTH hosts', () => {
    // Anchored INSIDE the `if (slowHud)` guard: hoisted above it, the probe
    // would sweep the whole bag every frame with the window open.
    const slowBand = region('if (slowHud) {', 'this.playerFramePainter');
    expect(slowBand).toContain('this.refreshOpenCraftingIfReagentsChanged();');
    const perFrame = region('const slowHud =', 'if (slowHud) {');
    expect(perFrame).not.toContain('refreshOpenCraftingIfReagentsChanged');
  });

  it('keeps the station-range edge it is layered on top of', () => {
    // The two staleness edges are independent. Pin the station COMPARISON, not
    // the re-arm assignment: deleting the slow-band station block on the
    // theory that the bag edge now covers staleness would otherwise stay green
    // while walking into forge range stopped enabling station-bound rows.
    const slowBand = region('if (slowHud) {', 'this.playerFramePainter');
    expect(slowBand).toContain('!== this.lastCraftingStationSig');
    expect(slowBand).toContain('this.renderCrafting();');
  });

  it('the probe is the extracted core, open check first', () => {
    // The harness above runs these two lines; pinned here so it cannot drift
    // from the Hud. The open state is read off the window and handed to the
    // core, which checks it BEFORE building the signature; the memo comparison
    // stays spelled in the Hud (the language fan-out sweep sees it there).
    const probe = region('private refreshOpenCraftingIfReagentsChanged(): void {', '\n  }');
    // The whole body, whitespace-normalized, so nothing can run before the probe
    // or beside the one repaint.
    expect(probe.replace(/\s+/g, ' ').trim()).toBe(
      'private refreshOpenCraftingIfReagentsChanged(): void { ' +
        "const sig = openCraftingRefreshSig($('#crafting-window').style.display === 'flex', this.sim); " +
        'if (sig !== null && sig !== this.lastCraftingReagentSig) this.renderCrafting();',
    );
  });

  it('the reconnect hook resets the focus-target frames', () => {
    const resync = region('resyncAfterReconnect(): void {', '\n  }');
    // The whole reconnect hook: every window it resyncs, the focus reset unguarded.
    expect(resync.replace(/\s+/g, ' ').trim()).toBe(
      'resyncAfterReconnect(): void { this.marketWindow.onReconnected(); ' +
        'this.focusTargets.reset(); this.perfectingWindow?.onReconnected(); ' +
        'this.freeholdGatePrompt?.onReconnected();',
    );
  });

  it('the online authoritative inventory delta converges it on the same frame', () => {
    // Bounded at the METHOD's own two-space closing brace rather than a flat
    // [^}]* reach from the opener (#2931 made that break this pin once) or
    // the next definition (whose gap a future method could squat in): inner
    // blocks close at deeper indents, so the slice is exactly the hook body.
    const arm = region('onInventoryChanged(): void {', '\n  }');
    expect(arm).toContain('this.refreshOpenCraftingIfReagentsChanged();');
  });

  it('the offline vendor buy converges it on the click', () => {
    expect(hud).toMatch(
      /const buyAndRefresh = \(buy: \(\) => void\) => \{[^}]*this\.refreshOpenCraftingIfReagentsChanged\(\);\s*\};/,
    );
  });
});

// ---------------------------------------------------------------------------
// The painter. The window now repaints from causes the player did not
// initiate, so a rebuild must not move what they are looking at.
// ---------------------------------------------------------------------------

function craftingDeps() {
  return {
    hideTooltip: vi.fn(),
    onCraft: vi.fn(),
    onClose: vi.fn(),
    onOpenOrders: vi.fn(),
    itemIcon: vi.fn(() => ''),
    moneyHtml: vi.fn(() => ''),
    itemTooltip: vi.fn(() => ''),
    attachTooltip: vi.fn(),
    commissionChecked: vi.fn((_recipeId: string) => false),
    onToggleCommission: vi.fn(),
    craftQty: () => 1,
    onCraftQty: vi.fn(),
    announce: vi.fn(),
    selectedCraft: () => null as string | null,
    recipePinned: () => false,
    onToggleRecipePin: (recipeId: string) => ({
      pinned: new Set([recipeId]),
      full: false,
      changed: true,
    }),
    onSelectCraft: vi.fn(),
  };
}

function paint(el: HTMLElement, inventory: InvSlot[]): void {
  renderCraftingWindow(
    el,
    buildCraftingView([STEW], inventory, ITEMS, {}, undefined, undefined, VIEWER),
    craftingDeps(),
  );
}

const BOTH_REAGENTS: InvSlot[] = [
  { itemId: REAGENT_A, count: 3 },
  { itemId: REAGENT_B, count: 3 },
];

describe('the fine-substitution suffix renders on BOTH claimed surfaces', () => {
  it('paints the suffix span and folds the same text into the row aria name', () => {
    // The phase 14 QA: the visible-line-AND-aria-fold claim had zero
    // rendered arms (only the view's number was pinned). Base copper is
    // absent and one fine copy covers the bill, so the reagent row must
    // carry the suffix in the .crafting-fine-sub span and in the row's
    // composed aria name.
    const el = document.createElement('div');
    document.body.appendChild(el);
    paint(el, [
      { itemId: 'fine_copper_ore', count: 1 },
      { itemId: REAGENT_B, count: 1 },
    ]);
    const sub = el.querySelector('.crafting-fine-sub');
    expect(sub?.textContent?.trim()).toBe('(spends 1 fine-grade)');
    expect(el.querySelector('[aria-label*="spends 1 fine-grade"]')).not.toBeNull();
    el.remove();
  });
});

describe('crafting window repaint preserves the player position', () => {
  it('keeps the tab strip scrolled where the player left it', () => {
    // The strip is its own horizontal scroller on mobile, so a repaint that
    // reset it would scroll the craft the player is reading off the screen
    // (visible in the mobile before/after capture for this issue).
    const el = document.createElement('div');
    document.body.appendChild(el);
    paint(el, BOTH_REAGENTS);
    const strip = el.querySelector('.crafting-tabs') as HTMLElement | null;
    expect(strip).not.toBeNull();
    (strip as HTMLElement).scrollLeft = 120;

    paint(el, [
      { itemId: REAGENT_A, count: 2 },
      { itemId: REAGENT_B, count: 2 },
    ]);
    const fresh = el.querySelector('.crafting-tabs') as HTMLElement;
    expect(fresh).not.toBe(strip); // rebuilt, not reused
    expect(fresh.scrollLeft).toBe(120);
    el.remove();
  });

  it('keeps the recipe list scrolled where the player left it', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    paint(el, BOTH_REAGENTS);
    (el.querySelector('.crafting-body') as HTMLElement).scrollTop = 64;

    paint(el, [
      { itemId: REAGENT_A, count: 2 },
      { itemId: REAGENT_B, count: 2 },
    ]);
    expect((el.querySelector('.crafting-body') as HTMLElement).scrollTop).toBe(64);
    el.remove();
  });
});

describe('the ordinary-grade note renders on BOTH claimed surfaces', () => {
  it('paints the note span and folds the same text into the row aria name', () => {
    // The Bronze Hoe report: the player holds the plain grade of a fine-only
    // reagent. The window must say so in words beside the 0/n count, on the
    // visible line AND the composed aria name (never color alone).
    const el = document.createElement('div');
    document.body.appendChild(el);
    const hoe: RecipeDefLike = {
      id: 'recipe_note_hoe',
      professionId: 'engineering',
      resultItemId: 'bronze_hoe',
      resultCount: 1,
      reagents: [{ itemId: 'fine_vale_wheat', count: 4 }],
      skillReq: 0,
    };
    renderCraftingWindow(
      el,
      buildCraftingView(
        [hoe],
        [{ itemId: 'vale_wheat', count: 7 }],
        {
          ...ITEMS,
          vale_wheat: { ...item('vale_wheat'), name: 'Vale Wheat' },
          fine_vale_wheat: item('fine_vale_wheat'),
        },
        {},
        undefined,
        undefined,
        VIEWER,
      ),
      craftingDeps(),
    );
    const note = el.querySelector('.crafting-ordinary-held');
    expect(note?.textContent?.trim()).toBe(
      '(Vale Wheat held: 7, but only the fine grade counts here)',
    );
    expect(
      el.querySelector('[aria-label*="Vale Wheat held: 7, but only the fine grade counts here"]'),
    ).not.toBeNull();
    expect(el.querySelector('.crafting-reagent.unsat')).not.toBeNull();
    el.remove();
  });
});
