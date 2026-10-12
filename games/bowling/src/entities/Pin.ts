import * as CANNON from "cannon-es";
import * as THREE from "three";
import {
  PIN_FALL_ANGLE_DEG,
  PIN_HEIGHT,
  PIN_MASS,
  PIN_RADIUS,
} from "../core/constants";
import type { Physics } from "../core/Physics";

const UP = new CANNON.Vec3(0, 1, 0);

/** ピン1本。コライダーは円柱1本で簡易化(SPEC.md §10) */
export class Pin {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Group;

  private readonly initialPosition: CANNON.Vec3;
  private fallen = false;

  constructor(physics: Physics, scene: THREE.Scene, x: number, z: number) {
    this.initialPosition = new CANNON.Vec3(x, PIN_HEIGHT / 2, z);

    this.body = new CANNON.Body({
      mass: PIN_MASS,
      shape: new CANNON.Cylinder(PIN_RADIUS, PIN_RADIUS, PIN_HEIGHT, 12),
      material: physics.pinMaterial,
      position: this.initialPosition.clone(),
      sleepSpeedLimit: 0.3,
      sleepTimeLimit: 0.5,
    });
    physics.world.addBody(this.body);

    this.mesh = Pin.createMesh();
    scene.add(this.mesh);
  }

  /** 白い円柱+赤帯のシンプルなピン形状 */
  private static createMesh(): THREE.Group {
    const group = new THREE.Group();

    const bodyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, PIN_HEIGHT, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(PIN_RADIUS * 1.02, PIN_RADIUS * 1.02, PIN_HEIGHT * 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 })
    );
    stripe.position.y = PIN_HEIGHT * 0.18;
    group.add(stripe);

    return group;
  }

  /**
   * 一度でも傾き角が閾値を超えたら「倒れた」扱い(リセットまで維持)。
   * 揺れ・転がりで傾き角が閾値を行き来しても判定が戻らないようラッチする
   */
  get isFallen(): boolean {
    return this.fallen;
  }

  reset(): void {
    this.fallen = false;
    this.body.velocity.setZero();
    this.body.angularVelocity.setZero();
    this.body.position.copy(this.initialPosition);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
  }

  dispose(physics: Physics, scene: THREE.Scene): void {
    physics.world.removeBody(this.body);
    scene.remove(this.mesh);
  }

  update(): void {
    if (!this.fallen) {
      const localUp = new CANNON.Vec3();
      this.body.quaternion.vmult(UP, localUp);
      const angleRad = Math.acos(Math.min(1, Math.max(-1, localUp.dot(UP))));
      this.fallen = angleRad > (PIN_FALL_ANGLE_DEG * Math.PI) / 180;
    }

    this.mesh.position.copy(this.body.interpolatedPosition);
    this.mesh.quaternion.copy(this.body.interpolatedQuaternion);
  }
}
