import * as CANNON from "cannon-es";
import * as THREE from "three";
import {
  LANE_LENGTH,
  LANE_THICKNESS,
  LANE_WIDTH,
} from "../core/constants";
import type { Physics } from "../core/Physics";

export type LaneType = "straight" | "curve" | "slope";

export interface LaneParams {
  length?: number;
  width?: number;
}

/** レーンを構成する1枚の板(将来カーブ・坂道はこれを連結して近似する) */
interface LaneSegment {
  position: THREE.Vector3;
  size: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

/**
 * レーン。laneType とパラメータから、ジオメトリとコライダー(Box板の連結)を生成する。
 * Phase 1 では "straight" のみ実装(板1枚)。curve/slope は複数セグメントで対応予定。
 */
export class Lane {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Group;

  constructor(physics: Physics, scene: THREE.Scene, laneType: LaneType = "straight", params: LaneParams = {}) {
    const segments = Lane.buildSegments(laneType, params);

    this.body = new CANNON.Body({
      mass: 0, // 静的
      material: physics.laneMaterial,
    });
    this.mesh = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color: 0xc89f65, // ウッドレーン風
      roughness: 0.3,
      metalness: 0.1,
    });

    for (const seg of segments) {
      this.body.addShape(
        new CANNON.Box(new CANNON.Vec3(seg.size.x / 2, seg.size.y / 2, seg.size.z / 2)),
        new CANNON.Vec3(seg.position.x, seg.position.y, seg.position.z),
        new CANNON.Quaternion(seg.quaternion.x, seg.quaternion.y, seg.quaternion.z, seg.quaternion.w)
      );

      const segMesh = new THREE.Mesh(
        new THREE.BoxGeometry(seg.size.x, seg.size.y, seg.size.z),
        material
      );
      segMesh.position.copy(seg.position);
      segMesh.quaternion.copy(seg.quaternion);
      segMesh.receiveShadow = true;
      this.mesh.add(segMesh);
    }

    physics.world.addBody(this.body);
    scene.add(this.mesh);
  }

  dispose(physics: Physics, scene: THREE.Scene): void {
    physics.world.removeBody(this.body);
    scene.remove(this.mesh);
    for (const child of this.mesh.children) {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    }
  }

  private static buildSegments(laneType: LaneType, params: LaneParams): LaneSegment[] {
    const length = params.length ?? LANE_LENGTH;
    const width = params.width ?? LANE_WIDTH;

    switch (laneType) {
      case "straight":
        // レーン上面が y=0、手前端が z=0、奥端が z=-length になる1枚板
        return [
          {
            position: new THREE.Vector3(0, -LANE_THICKNESS / 2, -length / 2),
            size: new THREE.Vector3(width, LANE_THICKNESS, length),
            quaternion: new THREE.Quaternion(),
          },
        ];
      case "curve":
      case "slope":
        throw new Error(`laneType "${laneType}" は Phase 4 で実装予定`);
    }
  }
}
