import { describe, it, expect } from 'vitest';
import {
  getCurrentSegmentIndex,
  getRaceProgress,
  safeSpeedForSegment,
  topSpeedFromStats,
} from '../src/race/engine/TrackMath';
import { OVAL_TEST_TRACK } from '../src/data/tracks';
import { BASE_STATS } from '../src/logic/statCalculator';
import type { RaceStats, TrackSegment } from '../src/data/types';

describe('TrackMath.getCurrentSegmentIndex', () => {
  it('returns 0 at the start of the track', () => {
    expect(getCurrentSegmentIndex(0, OVAL_TEST_TRACK)).toBe(0);
  });

  it('returns the correct segment for a mid-track distance', () => {
    // Segments: [250 straight, 150 curve, 250 straight, 150 curve]
    expect(getCurrentSegmentIndex(100, OVAL_TEST_TRACK)).toBe(0);
    expect(getCurrentSegmentIndex(300, OVAL_TEST_TRACK)).toBe(1);
    expect(getCurrentSegmentIndex(500, OVAL_TEST_TRACK)).toBe(2);
    expect(getCurrentSegmentIndex(700, OVAL_TEST_TRACK)).toBe(3);
  });

  it('clamps to the last segment past the end', () => {
    expect(
      getCurrentSegmentIndex(OVAL_TEST_TRACK.lengthMeters * 2, OVAL_TEST_TRACK),
    ).toBe(OVAL_TEST_TRACK.segments.length - 1);
  });
});

describe('TrackMath.safeSpeedForSegment', () => {
  const straight: TrackSegment = { type: 'straight', lengthMeters: 100 };
  const curve: TrackSegment = {
    type: 'curve_right',
    lengthMeters: 100,
    curvatureRadius: 50,
  };

  it('straights have no safe-speed limit', () => {
    expect(safeSpeedForSegment(straight, BASE_STATS)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('curves have a finite safe speed', () => {
    expect(safeSpeedForSegment(curve, BASE_STATS)).toBeLessThan(
      Number.POSITIVE_INFINITY,
    );
    expect(safeSpeedForSegment(curve, BASE_STATS)).toBeGreaterThan(0);
  });

  it('better gripRating yields a higher safe curve speed', () => {
    const lowGrip: RaceStats = { ...BASE_STATS, gripRating: 1 };
    const highGrip: RaceStats = { ...BASE_STATS, gripRating: 9 };
    expect(safeSpeedForSegment(curve, highGrip)).toBeGreaterThan(
      safeSpeedForSegment(curve, lowGrip),
    );
  });

  it('better stabilityRating yields a higher safe curve speed', () => {
    const lowStab: RaceStats = { ...BASE_STATS, stabilityRating: 1 };
    const highStab: RaceStats = { ...BASE_STATS, stabilityRating: 9 };
    expect(safeSpeedForSegment(curve, highStab)).toBeGreaterThan(
      safeSpeedForSegment(curve, lowStab),
    );
  });
});

describe('TrackMath.topSpeedFromStats', () => {
  it('scales monotonically with topSpeedRating', () => {
    expect(topSpeedFromStats({ ...BASE_STATS, topSpeedRating: 0 })).toBeLessThan(
      topSpeedFromStats({ ...BASE_STATS, topSpeedRating: 5 }),
    );
    expect(topSpeedFromStats({ ...BASE_STATS, topSpeedRating: 5 })).toBeLessThan(
      topSpeedFromStats({ ...BASE_STATS, topSpeedRating: 10 }),
    );
  });
});

describe('TrackMath.getRaceProgress', () => {
  it('returns 0 at start and 1 at end', () => {
    expect(getRaceProgress(0, OVAL_TEST_TRACK)).toBe(0);
    expect(getRaceProgress(OVAL_TEST_TRACK.lengthMeters, OVAL_TEST_TRACK)).toBe(
      1,
    );
  });

  it('clamps overshoot to 1', () => {
    expect(
      getRaceProgress(OVAL_TEST_TRACK.lengthMeters * 2, OVAL_TEST_TRACK),
    ).toBe(1);
  });
});
