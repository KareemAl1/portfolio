import { useEffect, useRef, useState } from 'react'
import type { Project } from './content'

const SIZE = {
  browser: { w: 1360, h: 850 },
  phone: { w: 390, h: 844 },
  // On a small screen a desktop site would be unreadable, so load the mobile layout.
  compact: { w: 400, h: 640 },
}

// Only one project runs at a time, so two WebGL scenes never fight for the GPU.
const listeners = new Set<(id: string) => void>()
const announce = (id: string) => listeners.forEach((fn) => fn(id))

// A project you can use without leaving the page. It shows a still until you
// ask for the real thing, then loads the live site into the frame at full
// desktop or phone size and scales it down to fit.
export function Stage({ p }: { p: Project }) {
  const frame = p.frame === 'phone' ? 'phone' : 'browser'
  const [small] = useState(() => matchMedia('(max-width: 760px)').matches)
  const [playing, setPlaying] = useState(false)
  const size = frame === 'browser' && small ? (playing ? SIZE.compact : { w: 400, h: 250 }) : SIZE[frame]
  const box = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [shot, setShot] = useState(0)
  const stop = () => {
    setPlaying(false)
    setLoaded(false)
  }
  const host = p.live?.replace('https://', '')

  useEffect(() => {
    const el = box.current
    if (!el) return
    const scale = () => el.style.setProperty('--s', String(el.clientWidth / size.w))
    scale()
    const ro = new ResizeObserver(scale)
    ro.observe(el)
    // Stop when the project scrolls away.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stop()
    })
    io.observe(el)
    const onOther = (id: string) => {
      if (id !== p.id) stop()
    }
    listeners.add(onOther)
    return () => {
      ro.disconnect()
      io.disconnect()
      listeners.delete(onOther)
    }
  }, [p.id, size.w])

  const play = () => {
    announce(p.id)
    setLoaded(false)
    setPlaying(true)
  }

  if (p.frame === 'shots') {
    const labels = ['See a round', 'Back to the lobby']
    return (
      <div className="stage stage--browser">
        <div className="stage__bar">
          <span className="stage__url">Not public yet</span>
          <button type="button" className="stage__ctl" onClick={() => setShot((s) => (s + 1) % p.images.length)}>
            {labels[shot] ?? 'Next'}
          </button>
        </div>
        <div className="stage__screen" style={{ aspectRatio: '16 / 10' }}>
          {p.images.map((img, i) => (
            <img
              key={img.src}
              className={`stage__poster${i === shot ? ' is-on' : ''}`}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`stage stage--${frame}${playing ? ' is-playing' : ''}`}>
      {frame === 'browser' && (
        <div className="stage__bar">
          <span className="stage__url">{host}</span>
          {playing && (
            <button type="button" className="stage__ctl" onClick={() => stop()}>
              Stop
            </button>
          )}
        </div>
      )}
      <div className="stage__screen" ref={box} style={{ aspectRatio: `${size.w} / ${size.h}` }}>
        <img className="stage__poster is-on" src={p.images[0].src} alt={p.images[0].alt} loading="lazy" decoding="async" />
        {playing && (
          <iframe
            className={`stage__live${loaded ? ' is-loaded' : ''}`}
            src={p.live}
            title={`${p.name}, live`}
            width={size.w}
            height={size.h}
            onLoad={() => setLoaded(true)}
            allow="accelerometer; gyroscope; clipboard-write"
          />
        )}
        {playing && !loaded && <span className="stage__wait">Loading {p.name}</span>}
        {!playing && (
          <button type="button" className="stage__play" onClick={play}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 2.8v10.4L13 8z" />
            </svg>
            Use it right here
          </button>
        )}
      </div>
      {frame === 'phone' && playing && (
        <button type="button" className="stage__ctl stage__ctl--under" onClick={() => stop()}>
          Stop
        </button>
      )}
    </div>
  )
}
