export interface RaceInput {
  gasHeld: boolean;
  brakeHeld: boolean;
}

export interface CarState {
  buildId: string;
  distanceMeters: number;
  speedMph: number;
  finished: boolean;
  finishTimeSeconds: number;
  energyRemaining: number;
  isSliding: boolean;
  currentSegmentIndex: number;
  elapsedSeconds: number;
}

export const NO_INPUT: RaceInput = { gasHeld: false, brakeHeld: false };
