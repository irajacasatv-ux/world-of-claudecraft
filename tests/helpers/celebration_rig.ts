// A celebration host wired the way Hud.celebrationHost() wires it, over a real
// BannerSlot, so the celebration painters (craft, deed, Reliquary, skill,
// faction) run their real banner and announce paths in a suite that does not
// import the Hud coordinator. The plain-text log arm and the node-body line
// are vi.fn stubs, as they were on the Object.create(Hud.prototype) rigs this
// replaces; a suite about the clickable lines passes a real pane's logNodes
// (chatPane in ./chat_log_deps.ts), so the chat appender and the content
// tables it reads load only where a case needs them. The Book of Deeds and
// Reliquary windows are vi.fn doubles a case asserts on.
import { type Mock, vi } from 'vitest';
import { BannerSlot, type BannerVariant, celebrationBannerArgs } from '../../src/ui/banner_slot';
import type { DeedUnlockHost } from '../../src/ui/deed_unlock_painter';
import type { CraftCelebrationHost } from '../../src/ui/hud/professions/craft_celebration_painter';
import type { ReliquaryUnlockHost } from '../../src/ui/reliquary_unlock_painter';

export type CelebrationRigHost = CraftCelebrationHost & DeedUnlockHost & ReliquaryUnlockHost;

export interface CelebrationRig {
  readonly bannerEl: HTMLElement;
  readonly slot: BannerSlot;
  readonly combatAnnouncer: { push: Mock };
  /** The plain-text log arm (Hud.log), a stub. */
  readonly log: Mock;
  readonly deedsWindow: { noteUnlocks: Mock; openWithDeed: Mock };
  readonly reliquaryWindow: {
    isOpen: boolean;
    open: Mock;
    openWithPage: Mock;
    flashRelics: Mock;
    celebrateIllumination: Mock;
    refreshIfChanged: Mock;
  };
  /** Hud.showCelebrationBanner, optional tail included: the real
   *  celebrationBannerArgs defaults into the real slot. */
  showCelebrationBanner(
    text: string,
    bannerClass: 'levelup' | 'deed',
    variant?: BannerVariant,
    motion?: boolean,
    decorativeIconUrl?: string,
    subtext?: string,
  ): void;
  readonly host: CelebrationRigHost;
}

export function celebrationRig(overrides: Partial<CelebrationRigHost> = {}): CelebrationRig {
  const bannerEl = document.createElement('div');
  const slot = new BannerSlot(bannerEl);
  const combatAnnouncer = { push: vi.fn() };
  const log = vi.fn();
  const deedsWindow = { noteUnlocks: vi.fn(), openWithDeed: vi.fn() };
  const reliquaryWindow = {
    isOpen: false,
    open: vi.fn(),
    openWithPage: vi.fn(),
    flashRelics: vi.fn(),
    celebrateIllumination: vi.fn(),
    refreshIfChanged: vi.fn(),
  };
  const showCelebrationBanner: CelebrationRig['showCelebrationBanner'] = (
    text,
    bannerClass,
    variant,
    motion,
    decorativeIconUrl,
    subtext,
  ) => {
    slot.show(
      ...celebrationBannerArgs(text, bannerClass, variant, motion, decorativeIconUrl, subtext),
    );
  };
  const host: CelebrationRigHost = {
    log: (text, color) => log(text, color),
    logNodes: vi.fn(),
    showBanner: (text, motion, decorativeIconUrl) => {
      slot.show(text, motion, decorativeIconUrl);
    },
    showCelebrationBanner,
    announce: (text) => combatAnnouncer.push(text, performance.now()),
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    deedsWindow,
    reliquaryWindow,
    ...overrides,
  };
  return {
    bannerEl,
    slot,
    combatAnnouncer,
    log,
    deedsWindow,
    reliquaryWindow,
    showCelebrationBanner,
    host,
  };
}
