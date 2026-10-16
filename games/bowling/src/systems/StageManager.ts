import * as THREE from 'three';
import { Physics } from '../core/Physics';
import { Lane } from '../entities/Lane';
import { Pin } from '../entities/Pin';
import { Obstacle } from '../entities/Obstacle';
import { pinLayout, type StageDef } from '../data/stages';

export class StageManager {
  pins: Pin[] = [];
  obstacles: Obstacle[] = [];
  private lane: Lane | null = null;
  private pinMesh: THREE.InstancedMesh | null = null;
  private transform = new THREE.Object3D();
  constructor(private physics: Physics, private scene: THREE.Scene) {}
  load(stage: StageDef): void {
    this.lane?.dispose(this.scene);
    this.pins.forEach(pin => { if (!pin.removed) this.physics.world.removeBody(pin.body); });
    this.obstacles.forEach(obstacle => obstacle.dispose(this.scene));
    if (this.pinMesh) {
      this.scene.remove(this.pinMesh); this.pinMesh.geometry.dispose();
      (this.pinMesh.material as THREE.Material).dispose();
    }
    this.lane = new Lane(this.physics,this.scene,stage.type === 'bank');
    this.pins = pinLayout(stage.layout).map(def=>new Pin(this.physics,def));
    this.obstacles = stage.obstacles.map(def=>new Obstacle(this.physics,this.scene,def));
    this.pinMesh = new THREE.InstancedMesh(Pin.geometry(),
      new THREE.MeshStandardMaterial({roughness:0.26,metalness:0.08,vertexColors:true}),this.pins.length);
    this.pinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pinMesh.castShadow=true; this.pinMesh.receiveShadow=true; this.pinMesh.frustumCulled=false;
    this.pins.forEach((pin,i)=>this.pinMesh!.setColorAt(i,new THREE.Color(pin.points === 100 ? '#ef5a50' : pin.points === 5 ? '#54b2eb' : '#fff9e8')));
    this.scene.add(this.pinMesh); this.sync();
  }
  step(time: number): void { this.obstacles.forEach(obstacle=>obstacle.step(time)); }
  sync(): void {
    this.pins.forEach((pin,i)=>{
      pin.update();
      this.transform.position.copy(pin.body.interpolatedPosition);
      this.transform.quaternion.copy(pin.body.interpolatedQuaternion);
      this.transform.scale.setScalar(pin.removed ? 0 : 1);
      this.transform.updateMatrix(); this.pinMesh!.setMatrixAt(i,this.transform.matrix);
    });
    if (this.pinMesh) this.pinMesh.instanceMatrix.needsUpdate=true;
    this.obstacles.forEach(obstacle=>obstacle.sync());
  }
  sweep(): void {
    this.pins.forEach(pin=>{
      if (pin.isFallen && !pin.removed) { this.physics.world.removeBody(pin.body); pin.removed=true; }
    });
  }
  get fallen(): number { return this.pins.filter(pin=>pin.isFallen).length; }
  get score(): number { return this.pins.reduce((sum,pin)=>sum+(pin.isFallen?pin.points:0),0); }
  get redDown(): number { return this.pins.filter(pin=>pin.points===100 && pin.isFallen).length; }
  get moving(): boolean {
    return this.pins.some(pin=>!pin.removed && (pin.body.velocity.lengthSquared()>0.035 || pin.body.angularVelocity.lengthSquared()>0.08));
  }
}
