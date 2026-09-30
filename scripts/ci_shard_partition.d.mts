export type WeightedItem = {
  id: unknown;
  weight: number;
  key: string;
};

export declare const DURATION_WEIGHT_OVERLAY: Readonly<Record<string, number>>;
export declare const MEASURED_WEIGHTS: Readonly<Record<string, number>>;
export declare const MEASURED_FALLBACK_MS: number;

export declare function partitionByStripe(
  items: ReadonlyArray<WeightedItem>,
  count: number,
): WeightedItem[][];

export declare function partitionByLpt(
  items: ReadonlyArray<WeightedItem>,
  count: number,
  cost?: (item: WeightedItem) => number,
): WeightedItem[][];

export declare const PER_FILE_OVERHEAD_MS: number;

export declare function packingCost(item: WeightedItem): number;

export declare function partitionForCi(
  items: ReadonlyArray<WeightedItem>,
  count: number,
): WeightedItem[][];

export declare function weightForTestFile(relPath: string, body: string, size: number): number;

export declare function assertPartitionCompleteness(
  items: ReadonlyArray<WeightedItem>,
  packs: ReadonlyArray<ReadonlyArray<WeightedItem>>,
): { ok: true } | { ok: false; reason: string };
