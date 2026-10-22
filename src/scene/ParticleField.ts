import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three'
import { buildShape, SHAPE_ORDER, type ShapeName } from './shapes'

const vertex = /* glsl */ `
  attribute vec3 aHandheld;
  attribute vec3 aHeadphones;
  attribute vec3 aShoe;
  attribute vec3 aAlibi;
  attribute vec3 aHalo;
  attribute float aSeed;

  uniform int uFrom;
  uniform int uTo;
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uBurst;

  varying float vSeed;
  varying float vDepth;

  vec3 shapeAt(int i) {
    if (i == 1) return aHandheld;
    if (i == 2) return aHeadphones;
    if (i == 3) return aShoe;
    if (i == 4) return aAlibi;
    if (i == 5) return aHalo;
    return position;
  }

  void main() {
    vec3 a = shapeAt(uFrom);
    vec3 b = shapeAt(uTo);
    // Each particle leaves at a slightly different moment, so shapes dissolve instead of sliding.
    float m = smoothstep(0.0, 1.0, clamp(uMix * 1.4 - aSeed * 0.4, 0.0, 1.0));
    vec3 p = mix(a, b, m);
    float burst = sin(m * 3.14159);
    vec3 dir = normalize(p + vec3(0.0001, 0.0002, 0.0003));
    p += dir * burst * uBurst * (0.35 + aSeed);
    p += vec3(
      sin(aSeed * 91.0 + uTime * 0.9),
      cos(aSeed * 53.0 + uTime * 0.7),
      sin(aSeed * 17.0 + uTime * 0.5)
    ) * 0.014;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.55 + aSeed * 0.9) * uPixelRatio / -mv.z;
    vSeed = aSeed;
    vDepth = clamp((p.z + 1.6) / 3.2, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uGold;
  uniform vec3 uPale;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 color = mix(uGold, uPale, step(0.82, vSeed) * 0.9 + vSeed * 0.2);
    float alpha = core * (0.35 + vDepth * 0.65) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export type FieldState = {
  mix: number
  x: number
  y: number
  scale: number
  opacity: number
  spin: number
  burst: number
}

export class ParticleField {
  readonly state: FieldState = { mix: 1, x: 0, y: 0, scale: 1, opacity: 1, spin: 1, burst: 0.55 }
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(35, 1, 0.1, 50)
  private group = new Group()
  private material: ShaderMaterial
  private geometry = new BufferGeometry()
  private from = 0
  private to = 0
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private spinAngle = 0
  private frame = 0
  private last = performance.now()
  private running = false
  private reduced: boolean

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, opts: { count: number; reducedMotion: boolean }) {
    this.canvas = canvas
    this.reduced = opts.reducedMotion
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.camera.position.set(0, 0, 7.2)

    const count = opts.count
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const v = Math.sin(i * 12.9898) * 43758.5453
      seeds[i] = v - Math.floor(v)
    }
    const attrName: Record<ShapeName, string> = {
      sphere: 'position',
      handheld: 'aHandheld',
      headphones: 'aHeadphones',
      shoe: 'aShoe',
      alibi: 'aAlibi',
      halo: 'aHalo',
    }
    for (const name of SHAPE_ORDER) {
      this.geometry.setAttribute(attrName[name], new BufferAttribute(buildShape(name, count), 3))
    }
    this.geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    this.geometry.boundingSphere = new Sphere(new Vector3(), 4)

    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uFrom: { value: 0 },
        uTo: { value: 0 },
        uMix: { value: 1 },
        uTime: { value: 0 },
        uSize: { value: 30 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 1 },
        uBurst: { value: 0.55 },
        uGold: { value: new Color('#e3a740') },
        uPale: { value: new Color('#f7e3b0') },
      },
    })
    this.group.add(new Points(this.geometry, this.material))
    this.scene.add(this.group)
    this.resize()
  }

  /** Starts a morph toward `name`; the caller tweens `state.mix` from 0 to 1. */
  beginMorph(name: ShapeName) {
    const next = SHAPE_ORDER.indexOf(name)
    if (next === this.to && this.state.mix >= 1) return false
    // Continue from whichever shape currently dominates.
    this.from = this.state.mix > 0.5 ? this.to : this.from
    this.to = next
    this.state.mix = 0
    return true
  }

  get shape(): ShapeName {
    return SHAPE_ORDER[this.to]
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
    this.material.uniforms.uPixelRatio.value = dpr * Math.min(1.2, Math.max(0.7, h / 900))
    if (!this.running) this.render(0)
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const loop = (now: number) => {
      if (!this.running) return
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.render(dt)
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frame)
  }

  render(dt: number) {
    const s = this.state
    const u = this.material.uniforms
    const motion = this.reduced ? 0 : 1
    u.uTime.value += dt * motion
    u.uFrom.value = this.from
    u.uTo.value = this.to
    u.uMix.value = s.mix
    u.uOpacity.value = s.opacity
    u.uBurst.value = s.burst * motion

    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 3)
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 3)

    // Free spin for abstract shapes; objects ease back to face the viewer.
    if (s.spin > 0.01) {
      this.spinAngle += dt * 0.16 * s.spin * motion
    } else {
      const target = Math.round(this.spinAngle / (Math.PI * 2)) * Math.PI * 2
      this.spinAngle += (target - this.spinAngle) * Math.min(1, dt * 2.5)
    }
    const sway = Math.sin(u.uTime.value * 0.35) * 0.28 * (1 - s.spin)
    this.group.rotation.y = this.spinAngle + sway + this.pointer.x * 0.35 - 0.25 * (1 - s.spin)
    this.group.rotation.x = this.pointer.y * 0.2 + 0.08
    this.group.position.set(s.x, s.y, 0)
    this.group.scale.setScalar(s.scale)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }
}
