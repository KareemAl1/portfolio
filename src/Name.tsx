import { useEffect, useRef } from 'react'

const LINES = ['Kareem', 'Alwan']
const MIN_W = 50
const MAX_W = 150

// The name is set in a variable font and behaves like something soft. Each
// line is stretched to fill the screen, and the letters nearest the pointer
// swell while the rest squeeze to make room, so the line never changes length.
export function Name() {
  const root = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const lines = Array.from(el.querySelectorAll<HTMLElement>('.name__line'))
    const letters = lines.map((line) => Array.from(line.querySelectorAll<HTMLElement>('.name__ch')))
    const base = lines.map(() => 100)
    const state = letters.map((row) => row.map(() => ({ f: 0, cx: 0, cy: 0 })))
    let pointer: { x: number; y: number } | null = null
    let sweep: { from: number; start: number } | null = null
    let raf = 0
    let running = false

    const setLine = (i: number, wdth: number) => {
      letters[i].forEach((ch) => (ch.style.fontVariationSettings = `'wdth' ${wdth}, 'wght' 500`))
    }

    // Pick a size from the height we have, then find the width setting that
    // makes each line span the full measure.
    const fit = () => {
      const width = el.clientWidth
      const hero = el.closest<HTMLElement>('.hero')
      const budget = (hero?.clientHeight ?? window.innerHeight) * 0.3
      el.style.fontSize = '100px'
      lines.forEach((line) => (line.style.transform = ''))
      const span = (wdth: number) =>
        Math.max(
          ...lines.map((line, i) => {
            setLine(i, wdth)
            return line.scrollWidth
          }),
        )
      // The size has to sit where the longest line can still be stretched or
      // squeezed to exactly the width of the screen.
      const smallest = (width / span(MAX_W - 20)) * 100
      const largest = (width / span(MIN_W + 12)) * 100
      const size = Math.max(smallest, Math.min(budget, largest))
      el.style.fontSize = `${size}px`
      lines.forEach((line, i) => {
        let lo = MIN_W + 10
        let hi = MAX_W
        for (let k = 0; k < 9; k++) {
          const mid = (lo + hi) / 2
          setLine(i, mid)
          if (line.scrollWidth > width) hi = mid
          else lo = mid
        }
        base[i] = lo
        setLine(i, lo)
      })
      measure()
      paint()
    }

    const measure = () => {
      letters.forEach((row, i) =>
        row.forEach((ch, j) => {
          const r = ch.getBoundingClientRect()
          state[i][j].cx = r.left + r.width / 2
          state[i][j].cy = r.top + r.height / 2
        }),
      )
    }

    const paint = () => {
      const width = el.clientWidth
      letters.forEach((row, i) => {
        const mean = state[i].reduce((a, s) => a + s.f, 0) / row.length
        row.forEach((ch, j) => {
          const f = state[i][j].f
          const wdth = Math.max(MIN_W, Math.min(MAX_W, base[i] + (f - mean) * 95))
          ch.style.fontVariationSettings = `'wdth' ${wdth.toFixed(1)}, 'wght' ${(500 + f * 400).toFixed(0)}`
        })
        // Weight changes the line length a little, so take up the slack here.
        const w = lines[i].scrollWidth
        lines[i].style.transform = Math.abs(w - width) > 0.5 ? `scaleX(${width / w})` : ''
      })
    }

    const tick = (now: number) => {
      let px: number | null = null
      let py: number | null = null
      if (sweep) {
        const t = (now - sweep.start) / 1500
        if (t >= 1) sweep = null
        else {
          const rect = el.getBoundingClientRect()
          px = rect.left - 200 + (rect.width + 400) * t
          py = rect.top + rect.height * (0.25 + 0.5 * t)
        }
      }
      if (px === null && pointer) {
        px = pointer.x
        py = pointer.y
      }
      const radius = Math.max(160, el.clientWidth * 0.17)
      let moving = false
      state.forEach((row) =>
        row.forEach((s) => {
          let target = 0
          if (px !== null && py !== null) {
            const d = Math.hypot(px - s.cx, (py - s.cy) * 0.8)
            target = Math.exp(-((d / radius) ** 2))
          }
          s.f += (target - s.f) * 0.16
          if (Math.abs(target - s.f) > 0.002) moving = true
        }),
      )
      paint()
      if (moving || sweep || pointer) raf = requestAnimationFrame(tick)
      else running = false
    }
    const wake = () => {
      if (running || reduced) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (!pointer) measure()
      pointer = { x: e.clientX, y: e.clientY }
      wake()
    }
    const onLeave = () => {
      pointer = null
      wake()
    }
    const hero = el.closest<HTMLElement>('.hero') ?? el
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    hero.addEventListener('pointercancel', onLeave)
    window.addEventListener('resize', fit)

    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      fit()
      el.classList.add('is-ready')
      if (!reduced) {
        // One pass across the name on load, so it's clear the letters move.
        window.setTimeout(() => {
          measure()
          sweep = { from: 0, start: performance.now() }
          wake()
        }, 900)
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      hero.removeEventListener('pointercancel', onLeave)
      window.removeEventListener('resize', fit)
    }
  }, [])

  let index = 0
  return (
    <h1 className="name" ref={root} aria-label="Kareem Alwan">
      {LINES.map((line) => (
        <span className="name__line" key={line} aria-hidden="true">
          {line.split('').map((ch, j) => (
            <span className="name__ch" key={j} style={{ ['--n' as string]: index++ }}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
