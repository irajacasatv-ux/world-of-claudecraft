import { t } from '../../i18n';
import { type FreeholdDeniedEvent, freeholdDeniedLineKey } from './housing_view';

/** Housing denials have one personal toast, with no log, sound or arrival output. */
export function handleFreeholdEvent(
  event: FreeholdDeniedEvent,
  host: { showError(text: string): void },
): void {
  host.showError(t(freeholdDeniedLineKey(event.reason)));
}
