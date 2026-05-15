import type { Track } from './types';

export const OVAL_TEST_TRACK: Track = {
  id: 'oval-test-track',
  name: 'Oval Test Track',
  description:
    'A short, forgiving paved oval. Two long straights joined by two wide curves. No hills, no surface changes.',
  surface: 'paved',
  lengthMeters: 800,
  segments: [
    { type: 'straight', lengthMeters: 250 },
    { type: 'curve_right', lengthMeters: 150, curvatureRadius: 60 },
    { type: 'straight', lengthMeters: 250 },
    { type: 'curve_right', lengthMeters: 150, curvatureRadius: 60 },
  ],
  metricWeights: {
    topSpeedRating: 0.4,
    accelerationRating: 0.25,
    brakingRating: 0.15,
    gripRating: 0.1,
    stabilityRating: 0.1,
  },
};

export const TRACKS: Track[] = [OVAL_TEST_TRACK];

export const TRACKS_BY_ID: Record<string, Track> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t]),
);

export function getTrack(id: string): Track | undefined {
  return TRACKS_BY_ID[id];
}
