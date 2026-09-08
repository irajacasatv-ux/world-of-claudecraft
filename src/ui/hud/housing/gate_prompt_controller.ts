import { dungeonAt } from '../../../sim/data';
import {
  FREEHOLD_GATE_INTERACT_RANGE,
  FREEHOLD_GATE_TEMPLATE_ID,
} from '../../../sim/freehold/gate_rules';
import { dist2d } from '../../../sim/types';
import type { IWorld } from '../../../world_api';
import { markDialogRoot } from '../../dialog_root';
import {
  captureFocusKey,
  findFocusKey,
  focusedWithin,
  restoreFirstEnabled,
} from '../../focus_restore';
import { t } from '../../i18n';
import { bindChromeButtonKeyGuard, bindPointerBlur } from '../../pointer_blur';
import { focusActiveTab, wireTabStrip } from '../../tab_strip_painter';
import { gatePromptHtml } from './gate_prompt_painter';
import {
  beginGateLookup,
  canPresentFreeholdGate,
  editGateName,
  type FreeholdDeniedEvent,
  failGateLookup,
  freeholdDeniedLineKey,
  type GateEntryRequest,
  type GateLookupRequest,
  type GateVisitCapability,
  gateEntryResolution,
  gateVisitAuthorized,
  newHousingGateDraft,
  resolveGateLookup,
} from './housing_view';

export function freeholdGateRoot(): HTMLElement {
  let root = document.getElementById('freehold-gate-window');
  if (!root) {
    root = document.createElement('div');
    root.id = 'freehold-gate-window';
    root.className = 'window panel';
    root.style.display = 'none';
    document.getElementById('ui')!.appendChild(root);
  }
  return root;
}
/** Dormant host seam: only a future authorized visiting service supplies this. */
export interface FreeholdFriendAdapter {
  lookup(request: GateLookupRequest): Promise<GateVisitCapability | null>;
  enter(capability: GateVisitCapability): void;
}
export interface FreeholdGateDeps {
  friend?: FreeholdFriendAdapter;
  root(): HTMLElement;
  world(): IWorld;
  closeOthers(): void;
  captureFocus(): HTMLElement | null;
  restoreFocus(target: HTMLElement | null): void;
  onVisibilityChange(): void;
}
/** Cold dialog. The event drain reconciles entry; closing retires local waiting only. */
export class FreeholdGatePrompt {
  private draft = newHousingGateDraft();
  private opener: HTMLElement | null = null;
  private generation = 0;
  private pending: GateEntryRequest | null = null;
  private statusKey:
    | ReturnType<typeof freeholdDeniedLineKey>
    | 'hudChrome.housing.common.unavailable'
    | null = null;
  private boundRoot: HTMLElement | null = null;
  private retryFocus = false;
  private visible = false;
  constructor(private readonly deps: FreeholdGateDeps) {}
  get isOpen(): boolean {
    return this.visible;
  }
  open(): void {
    if (!this.canEnter()) return;
    const opening = !this.visible;
    if (!this.visible) {
      this.deps.closeOthers();
      this.opener = this.deps.captureFocus();
      this.generation++;
      this.visible = true;
      const root = this.deps.root();
      markDialogRoot(root, { labelledBy: 'freehold-gate-title' });
      // This root is created after the HUD's boot-time chrome wiring.
      if (this.boundRoot !== root) {
        bindChromeButtonKeyGuard(root);
        bindPointerBlur(root);
        this.boundRoot = root;
      }
      root.style.display = 'flex';
      this.deps.onVisibilityChange();
    }
    this.paint(opening);
  }
  close(accepted = false): void {
    if (!this.visible) return;
    this.visible = false;
    this.pending = null;
    this.statusKey = null;
    this.retryFocus = false;
    editGateName(this.draft, this.draft.name);
    this.generation++;
    const root = this.deps.root();
    if (
      accepted &&
      root.contains(document.activeElement) &&
      document.activeElement instanceof HTMLElement
    )
      document.activeElement.blur();
    root.style.display = 'none';
    // Closing does not cancel server work or retry it. A new confirmation is
    // fresh user intent, including after a silently shed or unsent request.
    this.deps.restoreFocus(accepted ? null : this.opener);
    this.opener = null;
    this.deps.onVisibilityChange();
  }
  relocalize(): void {
    if (this.visible) this.paint();
  }
  notifyDenied(event: FreeholdDeniedEvent): void {
    if (!this.pending || event.pid !== this.pending.pid) return;
    this.pending = null;
    this.statusKey = freeholdDeniedLineKey(event.reason);
    if (this.visible) this.paint(false, this.retryFocus);
    this.retryFocus = false;
  }
  onReconnected(): void {
    // Hello precedes the fresh snapshot. Retire the uncertain request and its
    // stale prompt; reopening is a new user decision, never an automatic retry.
    if (!this.pending && !this.draft.request && !this.draft.capability) return;
    this.pending = null;
    this.statusKey = null;
    this.retryFocus = false;
    this.close(true);
  }
  reconcile(): void {
    if (!this.pending) return;
    const world = this.deps.world();
    const player = world.player;
    const home = dungeonAt(player.pos.x);
    if (
      gateEntryResolution(
        this.pending,
        world.playerId,
        player.dungeonEntrySeq ?? 0,
        home?.claimKey === 'owner',
      ) !== 'pending'
    ) {
      this.pending = null;
      this.close(true);
    }
  }
  private canEnter(): boolean {
    const world = this.deps.world();
    if (!world.cfg.freeholdsEnabled || !canPresentFreeholdGate(world.player)) return false;
    for (const entity of world.entities.values()) {
      if (
        entity.kind === 'object' &&
        entity.templateId === FREEHOLD_GATE_TEMPLATE_ID &&
        dist2d(entity.pos, world.player.pos) <= FREEHOLD_GATE_INTERACT_RANGE
      )
        return true;
    }
    return false;
  }
  private enter(generation: number): void {
    if (
      !this.visible ||
      generation !== this.generation ||
      this.pending ||
      (this.draft.tab === 'visit' && (!this.deps.friend || !gateVisitAuthorized(this.draft)))
    )
      return;
    if (!this.refreshEligibility()) return;
    const world = this.deps.world();
    this.retryFocus = focusedWithin(this.deps.root()) !== null;
    this.statusKey = null;
    this.pending = { entrySeq: world.player.dungeonEntrySeq ?? 0, pid: world.playerId };
    const capability = this.draft.tab === 'visit' ? this.draft.capability : null;
    this.paint();
    if (capability) this.deps.friend!.enter({ ...capability });
    else world.freeholdEnter();
    this.reconcile();
  }
  private async lookup(generation: number): Promise<void> {
    const adapter = this.deps.friend;
    if (
      !adapter ||
      !this.visible ||
      generation !== this.generation ||
      this.pending ||
      this.draft.tab !== 'visit'
    )
      return;
    if (!this.refreshEligibility()) return;
    this.statusKey = null;
    const request = beginGateLookup(this.draft);
    if (!request) {
      this.paint();
      return;
    }
    this.paint();
    let result: GateVisitCapability | null;
    try {
      result = await adapter.lookup({ ...request });
    } catch {
      result = null;
    }
    const matched = result
      ? resolveGateLookup(this.draft, result)
      : failGateLookup(this.draft, request);
    if (matched && this.visible)
      this.paint(
        false,
        false,
        this.draft.tab === 'visit' ? (result ? 'gate-result' : 'gate-lookup') : null,
      );
  }
  private refreshEligibility(): boolean {
    if (this.canEnter()) return true;
    this.statusKey = 'hudChrome.housing.common.unavailable';
    this.paint();
    return false;
  }
  private paint(opening = false, retry = false, completedFocus: string | null = null): void {
    if (!this.visible) return;
    const root = this.deps.root();
    const hadFocus = focusedWithin(root) !== null;
    const focus = captureFocusKey(root);
    const generation = ++this.generation;
    let content = root.querySelector<HTMLElement>('.fh-gate-content');
    let status = root.querySelector<HTMLElement>('.fh-gate-status');
    let actions = root.querySelector<HTMLElement>('.fh-gate-actions');
    if (!content || !status || !actions) {
      root.innerHTML =
        '<div class="fh-gate-content"></div><p id="gate-visit-status" class="fh-gate-status" role="status" aria-atomic="true"></p><div class="fh-gate-actions"></div>';
      content = root.querySelector('.fh-gate-content')!;
      status = root.querySelector('.fh-gate-status')!;
      actions = root.querySelector('.fh-gate-actions')!;
    }
    const canEnter = this.canEnter();
    const markup = gatePromptHtml(this.draft, canEnter, this.pending !== null, !!this.deps.friend);
    content.innerHTML = markup.content;
    actions.innerHTML = markup.actions;
    root.setAttribute('aria-busy', this.pending || this.draft.request ? 'true' : 'false');
    status.textContent = this.pending
      ? t('hudChrome.housing.gate.loading')
      : this.statusKey
        ? t(this.statusKey)
        : !canEnter
          ? t('hudChrome.housing.common.unavailable')
          : this.draft.tab === 'visit'
            ? markup.lookupStatus
            : '';
    // Clear refusal text at retry, so the same refusal changes this persistent live region again.
    wireTabStrip(root, 'fh-gate-tab', (id, focusFollow) => {
      if (generation !== this.generation || !this.visible) return;
      this.draft.tab = id === 'own' ? 'own' : 'visit';
      this.statusKey = null;
      this.paint();
      if (focusFollow) focusActiveTab(root, 'fh-gate-tab', 'on');
    });
    const name = findFocusKey(root, 'gate-name') as HTMLInputElement | null;
    const edit = (): void => {
      if (!name || generation !== this.generation) return;
      const focused = document.activeElement === name;
      const start = name.selectionStart,
        end = name.selectionEnd;
      this.statusKey = null;
      editGateName(this.draft, name.value);
      this.paint();
      if (focused)
        (findFocusKey(root, 'gate-name') as HTMLInputElement | null)?.setSelectionRange(start, end);
    };
    name?.addEventListener('input', (event) => {
      // Invalidate authority even during IME composition, without replacing its input.
      if (generation !== this.generation) return;
      this.statusKey = null;
      editGateName(this.draft, name.value);
      if (!(event as InputEvent).isComposing) edit();
      else {
        findFocusKey(root, 'gate-enter')?.remove();
        findFocusKey(root, 'gate-result')?.remove();
        status!.textContent = gatePromptHtml(
          this.draft,
          this.canEnter(),
          this.pending !== null,
          !!this.deps.friend,
        ).lookupStatus;
      }
    });
    name?.addEventListener('compositionend', edit);
    name?.addEventListener('keydown', (event) => {
      if (generation !== this.generation || !this.visible || event.isComposing) return;
      // Input leaves text fields alone, so route Escape to the same cancel
      // lifecycle as the Close control while preserving IME cancellation.
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        void this.lookup(generation);
      }
    });
    findFocusKey(root, 'gate-lookup')?.addEventListener('click', () => {
      void this.lookup(generation);
    });
    findFocusKey(root, 'gate-enter')?.addEventListener('click', () => this.enter(generation));
    findFocusKey(root, 'gate-close')!.addEventListener('click', () => {
      if (generation === this.generation) this.close();
    });
    if (opening) focusActiveTab(root, 'fh-gate-tab', 'on');
    else if (hadFocus)
      restoreFirstEnabled([
        completedFocus ? findFocusKey(root, completedFocus) : null,
        retry ? findFocusKey(root, 'gate-enter') : null,
        focus ? findFocusKey(root, focus) : null,
        root.querySelector<HTMLElement>('.fh-gate-tab.on'),
        findFocusKey(root, 'gate-close'),
      ]);
  }
}
