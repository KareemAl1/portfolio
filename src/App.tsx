import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { links, projects, roles, toolbox, type Project } from './content'
import { Name } from './Name'
import { Stage } from './Stage'

function useMichiganTime() {
  const read = () =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit' })
  const [time, setTime] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setTime(read()), 20_000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={`copy${copied ? ' is-copied' : ''}`}
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
      <span className="copy__text" key={copied ? 'copied' : 'email'}>
        {copied && (
          <svg className="copy__check" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
        )}
        {copied ? 'Copied' : links.email}
      </span>
    </button>
  )
}

// Each project gets the whole screen and its own colors. The page takes on
// that project's palette while you're inside it.
function World({ p }: { p: Project }) {
  return (
    <article className={`world world--${p.frame}`} id={p.id} data-world={p.id}>
      <header className="world__head">
        <h3 className="world__name">{p.name}</h3>
        <p className="world__kind">
          {p.kind}, {p.year}
        </p>
      </header>
      <div className="world__body">
        <div className="world__copy">
          <p className="world__pitch">{p.pitch}</p>
          <p className="world__text">{p.body}</p>
          <dl className="facts">
            {p.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          <p className="world__stack">{p.stack.join(', ')}</p>
          <div className="world__links">
            {p.live && (
              <a className="btn btn--fill" href={p.live} target="_blank" rel="noreferrer">
                Open the site
              </a>
            )}
            {p.code && (
              <a className="btn" href={p.code} target="_blank" rel="noreferrer">
                Read the code
              </a>
            )}
            {p.note && <span className="world__note">{p.note}</span>}
          </div>
        </div>
        <Stage p={p} />
      </div>
    </article>
  )
}

export default function App() {
  const time = useMichiganTime()

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    let lenis: Lenis | undefined
    let raf = 0

    if (!reduced) lenis = new Lenis({ lerp: 0.11 })

    const worlds = Array.from(document.querySelectorAll<HTMLElement>('[data-world]'))
    const names = Array.from(document.querySelectorAll<HTMLElement>('.world__name'))
    const nav = document.querySelector<HTMLElement>('.nav')
    let lastY = -1

    const update = () => {
      const vh = window.innerHeight
      const mid = vh / 2
      let world = 'studio'
      for (const w of worlds) {
        const r = w.getBoundingClientRect()
        if (r.top < mid && r.bottom > mid) world = w.dataset.world!
      }
      if (root.dataset.world !== world) root.dataset.world = world
      nav?.classList.toggle('is-scrolled', window.scrollY > 10)
      if (reduced) return
      // Project names arrive heavy and narrow, then open up as they rise.
      for (const n of names) {
        const r = n.getBoundingClientRect()
        if (r.bottom < -100 || r.top > vh + 100) continue
        const t = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)))
        const e = 1 - (1 - t) ** 3
        n.style.fontVariationSettings = `'wdth' ${(50 + e * 62).toFixed(1)}, 'wght' ${(860 - e * 330).toFixed(0)}`
      }
    }

    const loop = (now: number) => {
      lenis?.raf(now)
      if (window.scrollY !== lastY) {
        lastY = window.scrollY
        update()
      }
      raf = requestAnimationFrame(loop)
    }
    update()
    raf = requestAnimationFrame(loop)
    const onResize = () => {
      lastY = -1
    }
    window.addEventListener('resize', onResize)

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!a) return
      const target = document.querySelector<HTMLElement>(a.getAttribute('href')!)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { offset: 0 })
      else target.scrollIntoView()
    }
    document.addEventListener('click', onAnchor)

    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('click', onAnchor)
    }
  }, [])

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
              Frontend developer in Michigan. I build React and React Native interfaces that feel good in the hand.
            </p>
            <p className="hero__status">
              <span className="hero__open">
                <span className="dot" aria-hidden="true" />
                Open to junior roles
              </span>
              <span>
                Westland, Michigan, <time>{time}</time>
              </span>
            </p>
          </div>
          <Name />
          <p className="hero__hint" aria-hidden="true">
            <span className="hero__hint-fine">Run your cursor across the letters.</span>
            <span className="hero__hint-touch">Drag a finger across the letters.</span>
          </p>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="work__lead">
            <h2 id="work-title">Five projects. Four of them run right here on the page.</h2>
            <p>Each one has its own look, so the page changes color as you move through them.</p>
          </div>
          {projects.map((p) => (
            <World p={p} key={p.id} />
          ))}
        </section>

        <section className="exp" id="experience" aria-labelledby="exp-title">
          <div className="exp__lead">
            <h2 id="exp-title">Experience</h2>
            <p>
              I&rsquo;ve been building for the web for over a year. Since April I&rsquo;ve shipped features to CalorAI, a
              React Native app on the App Store, and I take on Shopify and web work for small brands.
            </p>
          </div>
          <ol className="roles">
            {roles.map((r) => (
              <li className="role" key={r.org}>
                <div className="role__head">
                  <h3>{r.org}</h3>
                  <p>{r.title}</p>
                  <p className="role__when">{r.when}</p>
                </div>
                <ul>
                  {r.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="tools">
            <span>I work with </span>
            {toolbox.join(', ')}.
          </p>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Looking for a junior frontend developer? Let&rsquo;s talk.</h2>
          <div className="contact__row">
            <CopyEmail />
            <a className="btn" href={links.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="btn" href={links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>Kareem Alwan, 2026</span>
        <span>
          Built with React and one variable font. <time>{time}</time> in Michigan.
        </span>
      </footer>
    </>
  )
}
