import { BANK_ARC, BANK_RADIUS, BANK_SEGMENTS, BANK_START, BANK_WIDTH,
  LANE_THICKNESS, LAUNCH_HEIGHT, LAUNCH_LENGTH, LAUNCH_WIDTH, LAUNCH_X } from './constants';

export interface Surface { x: number; y: number; z: number; width: number; length: number; angle: number; kind: 'floor' | 'bank' | 'launch' }
export function surfaces(bank: boolean): Surface[] {
  const result: Surface[] = [{ x: 0, y: -LANE_THICKNESS / 2, z: bank ? -4.75 : -5.5,
    width: bank ? BANK_WIDTH : 2.4, length: bank ? 12.5 : 15, angle: 0, kind: 'floor' }];
  if (!bank) return result;
  for (let i = 0; i < BANK_SEGMENTS; i++) {
    const a = i / BANK_SEGMENTS * BANK_ARC;
    const b = (i + 1) / BANK_SEGMENTS * BANK_ARC;
    const angle = (a + b) / 2;
    const y1 = BANK_RADIUS * (1 - Math.cos(a)), y2 = BANK_RADIUS * (1 - Math.cos(b));
    const z1 = BANK_START - BANK_RADIUS * Math.sin(a), z2 = BANK_START - BANK_RADIUS * Math.sin(b);
    result.push({ x: 0, y: (y1 + y2) / 2 - Math.cos(angle) * LANE_THICKNESS / 2,
      z: (z1 + z2) / 2 - Math.sin(angle) * LANE_THICKNESS / 2,
      width: BANK_WIDTH, length: Math.hypot(y2 - y1, z2 - z1) + 0.008, angle, kind: 'bank' });
  }
  const angle = -Math.atan2(LAUNCH_HEIGHT, LAUNCH_LENGTH);
  result.push({ x: LAUNCH_X, y: LAUNCH_HEIGHT / 2 - Math.cos(angle) * LANE_THICKNESS / 2,
    z: -LAUNCH_LENGTH / 2 - Math.sin(angle) * LANE_THICKNESS / 2,
    width: LAUNCH_WIDTH, length: Math.hypot(LAUNCH_HEIGHT, LAUNCH_LENGTH), angle, kind: 'launch' });
  return result;
}
