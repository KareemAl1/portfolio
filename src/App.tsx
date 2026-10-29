import { useEffect, useRef, useState } from 'react'
import { links, projects, roles, toolbox, type Project } from './content'
import { setupMotion } from './motion'

const WHEEL = [
  { src: 'work/sona.webp', alt: '' },
  { src: 'work/handheld-exploded.webp', alt: '' },
  { src: 'work/handheld.webp', alt: '' },
  { src: 'work/pace.webp', alt: '' },
  { src: 'work/alibi.webp', alt: '' },
]

function SplitWords({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="sw">{w}</span>{' '}
        </span>
      ))}
    </>
  )
}

// Local time in Michigan plus a small line about what the day looks like.
function moodFor(hour: number) {
  if (hour < 6) return 'Late night, still shipping'
  if (hour < 12) return 'Morning, coffee first'
  if (hour < 17) return 'Afternoon, deep in code'
  return 'Evening build, music on'
}

function useMichiganTime() {
  const read = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit' })
    const hour = Number(now.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Detroit' }))
    return { time, mood: moodFor(hour) }
  }
  const [state, setState] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setState(read()), 20_000)
    return () => window.clearInterval(id)
  }, [])
  return state
}

function LiveStatus({ className = '' }: { className?: string }) {
  const { time, mood } = useMichiganTime()
  return (
    <p className={`live ${className}`}>
      <span className="live__mood">{mood}</span>
      <span className="live__time">
        Local time <time>{time}</time>
      </span>
    </p>
  )
}

// A framed card whose picture slowly fades between shots while it is on screen.
function Crossfade({ images }: { images: { src: string; alt: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || images.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer)
      if (entry.isIntersecting) timer = window.setInterval(() => setIndex((i) => (i + 1) % images.length), 3600)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [images.length])
  return (
    <div
      className="bezel"
      ref={ref}
      onPointerMove={(e) => {
        // A soft light follows the pointer across the frame.
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      }}
    >
      <div className="bezel__screen">
        {images.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            width={1400}
            height={875}
            loading="lazy"
            decoding="async"
            className={i === index ? 'is-on' : undefined}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="bezel__dots" aria-hidden="true">
          {images.map((img, i) => (
            <span key={img.src} className={i === index ? 'is-on' : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}

function CopyEmail({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={`copy ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(links.email)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2000)
        } catch {
          window.location.href = `mailto:${links.email}`
        }
      }}
    >
      <span className="copy__text">{copied ? 'Copied to clipboard' : links.email}</span>
    </button>
  )
}

function ProjectBlock({ p, i }: { p: Project; i: number }) {
  return (
    <article className="proj" id={p.id} aria-labelledby={`${p.id}-name`}>
      <div className="proj__stage">
        <div className="proj__sticky">
          <figure className="proj__frame">
            <img src={p.images[0].src} alt={p.images[0].alt} width={2400} height={1500} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            <figcaption className="proj__title">
              <span className="proj__kind">{p.kind}</span>
              <span className="proj__name" id={`${p.id}-name`}>
                {p.name}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="proj__body">
        <div className="proj__copy">
          <p className="proj__pitch">{p.pitch}</p>
          <p className="proj__text">{p.body}</p>
          <p className="proj__stack">{p.stack.join(', ')}</p>
          <div className="proj__links">
            {p.live && (
              <a className="btn btn--accent" href={p.live} target="_blank" rel="noreferrer">
                Visit site
              </a>
            )}
            {p.code && (
              <a className="btn" href={p.code} target="_blank" rel="noreferrer">
                View code
              </a>
            )}
            {p.note && <span className="proj__note">{p.note}</span>}
          </div>
        </div>
        <div className="proj__side">
          <dl className="proj__facts">
            {p.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          {p.images[1] && <Crossfade images={[p.images[1], p.images[0]]} />}
        </div>
      </div>
    </article>
  )
}

export default function App() {
  useEffect(() => setupMotion(), [])

  return (
    <>
      <header className="nav">
        <a className="nav__name" href="#top">
          Kareem Alwan
        </a>
        <nav className="nav__links" aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a className="nav__cta" href="#contact">
            Get in touch
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-label="Introduction">
          <div className="hero__top">
            <p className="hero__intro">
              Frontend developer in Michigan. I build interfaces in React and React Native that feel{' '}
              <em className="warm">good to use</em>.
            </p>
            <div className="hero__side">
              <p className="hero__status">
                <span className="dot" aria-hidden="true" />
                Open to junior roles
              </p>
              <LiveStatus />
            </div>
          </div>

          <div className="wheel" aria-hidden="true">
            {WHEEL.map((c, i) => (
              <div className="wheel__card" style={{ ['--i' as string]: i - 2 }} key={c.src}>
                <img src={c.src} alt="" width={2400} height={1500} decoding="async" />
              </div>
            ))}
          </div>

          <h1 className="hero__name">
            <span className="hero__name-inner">
              <span>Kareem</span> <span>Alwan</span>
            </span>
          </h1>
        </section>

        <section className="statement" aria-label="About">
          <p className="statement__text">
            <SplitWords text="I've been building for the web for over a year. Since April I've shipped features to CalorAI, a React Native app on the App Store, and on my own time I build things like a 3D console you can take apart and a party game for friends." />
          </p>
          <p className="statement__tools">{toolbox.join(', ')}</p>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <header className="section-head">
            <h2 id="work-title">Selected work</h2>
            <p>Four projects, each built from scratch.</p>
          </header>
          {projects.map((p, i) => (
            <ProjectBlock p={p} i={i} key={p.id} />
          ))}
        </section>

        <section className="exp" id="experience" aria-labelledby="exp-title">
          <header className="section-head">
            <h2 id="exp-title">Experience</h2>
          </header>
          <ol className="exp__list">
            {roles.map((r) => (
              <li className="job" key={r.org}>
                <div className="job__head">
                  <h3>{r.org}</h3>
                  <p className="job__title">{r.title}</p>
                  <p className="job__when">{r.when}</p>
                </div>
                <ul className="job__points">
                  {r.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title" className="contact__title">
            Let's work together.
          </h2>
          <p className="contact__sub">
            I'm looking for a junior frontend or React Native role. Remote or in Detroit, and willing to relocate.
          </p>
          <div className="contact__actions">
            <CopyEmail className="btn btn--accent btn--lg" />
            <a className="btn btn--lg" href={links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="btn btn--lg" href={links.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>© 2026 Kareem Alwan</p>
        <LiveStatus className="live--foot" />
        <p>Designed and built by me with React and GSAP.</p>
      </footer>
    </>
  )
}
