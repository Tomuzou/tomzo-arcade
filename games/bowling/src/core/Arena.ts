import * as THREE from 'three';
export class Arena {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera();
  private mode = 0;
  private bank = true;
  private frame = {x:0,y:0,width:20,height:20};
  private center = new THREE.Vector2();
  private zoom = 1;
  constructor(private container: HTMLElement) {
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.35;
    container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight('#f1f4e6','#4b6965',2.1));
    const sun=new THREE.DirectionalLight('#fff1d5',3.4); sun.position.set(-7,16,3); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:0.5,far:45});
    sun.shadow.normalBias=0.035; sun.shadow.bias=-0.0001; this.scene.add(sun);
    sun.target.position.set(0,0,-6); this.scene.add(sun.target);
    const rim=new THREE.DirectionalLight('#73d6c8',1.5); rim.position.set(8,6,-12); this.scene.add(rim);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),
      new THREE.MeshStandardMaterial({color:'#173a40',roughness:0.9}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-1.95; floor.receiveShadow=true; this.scene.add(floor);
    const grid=new THREE.GridHelper(70,35,'#275057','#20464d'); grid.position.set(0,-1.94,-6); this.scene.add(grid);
    new ResizeObserver(()=>this.resize()).observe(container); this.resize();
  }
  toggle(): void { this.mode=(this.mode+1)%3; this.update(1,false); }
  setStage(bank: boolean): void { this.bank=bank;this.mode=0;this.zoom=1;this.resize(); }
  project(point: THREE.Vector3): {x: number;y: number} {
    const p=point.clone().project(this.camera),rect=this.container.getBoundingClientRect();
    return {x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2};
  }
  update(delta: number,closeup: boolean): void {
    const focus=this.mode===2 || (this.mode===0 && closeup);
    const target=focus?new THREE.Vector3(this.bank?0.7:0,0.35,this.bank?-5.6:-10.5)
      .applyMatrix4(this.camera.matrixWorldInverse):new THREE.Vector3(this.frame.x,this.frame.y,0);
    const smoothing=1-Math.exp(-delta*5);
    this.center.lerp(new THREE.Vector2(target.x,target.y),smoothing);
    this.zoom=THREE.MathUtils.lerp(this.zoom,focus?(this.bank?2:1.65):this.mode===1?0.78:1,smoothing);
    this.camera.left=this.center.x-this.frame.width/2;this.camera.right=this.center.x+this.frame.width/2;
    this.camera.top=this.center.y+this.frame.height/2;this.camera.bottom=this.center.y-this.frame.height/2;
    this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();
    const button=document.getElementById('btn-camera');
    if(button)button.textContent=['視点：プレイ','視点：全体','視点：ピン拡大'][this.mode];
  }
  private resize(): void {
    const {width,height}=this.container.getBoundingClientRect();
    const aspect=Math.max(0.1,width/Math.max(1,height));
    this.camera.near=0.1; this.camera.far=120;
    this.camera.position.set(...(aspect>1.2?[20,24,9]:[0,26,11]) as [number,number,number]);
    this.camera.lookAt(0,1,-6.4); this.camera.updateMatrixWorld(true);
    // Fit the real arena silhouette in camera space, leaving room for the HUD on every aspect ratio.
    const corners=(this.bank?[-5.05,5.05].flatMap(x=>[[x,0,1.5],[x,0,-11],[x,4.8,-16.1]]):
      [-1.3,1.3].flatMap(x=>[[x,0,2],[x,0,-13]]))
      .map(p=>new THREE.Vector3(...p as [number,number,number]).applyMatrix4(this.camera.matrixWorldInverse));
    const minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x));
    const minY=Math.min(...corners.map(p=>p.y)),maxY=Math.max(...corners.map(p=>p.y));
    const viewHeight=Math.max((maxY-minY)*height/Math.max(180,height-125),(maxX-minX+0.6)/aspect);
    this.frame={x:(minX+maxX)/2,y:(minY+maxY)/2-viewHeight*15/height,width:viewHeight*aspect,height:viewHeight};
    this.center.set(this.frame.x,this.frame.y);this.zoom=1;this.update(1,false);
    this.renderer.setSize(width,height);
  }
  render(): void { this.renderer.render(this.scene,this.camera); }
}
