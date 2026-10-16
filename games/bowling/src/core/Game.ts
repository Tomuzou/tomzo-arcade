import * as THREE from 'three';
import { FIXED_TIME_STEP, SETTLE_SPEED, SHOT_TIMEOUT, LAUNCH_HEIGHT, LAUNCH_LENGTH } from './constants';
import { Physics } from './Physics';
import { Arena } from './Arena';
import { Ball } from '../entities/Ball';
import { StageManager } from '../systems/StageManager';
import { Records } from '../systems/Records';
import { Sound } from '../systems/Sound';
import { ThrowController } from '../systems/ThrowController';
import { clamp, MIN_ANGLE, MAX_ANGLE } from '../systems/gesture';
import { STAGES, type StageDef } from '../data/stages';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
type Phase = 'ready' | 'rolling' | 'between' | 'result';
export class Game {
  private readonly arena: Arena;
  private readonly physics = new Physics();
  private readonly ball: Ball;
  private readonly manager: StageManager;
  private readonly records = new Records();
  private readonly sound = new Sound();
  private readonly controller: ThrowController;
  private aim={angle:8.5,power:65,position:0};
  private closeup=false;
  private readonly guide = new THREE.Group();
  private readonly trail: THREE.Line;
  private readonly trailPoints: THREE.Vector3[] = [];
  private readonly clock = new THREE.Clock();
  private stageIndex = 0;
  private stage: StageDef = STAGES[0];
  private phase: Phase = 'ready';
  private practice = false;
  private throws = 0;
  private shotTime = 0;
  private settled = 0;
  private elapsed = 0;
  private accumulator = 0;
  private previousScore = 0;
  private noticeTimer = 0;
  private fast = false;
  constructor(container: HTMLElement) {
    this.arena=new Arena(container);
    this.ball=new Ball(this.physics,this.arena.scene);
    this.manager=new StageManager(this.physics,this.arena.scene);
    this.controller=new ThrowController(this.arena,{
      getAim:()=>this.aim,
      change:(angle,power)=>{this.aim.angle=angle;this.aim.power=power;this.controlsChanged();},
      launch:()=>this.action(),unlock:()=>this.sound.unlock(),
    });
    for(let i=0;i<14;i++) {
      const dot=new THREE.Mesh(new THREE.SphereGeometry(i===0?0.07:0.035,8,6),
        new THREE.MeshBasicMaterial({color:'#fff4bd',transparent:true,opacity:1-i/18}));
      this.guide.add(dot);
    }
    this.arena.scene.add(this.guide);
    this.trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#ffc06e',transparent:true,opacity:0.65}));
    this.trail.frustumCulled=false; this.arena.scene.add(this.trail);
    this.bind(); this.loadStage(0);
    document.addEventListener('visibilitychange',()=>{ this.clock.getDelta(); this.accumulator=0; });
  }
  private value(id: 'angle'|'power'|'position'|'spin'): number {
    return id==='spin'?Number(el<HTMLInputElement>('spin').value):this.aim[id];
  }
  private renderStages(): void {
    el('stage-list').innerHTML=STAGES.map((stage,i)=>{
      const record=this.records.get(stage.id);
      return '<button class="stage-card '+(i===this.stageIndex?'selected':'')+'" data-stage="'+i+'" aria-pressed="'+(i===this.stageIndex)+'">'
        +'<span class="stage-number">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+stage.name+'</strong><small>'+stage.subtitle
        +'</small></span><span class="stage-stars" aria-label="'+record.stars+'つ星">'+(record.stars?'★'.repeat(record.stars):'—')+'</span></button>';
    }).join('');
    el('stage-list').querySelectorAll<HTMLButtonElement>('button').forEach(button=>{
      button.onclick=()=>{this.loadStage(Number(button.dataset.stage));el<HTMLDialogElement>('courses').close();};
    });
  }
  private loadStage(index: number): void {
    this.controller.cancel();
    this.stageIndex=index; this.stage=STAGES[index]; this.phase='ready';
    this.throws=0; this.shotTime=0; this.elapsed=0; this.accumulator=0; this.previousScore=0; this.fast=false;
    this.manager.load(this.stage); this.trailPoints.length=0; this.updateTrail();
    this.aim={angle:this.stage.angle,power:this.stage.power,position:0};
    el<HTMLInputElement>('spin').value='0';
    this.closeup=false;this.arena.setStage(this.stage.type==='bank');
    this.ball.reset(this.stage.type==='bank');
    el<HTMLDialogElement>('result').close();
    el('course-title').textContent=this.stage.name;
    el('course-description').textContent=this.stage.description;
    el('course-number').textContent='COURSE '+String(index+1).padStart(2,'0')+' / 06';
    el('hint').textContent=this.stage.hint;
    el('pin-legend').hidden=this.stage.type==='straight';
    el('classic-legend').hidden=this.stage.type!=='straight';
    this.renderStages(); this.controlsChanged(); this.updateHUD();
    this.notice('ボールを引っぱって、離すと投球');
  }
  private controlsChanged(): void {
    el('aim-summary').textContent=this.value('angle')+'° / '+this.value('power')+'%';
    el('spin-value').textContent=this.value('spin')===0?'なし':(this.value('spin')>0?'右 ':'左 ')+Math.abs(this.value('spin'));
    el('position-value').textContent=this.value('position')===0?'中央':this.value('position')>0?'右寄り':'左寄り';
    if(this.phase==='ready') this.ball.reset(this.stage.type==='bank',this.value('position'));
    this.updateGuide();
  }
  private updateGuide(): void {
    this.guide.visible=this.phase==='ready';
    const angle=this.value('angle')*Math.PI/180, origin=this.ball.body.position;
    this.guide.children.forEach((dot,i)=>{
      const distance=0.25+i*0.18;
      dot.position.set(origin.x+Math.sin(angle)*distance,origin.y+0.02-(this.stage.type==='bank'?distance*Math.cos(angle)*LAUNCH_HEIGHT/LAUNCH_LENGTH:0),origin.z-Math.cos(angle)*distance);
    });
  }
  private bind(): void {
    el('spin').addEventListener('input',()=>this.controlsChanged());
    for(const [id,direction] of [['position-left',-1],['position-right',1]] as const) el(id).onclick=()=>{
      if(this.phase!=='ready')return;
      this.controller.cancel();this.aim.position=clamp(this.aim.position+direction*0.2,-1,1);this.controlsChanged();
    };
    el('btn-courses').onclick=()=>{this.controller.cancel();el<HTMLDialogElement>('courses').showModal();};
    el('courses-close').onclick=()=>el<HTMLDialogElement>('courses').close();
    el('btn-throw').onclick=()=>this.action();
    el('btn-reset').onclick=()=>this.loadStage(this.stageIndex);
    el('btn-camera').onclick=()=>{this.controller.cancel();this.arena.toggle();};
    el('btn-sound').onclick=()=>{
      this.sound.enabled=!this.sound.enabled; this.sound.unlock();
      el('btn-sound').textContent=this.sound.enabled?'音 ON':'音 OFF';
      el('btn-sound').setAttribute('aria-pressed',String(this.sound.enabled));
    };
    el('btn-practice').onclick=()=>{
      this.practice=!this.practice; el('btn-practice').textContent=this.practice?'練習中 · 球数無制限':'練習モード';
      el('btn-practice').setAttribute('aria-pressed',String(this.practice)); this.loadStage(this.stageIndex);
    };
    el('result-retry').onclick=()=>this.loadStage(this.stageIndex);
    el('result-next').onclick=()=>this.loadStage((this.stageIndex+1)%STAGES.length);
    el('result-close').onclick=()=>el<HTMLDialogElement>('result').close();
    el('btn-help').onclick=()=>{this.controller.cancel();el<HTMLDialogElement>('help').showModal();};
    el('help-close').onclick=()=>el<HTMLDialogElement>('help').close();
    window.addEventListener('keydown',event=>{
      if(event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement
        || document.querySelector('dialog[open]')) return;
      if(this.controller.dragging)return;
      if(event.code==='Space') {event.preventDefault(); if(!event.repeat)this.action();}
      if(event.code==='KeyR') this.loadStage(this.stageIndex);
      if(event.code==='KeyV') this.arena.toggle();
      if(this.phase==='ready' && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)) {
        event.preventDefault();
        this.aim.angle=clamp(this.aim.angle+(event.code==='ArrowRight'?0.5:event.code==='ArrowLeft'?-0.5:0),MIN_ANGLE,MAX_ANGLE);
        this.aim.power=clamp(this.aim.power+(event.code==='ArrowUp'?5:event.code==='ArrowDown'?-5:0),20,100);this.controlsChanged();
      }
    });
  }
  private action(): void {
    this.sound.unlock();
    if(this.phase==='rolling') { this.fast=!this.fast; this.updateHUD(); return; }
    if(this.phase==='result') { el<HTMLDialogElement>('result').showModal(); return; }
    if(this.phase==='between') {
      this.manager.sweep(); this.phase='ready';
      this.closeup=false;this.arena.update(1,false);
      this.ball.reset(this.stage.type==='bank',this.value('position')); this.trailPoints.length=0; this.updateTrail();
      this.controlsChanged(); this.updateHUD(); this.notice('残ったピンを狙おう。'); return;
    }
    if(this.phase!=='ready') return;
    this.phase='rolling'; this.throws++; this.shotTime=0; this.settled=0; this.fast=false;
    this.ball.throw(this.value('angle'),this.value('power'),this.value('spin'),this.stage.type==='bank');
    this.sound.play('throw'); this.notice('ROLLING'); this.updateGuide(); this.updateHUD();
  }
  private notice(text: string): void { el('shot-status').textContent=text; }
  private finishShot(): void {
    const clear=this.manager.score>=this.stage.target;
    const all=this.manager.fallen===this.manager.pins.length;
    if(all || (!this.practice && (clear || this.throws>=this.stage.throws))) {
      this.phase='result';
      const stars=clear?(all || this.throws===1?3:this.throws<this.stage.throws?2:1):0;
      if(!this.practice) this.records.save(this.stage.id,this.manager.score,stars);
      this.renderStages();
      el('result-eyebrow').textContent=this.practice?'PRACTICE COMPLETE':clear?'COURSE CLEAR':'TRY AGAIN';
      el('result-title').textContent=all?'すべて倒した！':clear?'ナイス・バンク！':'もう一度、狙おう。';
      el('result-score').textContent=String(this.manager.score);
      el('result-stars').textContent=this.practice?'PRACTICE':'★'.repeat(stars)+'☆'.repeat(3-stars);
      el('result-detail').textContent=this.manager.fallen+' / '+this.manager.pins.length+' ピン · '+this.throws+'投 / 目標 '+this.stage.target+' pt';
      el('result-note').textContent=this.practice?'練習の成績は記録に保存されません。':clear?'自己ベストと星を保存しました。':this.stage.hint;
      el<HTMLDialogElement>('result').showModal(); if(clear)this.sound.play('clear');
      this.notice(clear?'ステージクリア！':'チャレンジ終了');
    } else {
      this.phase='between'; this.notice('+'+(this.manager.score-this.previousScore)+' pt · 次のボールを準備しよう');
    }
    this.previousScore=this.manager.score;
    this.ball.body.velocity.setZero(); this.ball.body.angularVelocity.setZero(); this.ball.body.sleep();
    this.manager.pins.forEach(pin=>{ pin.body.velocity.setZero(); pin.body.angularVelocity.setZero(); pin.body.sleep(); });
    this.updateHUD();
  }
  private updateHUD(): void {
    el('score').textContent=String(this.manager.score);
    el('target').textContent=String(this.stage.target);
    el('pin-count').textContent=this.manager.fallen+' / '+this.manager.pins.length;
    el('throw-count').textContent=this.throws+' / '+(this.practice?'∞':this.stage.throws);
    el('best').textContent=String(this.records.get(this.stage.id).score);
    el<HTMLProgressElement>('score-progress').max=this.stage.target; el<HTMLProgressElement>('score-progress').value=this.manager.score;
    el('score-progress').setAttribute('aria-label','得点 '+this.manager.score+' / 目標 '+this.stage.target);
    const button=el<HTMLButtonElement>('btn-throw');
    button.textContent=this.phase==='rolling'?(this.fast?'通常速度へ':'早送り ×2'):this.phase==='between'?'次のボール →':this.phase==='result'?'リザルトを見る':'この狙いで投球 ↗';
    ['spin','position-left','position-right'].forEach(id=>(el(id) as HTMLInputElement|HTMLButtonElement).disabled=this.phase!=='ready');
    this.controller.setEnabled(this.phase==='ready');
    el('app').dataset.phase=this.phase;
    el('app').dataset.course=this.stage.id;
  }
  private updateTrail(): void {
    this.trail.geometry.dispose();
    this.trail.geometry=new THREE.BufferGeometry().setFromPoints(this.trailPoints);
  }
  start(): void { this.arena.renderer.setAnimationLoop(()=>this.tick()); }
  private tick(): void {
    const delta=Math.min(this.clock.getDelta(),0.1)*(this.phase==='rolling' && this.fast?2:1);
    if(document.hidden)return;
    this.accumulator+=delta;
    const oldScore=this.manager.score;
    while(this.accumulator>=FIXED_TIME_STEP) {
      this.elapsed+=FIXED_TIME_STEP; this.manager.step(this.elapsed); this.ball.beforeStep();
      this.physics.world.step(FIXED_TIME_STEP);
      this.accumulator-=FIXED_TIME_STEP;
    }
    const alpha=this.accumulator/FIXED_TIME_STEP;
    for(const body of this.physics.world.bodies) {
      body.previousPosition.lerp(body.position,alpha,body.interpolatedPosition);
      body.previousQuaternion.slerp(body.quaternion,alpha,body.interpolatedQuaternion);
    }
    this.ball.update(); this.manager.sync();
    if(this.phase==='rolling') {
      this.shotTime+=delta; this.noticeTimer+=delta;
      if(this.noticeTimer>0.06) {
        this.noticeTimer=0; this.trailPoints.push(this.ball.mesh.position.clone());
        if(this.trailPoints.length>160)this.trailPoints.shift(); this.updateTrail();
      }
      if(this.manager.score>oldScore) { this.sound.play('pin'); this.updateHUD(); }
      const out=this.ball.body.position.y < -2 || this.ball.body.position.z > 3;
      const slow=this.ball.body.velocity.length()<SETTLE_SPEED;
      this.settled=(out||slow)&&!this.manager.moving?this.settled+delta:0;
      if(this.settled>0.8 || this.shotTime>SHOT_TIMEOUT) this.finishShot();
      const p=this.ball.body.position;
      if(this.stage.type==='bank' ? this.ball.body.velocity.z>0 && p.z>-9 && p.z<-3 && p.y<1 : p.z<-7) this.closeup=true;
    }
    if(!this.controller.dragging)this.arena.update(delta,this.closeup);
    this.controller.update(this.ball.mesh.position,this.stage.type==='bank');
    this.arena.render();
  }
}
