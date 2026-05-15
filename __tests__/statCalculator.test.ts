import { describe, it, expect } from 'vitest';
import {
  BASE_STATS,
  calculateStats,
  RATING_MAX,
  RATING_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from '../src/logic/statCalculator';
import { SAMPLE_BUILDS_BY_ID } from '../src/data/sampleBuilds';
import type { BuildParts, MetricKey } from '../src/data/types';
import { MAX_TECH_PARTS } from '../src/data/parts';

function statsFor(buildId: string) {
  const build = SAMPLE_BUILDS_BY_ID[buildId];
  if (!build) throw new Error(`missing sample build ${buildId}`);
  return calculateStats(build.parts);
}

describe('calculateStats', () => {
  it('returns base stats when given the empty/default base parts', () => {
    // A bare BuildParts object with valid IDs but minimal-effect picks.
    const parts: BuildParts = {
      chassisId: 'chassis_compact',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    };
    const { stats, validation } = calculateStats(parts);
    expect(validation.ok).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(stats.weightLbs).toBeGreaterThanOrEqual(WEIGHT_MIN);
    expect(stats.weightLbs).toBeLessThanOrEqual(WEIGHT_MAX);
    for (const key of Object.keys(BASE_STATS) as MetricKey[]) {
      if (key === 'weightLbs') continue;
      expect(stats[key]).toBeGreaterThanOrEqual(RATING_MIN);
      expect(stats[key]).toBeLessThanOrEqual(RATING_MAX);
    }
  });

  it('clamps rating overflow to RATING_MAX', () => {
    const parts: BuildParts = {
      chassisId: 'chassis_sports',
      engineId: 'engine_v8',
      wheelsId: 'wheels_sport',
      interiorId: 'interior_racing',
      techIds: ['tech_aero_kit'],
    };
    const { stats } = calculateStats(parts);
    // Sports +3, V8 +4, Sport tires +1, Aero kit +1 = +9 on top of base 3 -> 12, clamps to 10
    expect(stats.topSpeedRating).toBe(RATING_MAX);
  });

  it('clamps rating underflow to RATING_MIN', () => {
    // Sports Coupe (no off-road mod) + Sport Tires (-2 offRoad) on base 2 = 0,
    // and no part in the seed catalog adds back off-road traction here, so
    // any further reduction would otherwise push below 0.
    const parts: BuildParts = {
      chassisId: 'chassis_sports',
      engineId: 'engine_v8',
      wheelsId: 'wheels_sport',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    };
    const { stats } = calculateStats(parts);
    expect(stats.offRoadTractionRating).toBe(RATING_MIN);
    // Sanity: all other ratings still inside [RATING_MIN, RATING_MAX]
    for (const key of [
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
    ] as const) {
      expect(stats[key]).toBeGreaterThanOrEqual(RATING_MIN);
      expect(stats[key]).toBeLessThanOrEqual(RATING_MAX);
    }
    expect(stats.weightLbs).toBeGreaterThanOrEqual(WEIGHT_MIN);
    expect(stats.weightLbs).toBeLessThanOrEqual(WEIGHT_MAX);
  });

  it('Speed Tester has higher topSpeedRating than Balanced Starter', () => {
    const balanced = statsFor('sample_balanced_starter');
    const speed = statsFor('sample_speed_tester');
    expect(speed.stats.topSpeedRating).toBeGreaterThan(
      balanced.stats.topSpeedRating,
    );
  });

  it('Off-Road Tester has higher offRoadTractionRating than Speed Tester', () => {
    const offroad = statsFor('sample_off_road_tester');
    const speed = statsFor('sample_speed_tester');
    expect(offroad.stats.offRoadTractionRating).toBeGreaterThan(
      speed.stats.offRoadTractionRating,
    );
  });

  it('Electric Motor improves accelerationRating and efficiencyRating', () => {
    const base: BuildParts = {
      chassisId: 'chassis_compact',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    };
    const electric: BuildParts = { ...base, engineId: 'engine_electric' };
    const a = calculateStats(base).stats;
    const b = calculateStats(electric).stats;
    expect(b.accelerationRating).toBeGreaterThan(a.accelerationRating);
    expect(b.efficiencyRating).toBeGreaterThan(a.efficiencyRating);
  });

  it('V8 improves topSpeedRating but hurts efficiencyRating', () => {
    const baseParts: BuildParts = {
      chassisId: 'chassis_compact',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    };
    const v8Parts: BuildParts = { ...baseParts, engineId: 'engine_v8' };
    const base = calculateStats(baseParts).stats;
    const v8 = calculateStats(v8Parts).stats;
    expect(v8.topSpeedRating).toBeGreaterThan(base.topSpeedRating);
    expect(v8.efficiencyRating).toBeLessThan(base.efficiencyRating);
  });

  it('warns and ignores tech parts beyond the max', () => {
    const parts: BuildParts = {
      chassisId: 'chassis_compact',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [
        'tech_traction_control',
        'tech_aero_kit',
        'tech_extra_battery',
        'tech_traction_control', // duplicate, also exceeds limit
      ],
    };
    const { validation } = calculateStats(parts);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(
      validation.warnings.some((w) => w.toLowerCase().includes('only the first')) ||
        validation.warnings.some((w) =>
          w.toLowerCase().includes('only ' + MAX_TECH_PARTS),
        ),
    ).toBe(true);
  });

  it('produces a validation error (not a crash) when a part id is unknown', () => {
    const parts: BuildParts = {
      chassisId: 'chassis_does_not_exist',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: ['tech_does_not_exist'],
    };
    const { validation } = calculateStats(parts);
    expect(validation.ok).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('errors when a required part slot is missing', () => {
    const parts = {
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    } as unknown as BuildParts;
    const { validation } = calculateStats(parts);
    expect(validation.ok).toBe(false);
    expect(validation.errors.some((e) => e.includes('chassis'))).toBe(true);
  });
});
