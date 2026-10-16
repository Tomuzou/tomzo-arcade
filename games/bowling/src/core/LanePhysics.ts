import * as CANNON from 'cannon-es';
import type { Physics } from './Physics';
import { surfaces } from './surfaces';
import { BANK_WIDTH, LANE_THICKNESS } from './constants';

export function createLaneBody(physics: Physics, bank: boolean): CANNON.Body {
  const body=new CANNON.Body({mass:0,material:physics.laneMaterial});
  for (const s of surfaces(bank)) {
    const q=new CANNON.Quaternion(); q.setFromAxisAngle(new CANNON.Vec3(1,0,0),s.angle);
    body.addShape(new CANNON.Box(new CANNON.Vec3(s.width/2,LANE_THICKNESS/2,s.length/2)),new CANNON.Vec3(s.x,s.y,s.z),q);
  }
  const width=bank?BANK_WIDTH:2.4, length=bank?12.5:15, center=bank?-4.75:-5.5;
  for (const x of [-width/2-0.08,width/2+0.08])
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.08,0.175,length/2)),new CANNON.Vec3(x,0.09,center));
  physics.world.addBody(body);
  return body;
}
