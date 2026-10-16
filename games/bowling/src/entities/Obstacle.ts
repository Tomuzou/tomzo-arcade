import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { Physics } from '../core/Physics';
import type { ObstacleDef } from '../data/stages';

export class Obstacle {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Group;
  constructor(private physics: Physics, scene: THREE.Scene, private def: ObstacleDef) {
    const [w,h,d] = def.size;
    this.body = new CANNON.Body({ mass: 0, type: def.motion ? CANNON.Body.KINEMATIC : CANNON.Body.STATIC,
      material: physics.wallMaterial, shape: new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)),
      position: new CANNON.Vec3(...def.position) });
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), (def.rotationYDeg ?? 0)*Math.PI/180);
    physics.world.addBody(this.body);
    this.mesh = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({ color: def.motion ? '#65cdb8' : '#ed8b70', roughness: 0.3, metalness: 0.25 }));
    box.castShadow = true; this.mesh.add(box);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w+0.02,0.055,d+0.02),
      new THREE.MeshStandardMaterial({ color: '#fff3c5', emissive: '#f3bb55', emissiveIntensity: 0.5 }));
    trim.position.y = h/2-0.07; this.mesh.add(trim);
    scene.add(this.mesh); this.sync();
  }
  step(time: number): void {
    const motion = this.def.motion;
    if (!motion) return;
    if (motion.axis === 'x') {
      const phase = time * motion.speed + (motion.phase ?? 0);
      this.body.position.x = this.def.position[0] + Math.sin(phase) * motion.amplitude;
      this.body.velocity.x = Math.cos(phase) * motion.amplitude * motion.speed;
    } else {
      this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), time * motion.speed);
      this.body.angularVelocity.set(0,motion.speed,0);
    }
    this.body.aabbNeedsUpdate = true;
  }
  sync(): void { this.mesh.position.copy(this.body.position); this.mesh.quaternion.copy(this.body.quaternion); }
  dispose(scene: THREE.Scene): void {
    this.physics.world.removeBody(this.body); scene.remove(this.mesh);
    this.mesh.traverse((child) => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); child.material.dispose(); } });
  }
}
