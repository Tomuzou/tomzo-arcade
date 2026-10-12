export interface TiltVector { x: number; z: number }

/** 画面の向きを考慮して基準からの角度差を操作量にする。約18度で最大入力。 */
export function tiltVector(beta: number, gamma: number, baseBeta: number, baseGamma: number, angle: number): TiltVector {
  const b = ((beta - baseBeta + 540) % 360) - 180;
  const g = gamma - baseGamma;
  const radians = angle * Math.PI / 180;
  const axis = (degrees: number) => Math.sign(degrees) * Math.min(1, Math.max(0, Math.abs(degrees) - 2) / 16);
  return { x: axis(g * Math.cos(radians) + b * Math.sin(radians)), z: axis(b * Math.cos(radians) - g * Math.sin(radians)) };
}

type OrientationAPI = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
export class TiltControls {
  active = false;
  pending = false;
  private latest: { beta: number; gamma: number; angle: number } | null = null;
  private baseline: { beta: number; gamma: number; angle: number } | null = null;
  private filtered = { x: 0, z: 0 };
  private receivedAt = 0;
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(private notify: (message: string) => void) {}

  async enable(): Promise<void> {
    if (this.pending || this.active) return;
    const api = window.DeviceOrientationEvent as OrientationAPI | undefined;
    if (!window.isSecureContext || !api) { this.notify('この環境では傾きを使えません。方向ボタンで操作できます。'); return; }
    this.pending = true;
    this.notify('センサーを待っています。スマホを遊びやすい角度で持ってください。');
    try {
      // iOSではユーザーのボタン操作から直接呼ぶ必要がある。
      if (api.requestPermission && await api.requestPermission() !== 'granted') {
        this.disable('傾きの許可がありません。方向ボタンで操作できます。'); return;
      }
      if (!this.pending) return;
      window.addEventListener('deviceorientation', this.onOrientation);
      this.timeout = setTimeout(() => this.disable('傾きを取得できませんでした。方向ボタンで操作できます。'), 5000);
    } catch {
      this.disable('傾きを有効にできませんでした。方向ボタンで操作できます。');
    }
  }

  private onOrientation = (event: DeviceOrientationEvent): void => {
    if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const angle = window.screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0;
    this.latest = { beta: event.beta, gamma: event.gamma, angle };
    this.receivedAt = performance.now();
    if (!this.active || this.baseline?.angle !== angle) {
      this.active = true; this.pending = false;
      clearTimeout(this.timeout);
      this.calibrate();
    }
  };

  calibrate(): void {
    if (!this.active || !this.latest) return;
    this.baseline = { ...this.latest };
    this.filtered = { x: 0, z: 0 };
    this.notify('傾き操作中：この持ち方が基準です。BRAKEで減速。');
  }

  read(dt: number): TiltVector {
    if (!this.active || !this.latest || !this.baseline || performance.now() - this.receivedAt > 1500) {
      this.filtered = { x: 0, z: 0 }; return this.filtered;
    }
    const target = tiltVector(this.latest.beta, this.latest.gamma, this.baseline.beta, this.baseline.gamma, this.latest.angle);
    const blend = 1 - Math.exp(-12 * dt);
    this.filtered.x += (target.x - this.filtered.x) * blend;
    this.filtered.z += (target.z - this.filtered.z) * blend;
    return this.filtered;
  }

  disable(message = '方向ボタンで操作できます。'): void {
    clearTimeout(this.timeout);
    window.removeEventListener('deviceorientation', this.onOrientation);
    this.active = false; this.pending = false; this.latest = null; this.baseline = null;
    this.filtered = { x: 0, z: 0 };
    this.notify(message);
  }

  dispose(): void { clearTimeout(this.timeout); window.removeEventListener('deviceorientation', this.onOrientation); }
}
