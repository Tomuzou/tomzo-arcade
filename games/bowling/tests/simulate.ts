
import * as THREE from 'three';
import { Physics } from '../src/core/Physics';
import { createLaneBody } from '../src/core/LanePhysics';
import { Ball } from '../src/entities/Ball';
import { Pin } from '../src/entities/Pin';
import { Obstacle } from '../src/entities/Obstacle';
import { FIXED_TIME_STEP } from '../src/core/constants';
import { pinLayout, type StageDef } from '../src/data/stages';

export function createSimulation(stage: StageDef) {
  const physics=new Physics(), scene=new THREE.Scene();
  createLaneBody(physics,stage.type==='bank');
  const pins=pinLayout(stage.layout).map(p=>new Pin(physics,p));
  const obstacles=stage.obstacles.map(def=>new Obstacle(physics,scene,def));
  const ball=new Ball(physics,scene);
  return (angle=stage.angle, power=stage.power, position=0, spin=0, timeOffset=0) => {
  for(const pin of pins) if(pin.isFallen && !pin.removed) {physics.world.removeBody(pin.body);pin.removed=true;}
  ball.reset(stage.type==='bank',position); ball.throw(angle,power,spin,stage.type==='bank');
  let minZ=10, maxY=0, returned=false, deckX:number|null=null;
  const path: number[][]=[];
  for(let i=0;i<15/FIXED_TIME_STEP;i++) {
    obstacles.forEach(o=>o.step(timeOffset+i*FIXED_TIME_STEP));
    ball.beforeStep(); physics.world.step(FIXED_TIME_STEP); pins.forEach(p=>p.update());
    minZ=Math.min(minZ,ball.body.position.z); maxY=Math.max(maxY,ball.body.position.y);
    if(ball.body.position.z < -11 && ball.body.velocity.z>0.3)returned=true;
    if(returned && deckX===null && ball.body.position.z > -7.5)deckX=ball.body.position.x;
    if(i%120===0)path.push([i/120,...ball.body.position.toArray()].map(v=>Number(v.toFixed(2))));
    if(i > 8 / FIXED_TIME_STEP && ball.body.position.y < -3) break;
  }
  return {score:pins.reduce((s,p)=>s+(p.isFallen?p.points:0),0),fallen:pins.filter(p=>p.isFallen).length,minZ,maxY,returned,deckX,path};
  };
}

export function simulate(stage: StageDef, angle=stage.angle, power=stage.power, position=0, spin=0, timeOffset=0) {
  return createSimulation(stage)(angle,power,position,spin,timeOffset);
}
