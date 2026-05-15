import type { RaceStats, Track, TrackSegment } from '../../data/types';

export const MPH_TO_MPS = 0.44704;
export const MPS_TO_MPH = 1 / MPH_TO_MPS;

export function topSpeedFromStats(stats: RaceStats): number {
  return 30 + stats.topSpeedRating * 17;
}

export function getCurrentSegmentIndex(
  distanceMeters: number,
  track: Track,
): number {
  if (track.segments.length === 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < track.segments.length; i++) {
    cumulative += track.segments[i].lengthMeters;
    if (distanceMeters < cumulative) return i;
  }
  return track.segments.length - 1;
}

export function safeSpeedForSegment(
  segment: TrackSegment,
  stats: RaceStats,
): number {
  if (segment.type !== 'curve_left' && segment.type !== 'curve_right') {
    return Number.POSITIVE_INFINITY;
  }
  const base = 20 + stats.gripRating * 6 + stats.stabilityRating * 3;
  const radius = segment.curvatureRadius ?? 50;
  const radiusFactor = Math.max(0.6, Math.min(1.6, radius / 50));
  return base * radiusFactor;
}

export function getRaceProgress(
  distanceMeters: number,
  track: Track,
): number {
  if (track.lengthMeters <= 0) return 0;
  return Math.max(0, Math.min(1, distanceMeters / track.lengthMeters));
}
