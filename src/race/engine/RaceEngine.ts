import type { Build, RaceStats, Track } from '../../data/types';
import type { CarState, RaceInput } from './CarState';
import {
  MPH_TO_MPS,
  getCurrentSegmentIndex,
  getRaceProgress,
  topSpeedFromStats,
} from './TrackMath';

export const MIN_SPEED_MPH = 0;
export const MAX_SUBSTEP_SECONDS = 0.05;
export const INITIAL_ENERGY = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createInitialCarState(
  build: Build,
  _stats: RaceStats,
): CarState {
  return {
    buildId: build.id,
    distanceMeters: 0,
    speedMph: 0,
    finished: false,
    finishTimeSeconds: 0,
    energyRemaining: INITIAL_ENERGY,
    isSliding: false,
    currentSegmentIndex: 0,
    elapsedSeconds: 0,
  };
}

export function updateCarState(
  carState: CarState,
  stats: RaceStats,
  track: Track,
  input: RaceInput,
  deltaSeconds: number,
): CarState {
  if (deltaSeconds <= 0) return carState;
  if (deltaSeconds > MAX_SUBSTEP_SECONDS) {
    let s = carState;
    let remaining = deltaSeconds;
    while (remaining > 0) {
      const step = Math.min(remaining, MAX_SUBSTEP_SECONDS);
      s = stepOnce(s, stats, track, input, step);
      remaining -= step;
    }
    return s;
  }
  return stepOnce(carState, stats, track, input, deltaSeconds);
}

function stepOnce(
  carState: CarState,
  stats: RaceStats,
  track: Track,
  input: RaceInput,
  dt: number,
): CarState {
  if (carState.finished) {
    return {
      ...carState,
      isSliding: false,
      elapsedSeconds: carState.elapsedSeconds + dt,
    };
  }

  // Phase 2B physics: deliberately simple, deterministic, monotonic.
  // No curve/sliding/segment penalty — kept off until we have a working
  // playable race slice that can't go in reverse.
  const top = topSpeedFromStats(stats);
  let speed = carState.speedMph;

  if (input.brakeHeld) {
    const brakeMphPerSec = 10 + stats.brakingRating * 4;
    speed -= brakeMphPerSec * dt;
  } else if (input.gasHeld) {
    const accelMphPerSec = 5 + stats.accelerationRating * 2;
    speed += accelMphPerSec * dt;
  } else {
    const coastMphPerSec = 2 + (10 - clamp(stats.efficiencyRating, 0, 10)) * 0.3;
    speed -= coastMphPerSec * dt;
  }

  // Speed is clamped to [0, top]. It can never be negative.
  if (speed > top) speed = top;
  if (speed < MIN_SPEED_MPH) speed = MIN_SPEED_MPH;

  // Distance only accumulates positive (speed * dt). Since speed >= 0 and
  // dt > 0, distance is strictly non-decreasing across every step.
  const speedMps = speed * MPH_TO_MPS;
  let distance = carState.distanceMeters + speedMps * dt;
  if (distance < 0) distance = 0;

  const energyDecayPerMeter = 0.005;
  const energy = Math.max(
    0,
    carState.energyRemaining - speedMps * dt * energyDecayPerMeter,
  );

  const elapsed = carState.elapsedSeconds + dt;

  let finished = false;
  let finishTime = carState.finishTimeSeconds;
  if (distance >= track.lengthMeters) {
    distance = track.lengthMeters;
    finished = true;
    finishTime = elapsed;
  }

  return {
    ...carState,
    distanceMeters: distance,
    speedMph: speed,
    finished,
    finishTimeSeconds: finishTime,
    energyRemaining: energy,
    isSliding: false,
    currentSegmentIndex: getCurrentSegmentIndex(distance, track),
    elapsedSeconds: elapsed,
  };
}

export function getRacePosition(carState: CarState, track: Track): number {
  return getRaceProgress(carState.distanceMeters, track);
}

export function isRaceFinished(carState: CarState, track: Track): boolean {
  return carState.finished || carState.distanceMeters >= track.lengthMeters;
}
