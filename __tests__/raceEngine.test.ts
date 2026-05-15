import { describe, it, expect } from 'vitest';
import {
  createInitialCarState,
  isRaceFinished,
  updateCarState,
} from '../src/race/engine/RaceEngine';
import type { RaceInput } from '../src/race/engine/CarState';
import { OVAL_TEST_TRACK } from '../src/data/tracks';
import { SAMPLE_BUILDS_BY_ID } from '../src/data/sampleBuilds';
import { calculateStats } from '../src/logic/statCalculator';
import type { RaceStats, Track } from '../src/data/types';

const SPEED_BUILD = SAMPLE_BUILDS_BY_ID['sample_speed_tester'];
const STATS = calculateStats(SPEED_BUILD.parts).stats;

const GAS: RaceInput = { gasHeld: true, brakeHeld: false };
const BRAKE: RaceInput = { gasHeld: false, brakeHeld: true };
const COAST: RaceInput = { gasHeld: false, brakeHeld: false };

function runFor(
  state = createInitialCarState(SPEED_BUILD, STATS),
  input: RaceInput,
  seconds: number,
  step = 0.05,
  stats: RaceStats = STATS,
  track: Track = OVAL_TEST_TRACK,
) {
  const ticks = Math.round(seconds / step);
  let s = state;
  for (let i = 0; i < ticks; i++) {
    s = updateCarState(s, stats, track, input, step);
  }
  return s;
}

describe('RaceEngine.createInitialCarState', () => {
  it('starts at zero distance and zero speed', () => {
    const s = createInitialCarState(SPEED_BUILD, STATS);
    expect(s.distanceMeters).toBe(0);
    expect(s.speedMph).toBe(0);
    expect(s.finished).toBe(false);
    expect(s.isSliding).toBe(false);
    expect(s.currentSegmentIndex).toBe(0);
    expect(s.energyRemaining).toBeGreaterThan(0);
    expect(s.buildId).toBe(SPEED_BUILD.id);
  });
});

describe('RaceEngine.updateCarState - inputs', () => {
  it('holding gas increases speed', () => {
    const start = createInitialCarState(SPEED_BUILD, STATS);
    const after = updateCarState(start, STATS, OVAL_TEST_TRACK, GAS, 0.05);
    expect(after.speedMph).toBeGreaterThan(start.speedMph);
  });

  it('holding brake decreases speed', () => {
    const moving = runFor(undefined, GAS, 1.5);
    const braked = updateCarState(moving, STATS, OVAL_TEST_TRACK, BRAKE, 0.05);
    expect(braked.speedMph).toBeLessThan(moving.speedMph);
  });

  it('no input coasts down gradually', () => {
    const moving = runFor(undefined, GAS, 1.5);
    const coasted = updateCarState(moving, STATS, OVAL_TEST_TRACK, COAST, 0.5);
    expect(coasted.speedMph).toBeLessThan(moving.speedMph);
    // Coasting should be gentler than full braking
    const braked = updateCarState(moving, STATS, OVAL_TEST_TRACK, BRAKE, 0.5);
    expect(coasted.speedMph).toBeGreaterThan(braked.speedMph);
  });
});

describe('RaceEngine.updateCarState - distance & finish', () => {
  it('car distance increases when speed is positive', () => {
    const moving = runFor(undefined, GAS, 0.5);
    expect(moving.speedMph).toBeGreaterThan(0);
    expect(moving.distanceMeters).toBeGreaterThan(0);
  });

  it('race finishes when distance reaches track length', () => {
    const finishedState = runFor(undefined, GAS, 60);
    expect(finishedState.finished).toBe(true);
    expect(finishedState.distanceMeters).toBe(OVAL_TEST_TRACK.lengthMeters);
    expect(finishedState.finishTimeSeconds).toBeGreaterThan(0);
    expect(isRaceFinished(finishedState, OVAL_TEST_TRACK)).toBe(true);
  });

  it('finished state freezes distance and speed when stepped further', () => {
    const finished = runFor(undefined, GAS, 60);
    const after = updateCarState(finished, STATS, OVAL_TEST_TRACK, GAS, 0.1);
    expect(after.finished).toBe(true);
    expect(after.distanceMeters).toBe(finished.distanceMeters);
    expect(after.finishTimeSeconds).toBe(finished.finishTimeSeconds);
  });
});

describe('RaceEngine.updateCarState - curves & sliding', () => {
  it('curve overspeed triggers sliding penalty', () => {
    // Force the car onto the first curve at high speed.
    const start = createInitialCarState(SPEED_BUILD, STATS);
    const onCurve = {
      ...start,
      distanceMeters: 300, // inside first curve (250-400)
      currentSegmentIndex: 1,
      speedMph: 200, // way over any safe speed
    };
    const after = updateCarState(onCurve, STATS, OVAL_TEST_TRACK, GAS, 0.05);
    expect(after.isSliding).toBe(true);
    expect(after.speedMph).toBeLessThan(onCurve.speedMph);
  });

  it('better gripRating allows higher safe curve speed', () => {
    const lowGripStats: RaceStats = { ...STATS, gripRating: 1, stabilityRating: 1 };
    const highGripStats: RaceStats = { ...STATS, gripRating: 10, stabilityRating: 10 };

    // Place each car on the curve at a moderate speed and observe.
    const seed = (s: RaceStats) => ({
      ...createInitialCarState(SPEED_BUILD, s),
      distanceMeters: 300,
      currentSegmentIndex: 1,
      speedMph: 60,
    });

    const lowAfter = updateCarState(
      seed(lowGripStats),
      lowGripStats,
      OVAL_TEST_TRACK,
      COAST,
      0.05,
    );
    const highAfter = updateCarState(
      seed(highGripStats),
      highGripStats,
      OVAL_TEST_TRACK,
      COAST,
      0.05,
    );

    // Low grip: 60mph exceeds safe speed -> sliding.
    expect(lowAfter.isSliding).toBe(true);
    // High grip: 60mph is within safe speed -> not sliding.
    expect(highAfter.isSliding).toBe(false);
  });
});

describe('RaceEngine.updateCarState - clamping & determinism', () => {
  it('speed is clamped and never becomes negative', () => {
    const start = createInitialCarState(SPEED_BUILD, STATS);
    const slammed = updateCarState(start, STATS, OVAL_TEST_TRACK, BRAKE, 5);
    expect(slammed.speedMph).toBeGreaterThanOrEqual(0);

    // Even with extreme negative coasting time, speed can't go below 0.
    let s = start;
    for (let i = 0; i < 200; i++) {
      s = updateCarState(s, STATS, OVAL_TEST_TRACK, BRAKE, 0.1);
    }
    expect(s.speedMph).toBeGreaterThanOrEqual(0);
  });

  it('speed is clamped to top speed from stats', () => {
    const flooredForever = runFor(undefined, GAS, 30);
    const top = 30 + STATS.topSpeedRating * 17;
    expect(flooredForever.speedMph).toBeLessThanOrEqual(top + 1e-6);
  });

  it('physics is deterministic for the same inputs', () => {
    const a = runFor(undefined, GAS, 2.0, 0.05);
    const b = runFor(undefined, GAS, 2.0, 0.05);
    expect(a).toEqual(b);
  });

  it('zero or negative deltaSeconds is a no-op', () => {
    const s = createInitialCarState(SPEED_BUILD, STATS);
    expect(updateCarState(s, STATS, OVAL_TEST_TRACK, GAS, 0)).toEqual(s);
    expect(updateCarState(s, STATS, OVAL_TEST_TRACK, GAS, -1)).toEqual(s);
  });
});
