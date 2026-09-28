// The live half of the shared #banner slot, extracted from Hud: the one
// reused element, the duration and fade-gap timers, the R38 queue instance and
// the unstuck source flag. The queue POLICY (what an arrival does, what shows
// next) stays pure in banner_queue.ts (docs/design/banner-queue.md); this class
// owns the element, the clock and the paint, so a suite drives the banner
// timing and queue order end to end without importing the Hud coordinator.
// Hud keeps showBanner and showCelebrationBanner as its public entry points.
//
// A DOM module (registered in UI_DOM_MODULES, tests/architecture.test.ts): it
// writes the element, arms window timers and stamps performance.now().

import {
  type BannerClass,
  type BannerEnqueueOutcome,
  BannerQueue,
  bannerSubtextLines,
} from './banner_queue';
import { decorativeArtImg } from './decorative_art';

/** The visual language the shared #banner slot paints in. 'default' is the
 *  bare gold celebration text every milestone has always used (level up, zone
 *  crossing, craft masterwork, duel result). 'deed' is the Book of Deeds
 *  plate: a framed, quieter parchment treatment, because a deed accomplishment
 *  firing an identical gold banner to a real level-up is a known cause of
 *  players reading routine gathering progress as leveling. 'skill' is the
 *  gathering skill milestone plate: copper craft framing with the profession
 *  crest, so a Mining 50 plate can never steal the character level-up reading. */
export type BannerVariant = 'default' | 'deed' | 'skill' | 'worldQuest';

/** Everything one banner paint needs, held whole so a queued banner (R38)
 *  renders later exactly as it would have rendered immediately. */
interface BannerPayload {
  text: string;
  motion: boolean;
  decorativeIconUrl?: string;
  variant: BannerVariant;
  /** The secondary lines stacked under the title, ALREADY normalized by
   *  `bannerSubtextLines` (never an empty array, never an empty string). Several
   *  exist for the battleground verdict, whose facts (score plus rating swing,
   *  why the match ended, the first-win bonus) are INDEPENDENT sentences: each
   *  stays its own `t()` key on its own line instead of being concatenated. */
  subtext?: string[];
  durationMs: number;
  source: 'unstuck' | null;
  /** The R38 class, kept on the payload so the advance chain can tell a
   *  deferred AMBIENT (droppable when stale) from a celebration. */
  bannerClass: BannerClass;
  /** performance.now() at enqueue, for the ambient max-defer below. */
  enqueuedAt: number;
}

/** The fade gap between a finished banner and the next queued one. */
const BANNER_ADVANCE_GAP_MS = 250;

/** How long a parked AMBIENT banner stays worth replaying. An ambient is
 *  current-state, not history: behind ONE celebration (2600ms + gap) a zone
 *  name or prompt is still fresh enough to show, but behind a celebration
 *  CHAIN a "starting now" or countdown digit replayed many seconds late
 *  misleads (the phase 14 QA finding), so the advance chain drops anything
 *  parked longer than this. Celebrations never age out: "you leveled" stays
 *  true however late it shows. */
const AMBIENT_MAX_DEFER_MS = 4000;

/** The positional arguments BannerSlot.show takes. */
export type BannerShowArgs = Parameters<BannerSlot['show']>;

/** The celebration form of a banner (R38): full motion by default, the
 *  standard 2600ms duration, queued under the given class. Exists so the
 *  celebration call sites stop threading five defaults positionally to reach
 *  the class argument (and so changing the default duration cannot strand
 *  them). `motion` stays a parameter for the reduced-motion celebration plans;
 *  `decorativeIconUrl` and `subtext` carry the art-plus-detail plates (the
 *  gathering skill milestone). Returned as show()'s argument list so Hud keeps
 *  routing every banner through its one showBanner entry point. */
export function celebrationBannerArgs(
  text: string,
  bannerClass: 'levelup' | 'deed',
  variant: BannerVariant = 'default',
  motion = true,
  decorativeIconUrl?: string,
  subtext?: string,
): BannerShowArgs {
  return [text, motion, decorativeIconUrl, variant, subtext, 2600, null, bannerClass];
}

export class BannerSlot {
  private timer: number | undefined;
  // The hideImmediately re-arm's own handle, kept so repeat hides replace the
  // pending re-arm instead of stacking one leaked timer each.
  private hideRearmTimer: number | undefined;
  // R38: the slot's scheduler (celebrations queue, ambient replaces; the pure
  // policy lives in banner_queue.ts, this class owns the timers).
  private readonly queue = new BannerQueue<BannerPayload>();
  private source: 'unstuck' | null = null;

  constructor(
    private readonly el: HTMLElement,
    /** The quest progress banner: it yields its lane for as long as a World
     *  Quest plate paints, so the two never collide (yieldToPlate). */
    private readonly questLane?: { yieldToPlate(plateMs: number): void },
  ) {}

  show(
    text: string,
    motion = true,
    decorativeIconUrl?: string,
    variant: BannerVariant = 'default',
    subtext?: string | string[],
    durationMs = 2600,
    source: 'unstuck' | null = null,
    // R38: celebrations queue instead of last-write-wins; ambient (the
    // default: zone names, prompts, countdowns) keeps replace semantics.
    // See src/ui/banner_queue.ts for the whole policy. The outcome returns
    // so a time-critical caller (the duel and arena countdowns) can lay a
    // durable log line exactly when its banner did NOT show immediately.
    bannerClass: BannerClass = 'ambient',
  ): BannerEnqueueOutcome {
    const subtextLines = bannerSubtextLines(subtext);
    const payload: BannerPayload = {
      text,
      motion,
      decorativeIconUrl,
      variant,
      // Normalized once, here: an EMPTY line list is no subtext at all, and
      // paint's `!!subtext` gate and the has-subtext class must agree.
      subtext: subtextLines.length > 0 ? subtextLines : undefined,
      durationMs,
      source,
      bannerClass,
      enqueuedAt: performance.now(),
    };
    const outcome = this.queue.enqueue(bannerClass, payload);
    if (outcome === 'show') this.paint(payload);
    return outcome;
  }

  /** End the unstuck line early. Queued unstuck entries purge
   *  unconditionally; the LIVE banner clears only when it is itself the
   *  unstuck one. */
  clearUnstuck(): void {
    this.queue.retainQueued((p) => p.source !== 'unstuck');
    if (this.source !== 'unstuck') return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.source = null;
    this.el.replaceChildren();
    this.el.classList.remove('has-subtext');
    this.el.style.opacity = '0';
    // The live slot just ended early: the queue decides what (if anything)
    // takes it, so a level-up waiting behind the unstuck line still shows.
    this.advance();
  }

  /** Hide the live banner NOW for an ambient takeover. */
  hideImmediately(): void {
    // hideLive, not clear (the phase 14 QA): the one caller is the
    // mount-race countdown claiming the slot, an ambient takeover, not a
    // hard reset. Queued celebrations survive to play after the race;
    // only the live element and the stale pending-ambient seat go.
    this.queue.hideLive();
    // Re-arm the advance ourselves (the fix-round review): the takeover
    // caller paints its own ambient right after, whose paint clears this
    // timer, but a future caller that hides WITHOUT showing must not leave
    // surviving celebrations waiting on an unrelated banner. The handle is
    // kept so a second hide inside the gap replaces the pending re-arm
    // rather than stacking another.
    clearTimeout(this.hideRearmTimer);
    this.hideRearmTimer = window.setTimeout(() => {
      this.hideRearmTimer = undefined;
      if (this.timer === undefined && this.source === null) this.advance();
    }, BANNER_ADVANCE_GAP_MS);
    clearTimeout(this.timer);
    this.timer = undefined;
    this.source = null;
    this.el.style.opacity = '0';
    this.el.style.display = 'none';
  }

  /** The paint half of the slot: renders one payload and arms the advance
   *  chain (duration, fade gap, then the queue's next). Only show()'s 'show'
   *  outcome and the advance chain itself call this. */
  private paint(payload: BannerPayload): void {
    const { text, motion, decorativeIconUrl, variant, subtext, durationMs, source } = payload;
    this.el.style.removeProperty('display');
    this.el.classList.toggle('has-subtext', !!subtext);
    if (subtext) {
      const title = document.createElement('span');
      title.className = 'banner-title';
      title.textContent = text;
      // One span per line; the has-subtext rule already stacks them (flex column).
      const details = subtext.map((line) => {
        const detail = document.createElement('span');
        detail.className = 'banner-subtext';
        detail.textContent = line;
        return detail;
      });
      if (decorativeIconUrl) {
        // Art-plus-subtext plate (the gathering skill milestone, and any
        // future variant): crest beside a title/detail column. The wrapper is
        // variant-agnostic; #banner.banner-with-art.has-subtext styles it.
        const copy = document.createElement('span');
        copy.className = 'banner-art-copy';
        copy.append(title, ...details);
        this.el.replaceChildren(decorativeArtImg(document, 'banner-art', decorativeIconUrl), copy);
      } else {
        this.el.replaceChildren(title, ...details);
      }
    } else {
      const copy = document.createElement('span');
      copy.className = 'banner-copy';
      copy.textContent = text;
      if (decorativeIconUrl) {
        this.el.replaceChildren(decorativeArtImg(document, 'banner-art', decorativeIconUrl), copy);
      } else {
        this.el.replaceChildren(copy);
      }
    }
    this.el.classList.toggle('banner-with-art', Boolean(decorativeIconUrl));
    // The banner is ONE reused element, so every variant class must be
    // toggled off as well as on: the next unrelated banner through this slot
    // would otherwise inherit the previous one's visual language.
    this.el.classList.toggle('banner-deed', variant === 'deed');
    this.el.classList.toggle('banner-skill', variant === 'skill');
    this.el.classList.toggle('banner-world-quest', variant === 'worldQuest');
    if (variant === 'worldQuest') this.questLane?.yieldToPlate(durationMs);
    this.el.classList.toggle('banner-loot', payload.bannerClass === 'loot');
    // Reduced-motion celebrations (craft plan.motion) show and hide the
    // banner without the fade transition: identical text and duration, no
    // animation. Motion-trimming only; information always survives.
    this.el.classList.toggle('banner-no-motion', !motion);
    this.el.style.opacity = '1';
    this.source = source;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.el.style.opacity = '0';
      this.source = null;
      // The fade gap before the next queued banner, so back-to-back
      // celebrations read as two banners rather than one changing its text.
      this.timer = window.setTimeout(() => this.advance(), BANNER_ADVANCE_GAP_MS);
    }, durationMs);
  }

  /** Advance the slot to the next queued payload, dropping any parked AMBIENT
   *  older than AMBIENT_MAX_DEFER_MS (stale current-state; the doc above the
   *  constant). Celebrations paint however late they surface. */
  private advance(): void {
    for (;;) {
      const next = this.queue.advance();
      if (!next) return;
      if (
        next.bannerClass === 'ambient' &&
        performance.now() - next.enqueuedAt > AMBIENT_MAX_DEFER_MS
      ) {
        continue;
      }
      this.paint(next);
      return;
    }
  }
}
