import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BALL_MASS, BALL_RADIUS, LAUNCH_HEIGHT, LAUNCH_LENGTH, LAUNCH_X, LAUNCH_Z, SPIN_FORCE, shotSpeed } from '../core/constants';
import type { Physics } from '../core/Physics';

export class Ball {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Group;
  isThrown = false;
  private spin = 0;
  constructor(physics: Physics, scene: THREE.Scene) {
    this.body = new CANNON.Body({ mass: BALL_MASS, shape: new CANNON.Sphere(BALL_RADIUS),
      material: physics.ballMaterial, linearDamping: 0.015, angularDamping: 0.015 });
    physics.world.addBody(this.body);
    this.mesh = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 24),
      new THREE.MeshStandardMaterial({ color: '#e58142', roughness: 0.2, metalness: 0.35 }));
    sphere.castShadow = true;
    this.mesh.add(sphere);
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(BALL_RADIUS * 0.99, 0.012, 6, 40),
      new THREE.MeshStandardMaterial({ color: '#ffe9b0', roughness: 0.3 }));
    this.mesh.add(stripe);
    for (const [x, z] of [[-0.04, 0], [0.04, 0], [0, 0.07]]) {
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: '#39231e' }));
      hole.position.set(x, Math.sqrt(BALL_RADIUS ** 2 - x * x - z * z) - 0.006, z);
      this.mesh.add(hole);
    }
    scene.add(this.mesh);
  }
  reset(bank: boolean, position = 0): void {
    this.isThrown = false;
    this.body.type = CANNON.Body.STATIC;
    this.body.updateMassProperties();
    this.body.velocity.setZero(); this.body.angularVelocity.setZero();
    this.body.force.setZero(); this.body.torque.setZero();
    this.body.position.set(bank ? LAUNCH_X + position * 0.45 : 0.12 + position * 0.8,
      BALL_RADIUS + (bank ? LAUNCH_HEIGHT * (1 + LAUNCH_Z / LAUNCH_LENGTH) : 0), bank ? LAUNCH_Z : 0.5);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.previousPosition.copy(this.body.position);
    this.body.previousQuaternion.copy(this.body.quaternion);
    this.body.interpolatedPosition.copy(this.body.position);
    this.body.interpolatedQuaternion.copy(this.body.quaternion);
    this.body.aabbNeedsUpdate = true;
    this.mesh.visible = true;
    this.update();
  }
  throw(angle: number, power: number, spin: number, bank: boolean): void {
    if (this.isThrown) return;
    this.isThrown = true; this.spin = spin;
    this.body.type = CANNON.Body.DYNAMIC;
    this.body.updateMassProperties(); this.body.wakeUp();
    const radians = angle * Math.PI / 180, speed = shotSpeed(power);
    const vx = speed * Math.sin(radians), vz = -speed * Math.cos(radians);
    this.body.velocity.set(vx, bank ? vz * LAUNCH_HEIGHT / LAUNCH_LENGTH : 0, vz);
    this.body.angularVelocity.set(vz / BALL_RADIUS, spin * 2, -vx / BALL_RADIUS);
  }
  beforeStep(): void {
    if (this.isThrown && this.body.position.y < BALL_RADIUS + 0.08 && this.body.position.y > 0) {
      this.body.applyForce(new CANNON.Vec3(this.spin * SPIN_FORCE * Math.min(1, this.body.velocity.length() / 4), 0, 0));
    }
  }
  update(): void {
    this.mesh.position.copy(this.body.interpolatedPosition);
    this.mesh.quaternion.copy(this.body.interpolatedQuaternion);
  }
}
