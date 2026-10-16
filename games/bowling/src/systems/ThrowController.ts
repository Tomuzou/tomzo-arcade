import * as THREE from 'three';
import type { Arena } from '../core/Arena';
import { LAUNCH_HEIGHT, LAUNCH_LENGTH } from '../core/constants';
import { dragShot, clamp, MIN_ANGLE, MAX_ANGLE, type ScreenPoint } from './gesture';

interface Aim { angle: number; power: number }
interface Callbacks {
  getAim: () => Aim;
  change: (angle: number,power: number) => void;
  launch: () => void;
  unlock: () => void;
}
export class ThrowController {
  private readonly handle=document.getElementById('ball-handle') as HTMLButtonElement;
  private readonly overlay=document.getElementById('throw-overlay')!;
  private readonly svg=document.getElementById('gesture-lines')!;
  private readonly arrow=document.getElementById('gesture-arrow')!;
  private readonly cord=document.getElementById('gesture-cord')!;
  private readonly readout=document.getElementById('gesture-readout')!;
  private readonly instruction=document.getElementById('gesture-instruction')!;
  private pointer: number | null=null;
  private start: ScreenPoint={x:0,y:0};
  private pull: ScreenPoint={x:0,y:0};
  private right: ScreenPoint={x:0,y:0};
  private forward: ScreenPoint={x:0,y:0};
  private saved: Aim={angle:0,power:65};
  private armed=false;
  private enabled=false;
  private bank=true;
  private origin=new THREE.Vector3();
  private viewport={width:0,height:0,canvasWidth:0,canvasHeight:0};
  constructor(private arena: Arena,private callbacks: Callbacks) {
    this.handle.addEventListener('pointerdown',event=>{
      if(!this.enabled || event.button!==0)return;
      if(this.pointer!==null) {this.cancel();return;}
      event.preventDefault(); this.callbacks.unlock(); this.handle.focus({preventScroll:true});
      this.pointer=event.pointerId; this.saved={...this.callbacks.getAim()};
      const rect=this.arena.renderer.domElement.getBoundingClientRect();
      this.viewport={width:innerWidth,height:innerHeight,canvasWidth:rect.width,canvasHeight:rect.height};
      this.start={x:event.clientX,y:event.clientY}; this.pull={x:0,y:0}; this.armed=false;
      const center=this.arena.project(this.origin);
      const right=this.arena.project(this.origin.clone().add(new THREE.Vector3(1,0,0)));
      const forward=this.arena.project(this.origin.clone().add(new THREE.Vector3(0,this.bank?-LAUNCH_HEIGHT/LAUNCH_LENGTH:0,-1)));
      this.right={x:right.x-center.x,y:right.y-center.y}; this.forward={x:forward.x-center.x,y:forward.y-center.y};
      this.handle.setPointerCapture(event.pointerId); this.overlay.classList.add('dragging');
      this.draw();
    });
    this.handle.addEventListener('pointermove',event=>this.move(event));
    this.handle.addEventListener('pointerup',event=>{
      if(event.pointerId!==this.pointer)return;
      this.move(event);
      if(this.pointer===null)return;
      const launch=this.armed;
      this.end(!launch);
      if(launch)this.callbacks.launch();
    });
    this.handle.addEventListener('pointercancel',()=>this.cancel());
    this.handle.addEventListener('lostpointercapture',()=>this.cancel());
    this.handle.addEventListener('keydown',event=>{
      if(event.code==='Escape') {event.preventDefault();this.cancel();return;}
      if(this.pointer!==null)return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)) {
        event.preventDefault(); const aim=this.callbacks.getAim();
        this.callbacks.change(clamp(aim.angle+(event.code==='ArrowRight'?0.5:event.code==='ArrowLeft'?-0.5:0),MIN_ANGLE,MAX_ANGLE),
          clamp(aim.power+(event.code==='ArrowUp'?5:event.code==='ArrowDown'?-5:0),20,100)); this.draw();
      }
      if(['Space','Enter'].includes(event.code)) {event.preventDefault();if(!event.repeat)this.callbacks.launch();}
    });
    window.addEventListener('keydown',event=>{if(event.code==='Escape')this.cancel();});
    window.addEventListener('resize',()=>this.cancel());
    window.addEventListener('blur',()=>this.cancel());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancel();});
  }
  get dragging(): boolean { return this.pointer!==null; }
  setEnabled(enabled: boolean): void {
    if(!enabled)this.cancel();
    this.enabled=enabled; this.overlay.hidden=!enabled; this.handle.disabled=!enabled;
  }
  cancel(): void { if(this.pointer!==null)this.end(true); }
  private end(restore: boolean): void {
    const pointer=this.pointer; this.pointer=null; this.armed=false;
    if(pointer!==null && this.handle.hasPointerCapture(pointer))this.handle.releasePointerCapture(pointer);
    this.overlay.classList.remove('dragging');
    if(restore)this.callbacks.change(this.saved.angle,this.saved.power);
    this.draw();
  }
  private move(event: PointerEvent): void {
    if(event.pointerId!==this.pointer)return;
    const rect=this.arena.renderer.domElement.getBoundingClientRect();
    // A release may arrive before the browser dispatches resize/ResizeObserver.
    if(innerWidth!==this.viewport.width || innerHeight!==this.viewport.height
      || Math.abs(rect.width-this.viewport.canvasWidth)>0.5 || Math.abs(rect.height-this.viewport.canvasHeight)>0.5) {
      this.cancel();return;
    }
    event.preventDefault(); this.pull={x:event.clientX-this.start.x,y:event.clientY-this.start.y};
    const shot=dragShot(this.pull,this.right,this.forward); this.armed=shot.armed;
    if(shot.armed)this.callbacks.change(shot.angle,shot.power);
    this.draw();
  }
  update(origin: THREE.Vector3,bank: boolean): void { this.origin.copy(origin);this.bank=bank;if(this.enabled)this.draw(); }
  private draw(): void {
    const p=this.arena.project(this.origin),aim=this.callbacks.getAim();
    const rect=this.arena.renderer.domElement.getBoundingClientRect();
    this.overlay.style.visibility=p.x<24 || p.x>rect.width-24 || p.y<40 || p.y>rect.height-30?'hidden':'visible';
    const radians=aim.angle*Math.PI/180;
    const target=this.arena.project(this.origin.clone().add(new THREE.Vector3(Math.sin(radians),this.bank?-Math.cos(radians)*LAUNCH_HEIGHT/LAUNCH_LENGTH:0,-Math.cos(radians))));
    const direction=new THREE.Vector2(target.x-p.x,target.y-p.y).normalize().multiplyScalar(45+aim.power*0.9);
    this.svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
    this.handle.style.left=p.x+'px'; this.handle.style.top=p.y+'px';
    this.handle.style.setProperty('--charge',String(this.dragging&&this.armed?aim.power:0)+'%');
    this.arrow.setAttribute('d','M '+p.x+' '+p.y+' l '+direction.x+' '+direction.y);
    this.cord.setAttribute('d',this.dragging?'M '+p.x+' '+p.y+' l '+this.pull.x+' '+this.pull.y:'');
    this.instruction.style.left=clamp(p.x,100,rect.width-100)+'px';
    this.instruction.style.top=Math.min(rect.height-38,p.y+38)+'px';
    this.instruction.textContent=this.dragging?(this.armed?'離すと投球 · 戻すとキャンセル':'矢印と反対に引っぱる'):'ボールを引いて、離す';
    this.readout.style.left=clamp(p.x+direction.x,70,rect.width-70)+'px';
    this.readout.style.top=clamp(p.y+direction.y-34,75,rect.height-60)+'px';
    this.readout.textContent=aim.power+'%  /  '+(aim.angle>0?'右 ':aim.angle<0?'左 ':'')+Math.abs(aim.angle)+'°';
    this.overlay.dataset.armed=String(this.armed);
  }
}
