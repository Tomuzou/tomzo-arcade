// 物理定数・チューニング用パラメータを集約する(SPEC.md §4 参照)

// --- ボール ---
export const BALL_RADIUS = 0.108; // m
export const BALL_MASS = 6; // kg
export const BALL_THROW_SPEED = 11; // m/s(Phase 1 の固定パワー)
export const BALL_MOVE_STEP = 0.02; // ←→キー1回の移動量
export const BALL_START_Z = 0; // ファウルライン上
export const BALL_RESET_Y_LIMIT = -5; // ここより落ちたら投球終了扱い

// --- ピン ---
export const PIN_HEIGHT = 0.38; // m
export const PIN_RADIUS = 0.06; // m(円柱コライダーで簡易化)
export const PIN_MASS = 1.5; // kg
export const PIN_SPACING = 0.3048; // 隣接ピン間隔(12インチ)
export const PIN_FALL_ANGLE_DEG = 45; // 転倒判定の傾き閾値

// --- レーン ---
export const LANE_LENGTH = 18; // m
export const LANE_WIDTH = 1.05; // m
export const LANE_THICKNESS = 0.1; // コライダー板の厚み
export const HEAD_PIN_Z = -16.5; // 先頭ピン(1番ピン)の位置

// --- 物理マテリアル(摩擦・反発) ---
export const BALL_LANE_FRICTION = 0.05; // オイルレーン相当の低摩擦
export const BALL_LANE_RESTITUTION = 0.1;
export const PIN_LANE_FRICTION = 0.6;
export const PIN_LANE_RESTITUTION = 0.05;
// Node上でのパラメータスイープの結果、ポケットヒット(中心から約0.08mずらし)で
// ストライクが出る組み合わせ。ど真ん中ヒットは9本残り1本(実物のボウリングと同傾向)
export const BALL_PIN_FRICTION = 0.3;
export const BALL_PIN_RESTITUTION = 0.45;
export const PIN_PIN_FRICTION = 0.3;
export const PIN_PIN_RESTITUTION = 0.5;

// --- 壁・バンパー(バンクモード) ---
export const BALL_WALL_FRICTION = 0.05;
export const BALL_WALL_RESTITUTION = 0.85; // バンクショット用によく跳ねる
export const PIN_WALL_FRICTION = 0.4;
export const PIN_WALL_RESTITUTION = 0.3;

// --- 角度エイム(バンクモード) ---
export const AIM_ANGLE_STEP_DEG = 2; // ←→キー1回の角度変化
export const AIM_ANGLE_MAX_DEG = 70;

// --- シミュレーション ---
// 1/60 だとボール(11m/s)が1ステップで0.183m進み、ピンとの衝突半径0.168mを
// すり抜ける(トンネリング)。1/120 なら1ステップ0.09m で安全
export const FIXED_TIME_STEP = 1 / 120;
export const MAX_SUB_STEPS = 20; // 低fps環境でも物理が実時間に追いつくように
export const GRAVITY = -9.82; // m/s^2
