import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { Physics } from "../core/Physics";
import type { ObstacleDef } from "../data/stages";

/** 静的な壁・バンパー。バンクモードではボールがよく跳ね返る */
export class Obstacle {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Mesh;

  constructor(physics: Physics, scene: THREE.Scene, def: ObstacleDef) {
    const [w, h, d] = def.size;
    const [x, y, z] = def.position;

    this.body = new CANNON.Body({
      mass: 0, // 静的
      material: physics.wallMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(x, y, z),
    });
    if (def.rotationYDeg) {
      this.body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        (def.rotationYDeg * Math.PI) / 180
      );
    }
    physics.world.addBody(this.body);

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color: 0xd94f4f, // バンパー風の赤
        roughness: 0.5,
      })
    );
    this.mesh.position.set(x, y, z);
    this.mesh.quaternion.copy(this.body.quaternion);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
  }

  dispose(physics: Physics, scene: THREE.Scene): void {
    physics.world.removeBody(this.body);
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
  }
}
