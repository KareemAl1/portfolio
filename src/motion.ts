import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { ParticleField, type FieldState } from './scene/ParticleField'
import type { ShapeName } from './scene/shapes'

gsap.registerPlugin(ScrollTrigger)

type Placement = Pick<FieldState, 'x' | 'y' | 'scale' | 'opacity' | 'spin'>

const DESKTOP: Record<string, Placement> = {
  hero: { x: 1.8, y: -0.05, scale: 1, opacity: 1, spin: 1 },
  statement: { x: 0, y: 0, scale: 1.55, opacity: 0.22, spin: 1 },
  object: { x: 0, y: 0.38, scale: 1.05, opacity: 1, spin: 0 },
  detail: { x: -2.5, y: -0.4, scale: 0.8, opacity: 0.14, spin: 0 },
  experience: { x: 2.3, y: 0, scale: 0.85, opacity: 0.5, spin: 1 },
  result: { x: 2.05, y: 0.15, scale: 1.05, opacity: 0.4, spin: 1 },
  contact: { x: 0, y: 0.25, scale: 1.25, opacity: 0.32, spin: 1 },
}

const MOBILE: Record<string, Placement> = {
  hero: { x: 0, y: 0.5, scale: 0.58, opacity: 0.95, spin: 1 },
  statement: { x: 0, y: 0, scale: 0.85, opacity: 0.18, spin: 1 },
  object: { x: 0, y: 0.45, scale: 0.42, opacity: 1, spin: 0 },
  detail: { x: 0, y: 0, scale: 0.6, opacity: 0.07, spin: 0 },
  experience: { x: 0.6, y: 0.6, scale: 0.55, opacity: 0.3, spin: 1 },
  result: { x: 0, y: 0, scale: 0.6, opacity: 0.2, spin: 1 },
  contact: { x: 0, y: 0.6, scale: 0.6, opacity: 0.45, spin: 1 },
}

const SCENE_SHAPE: Record<string, ShapeName | undefined> = {
  hero: 'sphere',
  statement: 'sphere',
  experience: 'halo',
  result: 'halo',
  contact: 'sphere',
}

export function setupMotion(canvas: HTMLCanvasElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const isMobile = () => window.innerWidth < 760
  const root = document.documentElement
  root.classList.add('js')
  if (reduced) root.classList.add('reduced')

  let field: ParticleField | null = null
  try {
    field = new ParticleField(canvas, { count: isMobile() ? 3400 : 7000, reducedMotion: reduced })
  } catch {
    canvas.remove()
  }

  let lenis: Lenis | null = null
  const cleanups: (() => void)[] = []
  const ctx = gsap.context(() => {})

  ctx.add(() => {
    // ── Smooth scroll ───────────────────────────────────────────────
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (t: number) => lenis?.raf(t * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      cleanups.push(() => gsap.ticker.remove(raf))
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const target = document.querySelector(a.getAttribute('href') || '')
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.6 })
      else (target as HTMLElement).scrollIntoView()
    }
    document.addEventListener('click', onAnchor)
    cleanups.push(() => document.removeEventListener('click', onAnchor))

    // ── Particle field placement and morphs ─────────────────────────
    const place = (scene: string, shape?: ShapeName) => {
      if (!field) return
      const p = (isMobile() ? MOBILE : DESKTOP)[scene]
      if (p) gsap.to(field.state, { ...p, duration: reduced ? 0 : 1.5, ease: 'power3.inOut', overwrite: 'auto' })
      if (shape && field.beginMorph(shape)) {
        gsap.fromTo(
          field.state,
          { mix: 0 },
          { mix: 1, duration: reduced ? 0 : 2, ease: 'power2.inOut', overwrite: 'auto' },
        )
      }
    }

    document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
      const scene = el.dataset.scene!
      const shape = (el.closest<HTMLElement>('[data-shape]')?.dataset.shape as ShapeName | undefined) ?? SCENE_SHAPE[scene]
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => place(scene, shape),
        onEnterBack: () => place(scene, shape),
      })
    })

    if (field) {
      field.state.opacity = 0
      field.state.scale = 0.3
      Object.assign(field.state, { x: (isMobile() ? MOBILE : DESKTOP).hero.x, y: (isMobile() ? MOBILE : DESKTOP).hero.y })
      field.start()
    }

    // ── Intro: preloader into hero ──────────────────────────────────
    const heroChars = gsap.utils.toArray<HTMLElement>('.hero__name .char-inner')
    const heroRest = gsap.utils.toArray<HTMLElement>('.hero__status, .hero__lede, .hero__actions, .hero__scroll, .nav')
    const preloader = document.querySelector<HTMLElement>('.preloader')
    if (reduced) {
      preloader?.remove()
      place('hero', 'sphere')
    } else {
      gsap.set(heroChars, { yPercent: 115, rotate: 6 })
      gsap.set(heroRest, { autoAlpha: 0, y: 24 })
      lenis?.stop()
      const counter = { v: 0 }
      const num = document.querySelector('.preloader__num')
      const intro = gsap.timeline({ delay: 0.15 })
      intro
        .to(counter, {
          v: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (num) num.textContent = String(Math.round(counter.v))
          },
        })
        .to('.preloader__bar span', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
        .to('.preloader__name, .preloader__count, .preloader__bar', { autoAlpha: 0, y: -20, duration: 0.4, stagger: 0.05 })
        .to(preloader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.1')
        .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.045 }, '-=0.45')
        .add(() => place('hero', 'sphere'), '<')
        .to(heroRest, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=0.9')
        .add(() => {
          preloader?.remove()
          lenis?.start()
        })
      if (field) {
        field.beginMorph('halo')
        field.state.mix = 1
        intro.add(() => {
          if (!field) return
          field.beginMorph('sphere')
          gsap.fromTo(field.state, { mix: 0 }, { mix: 1, duration: 2.4, ease: 'power3.inOut' })
        }, 1.9)
      }
    }

    if (reduced) return

    // ── Hero scrolls away: letters drift apart ──────────────────────
    gsap.utils.toArray<HTMLElement>('.hero__line').forEach((line, li) => {
      const chars = line.querySelectorAll('.char')
      gsap.to(chars, {
        yPercent: (i) => (i % 2 ? -1 : 1) * (30 + i * 12) * (li ? 1 : -1),
        xPercent: (i) => (i - chars.length / 2) * 14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: 0.6 },
      })
    })
    gsap.to('.hero__foot, .hero__status, .hero__scroll', {
      y: -80,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '20% top', end: '70% top', scrub: true },
    })

    // ── Statement lights up word by word ────────────────────────────
    gsap.fromTo(
      '.statement .word',
      { opacity: 0.12 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top 70%', end: 'bottom 75%', scrub: true },
      },
    )

    // ── Ticker reacts to scroll velocity ────────────────────────────
    const tracks = gsap.utils.toArray<HTMLElement>('.ticker__track')
    const loops = tracks.map((t, i) =>
      gsap.fromTo(t, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: 45, ease: 'none', repeat: -1 }),
    )
    const skew = gsap.quickTo('.ticker__row', 'skewX', { duration: 0.5, ease: 'power3' })
    ScrollTrigger.create({
      trigger: '.ticker',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        const boost = 1 + Math.min(6, Math.abs(v) / 300)
        loops.forEach((l) => gsap.to(l, { timeScale: boost * (self.direction === -1 ? -1 : 1), duration: 0.3, overwrite: true }))
        skew(gsap.utils.clamp(-12, 12, v / -180))
        gsap.delayedCall(0.25, () => skew(0))
      },
    })

    // ── Section titles rise from a mask ─────────────────────────────
    gsap.utils.toArray<HTMLElement>('.section-title').forEach((title) => {
      gsap.from(title.querySelectorAll('.word'), {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: title, start: 'top 85%' },
      })
    })
    gsap.from('.work__sub', {
      opacity: 0,
      y: 20,
      duration: 0.8,
      scrollTrigger: { trigger: '.work__sub', start: 'top 88%' },
    })

    // ── Project chapters ────────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>('.chapter').forEach((chapter) => {
      const intro = chapter.querySelector<HTMLElement>('.chapter__intro')!
      const chars = intro.querySelectorAll('.char-inner')
      gsap
        .timeline({ scrollTrigger: { trigger: intro, start: 'top 75%', end: 'center center', scrub: 0.8 } })
        .fromTo(chars, { yPercent: 100, color: 'rgba(0,0,0,0)' }, { yPercent: 0, stagger: 0.05, ease: 'power2.out' })
        .to(chars, { color: 'var(--bone)', stagger: 0.05, ease: 'none' }, 0.25)
        .from(intro.querySelectorAll('.chapter__count, .chapter__kind'), { opacity: 0, y: 30, stagger: 0.1 }, 0)
      gsap.to(intro.querySelector('.chapter__name'), {
        scale: 1.25,
        opacity: 0,
        filter: 'blur(12px)',
        ease: 'none',
        scrollTrigger: { trigger: intro, start: 'bottom 85%', end: 'bottom 30%', scrub: true },
      })

      const detail = chapter.querySelector<HTMLElement>('.chapter__detail')!
      gsap.from(detail.querySelectorAll('.chapter__pitch, .chapter__body, .fact, .stack li, .chapter__links > *'), {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: { trigger: detail, start: 'top 70%' },
      })

      detail.querySelectorAll<HTMLElement>('.fact dt').forEach((dt) => {
        const m = dt.textContent?.match(/^(\d+)(%?)$/)
        if (!m) return
        const end = Number(m[1])
        const o = { v: 0 }
        gsap.to(o, {
          v: end,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: dt, start: 'top 85%' },
          onUpdate: () => (dt.textContent = `${Math.round(o.v)}${m[2]}`),
        })
      })

      detail.querySelectorAll<HTMLElement>('.shot').forEach((shot, i) => {
        gsap.fromTo(
          shot,
          { clipPath: 'inset(18% 12% 18% 12% round 28px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 18px)',
            ease: 'none',
            scrollTrigger: { trigger: shot, start: 'top 95%', end: 'top 35%', scrub: true },
          },
        )
        const img = shot.querySelector('img')
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.3, yPercent: -6 },
            {
              scale: 1,
              yPercent: 6,
              ease: 'none',
              scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
        if (i === 1) {
          gsap.fromTo(
            shot,
            { yPercent: 25 },
            {
              yPercent: -15,
              ease: 'none',
              scrollTrigger: { trigger: detail, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
      })

      const alibi = detail.querySelector('.shot--alibi')
      if (alibi) {
        gsap
          .timeline({ scrollTrigger: { trigger: alibi, start: 'top 75%', end: 'center 40%', scrub: 0.8 } })
          .from('.alibi-card--word', { rotate: -14, xPercent: -40, opacity: 0 })
          .from('.alibi-card--imposter', { rotate: 18, xPercent: 40, opacity: 0 }, 0.15)
          .from('.alibi-vote i', { scale: 0, stagger: 0.08 }, 0.4)
          .to('.alibi-vote .is-picked', { backgroundColor: 'var(--gold)', scale: 1.25 }, 0.8)
      }
    })

    // ── Timeline draws itself ───────────────────────────────────────
    gsap.fromTo(
      '.timeline__line span',
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true },
      },
    )
    gsap.utils.toArray<HTMLElement>('.role').forEach((role) => {
      gsap.from(role.querySelectorAll('.role__when, .role__org, .role__title, .role__points li'), {
        x: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: role, start: 'top 72%' },
      })
      ScrollTrigger.create({
        trigger: role,
        start: 'top 70%',
        onToggle: (self) => role.classList.toggle('is-on', self.isActive || self.progress === 1),
        end: 'bottom -9999px',
      })
    })

    // ── PageSpeed gauge ─────────────────────────────────────────────
    const gaugeNum = document.querySelector('.gauge__num')
    const score = { v: 44 }
    gsap
      .timeline({ scrollTrigger: { trigger: '.result', start: 'top 70%', end: 'center 45%', scrub: 0.6 } })
      .fromTo('.gauge__fill', { strokeDashoffset: 56 }, { strokeDashoffset: 14, ease: 'none' })
      .to(
        score,
        {
          v: 86,
          ease: 'none',
          onUpdate: () => {
            if (gaugeNum) gaugeNum.textContent = String(Math.round(score.v))
          },
        },
        0,
      )
      .fromTo('.gauge', { rotate: -40, scale: 0.85 }, { rotate: 0, scale: 1, ease: 'none' }, 0)
    gsap.from('.result__copy p', {
      opacity: 0,
      y: 30,
      duration: 0.9,
      scrollTrigger: { trigger: '.result', start: 'top 70%' },
    })

    // ── Contact headline slides in from both sides ──────────────────
    gsap.fromTo('.contact__line:first-child', { xPercent: -35 }, {
      xPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true },
    })
    gsap.fromTo('.contact__line--right', { xPercent: 35 }, {
      xPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true },
    })
    gsap.from('.contact__sub, .email-button, .contact__links li', {
      y: 40,
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact__sub', start: 'top 85%' },
    })

    // ── Chrome: progress bar, hiding nav ────────────────────────────
    gsap.to('.progress span', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    })
    const nav = document.querySelector('.nav')
    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        nav?.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 160)
        nav?.classList.toggle('is-solid', self.scroll() > 40)
      },
    })
  })

  // ── Pointer: cursor, magnetic elements, field tilt ────────────────
  const cursor = document.querySelector<HTMLElement>('.cursor')
  const label = document.querySelector<HTMLElement>('.cursor__label')
  if (finePointer && !reduced && cursor) {
    root.classList.add('has-cursor')
    const dotX = gsap.quickTo('.cursor__dot', 'x', { duration: 0.12, ease: 'power3' })
    const dotY = gsap.quickTo('.cursor__dot', 'y', { duration: 0.12, ease: 'power3' })
    const ringX = gsap.quickTo('.cursor__ring', 'x', { duration: 0.5, ease: 'power3' })
    const ringY = gsap.quickTo('.cursor__ring', 'y', { duration: 0.5, ease: 'power3' })
    const onMove = (e: PointerEvent) => {
      cursor.classList.add('is-live')
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
      const hit = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]')
      cursor.classList.toggle('is-hover', !!hit)
      const text = hit?.dataset.cursor ?? ''
      cursor.classList.toggle('has-label', !!text)
      if (label && label.textContent !== text) label.textContent = text
    }
    window.addEventListener('pointermove', onMove)
    cleanups.push(() => window.removeEventListener('pointermove', onMove))

    document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      cleanups.push(() => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      })
    })
  }

  const onFieldPointer = (e: PointerEvent) => {
    field?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onFieldPointer)
  cleanups.push(() => window.removeEventListener('pointermove', onFieldPointer))

  const onResize = () => field?.resize()
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  const onVisibility = () => (document.hidden ? field?.stop() : field?.start())
  document.addEventListener('visibilitychange', onVisibility)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))

  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  return () => {
    cleanups.forEach((c) => c())
    ctx.revert()
    ScrollTrigger.getAll().forEach((t) => t.kill())
    lenis?.destroy()
    field?.dispose()
  }
}
