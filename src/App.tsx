import { useEffect, useRef, useState } from 'react'
import { links, projects, roles, toolbox, type Project } from './content'
import { setupMotion } from './motion'

function Letters({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="char" aria-hidden="true" key={i}>
          <span className="char-inner">{ch === ' ' ? ' ' : ch}</span>
        </span>
      ))}
    </span>
  )
}

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span className="word" key={i}>
          {w}{' '}
        </span>
      ))}
    </>
  )
}

function LocalTime() {
  const [time, setTime] = useState(() => format())
  function format() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Detroit',
    }).format(new Date())
  }
  useEffect(() => {
    const t = window.setInterval(() => setTime(format()), 15000)
    return () => window.clearInterval(t)
  }, [])
  return <span>{time} in Westland, MI</span>
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(links.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${links.email}`
    }
  }
  return (
    <button type="button" className="email-button magnetic" data-cursor="Copy" onClick={copy}>
      <span className="email-button__text">{links.email}</span>
      <span className="email-button__state" aria-live="polite">
        {copied ? 'Copied to clipboard' : 'Click to copy'}
      </span>
    </button>
  )
}

function ProjectChapter({ project, index }: { project: Project; index: number }) {
  return (
    <section className="chapter" id={project.id} data-shape={project.shape} aria-labelledby={`${project.id}-title`}>
      <div className="chapter__intro" data-scene="object">
        <p className="chapter__count">
          <span>{String(index + 1).padStart(2, '0')}</span> of {String(projects.length).padStart(2, '0')}
        </p>
        <h3 className="chapter__name" id={`${project.id}-title`}>
          <Letters text={project.name} />
        </h3>
        <p className="chapter__kind">{project.kind}</p>
      </div>

      <div className="chapter__detail" data-scene="detail">
        <div className="chapter__copy">
          <p className="chapter__pitch">{project.pitch}</p>
          <p className="chapter__body">{project.body}</p>
          <dl className="facts">
            {project.facts.map((f) => (
              <div className="fact" key={f.label}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          <ul className="stack" aria-label="Built with">
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="chapter__links">
            {project.live && (
              <a className="pill pill--solid magnetic" href={project.live} target="_blank" rel="noreferrer">
                Open live site
              </a>
            )}
            {project.code && (
              <a className="pill magnetic" href={project.code} target="_blank" rel="noreferrer">
                Read the code
              </a>
            )}
            {project.note && <p className="chapter__note">{project.note}</p>}
          </div>
        </div>

        <div className="chapter__media">
          {project.images.length ? (
            project.images.map((img, i) => (
              <a
                key={img.src}
                className={`shot shot--${i}`}
                href={project.live}
                target="_blank"
                rel="noreferrer"
                data-cursor="Visit"
                tabIndex={i === 0 ? 0 : -1}
              >
                <img src={img.src} alt={img.alt} loading="lazy" decoding="async" width={1400} height={875} />
              </a>
            ))
          ) : (
            <div className="shot shot--alibi" aria-hidden="true">
              <div className="alibi-card alibi-card--word">
                <span>Your word</span>
                <strong>Lighthouse</strong>
              </div>
              <div className="alibi-card alibi-card--imposter">
                <span>You are the</span>
                <strong>Imposter</strong>
              </div>
              <div className="alibi-vote">
                <span>Vote</span>
                <i />
                <i />
                <i className="is-picked" />
                <i />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    return setupMotion(canvasRef.current)
  }, [])

  return (
    <>
      <div className="preloader" aria-hidden="true">
        <div className="preloader__count">
          <span className="preloader__num">0</span>
        </div>
        <div className="preloader__bar">
          <span />
        </div>
        <p className="preloader__name">Kareem Alwan</p>
      </div>

      <canvas className="field" ref={canvasRef} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="progress" aria-hidden="true">
        <span />
      </div>
      <div className="cursor" aria-hidden="true">
        <span className="cursor__dot" />
        <span className="cursor__ring">
          <span className="cursor__label" />
        </span>
      </div>

      <header className="nav">
        <a className="nav__mark magnetic" href="#top" aria-label="Kareem Alwan, back to top">
          KA
        </a>
        <nav aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="nav__time">
          <LocalTime />
        </p>
      </header>

      <main id="top">
        <section className="hero" data-scene="hero" aria-label="Introduction">
          <p className="hero__status">
            <span className="dot" /> Open to junior frontend and React Native roles
          </p>
          <h1 className="hero__name">
            <Letters text="Kareem" className="hero__line" />
            <Letters text="Alwan" className="hero__line hero__line--indent" />
          </h1>
          <div className="hero__foot">
            <p className="hero__lede">
              Frontend developer. I build interfaces in React and React Native, and I bring 3D and motion to the web
              when a page deserves it.
            </p>
            <div className="hero__actions">
              <a className="pill pill--solid magnetic" href="#work">
                See my work
              </a>
              <a className="pill magnetic" href={`mailto:${links.email}`}>
                Email me
              </a>
            </div>
          </div>
          <p className="hero__scroll" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </p>
        </section>

        <section className="statement" data-scene="statement" aria-label="About">
          <p className="statement__text">
            <Words text="I care about the part of software people actually touch. By day I ship features in a live React Native app on iOS. At night I build 3D, motion heavy projects to find out how far a browser can go. This site is one of them." />
          </p>
        </section>

        <section className="ticker" aria-label="Tools I use">
          <div className="ticker__row">
            <div className="ticker__track">
              {[...toolbox, ...toolbox].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
          <div className="ticker__row ticker__row--reverse">
            <div className="ticker__track">
              {[...toolbox.slice().reverse(), ...toolbox.slice().reverse()].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="work__head">
            <h2 id="work-title" className="section-title">
              <Words text="Selected work" />
            </h2>
            <p className="work__sub">Four projects. Each one is a different kind of hard.</p>
          </div>
          {projects.map((p, i) => (
            <ProjectChapter project={p} index={i} key={p.id} />
          ))}
        </section>

        <section className="experience" id="experience" data-scene="experience" aria-labelledby="exp-title">
          <h2 id="exp-title" className="section-title">
            <Words text="Where I've been" />
          </h2>
          <ol className="timeline">
            <span className="timeline__line" aria-hidden="true">
              <span />
            </span>
            {roles.map((r) => (
              <li className="role" key={r.org}>
                <span className="role__node" aria-hidden="true" />
                <p className="role__when">{r.when}</p>
                <h3 className="role__org">{r.org}</h3>
                <p className="role__title">{r.title}</p>
                <ul className="role__points">
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="result" data-scene="result" aria-labelledby="result-title">
          <div className="result__copy">
            <h2 id="result-title" className="section-title">
              <Words text="A slow store, made fast" />
            </h2>
            <p>
              Adonis Botanicals came to me with a slow Shopify store and broken ad tracking. I cut unused theme code,
              fixed image and font loading, and rebuilt the Pixel events. Mobile PageSpeed went from 44 to 86.
            </p>
          </div>
          <div className="gauge" role="img" aria-label="Mobile PageSpeed score improved from 44 to 86">
            <svg viewBox="0 0 220 220">
              <circle className="gauge__track" cx="110" cy="110" r="92" />
              <circle className="gauge__fill" cx="110" cy="110" r="92" pathLength="100" />
            </svg>
            <div className="gauge__value">
              <span className="gauge__num">44</span>
              <small>Mobile PageSpeed</small>
            </div>
          </div>
        </section>

        <section className="contact" id="contact" data-scene="contact" aria-labelledby="contact-title">
          <h2 id="contact-title" className="contact__title">
            <span className="contact__line">Let's build</span>
            <span className="contact__line contact__line--right">something good</span>
          </h2>
          <p className="contact__sub">
            Looking for a junior frontend or React Native role. Remote, Detroit, or happy to move to New York, San
            Francisco, Chicago or Florida.
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
            <li>
              <a className="magnetic" href={`mailto:${links.email}`}>
                Email
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Designed and built by Kareem Alwan with React, Three.js and GSAP.</p>
        <p>
          <LocalTime />
        </p>
      </footer>
    </>
  )
}
