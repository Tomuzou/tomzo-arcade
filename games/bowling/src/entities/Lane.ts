import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { LANE_THICKNESS, BANK_WIDTH, BANK_RADIUS, BANK_START, BANK_ARC, LAUNCH_X } from '../core/constants';
import { surfaces } from '../core/surfaces';
import type { Physics } from '../core/Physics';
import { createLaneBody } from '../core/LanePhysics';

export class Lane {
  readonly body: CANNON.Body;
  readonly mesh = new THREE.Group();
  private texture: THREE.CanvasTexture;
  constructor(private physics: Physics, scene: THREE.Scene, bank: boolean) {
    this.body = createLaneBody(physics,bank);
    this.texture = this.woodTexture();
    const wood = new THREE.MeshStandardMaterial({ map: this.texture, color: '#d6a86e', roughness: 0.36, metalness: 0.1 });
    const ramp = new THREE.MeshStandardMaterial({ color: '#d99550', roughness: 0.4, metalness: 0.12 });
    const launch = new THREE.MeshStandardMaterial({ color: '#327a7a', roughness: 0.45, metalness: 0.15 });
    for (const s of surfaces(bank)) {
      if (s.kind !== 'bank') {
        const part = new THREE.Mesh(new THREE.BoxGeometry(s.width,LANE_THICKNESS,s.length),s.kind === 'launch' ? launch : wood);
        part.position.set(s.x,s.y,s.z); part.rotation.x = s.angle; part.receiveShadow = true; this.mesh.add(part);
      }
    }
    if (!bank) { ramp.dispose(); launch.dispose(); }
    const width = bank ? BANK_WIDTH : 2.4;
    this.box([width+0.25,0.6,bank ? 12.5 : 15],[0,-0.57,bank ? -4.75 : -5.5],'#173e43');
    // Physical side rails end at the foot of the bank. The rear bank has an open top.
    for (const x of [-width/2-0.08,width/2+0.08]) {
      this.box([0.16,0.35,bank ? 12.5 : 15],[x,0.09,bank ? -4.75 : -5.5],'#2c6267');
      this.box([0.035,0.035,bank ? 12.5 : 15],[x,0.29,bank ? -4.75 : -5.5],'#7ed9c4');
    }
    if (bank) {
      // One continuous rendered surface avoids shadow seams between collider segments.
      const vertices: number[] = [], indices: number[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = i / 96 * BANK_ARC;
        for (const x of [-5,5]) vertices.push(x,BANK_RADIUS*(1-Math.cos(a)),BANK_START-BANK_RADIUS*Math.sin(a));
        if (i < 96) { const n=i*2; indices.push(n,n+1,n+2,n+1,n+3,n+2); }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
      ramp.side=THREE.DoubleSide;
      const curve = new THREE.Mesh(geometry,ramp); curve.castShadow=true; this.mesh.add(curve);
      for (const x of [-5.08,5.08]) {
        const points = Array.from({length:65},(_,i) => {
          const a = i/64*BANK_ARC;
          return new THREE.Vector3(x,BANK_RADIUS*(1-Math.cos(a))+0.1,BANK_START-BANK_RADIUS*Math.sin(a));
        });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,0.065,6,false),
          new THREE.MeshStandardMaterial({color:'#7ed9c4',emissive:'#2d7d73',emissiveIntensity:0.3}));
        this.mesh.add(tube);
      }
      this.label('U - T U R N   /   B A N K', [0,3.45,-15.72], 7, 0.65, true);
      this.label('01   /   LAUNCH', [LAUNCH_X,1.29,-0.2],1.45,0.27);
      this.label('PIN DECK', [1,0.015,-2.6],2.1,0.4);
      for (let i = 0; i < 5; i++) this.label('↑',[LAUNCH_X,0.015,-5.2-i],0.32,0.5);
      this.label('↓',[3.8,0.015,-9],0.6,0.85);
    } else this.label('CLASSIC / 10', [0,0.015,-4],1.8,0.35);
    // Table supports give the suspended arena real depth.
    for (const x of [-width/2+0.4,width/2-0.4]) for (const z of [0,-10]) {
      this.box([0.25,1.1,0.25],[x,-1.35,z],'#183338');
    }
    scene.add(this.mesh);
  }
  private box(size: number[], position: number[], color: string): void {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),
      new THREE.MeshStandardMaterial({color,roughness:0.4,metalness:0.2}));
    mesh.position.set(...position as [number,number,number]); mesh.castShadow=true; mesh.receiveShadow=true; this.mesh.add(mesh);
  }
  private label(text: string, position: [number,number,number], width: number, height: number, bank = false): void {
    const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle='#fff0ca'; ctx.font='600 54px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text,512,64);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false}));
    mesh.rotation.x = bank ? -0.5 : -Math.PI/2; mesh.position.set(...position); this.mesh.add(mesh);
  }
  private woodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle='#e4c79b'; ctx.fillRect(0,0,512,1024);
    for (let x=0;x<512;x+=32) {
      ctx.fillStyle=x%64===0?'#d8b88a':'#ebd0a7'; ctx.fillRect(x,0,31,1024);
      for (let y=0;y<1024;y+=128) {
        ctx.strokeStyle='#b9986733'; ctx.beginPath(); ctx.moveTo(x,y+(x%96)); ctx.lineTo(x+32,y+(x%96)); ctx.stroke();
      }
      for (let j=0;j<8;j++) { ctx.fillStyle='#9d774412'; ctx.fillRect(x+j*4,0,1,1024); }
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; return texture;
  }
  dispose(scene: THREE.Scene): void {
    this.physics.world.removeBody(this.body); scene.remove(this.mesh);
    const materials = new Set<THREE.Material>();
    this.mesh.traverse(child => { if (child instanceof THREE.Mesh) {
      child.geometry.dispose(); materials.add(child.material);
      if (child.material.map && child.material.map !== this.texture) child.material.map.dispose();
    } });
    materials.forEach(m=>m.dispose()); this.texture.dispose();
  }
}
