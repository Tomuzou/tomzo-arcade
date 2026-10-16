import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PIN_FALL_ANGLE_DEG, PIN_HEIGHT, PIN_MASS, PIN_RADIUS } from '../core/constants';
import type { Physics } from '../core/Physics';
import type { PinDef } from '../data/stages';

const UP = new CANNON.Vec3(0, 1, 0);
export class Pin {
  readonly body: CANNON.Body;
  readonly points: number;
  isFallen = false;
  removed = false;
  constructor(physics: Physics, def: PinDef) {
    this.points = def.points;
    this.body = new CANNON.Body({ mass: PIN_MASS,
      material: physics.pinMaterial, position: new CANNON.Vec3(def.x, PIN_HEIGHT / 2, def.z),
      sleepSpeedLimit: 0.12, sleepTimeLimit: 0.6, linearDamping: 0.08, angularDamping: 0.12 });
    this.body.addShape(new CANNON.Cylinder(PIN_RADIUS * 0.7, PIN_RADIUS, 0.38, 12),new CANNON.Vec3(0,-0.14,0));
    this.body.addShape(new CANNON.Sphere(0.075),new CANNON.Vec3(0,0.25,0));
    physics.world.addBody(this.body);
  }
  update(): void {
    if (this.isFallen) return;
    const up = this.body.quaternion.vmult(UP);
    this.isFallen = up.y < Math.cos(PIN_FALL_ANGLE_DEG * Math.PI / 180) || this.body.position.y < -0.2;
  }
  static geometry(): THREE.LatheGeometry {
    const profile = [[0,0],[0.085,0],[0.108,0.035],[0.12,0.13],[0.112,0.23],
      [0.075,0.33],[0.046,0.43],[0.047,0.49],[0.071,0.54],[0.075,0.59],
      [0.054,0.64],[0,0.66]];
    const geometry = new THREE.LatheGeometry(profile.map(([r,y]) => new THREE.Vector2(r,y-PIN_HEIGHT/2)), 20);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i) + PIN_HEIGHT / 2;
      const shade = y > 0.42 && y < 0.52 ? 0.36 : 1;
      colors.set([shade,shade,shade], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }
}
