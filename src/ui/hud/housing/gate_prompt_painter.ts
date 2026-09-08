import { esc } from '../../esc';
import { FOCUS_KEY_ATTR } from '../../focus_restore';
import { t } from '../../i18n';
import { tabStripHtml, tabStripModel } from '../../tab_strip_view';
import {
  gateLookupLine,
  gateOwnEntryEnabled,
  gateVisitAuthorized,
  type HousingGateDraft,
} from './housing_view';

/** Cold HTML composition only; the controller owns DOM and request lifetimes. */
export function gatePromptHtml(
  draft: HousingGateDraft,
  canEnter: boolean,
  pending: boolean,
  friendAvailable = false,
): { content: string; actions: string; lookupStatus: string } {
  const own = draft.tab === 'own';
  const authorized = friendAvailable && gateVisitAuthorized(draft);
  const lookupLine = gateLookupLine(draft, friendAvailable);
  const lookupStatus = t(lookupLine.key, { name: lookupLine.name ?? '' });
  const tabs = tabStripHtml(
    tabStripModel({
      ariaLabel: t('hudChrome.housing.gate.title'),
      panelId: 'gate-panel',
      stripClass: 'fh-gate-tabs',
      tabClass: 'fh-gate-tab soc-tab',
      selectedClass: 'on',
      selected: draft.tab,
      tabs: [
        { id: 'own', label: t('hudChrome.housing.gate.own'), buttonId: 'gate-own-tab' },
        { id: 'visit', label: t('hudChrome.housing.gate.visit'), buttonId: 'gate-visit-tab' },
      ],
    }),
  );
  const body = own
    ? `<label for="gate-home">${esc(t('hudChrome.housing.gate.homeChoice'))}</label><select class="hud-select" id="gate-home" ${FOCUS_KEY_ATTR}="gate-home"><option>${esc(t('hudChrome.housing.gate.own'))}</option></select>`
    : `<label for="gate-name">${esc(t('hudChrome.housing.gate.name'))}</label><input class="fh-gate-name" id="gate-name" ${FOCUS_KEY_ATTR}="gate-name" value="${esc(draft.name)}" placeholder="${esc(t('hudChrome.housing.gate.namePlaceholder'))}" autocomplete="off" aria-describedby="gate-visit-status"><button type="button" class="btn" ${FOCUS_KEY_ATTR}="gate-lookup" ${!friendAvailable || draft.request || pending ? 'disabled' : ''}>${esc(t(draft.lookupState === 'failed' ? 'hudChrome.housing.common.retry' : 'hudChrome.housing.gate.lookup'))}</button>`;
  return {
    lookupStatus,
    content: `<h2 id="freehold-gate-title">${esc(t('hudChrome.housing.gate.title'))}</h2>${tabs}<div id="gate-panel" class="fh-gate-body" role="tabpanel" aria-labelledby="gate-${draft.tab}-tab">${body}</div>`,
    actions: `${own || authorized ? `<button type="button" class="btn" ${FOCUS_KEY_ATTR}="gate-enter" ${(own ? gateOwnEntryEnabled(draft.tab, canEnter, pending) : canEnter && !pending) ? '' : 'disabled'}>${esc(t('hudChrome.housing.gate.enter'))}</button>` : ''}<button type="button" class="btn" ${FOCUS_KEY_ATTR}="gate-close" aria-label="${esc(t('hudChrome.housing.common.closeAria', { window: t('hudChrome.housing.gate.title') }))}">${esc(t('hudChrome.housing.common.close'))}</button>`,
  };
}
