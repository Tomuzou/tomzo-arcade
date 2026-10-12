import * as THREE from "three";
import {
  AIM_ANGLE_MAX_DEG,
  AIM_ANGLE_STEP_DEG,
  BALL_MOVE_STEP,
} from "./constants";
import { Physics } from "./Physics";
import { Ball } from "../entities/Ball";
import { Lane } from "../entities/Lane";
import { Obstacle } from "../entities/Obstacle";
import { Pin } from "../entities/Pin";
import { STAGES, type StageDef } from "../data/stages";

/**
 * ゲームループと入力を管理する。
 * ステージ(ノーマル/バンクボウリング)は StageDef のデータから構築し、切替可能。
 */
export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();

  private readonly physics: Physics;
  private readonly ball: Ball;
  private lane: Lane | null = null;
  private pins: Pin[] = [];
  private obstacles: Obstacle[] = [];

  private stageIndex = 0;
  private stage: StageDef = STAGES[0];
  private aimAngleDeg = 0;
  private readonly aimArrow: THREE.ArrowHelper;
  private readonly pinLight: THREE.PointLight;

  private readonly pinCountElement = document.getElementById("pin-count");
  private readonly pinTotalElement = document.getElementById("pin-total");
  private readonly modeNameElement = document.getElementById("mode-name");

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(4, 10, -6);
    sun.castShadow = true;
    sun.shadow.camera.left = -4;
    sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 3;
    sun.shadow.camera.bottom = -20;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);

    this.pinLight = new THREE.PointLight(0xffffff, 8, 12);
    this.scene.add(this.pinLight);

    this.aimArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0.05, 0),
      1.5,
      0xffcc00,
      0.3,
      0.2
    );
    this.scene.add(this.aimArrow);

    this.physics = new Physics();
    this.ball = new Ball(this.physics, this.scene);
    this.loadStage(0);

    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    this.setupTouchControls();
  }

  /** ステージ定義から レーン・壁・ピン を構築し直す */
  private loadStage(index: number): void {
    this.stageIndex = index;
    this.stage = STAGES[index];

    this.lane?.dispose(this.physics, this.scene);
    for (const pin of this.pins) pin.dispose(this.physics, this.scene);
    for (const obstacle of this.obstacles) obstacle.dispose(this.physics, this.scene);

    this.lane = new Lane(this.physics, this.scene, "straight", {
      width: this.stage.lane.width,
      length: this.stage.lane.length,
    });
    this.obstacles = this.stage.walls.map(
      (def) => new Obstacle(this.physics, this.scene, def)
    );
    this.pins = this.stage.pinPositions.map(
      ([x, z]) => new Pin(this.physics, this.scene, x, z)
    );

    this.ball.setLaneWidth(this.stage.lane.width);
    this.aimAngleDeg = 0;
    this.ball.reset();

    const cam = this.stage.camera;
    this.camera.position.set(...cam.position);
    this.camera.lookAt(...cam.lookAt);

    // ピンデッキ照明はピン位置の重心へ
    const meanZ =
      this.stage.pinPositions.reduce((sum, [, z]) => sum + z, 0) /
      this.stage.pinPositions.length;
    this.pinLight.position.set(0, 2, meanZ + 0.5);

    if (this.modeNameElement) this.modeNameElement.textContent = this.stage.name;
    if (this.pinTotalElement) this.pinTotalElement.textContent = String(this.pins.length);
  }

  private toggleStage(): void {
    this.loadStage((this.stageIndex + 1) % STAGES.length);
  }

  /** ←→: ノーマルでは立ち位置移動、バンクでは投球角度の調整 */
  private steer(direction: -1 | 1): void {
    if (this.stage.aimMode === "angle") {
      this.aimAngleDeg = Math.min(
        AIM_ANGLE_MAX_DEG,
        Math.max(-AIM_ANGLE_MAX_DEG, this.aimAngleDeg + direction * AIM_ANGLE_STEP_DEG)
      );
    } else {
      this.ball.move(direction * BALL_MOVE_STEP);
    }
  }

  private throwBall(): void {
    this.ball.throw((this.aimAngleDeg * Math.PI) / 180);
  }

  private resetAll(): void {
    this.ball.reset();
    for (const pin of this.pins) pin.reset();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === "Space") {
      e.preventDefault();
      this.throwBall();
    } else if (e.code === "KeyR") {
      this.resetAll();
    } else if (e.code === "KeyM") {
      this.toggleStage();
    } else if (e.code === "ArrowLeft") {
      this.steer(-1);
    } else if (e.code === "ArrowRight") {
      this.steer(1);
    }
  }

  /** スマホ用の画面ボタン。◀▶は押しっぱなしで連続入力 */
  private setupTouchControls(): void {
    this.bindButton("btn-throw", () => this.throwBall());
    this.bindButton("btn-reset", () => this.resetAll());
    this.bindButton("btn-mode", () => this.toggleStage());
    this.bindButton("btn-left", () => this.steer(-1), true);
    this.bindButton("btn-right", () => this.steer(1), true);
  }

  private bindButton(id: string, action: () => void, holdRepeat = false): void {
    const el = document.getElementById(id);
    if (!el) return;

    let timer: number | null = null;
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      action();
      if (holdRepeat) {
        stop();
        timer = window.setInterval(action, 80);
      }
    });
    if (holdRepeat) {
      for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
        el.addEventListener(type, stop);
      }
    }
  }

  private updatePinCount(): void {
    if (!this.pinCountElement) return;
    const fallen = this.pins.filter((pin) => pin.isFallen).length;
    this.pinCountElement.textContent = String(fallen);
  }

  /** 角度エイムの矢印をボール位置に追従させる(投球後は非表示) */
  private updateAimArrow(): void {
    const visible = this.stage.aimMode === "angle" && !this.ball.isThrown;
    this.aimArrow.visible = visible;
    if (!visible) return;

    const angleRad = (this.aimAngleDeg * Math.PI) / 180;
    this.aimArrow.position.set(
      this.ball.body.position.x,
      0.05,
      this.ball.body.position.z
    );
    this.aimArrow.setDirection(
      new THREE.Vector3(Math.sin(angleRad), 0, -Math.cos(angleRad))
    );
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start(): void {
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private tick(): void {
    const deltaTime = this.clock.getDelta();
    this.physics.step(deltaTime);

    this.ball.update();
    for (const pin of this.pins) pin.update();
    this.updatePinCount();
    this.updateAimArrow();

    this.renderer.render(this.scene, this.camera);
  }
}
