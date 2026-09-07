export type Point = [number, number, number];
export type Bounds = { min: Point; max: Point; size: Point };
export function boundsOf(points: number[][]): Bounds;
export function transformPoint(point: number[], matrix: number[]): number[];
export function placementProposal(
  points: number[][],
  options: { scale: number | Point; pitch: number; underlay?: boolean; floorLift?: number },
): {
  translationBeforeScale: number[];
  scale: Point;
  postScaleTranslation: Point;
  yaw: number;
  bounds: Bounds;
  intendedWorldHeight: number;
  measuredVertexRadius: number;
  conservativeBoxRadius: number;
  footprint: { width: number; depth: number };
  r: number;
  collisionClass: string;
  circleSlack: number | null;
  envelopeSlack: number[];
  fixtures: {
    finitePositiveFootprint: boolean;
    vertexEnvelopeContained: boolean;
    solidVertexRadiusContained: boolean;
    quarterTurnSwapsFootprint: { width: number; depth: number };
  };
};
export function decorProposal(
  metrics: Record<string, number>,
  reference: Record<string, number>,
): { components: Record<string, number>; decorCost: number };
