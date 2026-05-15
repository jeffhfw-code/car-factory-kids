export type PartCategory = 'chassis' | 'engine' | 'wheels' | 'interior' | 'tech';

export type PaintFinish = 'matte' | 'gloss' | 'metallic';

export type SurfaceType = 'paved' | 'dirt' | 'snow' | 'wet' | 'mixed';

export interface RaceStats {
  // Visible (shown in the Lab spec sheet from day one)
  topSpeedRating: number; // 0-10
  accelerationRating: number; // 0-10
  brakingRating: number; // 0-10
  gripRating: number; // 0-10
  rangeRating: number; // 0-10
  stabilityRating: number; // 0-10
  weightLbs: number; // 1500-6000

  // Hidden (unlocked through racing discoveries)
  offRoadTractionRating: number; // 0-10
  wetGripRating: number; // 0-10
  hillClimbRating: number; // 0-10
  aerodynamicsRating: number; // 0-10
  coolingRating: number; // 0-10
  tireWearRating: number; // 0-10
  groundClearanceRating: number; // 0-10
  efficiencyRating: number; // 0-10
}

export type MetricKey = keyof RaceStats;

export type StatModifiers = Partial<RaceStats>;

export interface Part {
  id: string;
  category: PartCategory;
  name: string;
  description: string;
  modifiers: StatModifiers;
}

export interface PaintColor {
  id: string;
  name: string;
  hex: string;
}

export interface BuildParts {
  chassisId: string;
  engineId: string;
  wheelsId: string;
  interiorId: string;
  techIds: string[]; // max 3
}

export interface LabResults {
  topSpeedMph: number;
  zeroToSixtySeconds: number;
  brakingDistanceFeet: number;
  slalomSpeedMph: number;
  rangeMiles: number;
  stabilityMph: number;
}

export interface Build {
  id: string;
  name: string;
  paintColorId: string;
  paintFinish: PaintFinish;
  parts: BuildParts;
  cachedStats?: RaceStats;
  cachedLabResults?: LabResults;
  createdAt: number;
  lastModified: number;
}

export interface ValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

export interface StatCalculationResult {
  stats: RaceStats;
  validation: ValidationResult;
}

export interface TrackSegment {
  type: 'straight' | 'curve_left' | 'curve_right' | 'hill_up' | 'hill_down';
  lengthMeters: number;
  curvatureRadius?: number;
  elevationDelta?: number;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  surface: SurfaceType;
  lengthMeters: number;
  segments: TrackSegment[];
  metricWeights: Partial<Record<MetricKey, number>>;
  recordTime?: number;
}

export interface RaceResult {
  trackId: string;
  buildId: string;
  finishTimeSeconds: number;
  position: number;
  totalRacers: number;
  surface: SurfaceType;
  ranOutOfEnergy: boolean;
  topSpeedReachedMph: number;
  durationSeconds: number;
  timestamp: number;
}
