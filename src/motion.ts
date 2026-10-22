import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// Every animation here moves only transform and opacity, so the browser can
// keep it on the compositor while scrolling.
export function setupMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = document.documentElement
  root.classList.add('js')
  const cleanups: (() => void)[] = []
  let lenis: Lenis | null = null

  const ctx = gsap.context(() => {
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (t: number) => lenis?.raf(t * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      cleanups.push(() => gsap.ticker.remove(raf))
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      const target = a && document.querySelector<HTMLElement>(a.getAttribute('href') || '')
      if (!a || !target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { duration: 1.4 })
      else target.scrollIntoView()
    }
    document.addEventListener('click', onAnchor)
    cleanups.push(() => document.removeEventListener('click', onAnchor))

    const nav = document.querySelector('.nav')
    ScrollTrigger.create({
      start: 'top -10',
      end: 'max',
      onUpdate: (self) => nav?.classList.toggle('is-scrolled', self.scroll() > 10),
    })

    if (reduced) return

    // ── Load: the wheel fans out, the name rises ───────────────────
    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .from('.wheel__card', { '--fan': 0, yPercent: 30, opacity: 0, duration: 1.6, stagger: 0.06 }, 0.1)
      .from('.hero__name-inner', { yPercent: 105, duration: 1.4 }, 0.25)
      .from('.hero__top > *', { y: 16, opacity: 0, duration: 1, stagger: 0.08 }, 0.5)

    // ── Hero: the wheel turns as you leave ─────────────────────────
    gsap.to('.wheel', {
      '--spin': -14,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to('.hero__name', {
      yPercent: -30,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
    })

    // ── Statement: words light up in reading order ─────────────────
    gsap.fromTo(
      '.statement .sw',
      { opacity: 0.18 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: '.statement__text', start: 'top 80%', end: 'bottom 55%', scrub: true },
      },
    )

    // ── Section headings ───────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>('.section-head').forEach((h) => {
      gsap.from(h.children, {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: h, start: 'top 85%' },
      })
    })

    // ── Projects: the frame grows to fill the screen ───────────────
    gsap.utils.toArray<HTMLElement>('.proj').forEach((proj) => {
      const stage = proj.querySelector('.proj__stage')!
      const frame = proj.querySelector<HTMLElement>('.proj__frame')!
      const img = frame.querySelector('img')!
      const title = frame.querySelector('.proj__title')!
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
      tl.fromTo(frame, { scale: 0.58 }, { scale: 1, duration: 1 })
        .fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
        .fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35 }, 0.75)

      const body = proj.querySelector('.proj__body')!
      gsap.from(body.querySelectorAll('.proj__copy > *, .proj__facts > div, .proj__second'), {
        y: 50,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: body, start: 'top 80%' },
      })
    })

    // ── Experience rows ────────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>('.job').forEach((job) => {
      gsap.from(job, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: job, start: 'top 88%' },
      })
    })

    // ── Contact ────────────────────────────────────────────────────
    gsap.from('.contact__title', {
      yPercent: 30,
      opacity: 0,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 70%' },
    })
    gsap.from('.contact__sub, .contact__actions > *', {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.contact', start: 'top 60%' },
    })
  })

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })

  return () => {
    cleanups.forEach((c) => c())
    ctx.revert()
    lenis?.destroy()
  }
}
