export interface RandomSource {
  next(): number;
}

export function mulberry32(seed: number): RandomSource {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
};

export function variance(rand: RandomSource, amplitude: number): number {
  return (rand.next() - 0.5) * 2 * amplitude;
}
