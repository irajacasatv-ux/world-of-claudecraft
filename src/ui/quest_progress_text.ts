// Localized quest progress text. questProgressText is the objective progress
// line ("Wolves slain: 3/10") the quest dialog, the mob tooltip and the quest
// item card share. questProgressEventText presents questProgress
// events: current events identify the objective and numbers structurally, so
// localization never depends on matching an English content label. The text
// parser remains only for rolling compatibility with an older server that does
// not yet send the structured fields.

import { QUESTS } from '../sim/data';
import { formatCount } from './count_format';
import { tEntity } from './entity_i18n';
import { formatNumber, t } from './i18n';

/** One objective's progress line: its localized label with the current and
 *  total counts as whole numbers in the viewer's locale. */
export function questProgressText(label: string, current: number, total: number): string {
  return t('questUi.detail.objectiveProgress', {
    label,
    current: formatCount(current),
    total: formatCount(total),
  });
}

export interface QuestProgressEventInput {
  questId: string;
  text: string;
  objectiveIndex?: number;
  current?: number;
  required?: number;
}

function progressText(questId: string, objectiveIndex: number, current: number, total: number) {
  return t('questUi.logs.progress', {
    label: tEntity({ kind: 'questObjective', questId, objectiveIndex, field: 'label' }),
    current: formatNumber(current, { maximumFractionDigits: 0 }),
    total: formatNumber(total, { maximumFractionDigits: 0 }),
  });
}

export function questProgressEventText(event: QuestProgressEventInput): string {
  const quest = QUESTS[event.questId];
  if (
    quest &&
    Number.isInteger(event.objectiveIndex) &&
    event.objectiveIndex !== undefined &&
    event.objectiveIndex >= 0 &&
    event.objectiveIndex < quest.objectives.length &&
    typeof event.current === 'number' &&
    Number.isFinite(event.current) &&
    typeof event.required === 'number' &&
    Number.isFinite(event.required)
  ) {
    return progressText(event.questId, event.objectiveIndex, event.current, event.required);
  }

  const match = /^(.+): (\d+)\/(\d+)$/.exec(event.text);
  if (!quest || !match) return event.text;
  const objectiveIndex = quest.objectives.findIndex((objective) => objective.label === match[1]);
  if (objectiveIndex < 0) return event.text;
  return progressText(event.questId, objectiveIndex, Number(match[2]), Number(match[3]));
}
