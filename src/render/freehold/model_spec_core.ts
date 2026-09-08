/** Measured static stand-ins. Box parts are in yards, with floor at local y=0. */
export interface FreeholdModelPart {
  size: readonly [number, number, number];
  center: readonly [number, number, number];
  color: number;
}
export type FreeholdModelKind = 'bed' | 'hearth' | 'plinth' | 'entry_door';

export const FREEHOLD_MODEL_PARTS: Readonly<
  Record<FreeholdModelKind, readonly FreeholdModelPart[]>
> = {
  bed: [
    { size: [2.6, 0.3, 4.2], center: [0, 0.45, 0], color: 0x72513a },
    { size: [2.4, 0.3, 3.8], center: [0, 0.75, 0], color: 0xe9dcc0 },
    { size: [2.42, 0.12, 2.6], center: [0, 0.96, -0.5], color: 0x5d7e6e },
    { size: [1.8, 0.2, 0.65], center: [0, 1, 1.28], color: 0xf1e5ce },
    { size: [2.6, 1.5, 0.2], center: [0, 0.75, 2], color: 0x72513a },
    { size: [2.6, 0.9, 0.2], center: [0, 0.45, -2], color: 0x72513a },
    { size: [0.24, 0.4, 0.24], center: [-1.13, 0.2, -1.7], color: 0x72513a },
    { size: [0.24, 0.4, 0.24], center: [1.13, 0.2, -1.7], color: 0x72513a },
    { size: [0.24, 0.4, 0.24], center: [-1.13, 0.2, 1.7], color: 0x72513a },
    { size: [0.24, 0.4, 0.24], center: [1.13, 0.2, 1.7], color: 0x72513a },
  ],
  hearth: [
    { size: [3.2, 0.2, 1.4], center: [0, 0.1, 0], color: 0xada591 },
    { size: [0.55, 2.35, 1.1], center: [-1.225, 1.375, 0.1], color: 0xada591 },
    { size: [0.55, 2.35, 1.1], center: [1.225, 1.375, 0.1], color: 0xada591 },
    { size: [3.2, 0.3, 1.4], center: [0, 2.65, 0], color: 0xcac0a7 },
    { size: [2.2, 0.4, 0.9], center: [0, 3, 0.2], color: 0xada591 },
    { size: [1.9, 2.3, 0.15], center: [0, 1.35, 0.625], color: 0x34322e },
    { size: [1.9, 0.15, 1], center: [0, 0.25, 0.1], color: 0x34322e },
  ],
  entry_door: [
    { size: [2.4, 3.2, 0.08], center: [0, 1.6, 0.02], color: 0x72513a },
    { size: [0.16, 3.2, 0.12], center: [-1.12, 1.6, 0], color: 0x8b6746 },
    { size: [0.16, 3.2, 0.12], center: [1.12, 1.6, 0], color: 0x8b6746 },
    { size: [2.4, 0.16, 0.12], center: [0, 3.12, 0], color: 0x8b6746 },
    { size: [0.12, 0.3, 0.12], center: [0.8, 1.4, 0], color: 0xc2a870 },
  ],
  plinth: [
    { size: [1.2, 0.01, 1.2], center: [0, 0.005, 0], color: 0xada591 },
    { size: [1.02, 0.01, 1.02], center: [0, 0.015, 0], color: 0xcac0a7 },
  ],
};
