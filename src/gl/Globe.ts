import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

// A navy point globe: a fibonacci shell, a few latitude bands and one tilted
// orbit carrying a satellite. Drawn with normal blending so it reads on white.

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aKind;
  uniform float uTime;
  uniform float uScatter;
  uniform float uPixelRatio;
  varying float vFacing;
  varying float vKind;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec3 p = position;
    float id = float(gl_VertexID);
    vec3 dir = normalize(p + vec3(0.0001));
    p += dir * uScatter * (0.4 + hash(id) * 2.2);
    p.y += uScatter * (hash(id * 1.7) - 0.5) * 1.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFacing = clamp((mv.z + 7.0) / 3.0, 0.0, 1.0);
    vKind = aKind;
    gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uSignal;
  uniform float uOpacity;
  varying float vFacing;
  varying float vKind;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.32, d);
    vec3 c = mix(uInk, uSignal, step(1.5, vKind));
    float depth = mix(0.22, 1.0, vFacing);
    gl_FragColor = vec4(c, a * depth * uOpacity);
  }
`

export type GlobeState = { x: number; y: number; scale: number; opacity: number; scatter: number; spin: number }

export class Globe {
  readonly state: GlobeState = { x: 0, y: 0, scale: 1, opacity: 1, scatter: 0, spin: 0 }
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(30, 1, 0.1, 40)
  private group = new Group()
  private orbit = new Group()
  private material: ShaderMaterial
  private satellite: number
  private positions: Float32Array
  private raf = 0
  private running = false
  private time = 0
  private last = 0
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private canvas: HTMLCanvasElement
  private reduced: boolean

  constructor(canvas: HTMLCanvasElement, reduced: boolean) {
    this.canvas = canvas
    this.reduced = reduced
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.camera.position.z = 8.5

    const shell = 2600
    const bands = 5 * 220
    const orbitPts = 520
    const total = shell + bands + orbitPts + 1
    const pos = new Float32Array(total * 3)
    const size = new Float32Array(total)
    const kind = new Float32Array(total)
    const golden = Math.PI * (3 - Math.sqrt(5))
    let i = 0
    for (let k = 0; k < shell; k++, i++) {
      const y = 1 - (k / (shell - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const t = golden * k
      pos.set([Math.cos(t) * r * 1.6, y * 1.6, Math.sin(t) * r * 1.6], i * 3)
      size[i] = 3.4
    }
    for (let b = 0; b < 5; b++) {
      const lat = (-0.6 + b * 0.3) * (Math.PI / 2)
      for (let k = 0; k < 220; k++, i++) {
        const a = (k / 220) * Math.PI * 2
        pos.set([Math.cos(a) * Math.cos(lat) * 1.62, Math.sin(lat) * 1.62, Math.sin(a) * Math.cos(lat) * 1.62], i * 3)
        size[i] = 4
        kind[i] = 1
      }
    }
    const orbitStart = i
    for (let k = 0; k < orbitPts; k++, i++) {
      const a = (k / orbitPts) * Math.PI * 2
      pos.set([Math.cos(a) * 2.35, 0, Math.sin(a) * 2.35], i * 3)
      size[i] = k % 4 === 0 ? 3.2 : 1.8
      kind[i] = 1
    }
    this.satellite = i
    pos.set([2.35, 0, 0], i * 3)
    size[i] = 16
    kind[i] = 2
    this.positions = pos

    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uScatter: { value: 0 },
        uOpacity: { value: 1 },
        uPixelRatio: { value: 1 },
        uInk: { value: new Color('#0A1A3F') },
        uSignal: { value: new Color('#3D63FF') },
      },
    })
    this.material = material

    // Globe and orbit live in separate groups so the orbit can tilt on its own.
    const globeGeo = new BufferGeometry()
    globeGeo.setAttribute('position', new BufferAttribute(pos.slice(0, orbitStart * 3), 3))
    globeGeo.setAttribute('aSize', new BufferAttribute(size.slice(0, orbitStart), 1))
    globeGeo.setAttribute('aKind', new BufferAttribute(kind.slice(0, orbitStart), 1))
    const orbitGeo = new BufferGeometry()
    orbitGeo.setAttribute('position', new BufferAttribute(pos.slice(orbitStart * 3), 3))
    orbitGeo.setAttribute('aSize', new BufferAttribute(size.slice(orbitStart), 1))
    orbitGeo.setAttribute('aKind', new BufferAttribute(kind.slice(orbitStart), 1))
    this.satellite = this.satellite - orbitStart
    this.positions = orbitGeo.getAttribute('position').array as Float32Array

    this.group.add(new Points(globeGeo, material))
    this.orbit.add(new Points(orbitGeo, material))
    this.orbit.rotation.set(0.42, 0, -0.32)
    this.group.add(this.orbit)
    this.group.rotation.x = 0.22
    this.scene.add(this.group)
    this.resize()
  }

  setPointer(nx: number, ny: number) {
    this.pointer.tx = nx
    this.pointer.ty = ny
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.material.uniforms.uPixelRatio.value = dpr * Math.min(1.25, Math.max(0.75, h / 900))
    if (!this.running) this.render(0)
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const tick = (now: number) => {
      if (!this.running) return
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.render(dt)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.renderer.clear()
  }

  private render(dt: number) {
    const s = this.state
    const m = this.reduced ? 0 : 1
    this.time += dt * m
    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 2.5)
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 2.5)
    this.group.rotation.y = this.time * 0.12 + s.spin + this.pointer.x * 0.3
    this.group.rotation.x = 0.22 + this.pointer.y * 0.15
    // Satellite travels along the orbit.
    const a = this.time * 0.5
    this.positions[this.satellite * 3] = Math.cos(a) * 2.35
    this.positions[this.satellite * 3 + 2] = Math.sin(a) * 2.35
    const attr = (this.orbit.children[0] as Points).geometry.getAttribute('position')
    attr.needsUpdate = true
    this.group.position.set(s.x, s.y, 0)
    this.group.scale.setScalar(s.scale)
    this.material.uniforms.uScatter.value = s.scatter
    this.material.uniforms.uOpacity.value = s.opacity
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    this.material.dispose()
    this.renderer.dispose()
  }
}
