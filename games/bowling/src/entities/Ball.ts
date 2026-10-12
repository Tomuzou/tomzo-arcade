import * as CANNON from "cannon-es";
import * as THREE from "three";
import {
  BALL_MASS,
  BALL_RADIUS,
  BALL_START_Z,
  BALL_THROW_SPEED,
  LANE_WIDTH,
} from "../core/constants";
import type { Physics } from "../core/Physics";

/** ボウリングボール。物理 body と描画 mesh を持ち、毎フレーム同期する */
export class Ball {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Mesh;

  private thrown = false;
  private laneHalfLimit = LANE_WIDTH / 2 - BALL_RADIUS;

  constructor(physics: Physics, scene: THREE.Scene) {
    this.body = new CANNON.Body({
      mass: BALL_MASS,
      shape: new CANNON.Sphere(BALL_RADIUS),
      material: physics.ballMaterial,
    });
    physics.world.addBody(this.body);

    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2244cc,
      roughness: 0.15,
      metalness: 0.3,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    this.reset();
  }

  get isThrown(): boolean {
    return this.thrown;
  }

  /**
   * 固定パワーで投球する。angleRad=0 でレーン奥(-Z)へまっすぐ、
   * 正の角度で右方向へ逸れる(バンクモードの角度エイム用)
   */
  throw(angleRad = 0): void {
    if (this.thrown) return;
    this.thrown = true;
    this.body.wakeUp();
    const vx = BALL_THROW_SPEED * Math.sin(angleRad);
    const vz = -BALL_THROW_SPEED * Math.cos(angleRad);
    this.body.velocity.set(vx, 0, vz);
    // 進行方向に転がる回転(接地点速度ゼロの条件 ω=(vz/r, 0, -vx/r))
    this.body.angularVelocity.set(vz / BALL_RADIUS, 0, -vx / BALL_RADIUS);
  }

  /** ステージのレーン幅に合わせて移動範囲を更新する */
  setLaneWidth(width: number): void {
    this.laneHalfLimit = width / 2 - BALL_RADIUS;
  }

  /** 投球前に立ち位置を左右へ動かす(レーン内にクランプ) */
  move(dx: number): void {
    if (this.thrown) return;
    const limit = this.laneHalfLimit;
    this.body.position.x = Math.min(limit, Math.max(-limit, this.body.position.x + dx));
  }

  /** ファウルライン上の初期位置に戻す */
  reset(): void {
    this.thrown = false;
    this.body.velocity.setZero();
    this.body.angularVelocity.setZero();
    this.body.position.set(0, BALL_RADIUS, BALL_START_Z);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
  }

  /** 物理 body の補間値を描画 mesh に反映する */
  update(): void {
    this.mesh.position.copy(this.body.interpolatedPosition);
    this.mesh.quaternion.copy(this.body.interpolatedQuaternion);
  }
}
