import type { Build } from './types';

export const SAMPLE_BUILDS: Build[] = [
  {
    id: 'sample_balanced_starter',
    name: 'Balanced Starter',
    paintColorId: 'blue',
    paintFinish: 'gloss',
    parts: {
      chassisId: 'chassis_compact',
      engineId: 'engine_small_gas',
      wheelsId: 'wheels_standard',
      interiorId: 'interior_basic_cloth',
      techIds: [],
    },
    createdAt: 0,
    lastModified: 0,
  },
  {
    id: 'sample_speed_tester',
    name: 'Speed Tester',
    paintColorId: 'red',
    paintFinish: 'metallic',
    parts: {
      chassisId: 'chassis_sports',
      engineId: 'engine_v8',
      wheelsId: 'wheels_sport',
      interiorId: 'interior_sport_bucket',
      techIds: ['tech_aero_kit'],
    },
    createdAt: 0,
    lastModified: 0,
  },
  {
    id: 'sample_off_road_tester',
    name: 'Off-Road Tester',
    paintColorId: 'orange',
    paintFinish: 'matte',
    parts: {
      chassisId: 'chassis_suv',
      engineId: 'engine_electric',
      wheelsId: 'wheels_off_road',
      interiorId: 'interior_sport_bucket',
      techIds: ['tech_traction_control'],
    },
    createdAt: 0,
    lastModified: 0,
  },
];

export const SAMPLE_BUILDS_BY_ID: Record<string, Build> = Object.fromEntries(
  SAMPLE_BUILDS.map((b) => [b.id, b]),
);

export function getSampleBuild(id: string): Build | undefined {
  return SAMPLE_BUILDS_BY_ID[id];
}
