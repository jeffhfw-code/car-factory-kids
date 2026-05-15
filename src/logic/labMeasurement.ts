import type { LabResults, RaceStats } from '../data/types';
import {
  mathRandomSource,
  variance,
  type RandomSource,
} from '../utils/random';

export const LAB_VARIANCE = 0.03;

interface MeasureOptions {
  rand?: RandomSource;
  variance?: number;
}

function withVariance(
  base: number,
  rand: RandomSource,
  amplitude: number,
): number {
  if (amplitude <= 0) return base;
  return base + base * variance(rand, amplitude);
}

export function rawTopSpeedMph(stats: RaceStats): number {
  return 30 + stats.topSpeedRating * 17;
}

export function rawZeroToSixtySeconds(stats: RaceStats): number {
  const accel = Math.max(0, Math.min(10, stats.accelerationRating));
  return Number((15 - accel * 1.2).toFixed(3));
}

export function rawBrakingDistanceFeet(stats: RaceStats): number {
  return 200 - stats.brakingRating * 15;
}

export function rawSlalomSpeedMph(stats: RaceStats): number {
  return 20 + stats.gripRating * 6;
}

export function rawRangeMiles(stats: RaceStats): number {
  return 30 + stats.rangeRating * 30;
}

export function rawStabilityMph(stats: RaceStats): number {
  return 50 + stats.stabilityRating * 12;
}

export function measureLab(
  stats: RaceStats,
  options: MeasureOptions = {},
): LabResults {
  const rand = options.rand ?? mathRandomSource;
  const amp = options.variance ?? LAB_VARIANCE;

  return {
    topSpeedMph: Math.round(withVariance(rawTopSpeedMph(stats), rand, amp)),
    zeroToSixtySeconds: Number(
      withVariance(rawZeroToSixtySeconds(stats), rand, amp).toFixed(2),
    ),
    brakingDistanceFeet: Math.round(
      withVariance(rawBrakingDistanceFeet(stats), rand, amp),
    ),
    slalomSpeedMph: Math.round(withVariance(rawSlalomSpeedMph(stats), rand, amp)),
    rangeMiles: Math.round(withVariance(rawRangeMiles(stats), rand, amp)),
    stabilityMph: Math.round(withVariance(rawStabilityMph(stats), rand, amp)),
  };
}

export function measureLabExact(stats: RaceStats): LabResults {
  return measureLab(stats, { variance: 0 });
}
