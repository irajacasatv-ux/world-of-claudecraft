import type { Page } from 'puppeteer-core';

export type FreeholdNoticeResolution =
  | 'boot-notice'
  | 'performance-notice'
  | 'prior-performance-dismissal';
export function settleFreeholdCaptureNotices(
  page: Pick<Page, 'waitForFunction' | '$' | 'tap' | 'click' | 'waitForSelector'>,
  mobile: boolean,
): Promise<{
  noticeResolution: FreeholdNoticeResolution;
  dismissedIds: string[];
}>;
export function freeholdOverlayPass(): string[];
export function settleFreeholdCaptureOverlays(
  page: Pick<Page, 'evaluate'>,
  options?: { quietPasses?: number; pollMs?: number; maxPasses?: number },
): Promise<{ dismissedOverlays: string[]; passes: number }>;
