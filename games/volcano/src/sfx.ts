/**
 * WebAudio で合成する効果音。音源ファイルは持たない。
 * AudioContext は自動再生制限を避けるため、最初の再生時（ユーザー操作の後）に作る。
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastBump = 0;

  constructor(public muted: boolean) {}

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      if (!window.AudioContext) return null;
      try { this.ctx = new AudioContext(); } catch { return null; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(frequency: number, at: number, length: number, volume: number, type: OscillatorType = 'sine', endFrequency = frequency): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    if (endFrequency !== frequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  /** 壁・外枠に当たった音。速さで音量が変わる。連打は間引く。 */
  bump(speed: number): void {
    if (speed < 0.6 || !this.ensure()) return;
    const now = this.ctx!.currentTime;
    if (now - this.lastBump < 0.07) return;
    this.lastBump = now;
    this.tone(210, 0, 0.09, Math.min(0.5, speed * 0.12), 'triangle', 90);
  }

  checkpoint(): void {
    if (!this.ensure()) return;
    this.tone(660, 0, 0.14, 0.22);
    this.tone(990, 0.09, 0.2, 0.2);
  }

  fall(): void {
    if (!this.ensure()) return;
    this.tone(520, 0, 0.6, 0.28, 'triangle', 70);
  }

  goal(): void {
    if (!this.ensure()) return;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.09, i === 3 ? 0.5 : 0.16, 0.22, 'triangle'));
  }

  dispose(): void { void this.ctx?.close(); this.ctx = null; }
}
