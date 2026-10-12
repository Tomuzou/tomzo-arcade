import { HEAD_PIN_Z, LANE_LENGTH, LANE_WIDTH, PIN_SPACING } from "../core/constants";

// ステージ定義。将来 SPEC.md §7 の JSON 形式(src/data/stages/*.json)に移行する前段の TS データ版

export interface ObstacleDef {
  position: [number, number, number];
  size: [number, number, number];
  rotationYDeg?: number;
}

export interface StageDef {
  id: string;
  name: string;
  lane: { width: number; length: number };
  walls: ObstacleDef[];
  /** ピン位置 [x, z] の配列 */
  pinPositions: [number, number][];
  /** position: ←→で立ち位置移動 / angle: ←→で投球角度を変える(バンクショット用) */
  aimMode: "position" | "angle";
  camera: { position: [number, number, number]; lookAt: [number, number, number] };
}

/** 標準10ピン配置(正三角形、1番ピンが手前) */
function standard10(): [number, number][] {
  const positions: [number, number][] = [];
  const rowSpacingZ = PIN_SPACING * Math.sin(Math.PI / 3);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      positions.push([(i - row / 2) * PIN_SPACING, HEAD_PIN_Z - row * rowSpacingZ]);
    }
  }
  return positions;
}

/** ノーマルモード: 普通のボーリングレーン */
export const STANDARD_STAGE: StageDef = {
  id: "standard",
  name: "ノーマル",
  lane: { width: LANE_WIDTH, length: LANE_LENGTH },
  walls: [],
  pinPositions: standard10(),
  aimMode: "position",
  camera: { position: [0, 1.8, 2.5], lookAt: [0, 0.3, HEAD_PIN_Z] },
};

/**
 * バンクモード(VS嵐のバンクボウリング風):
 * 広いフィールドの左右が反発壁になっていて、壁に当てて跳ね返すバンクショットで
 * バンパーの陰や中央ガード裏に散らばったピンを狙う
 */
export const BANK_STAGE: StageDef = {
  id: "bank",
  name: "バンクボウリング",
  lane: { width: 5, length: 14 },
  walls: [
    // 左右のバンク壁(全長)と奥の壁
    { position: [-2.55, 0.15, -7], size: [0.1, 0.3, 14] },
    { position: [2.55, 0.15, -7], size: [0.1, 0.3, 14] },
    { position: [0, 0.15, -14.05], size: [5.2, 0.3, 0.1] },
    // 中央のダイヤ型バンパー(45°回転した箱)
    { position: [-1.3, 0.2, -7], size: [0.6, 0.4, 0.6], rotationYDeg: 45 },
    { position: [1.3, 0.2, -7], size: [0.6, 0.4, 0.6], rotationYDeg: 45 },
    { position: [0, 0.2, -9], size: [0.7, 0.4, 0.7], rotationYDeg: 45 },
    // 中央クラスターを守るガード壁(正面からは狙えない)
    { position: [0, 0.2, -11.8], size: [1.4, 0.4, 0.15] },
  ],
  pinPositions: [
    // 左奥クラスター
    [-2.1, -12.6],
    [-1.7, -13.1],
    [-2.3, -13.3],
    // 右奥クラスター
    [2.1, -12.6],
    [1.7, -13.1],
    [2.3, -13.3],
    // 中央クラスター(ガード壁の裏。バンクショットでしか狙えない)
    [0, -12.8],
    [-0.35, -13.3],
    [0.35, -13.3],
    // 中盤のフリーピン
    [-0.9, -10.3],
    [0.9, -10.3],
  ],
  aimMode: "angle",
  camera: { position: [0, 5.5, 4], lookAt: [0, 0, -7.5] },
};

export const STAGES: StageDef[] = [STANDARD_STAGE, BANK_STAGE];
