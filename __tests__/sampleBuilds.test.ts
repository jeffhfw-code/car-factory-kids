import { describe, it, expect } from 'vitest';
import { SAMPLE_BUILDS, SAMPLE_BUILDS_BY_ID } from '../src/data/sampleBuilds';
import { calculateStats } from '../src/logic/statCalculator';
import { getPart, MAX_TECH_PARTS } from '../src/data/parts';
import { getPaintColor } from '../src/data/paints';

describe('sampleBuilds', () => {
  it('contains the three required builds with unique ids', () => {
    expect(SAMPLE_BUILDS).toHaveLength(3);
    const ids = SAMPLE_BUILDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SAMPLE_BUILDS_BY_ID['sample_balanced_starter']).toBeTruthy();
    expect(SAMPLE_BUILDS_BY_ID['sample_speed_tester']).toBeTruthy();
    expect(SAMPLE_BUILDS_BY_ID['sample_off_road_tester']).toBeTruthy();
  });

  it('every sample build references real parts and paints', () => {
    for (const build of SAMPLE_BUILDS) {
      expect(getPart(build.parts.chassisId)?.category).toBe('chassis');
      expect(getPart(build.parts.engineId)?.category).toBe('engine');
      expect(getPart(build.parts.wheelsId)?.category).toBe('wheels');
      expect(getPart(build.parts.interiorId)?.category).toBe('interior');
      expect(build.parts.techIds.length).toBeLessThanOrEqual(MAX_TECH_PARTS);
      for (const techId of build.parts.techIds) {
        expect(getPart(techId)?.category).toBe('tech');
      }
      expect(getPaintColor(build.paintColorId)).toBeTruthy();
    }
  });

  it('every sample build calculates stats without validation errors', () => {
    for (const build of SAMPLE_BUILDS) {
      const result = calculateStats(build.parts);
      expect(result.validation.ok).toBe(true);
      expect(result.validation.errors).toEqual([]);
    }
  });
});
