// The chat and combat log line appender, extracted from Hud.appendLog and
// Hud.appendChatItemLink so a suite drives the real line without importing the
// Hud coordinator. One line's chrome (its color, the optional Show Timestamps
// prefix, the chat pane's channel tag and tab filter, the decorative seal), its
// body (verbatim text, a caller-assembled node body, or the [[i:id]] / [[q:id]]
// token splice with quality-colored item links), the #chat-live announce, the
// 200-line trim and the follow-the-bottom scroll. Hud keeps log / logNodes /
// appendLog as delegators and hands its live state in through
// ChatLogAppendDeps, built once on the first line and reused (its closures
// read the live state per call).
//
// A DOM module (registered in UI_DOM_MODULES, tests/architecture.test.ts): it
// mints nodes on `document`, reads the wall clock for the timestamp prefix and
// performance.now() for the announcer, exactly as the Hud methods did.

import { ITEMS, QUESTS } from '../../../sim/data';
import type { ItemDef, ItemInstancePayload } from '../../../sim/types';
import { decorativeArtImg } from '../../decorative_art';
import { questTitle } from '../../entity_display_core';
import { itemDisplayName } from '../../entity_i18n';
import { itemPresentationInstance } from '../../item_instance_view';
import { itemNameColor } from '../../item_name_color';
import { knownItemDef } from '../../known_item';
import { lootQualityAriaName } from '../../loot_quality_view';
import { parseChatSegments } from '../quest/quest_link';
import type { ChatAnnouncer } from './chat_announcer';
import type { ChatScrollFollow } from './chat_scroll_follow';
import { type ChatClock, formatChatTimestamp } from './chat_timestamp';

/** What a chat item link needs from its host: the profanity mask the
 *  unknown-id fallback runs through, and the shared tooltip binding plus the
 *  composed item card it shows on hover or focus. */
export interface ChatItemLinkDeps {
  maskChat(text: string): string;
  attachTooltip(el: HTMLElement, html: () => string): void;
  itemTooltip(item: ItemDef, compare: boolean, instance?: ItemInstancePayload): string;
}

/** The host state one appended line reads. */
export interface ChatLogAppendDeps extends ChatItemLinkDeps {
  /** The chat pane. Only its lines are channel-tagged, tab-filtered,
   *  linkified and announced; any other pane (the combat log) takes the plain
   *  path. */
  readonly chatLogEl: HTMLElement;
  /** The follow-the-bottom tracker both log panes share. */
  follow(): ChatScrollFollow;
  /** The Show Timestamps clock, or null while the option is off. */
  timestampClock(): ChatClock | null;
  /** Hides a line its channel's tab filter excludes. */
  hideIfFiltered(div: HTMLElement, chan: string): void;
  /** The tab-independent #chat-live announcer. */
  readonly chatAnnouncer: Pick<ChatAnnouncer, 'push'>;
}

/** One log line. */
export interface ChatLogLine {
  /** Text, or a caller-assembled node body (the deed-link splice, the
   *  exact-copy loot receipt link) that lands verbatim. */
  readonly body: string | readonly Node[];
  readonly color: string;
  /** Prepend the Show Timestamps prefix (when the option is on). */
  readonly timestamp?: boolean;
  /** The chat pane's channel tag, which the tab filter keys on. */
  readonly chan?: string;
  readonly decorativeIconUrl?: string;
  /** True forces the single-text-node path even on the chat pane: the line
   *  renders VERBATIM and [[i:...]]/[[q:...]] tokens are never turned into
   *  links. For player-authored surfaces whose home rendering is plain escaped
   *  text (the guild billboard echo: the social pane shows the MOTD via esc(),
   *  so guild-controlled text must not mint trusted clickable item links in
   *  chat either). */
  readonly plainText?: boolean;
  /** Sender-only command feedback must still reach the tab-independent live
   *  region when its durable channel line is filtered by another active tab. */
  readonly announceWhenFiltered?: boolean;
}

/** The chat-pane line Hud.log appends: timestamped, on the given channel,
 *  with a string or node body. Its parameters are log()'s own, in order, so
 *  the plainText opt-out a player-authored line depends on (a chosen legendary
 *  name, the guild billboard) threads through in exactly one place. */
export function chatLogLine(
  body: string | readonly Node[],
  color: string,
  decorativeIconUrl: string | undefined,
  chan: string,
  announceWhenFiltered: boolean,
  plainText: boolean,
): ChatLogLine {
  return { body, color, timestamp: true, chan, decorativeIconUrl, plainText, announceWhenFiltered };
}

/** Prepend a dim bracketed wall-clock prefix to a chat line when the "Show
 *  Timestamps" option is on (a non-null clock); a no-op otherwise. Wall-clock
 *  time is fine here: the determinism ban is sim-only. */
export function prependChatTimestamp(div: HTMLElement, clock: ChatClock | null): void {
  if (clock === null) return;
  const ts = document.createElement('span');
  ts.className = 'chat-ts ui-faint ui-num';
  ts.textContent = `${formatChatTimestamp(new Date(), clock)} `;
  div.appendChild(ts);
}

/** Announce a visible #chatlog line through #chat-live, mirroring the old
 *  aria-live: channel-filtered .chat-hidden lines stay silent, matching
 *  display:none live-region children. The relayed text is the rendered line
 *  text the screen reader read off the div (sender + message, already
 *  localized); ChatAnnouncer coalesces + throttles a burst. Both chat append
 *  paths (this appender's chat case and Hud.chatLogFrom) call this so player
 *  chat and system chat announce alike, as #chatlog's implicit-polite log did
 *  before the decouple. */
export function announceChatLine(
  div: HTMLElement,
  announcer: Pick<ChatAnnouncer, 'push'>,
  announceWhenFiltered = false,
): void {
  if (!announceWhenFiltered && div.classList.contains('chat-hidden')) return;
  announcer.push(div.textContent ?? '', performance.now());
}

/** A [[i:id]] chat segment as a quality-colored, inspectable item link. Quest
 *  kinds use quest gold (purpose class) via itemNameColor so chat matches bag /
 *  tooltip / loot name language. Hover and focus show the same item tooltip
 *  the bags window uses; an unknown id (content drift between players)
 *  degrades to a plain [?]. */
export function chatItemLinkEl(
  doc: Document,
  itemId: string,
  deps: ChatItemLinkDeps,
  instance?: ItemInstancePayload,
): Text | HTMLSpanElement {
  // knownItemDef, not bare truthiness: a peer-typed prototype key must miss.
  const item = knownItemDef(ITEMS, itemId);
  if (!item) return doc.createTextNode(deps.maskChat('[?]'));
  const link = doc.createElement('span');
  link.className = 'chat-item-link';
  link.style.color = itemNameColor(item);
  const shown = itemPresentationInstance(item.kind, instance);
  link.textContent = `[${lootQualityAriaName(itemDisplayName(item), shown)}]`;
  link.tabIndex = 0;
  deps.attachTooltip(link, () => deps.itemTooltip(item, true, instance));
  return link;
}

/** Append one line to a log pane (the chat pane or the combat pane). */
export function appendChatLogLine(
  el: HTMLElement,
  line: ChatLogLine,
  deps: ChatLogAppendDeps,
): void {
  const {
    body,
    color,
    timestamp = false,
    chan = 'system',
    decorativeIconUrl,
    plainText = false,
    announceWhenFiltered = false,
  } = line;
  const follow = deps.follow();
  const wasNearBottom = follow.shouldFollow(el);
  const chatPane = el === deps.chatLogEl;
  const div = document.createElement('div');
  div.style.color = color;
  if (timestamp) prependChatTimestamp(div, deps.timestampClock());
  // tag + filter only the chat pane; the combat pane is a separate view
  if (chatPane) {
    div.dataset.chan = chan;
    deps.hideIfFiltered(div, chan);
  }
  if (decorativeIconUrl) {
    div.append(decorativeArtImg(document, 'chat-masterwork-seal', decorativeIconUrl));
  }
  // A caller-assembled node body (the deed-link splice) lands verbatim.
  // Loot lines carry name-free item tokens ([[i:id]]); render those as clickable
  // links via the shared chat item-link renderer. Plain system/combat lines keep
  // the fast text-node path (the substring test never fires for tokenless lines),
  // and a plainText caller opts out entirely (see ChatLogLine.plainText).
  if (typeof body !== 'string') {
    for (const node of body) div.append(node);
  } else if (!plainText && chatPane && body.includes('[[i:')) {
    for (const seg of parseChatSegments(body)) {
      if (seg.kind === 'item') div.append(chatItemLinkEl(document, seg.itemId, deps));
      else if (seg.kind === 'quest')
        div.append(
          document.createTextNode(`[${QUESTS[seg.questId] ? questTitle(seg.questId) : '?'}]`),
        );
      else div.append(document.createTextNode(seg.value));
    }
  } else {
    div.append(document.createTextNode(body));
  }
  el.appendChild(div);
  // Announce chat-pane lines through #chat-live (the combat pane has its own announcer).
  if (chatPane) announceChatLine(div, deps.chatAnnouncer, announceWhenFiltered);
  while (el.children.length > 200) {
    const first = el.firstChild;
    if (!first) break;
    el.removeChild(first);
  }
  if (wasNearBottom) follow.scrollToBottom(el);
}
