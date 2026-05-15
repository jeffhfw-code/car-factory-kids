import type { Part } from './types';

export const CHASSIS_PARTS: Part[] = [
  {
    id: 'chassis_compact',
    category: 'chassis',
    name: 'Compact Hatchback',
    description: 'Small and light. Easy to drive, easy to corner.',
    modifiers: {
      weightLbs: -500,
      topSpeedRating: 1,
      gripRating: 1,
      aerodynamicsRating: 1,
      groundClearanceRating: -1,
    },
  },
  {
    id: 'chassis_sports',
    category: 'chassis',
    name: 'Sports Coupe',
    description: 'Low, fast, and grippy. Built for paved tracks.',
    modifiers: {
      weightLbs: -300,
      topSpeedRating: 3,
      accelerationRating: 2,
      gripRating: 2,
      aerodynamicsRating: 3,
      groundClearanceRating: -2,
    },
  },
  {
    id: 'chassis_suv',
    category: 'chassis',
    name: 'SUV',
    description: 'Tall and heavy. Loves dirt and bumpy roads.',
    modifiers: {
      weightLbs: 800,
      topSpeedRating: -2,
      groundClearanceRating: 3,
      offRoadTractionRating: 2,
      stabilityRating: 1,
    },
  },
];

export const ENGINE_PARTS: Part[] = [
  {
    id: 'engine_small_gas',
    category: 'engine',
    name: 'Small Gas Engine',
    description: 'A friendly all-rounder. Decent everything.',
    modifiers: {
      topSpeedRating: 1,
      accelerationRating: 1,
      rangeRating: 2,
      coolingRating: 1,
      efficiencyRating: 1,
    },
  },
  {
    id: 'engine_electric',
    category: 'engine',
    name: 'Electric Motor',
    description: 'Quiet and quick off the line. Uses energy carefully.',
    modifiers: {
      topSpeedRating: 1,
      accelerationRating: 4,
      rangeRating: -1,
      efficiencyRating: 4,
      coolingRating: 3,
    },
  },
  {
    id: 'engine_v8',
    category: 'engine',
    name: 'V8 Sport Engine',
    description: 'Roars on the straights. Drinks a lot of fuel.',
    modifiers: {
      topSpeedRating: 4,
      accelerationRating: 3,
      rangeRating: -1,
      coolingRating: -2,
      efficiencyRating: -3,
      weightLbs: 400,
    },
  },
];

export const WHEEL_PARTS: Part[] = [
  {
    id: 'wheels_standard',
    category: 'wheels',
    name: 'Standard Road Tires',
    description: 'Balanced rubber. Works fine almost anywhere paved.',
    modifiers: {
      gripRating: 1,
      wetGripRating: 1,
      tireWearRating: 1,
    },
  },
  {
    id: 'wheels_sport',
    category: 'wheels',
    name: 'Sport Tires',
    description: 'Sticky on paved corners. Hates dirt and rain.',
    modifiers: {
      gripRating: 4,
      topSpeedRating: 1,
      wetGripRating: -1,
      offRoadTractionRating: -2,
      tireWearRating: -2,
    },
  },
  {
    id: 'wheels_off_road',
    category: 'wheels',
    name: 'Off-Road Tires',
    description: 'Knobby tread chews dirt. Slow and loud on pavement.',
    modifiers: {
      offRoadTractionRating: 5,
      groundClearanceRating: 1,
      gripRating: -1,
      topSpeedRating: -1,
      tireWearRating: 1,
    },
  },
];

export const INTERIOR_PARTS: Part[] = [
  {
    id: 'interior_basic_cloth',
    category: 'interior',
    name: 'Basic Cloth Seats',
    description: 'Comfy and simple. No stat changes.',
    modifiers: {},
  },
  {
    id: 'interior_sport_bucket',
    category: 'interior',
    name: 'Sport Bucket Seats',
    description: 'Hug you in the corners. Saves a little weight.',
    modifiers: {
      weightLbs: -50,
      stabilityRating: 1,
    },
  },
  {
    id: 'interior_racing',
    category: 'interior',
    name: 'Lightweight Racing Seat',
    description: 'Stripped-down racing seat. Tight, tough, and very light.',
    modifiers: {
      weightLbs: -100,
      stabilityRating: 2,
    },
  },
];

export const TECH_PARTS: Part[] = [
  {
    id: 'tech_traction_control',
    category: 'tech',
    name: 'Traction Control',
    description: 'Computer helps the tires stick on slippery surfaces.',
    modifiers: {
      gripRating: 2,
      wetGripRating: 2,
      offRoadTractionRating: 1,
    },
  },
  {
    id: 'tech_aero_kit',
    category: 'tech',
    name: 'Aerodynamic Kit',
    description: 'Wings and skirts that push the car down at speed.',
    modifiers: {
      aerodynamicsRating: 3,
      stabilityRating: 1,
      topSpeedRating: 1,
    },
  },
  {
    id: 'tech_extra_battery',
    category: 'tech',
    name: 'Extra Battery Pack',
    description: 'More energy on board. Heavier and a tad slower off the line.',
    modifiers: {
      rangeRating: 3,
      weightLbs: 200,
      accelerationRating: -1,
    },
  },
];

export const ALL_PARTS: Part[] = [
  ...CHASSIS_PARTS,
  ...ENGINE_PARTS,
  ...WHEEL_PARTS,
  ...INTERIOR_PARTS,
  ...TECH_PARTS,
];

export const PARTS_BY_ID: Record<string, Part> = Object.fromEntries(
  ALL_PARTS.map((p) => [p.id, p]),
);

export const MAX_TECH_PARTS = 3;

export function getPart(id: string): Part | undefined {
  return PARTS_BY_ID[id];
}
