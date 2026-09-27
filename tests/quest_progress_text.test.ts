import { describe, expect, it } from 'vitest';
import { t } from '../src/ui/i18n';
import { questProgressEventText, questProgressText } from '../src/ui/quest_progress_text';

describe('questProgressText', () => {
  it('formats an objective label with its current and total counts', () => {
    expect(questProgressText('Wolves slain', 3, 10)).toBe(
      t('questUi.detail.objectiveProgress', { label: 'Wolves slain', current: '3', total: '10' }),
    );
    // Whole numbers in the viewer's locale: grouped, never a fraction digit.
    expect(questProgressText('Wolves slain', 1234.4, 2000)).toBe('Wolves slain: 1,234/2,000');
  });
});

describe('questProgress event localization', () => {
  it('uses the structured objective identity and values instead of parsing English text', () => {
    expect(
      questProgressEventText({
        questId: 'q_wolves',
        objectiveIndex: 0,
        current: 3,
        required: 8,
        text: 'this legacy fallback must not be parsed',
      }),
    ).toBe('Forest Wolf slain: 3/8');
  });

  it('keeps the English-text parser only as compatibility for an older server payload', () => {
    expect(
      questProgressEventText({
        questId: 'q_wolves',
        text: 'Forest Wolf slain: 2/8',
      }),
    ).toBe('Forest Wolf slain: 2/8');
  });

  it('returns an unrecognized legacy payload unchanged', () => {
    expect(
      questProgressEventText({
        questId: 'missing_quest',
        text: 'Unrecognized progress',
      }),
    ).toBe('Unrecognized progress');
  });
});
