import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three'

// Mirrors DOM images as WebGL planes (1 world unit = 1 CSS pixel) so they can
// bend with scroll speed and split their color channels while moving.

const vertex = /* glsl */ `
  uniform float uVelocity;
  uniform float uHover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float bend = sin(uv.x * 3.14159);
    p.z -= bend * clamp(uVelocity, -80.0, 80.0) * 1.1;
    p.z += uHover * 18.0 * sin(uv.y * 3.14159) * sin(uv.x * 3.14159);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uPlane;
  uniform vec2 uImage;
  uniform float uVelocity;
  uniform float uHover;
  uniform float uReveal;
  varying vec2 vUv;

  vec2 cover(vec2 uv) {
    float rp = uPlane.x / uPlane.y;
    float ri = uImage.x / uImage.y;
    vec2 scale = vec2(min(rp / ri, 1.0), min(ri / rp, 1.0));
    // Centered horizontally, pinned to the top of the screenshot vertically.
    vec2 offset = vec2((1.0 - scale.x) * 0.5, 1.0 - scale.y);
    return uv * scale + offset;
  }

  void main() {
    vec2 uv = vUv;
    uv = (uv - 0.5) * (1.0 - uHover * 0.06) + 0.5;
    vec2 c = cover(uv);
    float shift = clamp(uVelocity, -60.0, 60.0) * 0.00035;
    float r = texture2D(uTexture, c + vec2(shift, 0.0)).r;
    vec4 g = texture2D(uTexture, c);
    float b = texture2D(uTexture, c - vec2(shift, 0.0)).b;
    vec3 col = vec3(r, g.g, b);
    // Reveal wipes upward from the bottom edge.
    float edge = smoothstep(uReveal - 0.04, uReveal, 1.0 - vUv.y);
    gl_FragColor = vec4(col, 1.0 - edge);
  }
`

type Item = { el: HTMLElement; img: HTMLImageElement; mesh: Mesh; mat: ShaderMaterial; hover: number; target: number }

export class Gallery {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(45, 1, 10, 4000)
  private items: Item[] = []
  private geometry = new PlaneGeometry(1, 1, 40, 20)
  private loader = new TextureLoader()
  private raf = 0
  private running = false
  velocity = 0
  private smoothed = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.camera.position.z = 800
    this.resize()
  }

  add(el: HTMLElement) {
    const img = el.querySelector('img')
    if (!img) return
    const mat = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        uTexture: { value: new Texture() },
        uPlane: { value: new Vector2(1, 1) },
        uImage: { value: new Vector2(16, 10) },
        uVelocity: { value: 0 },
        uHover: { value: 0 },
        uReveal: { value: 1 },
      },
    })
    const mesh = new Mesh(this.geometry, mat)
    mesh.visible = false
    this.scene.add(mesh)
    const item: Item = { el, img, mesh, mat, hover: 0, target: 0 }
    this.items.push(item)
    this.loader.load(img.currentSrc || img.src, (tex) => {
      tex.colorSpace = SRGBColorSpace
      mat.uniforms.uTexture.value = tex
      mat.uniforms.uImage.value.set(tex.image.width, tex.image.height)
      mesh.visible = true
      el.classList.add('is-gl')
    })
    el.addEventListener('pointerenter', () => (item.target = 1))
    el.addEventListener('pointerleave', () => (item.target = 0))
    return item
  }

  /** 0 hides the image, 1 shows it; scrubbed from scroll. */
  setReveal(el: HTMLElement, v: number) {
    const item = this.items.find((i) => i.el === el)
    if (item) item.mat.uniforms.uReveal.value = v
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = (2 * Math.atan(h / 2 / this.camera.position.z) * 180) / Math.PI
    this.camera.updateProjectionMatrix()
  }

  start() {
    if (this.running) return
    this.running = true
    const tick = () => {
      if (!this.running) return
      this.render()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    // Leave no stale frame behind once the gallery scrolls away.
    this.renderer.clear()
  }

  private render() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.smoothed += (this.velocity - this.smoothed) * 0.12
    // Lenis stops reporting once scrolling ends, so let speed fall back to rest.
    this.velocity *= 0.9
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect()
      const onScreen = r.bottom > -100 && r.top < h + 100 && r.right > -100 && r.left < w + 100
      it.mesh.visible = onScreen && it.el.classList.contains('is-gl')
      if (!it.mesh.visible) continue
      it.hover += (it.target - it.hover) * 0.1
      it.mesh.position.set(r.left + r.width / 2 - w / 2, -(r.top + r.height / 2) + h / 2, 0)
      it.mesh.scale.set(r.width, r.height, 1)
      it.mat.uniforms.uPlane.value.set(r.width, r.height)
      it.mat.uniforms.uVelocity.value = this.smoothed
      it.mat.uniforms.uHover.value = it.hover
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    this.items.forEach((i) => i.mat.dispose())
    this.geometry.dispose()
    this.renderer.dispose()
  }
}
