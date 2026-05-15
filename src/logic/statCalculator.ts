import { MAX_TECH_PARTS, getPart } from '../data/parts';
import type {
  BuildParts,
  MetricKey,
  Part,
  PartCategory,
  RaceStats,
  StatCalculationResult,
  StatModifiers,
  ValidationResult,
} from '../data/types';

export const BASE_STATS: RaceStats = {
  topSpeedRating: 3,
  accelerationRating: 2,
  brakingRating: 3,
  gripRating: 2,
  rangeRating: 3,
  stabilityRating: 3,
  weightLbs: 2500,
  offRoadTractionRating: 2,
  wetGripRating: 2,
  hillClimbRating: 2,
  aerodynamicsRating: 2,
  coolingRating: 5,
  tireWearRating: 5,
  groundClearanceRating: 5,
  efficiencyRating: 5,
};

export const RATING_MIN = 0;
export const RATING_MAX = 10;
export const WEIGHT_MIN = 1500;
export const WEIGHT_MAX = 6000;

const RATING_KEYS: MetricKey[] = [
  'topSpeedRating',
  'accelerationRating',
  'brakingRating',
  'gripRating',
  'rangeRating',
  'stabilityRating',
  'offRoadTractionRating',
  'wetGripRating',
  'hillClimbRating',
  'aerodynamicsRating',
  'coolingRating',
  'tireWearRating',
  'groundClearanceRating',
  'efficiencyRating',
];

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function applyModifiers(target: RaceStats, mods: StatModifiers): void {
  for (const key of Object.keys(mods) as MetricKey[]) {
    const delta = mods[key];
    if (typeof delta !== 'number') continue;
    target[key] = target[key] + delta;
  }
}

function clampStats(stats: RaceStats): RaceStats {
  const clamped: RaceStats = { ...stats };
  for (const key of RATING_KEYS) {
    clamped[key] = clamp(clamped[key], RATING_MIN, RATING_MAX);
  }
  clamped.weightLbs = clamp(clamped.weightLbs, WEIGHT_MIN, WEIGHT_MAX);
  return clamped;
}

interface ResolvedPart {
  part: Part;
  expectedCategory: PartCategory;
}

function resolvePart(
  id: string | undefined,
  category: PartCategory,
  warnings: string[],
  errors: string[],
): ResolvedPart | null {
  if (!id) {
    errors.push(`Missing ${category} part.`);
    return null;
  }
  const part = getPart(id);
  if (!part) {
    errors.push(`Unknown ${category} part id: ${id}`);
    return null;
  }
  if (part.category !== category) {
    warnings.push(
      `Part ${id} is a ${part.category}, expected ${category}; modifiers still applied.`,
    );
  }
  return { part, expectedCategory: category };
}

export function calculateStats(parts: BuildParts): StatCalculationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const stats: RaceStats = { ...BASE_STATS };

  const chassis = resolvePart(parts.chassisId, 'chassis', warnings, errors);
  const engine = resolvePart(parts.engineId, 'engine', warnings, errors);
  const wheels = resolvePart(parts.wheelsId, 'wheels', warnings, errors);
  const interior = resolvePart(parts.interiorId, 'interior', warnings, errors);

  for (const resolved of [chassis, engine, wheels, interior]) {
    if (resolved) applyModifiers(stats, resolved.part.modifiers);
  }

  const techIds = Array.isArray(parts.techIds) ? parts.techIds : [];
  const seenTechIds = new Set<string>();
  let appliedTech = 0;
  for (const techId of techIds) {
    if (seenTechIds.has(techId)) {
      warnings.push(`Duplicate tech part ignored: ${techId}`);
      continue;
    }
    seenTechIds.add(techId);

    if (appliedTech >= MAX_TECH_PARTS) {
      warnings.push(
        `Only the first ${MAX_TECH_PARTS} tech parts apply; ${techId} was skipped.`,
      );
      continue;
    }

    const part = getPart(techId);
    if (!part) {
      errors.push(`Unknown tech part id: ${techId}`);
      continue;
    }
    if (part.category !== 'tech') {
      warnings.push(
        `Part ${techId} is a ${part.category}, expected tech; modifiers still applied.`,
      );
    }
    applyModifiers(stats, part.modifiers);
    appliedTech += 1;
  }

  if (techIds.length > MAX_TECH_PARTS) {
    warnings.push(
      `Build selected ${techIds.length} tech parts; only ${MAX_TECH_PARTS} are allowed.`,
    );
  }

  const finalStats = clampStats(stats);
  const validation: ValidationResult = {
    ok: errors.length === 0,
    warnings,
    errors,
  };

  return { stats: finalStats, validation };
}
