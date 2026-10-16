import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { STAGES, pinLayout } from '../src/data/stages';
import { Physics } from '../src/core/Physics';
import { Ball } from '../src/entities/Ball';
import { Records } from '../src/systems/Records';
import {simulate,createSimulation} from './simulate';
import {dragShot} from '../src/systems/gesture';

test('drag direction follows the projected lane in portrait and angled cameras',()=>{
  for(const [right,forward] of [[{x:32,y:0},{x:0,y:-25}],[{x:25,y:13},{x:30,y:-8}]]) {
    for(const angle of [-20,0,8.5,25]) {
      const radians=angle*Math.PI/180;
      const direction={x:right.x*Math.sin(radians)+forward.x*Math.cos(radians),y:right.y*Math.sin(radians)+forward.y*Math.cos(radians)};
      const scale=-73.625/Math.hypot(direction.x,direction.y);
      const shot=dragShot({x:direction.x*scale,y:direction.y*scale},right,forward);
      assert.equal(shot.angle,angle);assert.equal(shot.power,65);assert.equal(shot.armed,true);
    }
  }
});
test('short pulls and forward pushes cancel; strength and aim are bounded',()=>{
  const right={x:30,y:0},forward={x:0,y:-25};
  assert.equal(dragShot({x:0,y:6},right,forward).armed,false);
  assert.equal(dragShot({x:0,y:-90},right,forward).armed,false);
  assert.equal(dragShot({x:0,y:400},right,forward).power,100);
  assert.equal(dragShot({x:-400,y:50},right,forward).angle,30);
  assert.equal(dragShot({x:400,y:50},right,forward).angle,-25);
});

test('six courses have attainable targets, unique IDs, and the intended pin counts',()=>{
  assert.equal(new Set(STAGES.map(s=>s.id)).size,6);
  assert.deepEqual(STAGES.map(s=>pinLayout(s.layout).length),[65,65,65,30,100,10]);
  for(const stage of STAGES) {
    const pins=pinLayout(stage.layout);
    assert.ok(stage.target<=pins.reduce((sum,p)=>sum+p.points,0));
    for(let i=0;i<pins.length;i++) for(let j=i+1;j<pins.length;j++)
      assert.ok(Math.hypot(pins[i].x-pins[j].x,pins[i].z-pins[j].z)>0.23);
  }
});
test('default bank shot climbs the curve, U-turns, and reaches the red pin',()=>{
  const result=simulate(STAGES[0]);
  assert.ok(result.minZ < -15);
  assert.ok(result.maxY > 3);
  assert.equal(result.returned,true);
  assert.ok(result.score>=STAGES[0].target,JSON.stringify(result));
});
test('a straight pocket shot can strike all ten pins',()=>{
  assert.equal(simulate(STAGES[5]).fallen,10);
});
test('moving gate is passable when the throw is timed',()=>{
  assert.ok(simulate(STAGES[1],8.5,65,0,0,2).score>=STAGES[1].target);
});
test('rebound course remains playable with the physical bumpers',()=>{
  assert.ok(simulate(STAGES[2]).score>=STAGES[2].target);
});
test('both islands can be cleared by changing aim between throws',()=>{
  const shoot=createSimulation(STAGES[3]);
  shoot(5,65);
  assert.ok(shoot(10.5,65).score>=STAGES[3].target);
});
test('100 pins can reach the goal in four timed throws with pin carry-over',()=>{
  const shoot=createSimulation(STAGES[4]);
  let score=0;
  for(const angle of [8,8,6,10]) score=shoot(angle,65,0,0,1).score;
  assert.ok(score>=STAGES[4].target);
});
test('reset clears momentum and an unthrown ball stays on the launch platform',()=>{
  const physics=new Physics(),ball=new Ball(physics,new THREE.Scene());
  ball.reset(true); const start=ball.body.position.clone();
  for(let i=0;i<120;i++)physics.world.step(1/120);
  assert.equal(ball.body.position.distanceTo(start),0);
  ball.throw(8.5,65,0,true); assert.ok(ball.body.velocity.length()>1);
  ball.reset(true); assert.equal(ball.body.velocity.length(),0); assert.equal(ball.isThrown,false);
});
test('records tolerate invalid JSON shapes and preserve separate personal bests',()=>{
  let stored='{"star-bank":{"score":"bad","stars":9}}';
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}
  }});
  const records=new Records();
  assert.deepEqual(records.get('star-bank'),{score:0,stars:0});
  records.save('star-bank',126,3); records.save('star-bank',12,0);
  assert.deepEqual(new Records().get('star-bank'),{score:126,stars:3});
  stored='null'; assert.deepEqual(new Records().get('star-bank'),{score:0,stars:0});
  stored='{broken'; assert.deepEqual(new Records().get('star-bank'),{score:0,stars:0});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get:()=>{throw Error('blocked');}});
  assert.doesNotThrow(()=>new Records().save('star-bank',123,2));
  delete (globalThis as {localStorage?: unknown}).localStorage;
});
