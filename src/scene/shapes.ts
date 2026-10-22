// Procedural point clouds for each object the particle field can become.
// Every generator returns exactly `count` xyz triples so shapes can morph 1:1.

export type ShapeName = 'sphere' | 'handheld' | 'headphones' | 'shoe' | 'alibi' | 'halo'

export const SHAPE_ORDER: ShapeName[] = ['sphere', 'handheld', 'headphones', 'shoe', 'alibi', 'halo']

type Vec2 = [number, number]

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Walks a closed polyline and returns a point at fraction t of its total length. */
function polylineSampler(points: Vec2[]) {
  const lengths: number[] = []
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[(i + 1) % points.length]
    const len = Math.hypot(bx - ax, by - ay)
    lengths.push(len)
    total += len
  }
  return (t: number): Vec2 => {
    let d = t * total
    for (let i = 0; i < points.length; i++) {
      if (d <= lengths[i]) {
        const [ax, ay] = points[i]
        const [bx, by] = points[(i + 1) % points.length]
        const f = lengths[i] === 0 ? 0 : d / lengths[i]
        return [ax + (bx - ax) * f, ay + (by - ay) * f]
      }
      d -= lengths[i]
    }
    return points[0]
  }
}

function roundedRect(cx: number, cy: number, w: number, h: number, r: number, steps = 10): Vec2[] {
  const pts: Vec2[] = []
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cy + h / 2 - r, 0],
    [cx - w / 2 + r, cy + h / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cy - h / 2 + r, Math.PI],
    [cx + w / 2 - r, cy - h / 2 + r, (3 * Math.PI) / 2],
  ]
  for (const [x, y, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = start + (i / steps) * (Math.PI / 2)
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r])
    }
  }
  return pts
}

function insidePolygon([x, y]: Vec2, poly: Vec2[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Splits `count` across weighted parts so the total is exact. */
function allot(count: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0)
  const out = weights.map((w) => Math.floor((w / sum) * count))
  out[out.length - 1] += count - out.reduce((a, b) => a + b, 0)
  return out
}

function sphere(count: number) {
  const r = rng(1)
  const out = new Float32Array(count * 3)
  const [surface] = allot(count, [0.86, 0.14])
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number
    if (i < surface) {
      y = 1 - (i / (surface - 1)) * 2
      const rad = Math.sqrt(1 - y * y)
      const th = golden * i
      x = Math.cos(th) * rad
      z = Math.sin(th) * rad
      const s = 1.55
      x *= s
      y *= s
      z *= s
    } else {
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const rr = 0.5 + r() * 0.95
      const rad = Math.sqrt(1 - u * u)
      x = Math.cos(th) * rad * rr
      y = u * rr
      z = Math.sin(th) * rad * rr
    }
    out.set([x, y, z], i * 3)
  }
  return out
}

function handheld(count: number) {
  const r = rng(2)
  const out = new Float32Array(count * 3)
  const W = 3.3
  const H = 1.75
  const shell = polylineSampler(roundedRect(0, 0, W, H, 0.48))
  const screenRect = roundedRect(0, 0.04, 1.55, 1.05, 0.09)
  const screen = polylineSampler(screenRect)
  const dpadH = polylineSampler([
    [-1.43, 0.13], [-0.85, 0.13], [-0.85, -0.03], [-1.43, -0.03],
  ])
  const dpadV = polylineSampler([
    [-1.22, 0.34], [-1.06, 0.34], [-1.06, -0.24], [-1.22, -0.24],
  ])
  const buttons: Vec2[] = [[1.14, 0.3], [0.88, 0.05], [1.4, 0.05], [1.14, -0.2]]
  const parts = allot(count, [26, 8, 15, 9, 10, 15, 4, 13])
  let i = 0
  const put = (x: number, y: number, z: number) => out.set([x, y, z], i++ * 3)
  const FRONT = 0.2
  // shell outline, front and back
  for (let k = 0; k < parts[0]; k++) {
    const [x, y] = shell(r())
    put(x, y, r() < 0.62 ? FRONT : -FRONT)
  }
  // shell side wall
  for (let k = 0; k < parts[1]; k++) {
    const [x, y] = shell(r())
    put(x, y, (r() * 2 - 1) * FRONT)
  }
  // screen outline
  for (let k = 0; k < parts[2]; k++) {
    const [x, y] = screen(r())
    put(x, y, FRONT + 0.01)
  }
  // screen scanlines
  for (let k = 0; k < parts[3]; k++) {
    const row = Math.floor(r() * 9)
    put(-0.7 + r() * 1.4, -0.38 + row * 0.11, FRONT + 0.005)
  }
  // d-pad
  for (let k = 0; k < parts[4]; k++) {
    const [x, y] = (k % 2 ? dpadH : dpadV)(r())
    put(x, y, FRONT + 0.03)
  }
  // face buttons
  for (let k = 0; k < parts[5]; k++) {
    const [bx, by] = buttons[k % 4]
    const a = r() * Math.PI * 2
    const rr = r() < 0.7 ? 0.13 : r() * 0.13
    put(bx + Math.cos(a) * rr, by + Math.sin(a) * rr, FRONT + 0.03)
  }
  // start / select
  for (let k = 0; k < parts[6]; k++) {
    const x = (k % 2 ? 0.18 : -0.18) + (r() - 0.5) * 0.22
    put(x, -0.68 + (r() - 0.5) * 0.05, FRONT + 0.01)
  }
  // sparse face fill
  while (i < count) {
    const p: Vec2 = [(r() - 0.5) * W * 0.94, (r() - 0.5) * H * 0.9]
    if (insidePolygon(p, screenRect)) continue
    put(p[0], p[1], FRONT)
  }
  return out
}

function headphones(count: number) {
  const r = rng(3)
  const out = new Float32Array(count * 3)
  const [band, cups, yokes] = allot(count, [34, 56, 10])
  let i = 0
  const put = (x: number, y: number, z: number) => out.set([x, y, z], i++ * 3)
  const R = 1.25
  const tube = 0.12
  for (let k = 0; k < band; k++) {
    const a = 0.08 * Math.PI + r() * 0.84 * Math.PI
    const t = r() * Math.PI * 2
    const rr = R + Math.cos(t) * tube
    put(Math.cos(a) * rr, Math.sin(a) * rr + 0.15, Math.sin(t) * tube)
  }
  for (let k = 0; k < cups; k++) {
    const side = k % 2 ? 1 : -1
    const a = r() * Math.PI * 2
    const surface = r()
    let x: number, rad: number
    if (surface < 0.55) {
      // cylinder wall
      x = (r() - 0.5) * 0.38
      rad = 0.56
    } else {
      // outer and inner caps
      x = surface < 0.8 ? 0.19 : -0.19
      rad = Math.sqrt(r()) * 0.56
    }
    put(side * (R + 0.08) + side * x, -0.32 + Math.sin(a) * rad * 1.12, Math.cos(a) * rad * 0.9)
  }
  for (let k = 0; k < yokes; k++) {
    const side = k % 2 ? 1 : -1
    const t = r()
    put(side * (R - 0.02 + t * 0.06), 0.42 - t * 0.28, (r() - 0.5) * 0.05)
  }
  return out
}

function shoe(count: number) {
  const r = rng(4)
  const out = new Float32Array(count * 3)
  const profile: Vec2[] = [
    [-1.75, -0.55], [1.5, -0.55], [1.78, -0.47], [1.88, -0.32], [1.72, -0.17],
    [1.2, 0.0], [0.62, 0.17], [0.08, 0.36], [-0.42, 0.6], [-0.72, 0.88],
    [-1.12, 0.95], [-1.46, 0.86], [-1.7, 0.55], [-1.86, 0.1], [-1.86, -0.35],
  ]
  const outline = polylineSampler(profile)
  const width = (x: number) => Math.max(0.12, 0.46 * (1 - Math.pow((x + 0.2) / 2.15, 2) * 0.75))
  const [edge, fill, sole, stripe, laces] = allot(count, [38, 28, 20, 7, 7])
  let i = 0
  const put = (x: number, y: number, z: number) => out.set([x, y - 0.12, z], i++ * 3)
  for (let k = 0; k < edge; k++) {
    const [x, y] = outline(r())
    put(x, y, (r() < 0.5 ? 1 : -1) * width(x))
  }
  for (let k = 0; k < fill; ) {
    const p: Vec2 = [-1.86 + r() * 3.74, -0.55 + r() * 1.5]
    if (!insidePolygon(p, profile)) continue
    put(p[0], p[1], (r() < 0.5 ? 1 : -1) * width(p[0]) * (0.85 + r() * 0.15))
    k++
  }
  for (let k = 0; k < sole; k++) {
    const x = -1.8 + r() * 3.55
    const y = -0.55 + r() * 0.2
    put(x, y, (r() * 2 - 1) * width(x) * 1.08)
  }
  for (let k = 0; k < stripe; k++) {
    const t = r()
    const x = -1.0 + t * 1.9
    const y = 0.22 - t * 0.42 + Math.sin(t * Math.PI) * 0.12
    put(x, y, width(x) + 0.02)
  }
  // laces run across the instep
  for (let k = 0; k < laces; k++) {
    const bar = k % 5
    const t = 0.1 + bar * 0.18
    const x = -0.35 + t * 1.25
    const y = 0.5 - t * 0.38
    put(x + (r() - 0.5) * 0.03, y + 0.03, (r() * 2 - 1) * width(x) * 0.55)
  }
  return out
}

/** Two overlapping speech bubbles, one asking a question: the imposter game. */
function alibi(count: number) {
  const r = rng(5)
  const out = new Float32Array(count * 3)
  const W = 420
  const H = 300
  let pixels: Vec2[] = []
  let layers: number[] = []
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 9
      ctx.lineJoin = 'round'
      const bubble = (x: number, y: number, w: number, h: number, tail: number, color: string) => {
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, 46)
        ctx.moveTo(x + w * tail - 18, y + h)
        ctx.lineTo(x + w * tail - 8, y + h + 44)
        ctx.lineTo(x + w * tail + 26, y + h)
        ctx.stroke()
      }
      bubble(18, 24, 230, 170, 0.3, '#ff0000')
      bubble(176, 96, 226, 150, 0.72, '#00ff00')
      ctx.fillStyle = '#ff0000'
      ctx.font = '700 120px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', 120, 112)
      ctx.fillStyle = '#00ff00'
      for (const dx of [-46, 0, 46]) {
        ctx.beginPath()
        ctx.arc(306 + dx, 172, 11, 0, Math.PI * 2)
        ctx.fill()
      }
      const data = ctx.getImageData(0, 0, W, H).data
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          const o = (y * W + x) * 4
          if (data[o + 3] > 120) {
            pixels.push([x, y])
            layers.push(data[o] > data[o + 1] ? 1 : -1)
          }
        }
      }
    }
  }
  if (!pixels.length) {
    pixels = [[W / 2, H / 2]]
    layers = [0]
  }
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(r() * pixels.length)
    const [px, py] = pixels[idx]
    const x = (px / W - 0.5) * 4.0 + (r() - 0.5) * 0.02
    const y = -(py / H - 0.5) * 2.86 + (r() - 0.5) * 0.02
    out.set([x, y, layers[idx] * 0.18 + (r() - 0.5) * 0.06], i * 3)
  }
  return out
}

function halo(count: number) {
  const r = rng(6)
  const out = new Float32Array(count * 3)
  const [ring, inner, dust] = allot(count, [55, 20, 25])
  let i = 0
  const tilt = 1.05
  const put = (x: number, y: number, z: number) => {
    const yy = y * Math.cos(tilt) - z * Math.sin(tilt)
    const zz = y * Math.sin(tilt) + z * Math.cos(tilt)
    out.set([x, yy, zz], i++ * 3)
  }
  for (let k = 0; k < ring; k++) {
    const a = r() * Math.PI * 2
    const rr = 1.75 + (r() - 0.5) * 0.08
    put(Math.cos(a) * rr, Math.sin(a) * rr, (r() - 0.5) * 0.06)
  }
  for (let k = 0; k < inner; k++) {
    const a = r() * Math.PI * 2
    const rr = 1.15 + (r() - 0.5) * 0.04
    put(Math.cos(a) * rr, Math.sin(a) * rr, (r() - 0.5) * 0.03)
  }
  for (let k = 0; k < dust; k++) {
    const a = r() * Math.PI * 2
    const rr = 0.4 + Math.pow(r(), 0.6) * 2.4
    put(Math.cos(a) * rr, Math.sin(a) * rr, (r() - 0.5) * 0.5)
  }
  return out
}

const GENERATORS: Record<ShapeName, (count: number) => Float32Array> = {
  sphere,
  handheld,
  headphones,
  shoe,
  alibi,
  halo,
}

export function buildShape(name: ShapeName, count: number) {
  const out = GENERATORS[name](count)
  if (out.length !== count * 3) throw new Error(`${name} produced ${out.length / 3} of ${count} points`)
  return out
}
