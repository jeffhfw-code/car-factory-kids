import type { PaintColor, PaintFinish } from './types';

export const PAINT_COLORS: PaintColor[] = [
  { id: 'red', name: 'Fire Red', hex: '#E63946' },
  { id: 'blue', name: 'Sky Blue', hex: '#3FA9F5' },
  { id: 'yellow', name: 'Sunshine Yellow', hex: '#FFC93C' },
  { id: 'green', name: 'Grass Green', hex: '#7BC950' },
  { id: 'purple', name: 'Royal Purple', hex: '#8A4FFF' },
  { id: 'white', name: 'Cloud White', hex: '#F4F1ED' },
  { id: 'black', name: 'Midnight Black', hex: '#2C3E50' },
  { id: 'orange', name: 'Pumpkin Orange', hex: '#FF8C42' },
];

export const PAINT_FINISHES: PaintFinish[] = ['matte', 'gloss', 'metallic'];

export const PAINT_COLORS_BY_ID: Record<string, PaintColor> = Object.fromEntries(
  PAINT_COLORS.map((p) => [p.id, p]),
);

export function getPaintColor(id: string): PaintColor | undefined {
  return PAINT_COLORS_BY_ID[id];
}
