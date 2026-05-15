import { describe, it, expect } from 'vitest';
import {
  createInitialCarState,
  isRaceFinished,
  updateCarState,
} from '../src/race/engine/RaceEngine';
import { getRaceProgress } from '../src/race/engine/TrackMath';
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

describe('RaceEngine.updateCarState - no-reverse guarantees', () => {
  // Phase 2B physics is intentionally non-decreasing on distance: GAS, BRAKE,
  // and COAST must never move the car backward. These tests pin that contract.

  it('BRAKE at zero speed cannot create negative speed', () => {
    const start = createInitialCarState(SPEED_BUILD, STATS);
    const after = updateCarState(start, STATS, OVAL_TEST_TRACK, BRAKE, 5);
    expect(after.speedMph).toBe(0);
    expect(after.speedMph).toBeGreaterThanOrEqual(0);
  });

  it('BRAKE at zero speed does not move the car backward', () => {
    const start = createInitialCarState(SPEED_BUILD, STATS);
    let s = start;
    for (let i = 0; i < 50; i++) {
      s = updateCarState(s, STATS, OVAL_TEST_TRACK, BRAKE, 0.05);
    }
    expect(s.distanceMeters).toBe(0);
    expect(s.distanceMeters).toBeGreaterThanOrEqual(0);
  });

  it('distance never decreases across an update under any input', () => {
    // Spin up some speed, then sweep through every combination of inputs and
    // assert distance is monotonic over each step. This catches any future
    // change that would let brake/coast/curve math push distance backward.
    const inputs: RaceInput[] = [
      GAS,
      BRAKE,
      COAST,
      { gasHeld: true, brakeHeld: true },
    ];
    let s = createInitialCarState(SPEED_BUILD, STATS);
    // Warm up to a non-zero speed.
    for (let i = 0; i < 40; i++) {
      s = updateCarState(s, STATS, OVAL_TEST_TRACK, GAS, 0.05);
    }
    for (const input of inputs) {
      let cur = s;
      for (let i = 0; i < 200; i++) {
        const next = updateCarState(cur, STATS, OVAL_TEST_TRACK, input, 0.05);
        expect(next.distanceMeters).toBeGreaterThanOrEqual(cur.distanceMeters);
        cur = next;
      }
    }
  });

  it('BRAKE while accelerated keeps progress non-decreasing', () => {
    // Hold both GAS and BRAKE simultaneously after picking up speed: brake
    // wins, speed drops to 0, but progress must never go down.
    let s = createInitialCarState(SPEED_BUILD, STATS);
    for (let i = 0; i < 40; i++) {
      s = updateCarState(s, STATS, OVAL_TEST_TRACK, GAS, 0.05);
    }
    let prevDistance = s.distanceMeters;
    expect(prevDistance).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) {
      s = updateCarState(
        s,
        STATS,
        OVAL_TEST_TRACK,
        { gasHeld: true, brakeHeld: true },
        0.05,
      );
      expect(s.distanceMeters).toBeGreaterThanOrEqual(prevDistance);
      prevDistance = s.distanceMeters;
    }
    expect(s.speedMph).toBe(0);
  });

  it('progress starts at 0 and clamps at 1', () => {
    const start = createInitialCarState(SPEED_BUILD, STATS);
    expect(getRaceProgress(start.distanceMeters, OVAL_TEST_TRACK)).toBe(0);

    // Floor the gas until well past the finish line.
    let s = start;
    for (let i = 0; i < 2000; i++) {
      s = updateCarState(s, STATS, OVAL_TEST_TRACK, GAS, 0.05);
    }
    const progress = getRaceProgress(s.distanceMeters, OVAL_TEST_TRACK);
    expect(progress).toBeLessThanOrEqual(1);
    expect(progress).toBe(1);
  });

  it('Restart (createInitialCarState) resets speed/distance/progress/elapsed/finished', () => {
    // Reach a finished state, then "restart" by reconstructing the initial
    // state — this mirrors what the route does on the Restart Race click.
    const finished = runFor(undefined, GAS, 60);
    expect(finished.finished).toBe(true);
    expect(finished.distanceMeters).toBe(OVAL_TEST_TRACK.lengthMeters);

    const restarted = createInitialCarState(SPEED_BUILD, STATS);
    expect(restarted.speedMph).toBe(0);
    expect(restarted.distanceMeters).toBe(0);
    expect(restarted.elapsedSeconds).toBe(0);
    expect(restarted.finished).toBe(false);
    expect(restarted.finishTimeSeconds).toBe(0);
    expect(getRaceProgress(restarted.distanceMeters, OVAL_TEST_TRACK)).toBe(0);
  });
});

describe('RaceEngine.updateCarState - restart safety', () => {
  it('updating a fresh initial state never resurrects a previous finished state', () => {
    // Repro for the restart race: a tick that fires BETWEEN setCarState(initial)
    // and the next render must not somehow carry over finished=true. Because
    // updateCarState is pure, calling it on a fresh initial state must always
    // produce a fresh, non-finished state — regardless of what previously ran.
    const finished = runFor(undefined, GAS, 60);
    expect(finished.finished).toBe(true);

    const fresh = createInitialCarState(SPEED_BUILD, STATS);
    const afterTick = updateCarState(fresh, STATS, OVAL_TEST_TRACK, COAST, 0.05);
    expect(afterTick.finished).toBe(false);
    expect(afterTick.distanceMeters).toBeLessThan(OVAL_TEST_TRACK.lengthMeters);
    expect(afterTick.finishTimeSeconds).toBe(0);
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
