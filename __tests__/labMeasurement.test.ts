import { describe, it, expect } from 'vitest';
import { BASE_STATS, calculateStats } from '../src/logic/statCalculator';
import {
  measureLab,
  measureLabExact,
  rawTopSpeedMph,
  rawZeroToSixtySeconds,
} from '../src/logic/labMeasurement';
import { mulberry32 } from '../src/utils/random';
import { SAMPLE_BUILDS_BY_ID } from '../src/data/sampleBuilds';

describe('labMeasurement', () => {
  it('produces deterministic output for the same seed', () => {
    const stats = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_speed_tester'].parts,
    ).stats;
    const a = measureLab(stats, { rand: mulberry32(42) });
    const b = measureLab(stats, { rand: mulberry32(42) });
    expect(a).toEqual(b);
  });

  it('produces different output for different seeds', () => {
    const stats = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_speed_tester'].parts,
    ).stats;
    const a = measureLab(stats, { rand: mulberry32(1) });
    const b = measureLab(stats, { rand: mulberry32(99) });
    expect(a).not.toEqual(b);
  });

  it('exact (zero-variance) measurement matches the raw formulas', () => {
    const exact = measureLabExact(BASE_STATS);
    expect(exact.topSpeedMph).toBe(Math.round(rawTopSpeedMph(BASE_STATS)));
    expect(exact.zeroToSixtySeconds).toBeCloseTo(
      Number(rawZeroToSixtySeconds(BASE_STATS).toFixed(2)),
      2,
    );
  });

  it('Speed Tester out-tops Balanced Starter on the dyno', () => {
    const balanced = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_balanced_starter'].parts,
    ).stats;
    const speed = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_speed_tester'].parts,
    ).stats;
    expect(measureLabExact(speed).topSpeedMph).toBeGreaterThan(
      measureLabExact(balanced).topSpeedMph,
    );
  });

  it('Speed Tester reaches 60 mph faster than Balanced Starter', () => {
    const balanced = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_balanced_starter'].parts,
    ).stats;
    const speed = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_speed_tester'].parts,
    ).stats;
    expect(measureLabExact(speed).zeroToSixtySeconds).toBeLessThan(
      measureLabExact(balanced).zeroToSixtySeconds,
    );
  });

  it('stays within the configured variance band when seeded', () => {
    const stats = calculateStats(
      SAMPLE_BUILDS_BY_ID['sample_balanced_starter'].parts,
    ).stats;
    const seeded = measureLab(stats, { rand: mulberry32(7), variance: 0.03 });
    const exact = measureLabExact(stats);
    const within = (a: number, b: number, tolerance: number) =>
      Math.abs(a - b) <= b * tolerance + 1;
    expect(within(seeded.topSpeedMph, exact.topSpeedMph, 0.05)).toBe(true);
    expect(within(seeded.rangeMiles, exact.rangeMiles, 0.05)).toBe(true);
  });
});
