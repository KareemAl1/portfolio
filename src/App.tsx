import { useEffect, useRef, useState } from 'react'
import { links, projects, roles, toolbox } from './content'
import { setupMotion } from './motion'

function Chars({ text }: { text: string }) {
  return (
    <span className="chars" aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="ch" aria-hidden="true" key={i}>
          <span>{ch === ' ' ? ' ' : ch}</span>
        </span>
      ))}
    </span>
  )
}

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="w">{w}</span>{' '}
        </span>
      ))}
    </>
  )
}

function Clock() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Detroit' }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setT(fmt()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <span className="tabular">{t} EDT</span>
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="mail magnetic"
      data-cursor="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(links.email)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1800)
        } catch {
          window.location.href = `mailto:${links.email}`
        }
      }}
    >
      <span className="mail__addr">{links.email}</span>
      <span className="mail__hint mono" aria-live="polite">
        {copied ? 'Copied' : 'Click to copy'}
      </span>
    </button>
  )
}

function ProjectRow({ index }: { index: number }) {
  const p = projects[index]
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const from = el.getBoundingClientRect().height
    el.style.height = open ? 'auto' : '0px'
    const to = el.getBoundingClientRect().height
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 650, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' })
  }, [open])
  return (
    <li className={`row${open ? ' is-open' : ''}`} data-preview={p.images[0]?.src}>
      <span className="row__line" aria-hidden="true" />
      <button type="button" className="row__head" aria-expanded={open} aria-controls={`${p.id}-notes`} onClick={() => setOpen(!open)}>
        <span className="mono row__idx">{String(index + 1).padStart(2, '0')}</span>
        <span className="row__name">{p.name}</span>
        <span className="row__kind">{p.kind}</span>
        <span className="mono row__year">{p.year}</span>
        <span className="row__toggle" aria-hidden="true" />
      </button>
      <div className="row__body" id={`${p.id}-notes`} ref={bodyRef} style={{ height: 0 }}>
        <div className="row__inner">
          <p className="row__pitch">{p.pitch}</p>
          <p className="row__text">{p.body}</p>
          <dl className="row__facts">
            {p.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mono row__stack">{p.stack.join(' / ')}</p>
          <div className="row__links">
            {p.live && (
              <a className="btn btn--fill magnetic" href={p.live} target="_blank" rel="noreferrer">
                Open live site
              </a>
            )}
            {p.code && (
              <a className="btn magnetic" href={p.code} target="_blank" rel="noreferrer">
                Read the code
              </a>
            )}
            {p.note && <p className="row__note">{p.note}</p>}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function App() {
  const globeRef = useRef<HTMLCanvasElement>(null)
  const galleryRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!globeRef.current || !galleryRef.current) return
    return setupMotion(globeRef.current, galleryRef.current)
  }, [])

  return (
    <>
      <div className="loader" aria-hidden="true">
        <div className="loader__row mono">
          <span>Kareem Alwan</span>
          <span>Portfolio, 2026</span>
        </div>
        <div className="loader__num">
          <span className="loader__count">000</span>
        </div>
        <div className="loader__track">
          <span />
        </div>
      </div>

      <canvas className="globe" ref={globeRef} aria-hidden="true" />
      <canvas className="gallery-gl" ref={galleryRef} aria-hidden="true" />
      <div className="cursor" aria-hidden="true">
        <span className="cursor__ring">
          <span className="cursor__label" />
        </span>
      </div>
      <div className="preview" aria-hidden="true">
        <img alt="" />
      </div>

      <header className="nav">
        <a href="#top" className="nav__name">
          Kareem Alwan
        </a>
        <p className="nav__meta mono">
          <span>Westland, MI</span>
          <Clock />
        </p>
        <nav className="nav__links" aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-label="Introduction">
          <div className="hero__meta mono">
            <span>Frontend engineer</span>
            <span>React / React Native / Three.js</span>
            <span>42.33° N, 83.40° W</span>
          </div>
          <h1 className="hero__title">
            <span className="hero__line hero__line--a">
              <Chars text="Kareem" />
            </span>
            <span className="hero__line hero__line--b">
              <Chars text="Alwan" />
            </span>
          </h1>
          <div className="hero__foot">
            <p className="hero__lede">
              I build interfaces that move well. Production React Native by day, WebGL and motion experiments by night.
            </p>
            <p className="hero__status mono">
              <span className="pulse" /> Open to junior roles
            </p>
            <a href="#work" className="hero__cue mono">
              Scroll
              <span className="hero__cue-bar">
                <i />
              </span>
            </a>
          </div>
        </section>

        <section className="about" id="about" aria-label="About">
          <p className="label mono">About</p>
          <p className="about__text">
            <Words text="I care about the part of software people actually touch. I ship features to a live iOS app in React Native, and on the side I build 3D, scroll and motion projects to find out how far a browser can go. Every one of them is below." />
          </p>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="work__head">
            <h2 id="work-title" className="h2">
              <Chars text="Selected work" />
            </h2>
            <p className="mono work__count">(04) projects, keep scrolling</p>
          </div>
          <div className="work__pin">
            <div className="work__track">
              {projects.map((p, i) => (
                <article className={`card card--${i}`} key={p.id}>
                  <a
                    className="card__media"
                    href={p.live ?? `#${p.id}-notes`}
                    target={p.live ? '_blank' : undefined}
                    rel="noreferrer"
                    data-cursor={p.live ? 'Visit' : 'Notes'}
                  >
                    <img src={p.images[0].src} alt={p.images[0].alt} width={1400} height={875} loading="eager" decoding="async" />
                  </a>
                  <div className="card__cap">
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{p.name}</h3>
                    <span className="card__kind">{p.kind}</span>
                  </div>
                </article>
              ))}
              <div className="card card--end">
                <p className="card__end-text">
                  Notes on each project
                  <br />
                  are just below.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="notes" aria-labelledby="notes-title">
          <div className="notes__head">
            <h2 id="notes-title" className="h2">
              <Chars text="Project notes" />
            </h2>
            <p className="mono">Open a row for the details</p>
          </div>
          <ol className="rows">
            {projects.map((p, i) => (
              <ProjectRow index={i} key={p.id} />
            ))}
          </ol>
        </section>

        <section className="stats" aria-label="Results">
          <div className="stat">
            <p className="stat__num">
              <span data-count="44" data-to="86">
                44
              </span>
            </p>
            <p className="stat__label">Mobile PageSpeed for a Shopify store, up from 44</p>
          </div>
          <div className="stat">
            <p className="stat__num">
              <span data-count="0" data-to="182">
                182
              </span>
            </p>
            <p className="stat__label">Unit tests behind Handheld Studio</p>
          </div>
          <div className="stat">
            <p className="stat__num">
              <span data-count="92" data-to="26">
                26
              </span>
            </p>
            <p className="stat__label">Draw calls per frame, down from 92 after batching</p>
          </div>
        </section>

        <section className="exp" aria-labelledby="exp-title">
          <div className="exp__side">
            <h2 id="exp-title" className="h2">
              <Chars text="Experience" />
            </h2>
          </div>
          <ol className="exp__list">
            {roles.map((r) => (
              <li className="job" key={r.org}>
                <span className="job__line" aria-hidden="true" />
                <p className="mono job__when">{r.when}</p>
                <div>
                  <h3 className="job__org">{r.org}</h3>
                  <p className="job__title">{r.title}</p>
                  <ul className="job__points">
                    {r.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="tools" aria-label="Tools">
          <div className="tools__track">
            {[...toolbox, ...toolbox].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <p className="label mono">Contact</p>
          <h2 id="contact-title" className="contact__title">
            <Chars text="Let's talk." />
          </h2>
          <p className="contact__sub">
            Looking for a junior frontend or React Native role. Remote, Detroit, or happy to move to New York, San Francisco,
            Chicago or Florida.
          </p>
          <CopyEmail />
          <ul className="contact__links">
            <li>
              <a className="magnetic" href={links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a className="magnetic" href={links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
          <footer className="foot mono">
            <span>Designed and built by Kareem Alwan</span>
            <span>React, Three.js, GSAP</span>
            <Clock />
          </footer>
        </section>
      </main>
    </>
  )
}
