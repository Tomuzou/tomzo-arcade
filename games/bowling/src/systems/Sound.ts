export class Sound {
  enabled = true;
  private context: AudioContext | null = null;
  unlock(): void {
    if (!this.enabled) return;
    try { this.context ??= new AudioContext(); void this.context.resume().catch(()=>{}); } catch { /* Audio is optional. */ }
  }
  play(kind: 'throw' | 'pin' | 'clear'): void {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx=this.context, now=ctx.currentTime;
    const notes=kind==='clear'?[523,659,784]:kind==='throw'?[140]:[340,210];
    notes.forEach((frequency,i)=>{
      const oscillator=ctx.createOscillator(), gain=ctx.createGain();
      oscillator.type=kind==='pin'?'triangle':'sine'; oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0.055,now+i*0.08);
      gain.gain.exponentialRampToValueAtTime(0.001,now+i*0.08+0.18);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(now+i*0.08); oscillator.stop(now+i*0.08+0.2);
    });
  }
}
