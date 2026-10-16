import * as THREE from 'three';
import { BALL_RADIUS, BOARD_X, BOARD_Z, slope, surface, type Ball, type Input } from './physics';
import type { Point, Stage } from './stages';

const UP = new THREE.Vector3(0, 1, 0);

/** 描画だけを担当。物理は台の座標系で独立して動かす。 */
export class BoardScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  private board = new THREE.Group();
  private ball: THREE.Mesh;
  private shadow: THREE.Mesh;
  private checkpoint: THREE.Mesh | null = null;
  private goal: THREE.Mesh | null = null;
  private resizeObserver: ResizeObserver;
  private stage: Stage | null = null;
  /** ギミックのアニメーション（経過秒と玉を受け取る）。 */
  private animators: ((time: number, ball: Ball) => void)[] = [];

  constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.setClearColor(0x121a24, 0);
    this.renderer.domElement.setAttribute('aria-label', '穴と坂のある立体コース');
    host.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xfff4dd, 0x4b6481, 2.6));
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.position.set(-5, 12, 8);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffac69, 1.1);
    fill.position.set(6, 4, -4);
    this.scene.add(fill, this.board);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.2, metalness: 0.15 }));
    // 玉の赤道の模様で、転がる向きと速さを見せる。
    const band = new THREE.Mesh(new THREE.TorusGeometry(BALL_RADIUS * 0.99, 0.026, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0xff7652, roughness: 0.45 }));
    this.ball.add(band);
    // 坂の上でも玉の高さが分かるよう、斜面に沿わせた影を落とす。
    const shadowGeometry = new THREE.CircleGeometry(BALL_RADIUS * 1.05, 24);
    shadowGeometry.rotateX(-Math.PI / 2);
    this.shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false,
    }));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    // 縦長画面でも盤面全体を画角内に収める。
    const distance = Math.max(22.5, 16 / this.camera.aspect);
    // 段差のあるコースは少し低い角度から見て、高さを感じやすくする。
    const low = !!this.stage?.plateaus?.length;
    this.camera.position.set(0, distance * (low ? 0.8 : 0.89), distance * (low ? 0.6 : 0.46));
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  load(stage: Stage): void {
    this.clearBoard();
    this.stage = stage;
    this.board.rotation.set(0, 0, 0);
    this.resize();
    const ground = new THREE.BufferGeometry();
    const vertices: number[] = [], colors: number[] = [];
    const sand = new THREE.Color('#eadbb7'), peak = new THREE.Color(stage.color);
    const rock = new THREE.Color('#8f735c'), antlion = new THREE.Color('#c08c4f');
    const tint = (x: number, y: number, z: number): THREE.Color => {
      const color = sand.clone().lerp(peak, Math.max(0, Math.min(y * 0.65, 0.85)));
      for (const pit of stage.pits ?? []) {
        const t = 1 - Math.hypot(x - pit.x, z - pit.z) / pit.radius;
        if (t > 0) color.lerp(antlion, Math.min(0.9, 0.35 + t * 0.6));
      }
      // 急な斜面（崖）は岩の色にして段差を見せる。
      const g = slope(stage, x, z);
      return color.lerp(rock, Math.max(0, Math.min(0.8, (Math.hypot(g.x, g.z) - 0.9) / 1.2)));
    };
    const nx = 90, nz = 120;
    const point = (i: number, j: number): [number, number, number] => {
      const x = -BOARD_X + i * 0.1, z = -BOARD_Z + j * 0.1;
      return [x, surface(stage, x, z), z];
    };
    const triangle = (a: number[], b: number[], c: number[]) => {
      const x = (a[0] + b[0] + c[0]) / 3, z = (a[2] + b[2] + c[2]) / 3;
      if (stage.holes.some(h => Math.hypot(x - h.x, z - h.z) < h.radius)) return;
      for (const p of [a, b, c]) {
        vertices.push(...p);
        const color = tint(p[0], p[1], p[2]);
        colors.push(color.r, color.g, color.b);
      }
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a = point(i, j), b = point(i + 1, j), c = point(i, j + 1), d = point(i + 1, j + 1);
      triangle(a, c, b); triangle(b, c, d);
    }
    ground.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    ground.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    ground.computeVertexNormals();
    this.board.add(new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));
    const dark = new THREE.MeshStandardMaterial({ color: 0x131c26, roughness: 0.9 });
    const rail = new THREE.MeshStandardMaterial({ color: 0x68867e, metalness: 0.35, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.5, 12.5), dark);
    base.position.y = -0.5; this.board.add(base);
    // 外枠は縁の地形より少し高くして、台地の断面を隠す。
    let edgeTop = 0;
    for (let t = -BOARD_Z; t <= BOARD_Z; t += 0.1) edgeTop = Math.max(edgeTop, surface(stage, -BOARD_X, t), surface(stage, BOARD_X, t));
    for (let t = -BOARD_X; t <= BOARD_X; t += 0.1) edgeTop = Math.max(edgeTop, surface(stage, t, -BOARD_Z), surface(stage, t, BOARD_Z));
    const railTop = Math.max(0.29, edgeTop + 0.2);
    for (const [x, z, w, d] of [[-4.65, 0, 0.3, 12.6], [4.65, 0, 0.3, 12.6], [0, -6.15, 9, 0.3], [0, 6.15, 9, 0.3]]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, railTop + 0.19, d), rail);
      mesh.position.set(x, (railTop - 0.19) / 2, z); this.board.add(mesh);
    }
    for (const h of stage.holes) {
      const well = new THREE.CylinderGeometry(h.radius, h.radius * 0.85, 0.65, 48, 1, true);
      const positions = well.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        // 上端は地形に合わせ、下端は高い台地の上でも底が抜けて見えないよう土台まで伸ばす。
        const top = surface(stage, h.x + positions.getX(i), h.z + positions.getZ(i));
        positions.setY(i, positions.getY(i) > 0 ? top : Math.min(top - 0.65, -0.3));
      }
      well.computeVertexNormals();
      const inside = new THREE.Mesh(well, dark);
      inside.position.set(h.x, 0, h.z); this.board.add(inside);
      const rim = this.ring(h, h.radius, '#b36948', 0.08);
      rim.position.y += 0.015;
    }
    // 等高線で坂の広がりと頂上の位置を見せる。
    for (const hill of stage.hills) {
      for (const scale of [0.65, 1, 1.4]) {
        const points: number[] = [];
        for (let i = 0; i < 160; i++) {
          const segment = [i, i + 1].map(step => ({
            x: hill.x + Math.cos(step / 160 * Math.PI * 2) * hill.width * scale,
            z: hill.z + Math.sin(step / 160 * Math.PI * 2) * hill.width * scale,
          }));
          if (segment.some(p => Math.abs(p.x) > BOARD_X || Math.abs(p.z) > BOARD_Z ||
            stage.holes.some(h => Math.hypot(p.x - h.x, p.z - h.z) < h.radius + 0.1))) continue;
          segment.forEach(p => points.push(p.x, surface(stage, p.x, p.z) + 0.012, p.z));
        }
        const contour = new THREE.BufferGeometry();
        contour.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        this.board.add(new THREE.LineSegments(contour, new THREE.LineBasicMaterial({ color: '#b99876', transparent: true, opacity: 0.65 })));
      }
    }
    for (const wall of stage.walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.width, 0.45, wall.depth), rail);
      mesh.position.set(wall.x, surface(stage, wall.x, wall.z) + 0.22, wall.z);
      this.board.add(mesh);
    }
    this.gimmicks(stage);
    this.ring(stage.start, 0.4, '#ffffff', 0.028);
    this.checkpoint = this.ring(stage.checkpoint, 0.43, '#64b9ee', 0.05);
    this.goal = this.ring(stage.goal, 0.56, '#ffbd45', 0.085);
    this.ring(stage.goal, 0.72, '#fff0ae', 0.025);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 10),
      new THREE.MeshStandardMaterial({ color: 0xffc65c }));
    beacon.position.set(stage.goal.x + 0.75, surface(stage, stage.goal.x + 0.75, stage.goal.z) + 0.4, stage.goal.z);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffc65c }));
    flag.position.set(beacon.position.x + 0.2, beacon.position.y + 0.25, beacon.position.z);
    this.board.add(beacon, flag, this.shadow, this.ball);
  }

  /** ジャンプ台・蟻地獄・ブラックホール・ワープ・バンパーの見た目と動き。 */
  private gimmicks(stage: Stage): void {
    const glow = (color: string, intensity = 0.6, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, ...extra });
    const at = (p: Point, lift: number) => new THREE.Vector3(p.x, surface(stage, p.x, p.z) + lift, p.z);

    for (const pad of stage.jumps ?? []) {
      const group = new THREE.Group();
      group.position.copy(at(pad, 0.02));
      group.rotation.y = Math.atan2(-pad.dx, -pad.dz);
      const base = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40).rotateX(-Math.PI / 2), glow('#1f6b3a', 0.25));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 8, 48).rotateX(-Math.PI / 2), glow('#7dff8a', 0.5));
      const arrows: THREE.Mesh[] = [];
      for (const offset of [-0.18, 0.08]) {
        const shape = new THREE.Shape([[-0.24, 0], [0, 0.2], [0.24, 0], [0.24, -0.08], [0, 0.11], [-0.24, -0.08]].map(([x, y]) => new THREE.Vector2(x, y)));
        const arrow = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), glow('#b8ffbf', 0.7, { side: THREE.DoubleSide }));
        arrow.position.set(0, 0.01, -offset); arrows.push(arrow);
      }
      group.add(base, rim, ...arrows);
      this.board.add(group);
      this.animators.push(time => arrows.forEach((arrow, i) => {
        (arrow.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 0.9 * Math.max(0, Math.sin(time * 6 - i * 1.4));
      }));
    }

    for (const pit of stage.pits ?? []) {
      const center = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x2a1a10 }));
      center.position.copy(at(pit, 0.015));
      const swirl = this.spiral(stage, pit, pit.radius * 0.95, 0.4, '#8a5a2b', 0.55, 5);
      this.board.add(center);
      this.animators.push(time => { swirl.rotation.y = time * 0.5; });
    }

    for (const hole of stage.blackHoles ?? []) {
      const core = new THREE.Mesh(new THREE.CircleGeometry(0.36, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      core.position.copy(at(hole, 0.03));
      const disk = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 10, 64).rotateX(-Math.PI / 2), glow('#c49bff', 1));
      disk.position.copy(at(hole, 0.05));
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.36, hole.range * 0.55, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#5a2fa8', transparent: true, opacity: 0.18, depthWrite: false }));
      halo.position.copy(at(hole, 0.01));
      const swirl = this.spiral(stage, hole, hole.range * 0.9, 0.45, '#9d7bff', 0.7, 4);
      this.board.add(halo, core, disk);
      this.animators.push(time => {
        swirl.rotation.y = -time * 1.4;
        (disk.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + 0.5 * Math.sin(time * 5);
      });
    }

    const warpColors = ['#4fe3ff', '#ff6ad5', '#b4ff6a'];
    (stage.warps ?? []).forEach((pair, i) => {
      const color = warpColors[i % warpColors.length];
      for (const end of [pair.a, pair.b]) {
        const group = new THREE.Group();
        group.position.copy(at(end, 0.03));
        const portal = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false }));
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 48).rotateX(-Math.PI / 2), glow(color, 0.9));
        const inner = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 6).rotateX(-Math.PI / 2), glow('#ffffff', 0.8));
        group.add(portal, rim, inner);
        this.board.add(group);
        this.animators.push(time => {
          inner.rotation.y = time * 2.5;
          inner.scale.setScalar(0.8 + 0.25 * Math.sin(time * 4 + i));
          (portal.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.2 * Math.sin(time * 3 + i);
        });
      }
    });

    for (const bumper of stage.bumpers ?? []) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(bumper.radius, bumper.radius * 1.08, 0.38, 36), glow('#ff4d6d', 0.25, { metalness: 0.3 }));
      body.position.copy(at(bumper, 0.19));
      const cap = new THREE.Mesh(new THREE.TorusGeometry(bumper.radius * 0.7, 0.04, 8, 36).rotateX(-Math.PI / 2), glow('#fff2f4', 0.6));
      cap.position.copy(at(bumper, 0.39));
      this.board.add(body, cap);
      let flash = 0, last = 0;
      this.animators.push((time, ball) => {
        if (Math.hypot(ball.x - bumper.x, ball.z - bumper.z) < bumper.radius + BALL_RADIUS + 0.03) flash = 1;
        flash = Math.max(0, flash - (time - last) * 4); last = time;
        (body.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + flash * 1.6;
        body.scale.set(1 + flash * 0.12, 1, 1 + flash * 0.12);
      });
    }
  }

  /** 中心に向かって巻く渦巻き。地形に沿わせ、回転させて吸い込む流れを見せる。 */
  private spiral(stage: Stage, center: Point, outer: number, inner: number, color: string, opacity: number, arms: number): THREE.Group {
    const points: number[] = [];
    for (let arm = 0; arm < arms; arm++) {
      for (let i = 0; i < 60; i++) {
        const segment = [i, i + 1].map(step => {
          const t = step / 60, r = outer - (outer - inner) * t, angle = arm / arms * Math.PI * 2 + t * Math.PI * 1.6;
          return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
        });
        segment.forEach(p => points.push(p.x, surface(stage, center.x + p.x, center.z + p.z) + 0.02, p.z));
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const group = new THREE.Group();
    group.position.set(center.x, 0, center.z);
    group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
    this.board.add(group);
    return group;
  }

  private ring(p: Point, radius: number, color: string, thickness: number): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(radius, thickness, 8, 64);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, positions.getY(i) + surface(this.stage!, p.x + positions.getX(i), p.z + positions.getZ(i)));
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0.15 }));
    mesh.position.set(p.x, 0.025, p.z);
    this.board.add(mesh);
    return mesh;
  }

  /** shrink は玉の大きさ（ブラックホールに吸い込まれるときに小さくする）。 */
  draw(ball: Ball, input: Input, checkpoint: boolean, fallDepth: number, dt: number, shrink = 1): void {
    if (!this.stage) return;
    const ground = surface(this.stage, ball.x, ball.z);
    const height = Math.max(0, (ball.y ?? ground) - ground);
    this.ball.position.set(ball.x, ground + height + BALL_RADIUS * shrink - fallDepth, ball.z);
    this.ball.scale.setScalar(Math.max(0.001, shrink));
    const gradient = slope(this.stage, ball.x, ball.z);
    this.shadow.position.set(ball.x, ground + 0.02, ball.z);
    this.shadow.quaternion.setFromUnitVectors(UP, new THREE.Vector3(-gradient.x, 1, -gradient.z).normalize());
    // 空中では影を広く薄く、穴に落ちていく間は消していく。
    this.shadow.scale.setScalar((1 + height * 0.5) * shrink);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.32 * Math.max(0, 1 - fallDepth * 3) / (1 + height * 1.5);
    const time = performance.now() / 1000;
    this.animators.forEach(animate => animate(time, ball));
    this.ball.rotateOnWorldAxis(new THREE.Vector3(ball.vz, 0, -ball.vx).normalize(), Math.hypot(ball.vx, ball.vz) * dt / BALL_RADIUS);
    const blend = 1 - Math.exp(-8 * dt);
    this.board.rotation.x += (input.z * 0.045 - this.board.rotation.x) * blend;
    this.board.rotation.z += (-input.x * 0.045 - this.board.rotation.z) * blend;
    if (this.checkpoint) (this.checkpoint.material as THREE.MeshStandardMaterial).color.set(checkpoint ? '#9bed83' : '#64b9ee');
    if (this.goal) (this.goal.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 0.3 * (1 + Math.sin(performance.now() / 260)) / 2;
    this.renderer.render(this.scene, this.camera);
  }

  private clearBoard(): void {
    this.ball.removeFromParent();
    this.shadow.removeFromParent();
    this.checkpoint = null; this.goal = null; this.animators = [];
    this.board.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(m => m.dispose());
      }
    });
    this.board.clear();
  }

  dispose(): void {
    this.clearBoard();
    this.shadow.geometry.dispose(); (this.shadow.material as THREE.Material).dispose();
    this.ball.traverse(obj => {
      if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); (obj.material as THREE.Material).dispose(); }
    });
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
