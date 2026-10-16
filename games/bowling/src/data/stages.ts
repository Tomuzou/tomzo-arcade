import definitions from './stages/courses.json';

export interface ObstacleDef {
  position: [number, number, number];
  size: [number, number, number];
  rotationYDeg?: number;
  motion?: { axis: 'x' | 'rotate'; amplitude: number; speed: number; phase?: number };
}
export interface StageDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  hint: string;
  type: 'bank' | 'straight';
  layout: 'star' | 'split' | 'hundred' | 'standard';
  accent: string;
  target: number;
  throws: number;
  angle: number;
  power: number;
  obstacles: ObstacleDef[];
}
export interface PinDef { x: number; z: number; points: number }
export const STAGES = definitions as StageDef[];

export function pinLayout(layout: StageDef['layout']): PinDef[] {
  if (layout === 'standard') {
    return Array.from({ length: 4 }, (_, row) => Array.from({ length: row + 1 }, (_, col) => ({
      x: (col - row / 2) * 0.38, z: -10 - row * 0.33, points: 10,
    }))).flat();
  }
  if (layout === 'hundred') {
    return Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10 - 4.5) * 0.38 + 0.7, z: -7.4 + Math.floor(i / 10) * 0.38,
      points: i === 45 ? 100 : i % 9 === 0 ? 5 : 1,
    }));
  }
  if (layout === 'split') {
    return [-1.25, 2.15].flatMap((center) => Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: row + 1 }, (_, col) => ({
        x: center + (col - row / 2) * 0.38, z: -6.7 + row * 0.34,
        points: row === 2 && col === 1 ? 100 : row === 1 ? 5 : 1,
      }))).flat());
  }
  // Sample a five-point star on a staggered grid, preserving a fixed 65-pin total.
  const candidates: (PinDef & { rank: number })[] = [];
  for (let row = -8; row <= 8; row++) for (let col = -8; col <= 8; col++) {
    const x = (col + (Math.abs(row) % 2) * 0.5) * 0.36;
    const z = row * 0.32;
    const angle = Math.atan2(x, -z);
    const radius = 1.4 + 0.65 * Math.cos(angle * 5);
    candidates.push({ x: x + 0.7, z: z - 5.6, rank: Math.hypot(x, z) / radius, points: 1 });
  }
  return candidates.sort((a, b) => a.rank - b.rank).slice(0, 65)
    .map((pin, i) => ({ x: pin.x, z: pin.z, points: i === 0 ? 100 : i < 13 ? 5 : 1 }));
}
