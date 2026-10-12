import * as CANNON from "cannon-es";
import {
  BALL_LANE_FRICTION,
  BALL_LANE_RESTITUTION,
  BALL_PIN_FRICTION,
  BALL_PIN_RESTITUTION,
  BALL_WALL_FRICTION,
  BALL_WALL_RESTITUTION,
  FIXED_TIME_STEP,
  GRAVITY,
  MAX_SUB_STEPS,
  PIN_LANE_FRICTION,
  PIN_LANE_RESTITUTION,
  PIN_PIN_FRICTION,
  PIN_PIN_RESTITUTION,
  PIN_WALL_FRICTION,
  PIN_WALL_RESTITUTION,
} from "./constants";

/**
 * cannon-es のラッパー。
 * ワールド生成・マテリアル定義・固定タイムステップの step を担当する。
 * 描画側は body.interpolatedPosition / interpolatedQuaternion を使って補間する。
 */
export class Physics {
  readonly world: CANNON.World;

  readonly ballMaterial: CANNON.Material;
  readonly pinMaterial: CANNON.Material;
  readonly laneMaterial: CANNON.Material;
  readonly wallMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, GRAVITY, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    this.ballMaterial = new CANNON.Material("ball");
    this.pinMaterial = new CANNON.Material("pin");
    this.laneMaterial = new CANNON.Material("lane");
    this.wallMaterial = new CANNON.Material("wall");

    this.addContact(this.ballMaterial, this.laneMaterial, BALL_LANE_FRICTION, BALL_LANE_RESTITUTION);
    this.addContact(this.pinMaterial, this.laneMaterial, PIN_LANE_FRICTION, PIN_LANE_RESTITUTION);
    this.addContact(this.ballMaterial, this.pinMaterial, BALL_PIN_FRICTION, BALL_PIN_RESTITUTION);
    this.addContact(this.pinMaterial, this.pinMaterial, PIN_PIN_FRICTION, PIN_PIN_RESTITUTION);
    this.addContact(this.ballMaterial, this.wallMaterial, BALL_WALL_FRICTION, BALL_WALL_RESTITUTION);
    this.addContact(this.pinMaterial, this.wallMaterial, PIN_WALL_FRICTION, PIN_WALL_RESTITUTION);
  }

  private addContact(
    a: CANNON.Material,
    b: CANNON.Material,
    friction: number,
    restitution: number
  ): void {
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(a, b, { friction, restitution })
    );
  }

  /** 固定タイムステップで進める。deltaTime は前フレームからの経過秒 */
  step(deltaTime: number): void {
    this.world.step(FIXED_TIME_STEP, deltaTime, MAX_SUB_STEPS);
  }
}
