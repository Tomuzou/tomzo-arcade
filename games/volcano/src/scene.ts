import * as THREE from 'three';
import { BALL_RADIUS, BOARD_X, BOARD_Z, surface, type Ball, type Input } from './physics';
import type { Point, Stage } from './stages';

/** 描画だけを担当。物理は台の座標系で独立して動かす。 */
export class BoardScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  private board = new THREE.Group();
  private ball: THREE.Mesh;
  private checkpoint: THREE.Mesh | null = null;
  private resizeObserver: ResizeObserver;
  private stage: Stage | null = null;

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
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    // 縦長画面でも盤面全体を画角内に収める。
    const distance = Math.max(22.5, 16 / this.camera.aspect);
    this.camera.position.set(0, distance * 0.89, distance * 0.46);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  load(stage: Stage): void {
    this.clearBoard();
    this.stage = stage;
    this.board.rotation.set(0, 0, 0);
    const ground = new THREE.BufferGeometry();
    const vertices: number[] = [], colors: number[] = [];
    const sand = new THREE.Color('#eadbb7'), peak = new THREE.Color(stage.color);
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
        const color = sand.clone().lerp(peak, Math.min(p[1] * 0.65, 0.85));
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
    for (const [x, z, w, d] of [[-4.65, 0, 0.3, 12.6], [4.65, 0, 0.3, 12.6], [0, -6.15, 9, 0.3], [0, 6.15, 9, 0.3]]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.48, d), rail);
      mesh.position.set(x, 0.05, z); this.board.add(mesh);
    }
    for (const h of stage.holes) {
      const well = new THREE.CylinderGeometry(h.radius, h.radius * 0.85, 0.65, 48, 1, true);
      const positions = well.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) - 0.325 + surface(stage, h.x + positions.getX(i), h.z + positions.getZ(i)));
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
    this.ring(stage.start, 0.4, '#ffffff', 0.028);
    this.checkpoint = this.ring(stage.checkpoint, 0.43, '#64b9ee', 0.05);
    this.ring(stage.goal, 0.56, '#ffbd45', 0.085);
    this.ring(stage.goal, 0.72, '#fff0ae', 0.025);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 10),
      new THREE.MeshStandardMaterial({ color: 0xffc65c }));
    beacon.position.set(stage.goal.x + 0.75, surface(stage, stage.goal.x + 0.75, stage.goal.z) + 0.4, stage.goal.z);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffc65c }));
    flag.position.set(beacon.position.x + 0.2, beacon.position.y + 0.25, beacon.position.z);
    this.board.add(beacon, flag, this.ball);
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

  draw(ball: Ball, input: Input, checkpoint: boolean, fallDepth: number, dt: number): void {
    if (!this.stage) return;
    this.ball.position.set(ball.x, surface(this.stage, ball.x, ball.z) + BALL_RADIUS - fallDepth, ball.z);
    this.ball.rotateOnWorldAxis(new THREE.Vector3(ball.vz, 0, -ball.vx).normalize(), Math.hypot(ball.vx, ball.vz) * dt / BALL_RADIUS);
    const blend = 1 - Math.exp(-8 * dt);
    this.board.rotation.x += (input.z * 0.045 - this.board.rotation.x) * blend;
    this.board.rotation.z += (-input.x * 0.045 - this.board.rotation.z) * blend;
    if (this.checkpoint) (this.checkpoint.material as THREE.MeshStandardMaterial).color.set(checkpoint ? '#9bed83' : '#64b9ee');
    this.renderer.render(this.scene, this.camera);
  }

  private clearBoard(): void {
    this.ball.removeFromParent();
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
    this.ball.traverse(obj => {
      if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); (obj.material as THREE.Material).dispose(); }
    });
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
