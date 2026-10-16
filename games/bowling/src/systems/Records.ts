import { loadJson, saveJson } from '@tomzo-arcade/core';
import { SCORE_KEY } from '../core/constants';
export interface RecordEntry { score: number; stars: number }
export class Records {
  private entries: Record<string,RecordEntry> = {};
  constructor() {
    const data = loadJson<unknown>(SCORE_KEY,{});
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [id,value] of Object.entries(data)) {
        if (value && typeof value === 'object' && Number.isFinite(value.score) && value.score >= 0
          && Number.isInteger(value.stars) && value.stars >= 0 && value.stars <= 3) this.entries[id]=value;
      }
    }
  }
  get(id: string): RecordEntry { return this.entries[id] ?? {score:0,stars:0}; }
  save(id: string,score: number,stars: number): void {
    const previous = this.get(id);
    this.entries[id]={score:Math.max(previous.score,score),stars:Math.max(previous.stars,stars)};
    saveJson(SCORE_KEY,this.entries);
  }
}
