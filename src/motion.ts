import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Globe } from './gl/Globe'
import { Gallery } from './gl/Gallery'

gsap.registerPlugin(ScrollTrigger)

export function setupMotion(globeCanvas: HTMLCanvasElement, galleryCanvas: HTMLCanvasElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = window.matchMedia('(pointer: fine)').matches
  const mobile = () => window.innerWidth < 760
  const root = document.documentElement
  root.classList.add('js')
  if (reduced) root.classList.add('reduced')

  const cleanups: (() => void)[] = []
  const on = <K extends keyof WindowEventMap>(t: Window, type: K, fn: (e: WindowEventMap[K]) => void) => {
    t.addEventListener(type, fn as EventListener)
    cleanups.push(() => t.removeEventListener(type, fn as EventListener))
  }

  let globe: Globe | null = null
  let gallery: Gallery | null = null
  try {
    globe = new Globe(globeCanvas, reduced)
  } catch {
    globeCanvas.remove()
  }
  try {
    gallery = new Gallery(galleryCanvas)
  } catch {
    galleryCanvas.remove()
  }

  let lenis: Lenis | null = null
  const ctx = gsap.context(() => {
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.085 })
      lenis.on('scroll', (l: Lenis) => {
        ScrollTrigger.update()
        if (gallery) gallery.velocity = l.velocity
      })
      const raf = (t: number) => lenis?.raf(t * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      cleanups.push(() => gsap.ticker.remove(raf))
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const target = document.querySelector<HTMLElement>(a.getAttribute('href') || '')
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { duration: 1.8 })
      else target.scrollIntoView()
    }
    document.addEventListener('click', onAnchor)
    cleanups.push(() => document.removeEventListener('click', onAnchor))

    // ── Globe placement ─────────────────────────────────────────────
    const placeGlobe = () => {
      if (!globe) return
      Object.assign(globe.state, mobile() ? { x: 0, y: 0.55, scale: 0.62 } : { x: 0.95, y: 0.05, scale: 1 })
    }
    placeGlobe()
    globe?.start()

    // ── Gallery planes ──────────────────────────────────────────────
    if (gallery) {
      document.querySelectorAll<HTMLElement>('.card__media').forEach((el) => gallery!.add(el))
    }

    // ── Intro ───────────────────────────────────────────────────────
    const heroChars = gsap.utils.toArray<HTMLElement>('.hero__title .ch > span')
    const heroBits = gsap.utils.toArray<HTMLElement>('.hero__meta > *, .hero__foot > *, .nav > *')
    const loader = document.querySelector<HTMLElement>('.loader')
    if (reduced) {
      loader?.remove()
    } else {
      gsap.set(heroChars, { yPercent: 105 })
      gsap.set(heroBits, { opacity: 0, y: 14 })
      if (globe) Object.assign(globe.state, { opacity: 0, scatter: 3 })
      lenis?.stop()
      const count = { v: 0 }
      const num = document.querySelector('.loader__count')
      gsap
        .timeline({ delay: 0.2 })
        .to(count, {
          v: 100,
          duration: 1.6,
          ease: 'power3.inOut',
          onUpdate: () => {
            if (num) num.textContent = String(Math.round(count.v)).padStart(3, '0')
          },
        })
        .to('.loader__track span', { scaleX: 1, duration: 1.6, ease: 'power3.inOut' }, 0)
        .to('.loader__num, .loader__row, .loader__track', { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.15')
        .to(heroChars, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.05 }, '-=0.55')
        .to(globe ? globe.state : {}, { opacity: 1, scatter: 0, duration: 2.4, ease: 'expo.out' }, '<')
        .to(heroBits, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.04 }, '-=1.6')
        .add(() => {
          loader?.remove()
          lenis?.start()
        })
    }

    if (reduced) return

    // ── Hero exit: the two lines part, the globe scatters ───────────
    gsap
      .timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
      .to('.hero__line--a', { xPercent: -18, ease: 'none' }, 0)
      .to('.hero__line--b', { xPercent: 18, ease: 'none' }, 0)
      .to('.hero__meta, .hero__foot', { opacity: 0, y: -40, ease: 'none' }, 0)
      .to(globe ? globe.state : {}, { scatter: 2.2, opacity: 0, scale: mobile() ? 0.9 : 1.35, spin: 1.2, ease: 'none' }, 0)
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? globe?.start() : globe?.stop()),
    })

    // ── About: words come into focus ────────────────────────────────
    gsap.fromTo(
      '.about .w',
      { opacity: 0.1, filter: 'blur(6px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        stagger: 0.12,
        ease: 'none',
        scrollTrigger: { trigger: '.about', start: 'top 72%', end: 'bottom 70%', scrub: true },
      },
    )

    // ── Section titles rise char by char ────────────────────────────
    gsap.utils.toArray<HTMLElement>('.h2, .contact__title').forEach((h) => {
      gsap.from(h.querySelectorAll('.ch > span'), {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.03,
        scrollTrigger: { trigger: h, start: 'top 85%' },
      })
    })
    gsap.utils.toArray<HTMLElement>('.label, .work__count, .notes__head .mono').forEach((el) => {
      gsap.from(el, { opacity: 0, x: -16, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 90%' } })
    })

    // ── Work: horizontal pinned track (desktop) ─────────────────────
    const mm = gsap.matchMedia()
    mm.add('(min-width: 760px)', () => {
      const track = document.querySelector<HTMLElement>('.work__track')!
      const distance = () => track.scrollWidth - window.innerWidth
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.work__pin',
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      gsap.utils.toArray<HTMLElement>('.card:not(.card--0)').forEach((card) => {
        const cap = card.querySelector('.card__cap')
        if (!cap) return
        gsap.from(cap.children, {
          y: 30,
          opacity: 0,
          stagger: 0.06,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 96%' },
        })
        const media = card.querySelector<HTMLElement>('.card__media')
        if (media) {
          gsap.fromTo(
            media,
            { clipPath: 'inset(12% 10% 12% 10%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'left 35%', scrub: true },
            },
          )
        }
      })
    })
    mm.add('(max-width: 759px)', () => {
      gsap.utils.toArray<HTMLElement>('.card__media').forEach((media) => {
        gsap.fromTo(
          media,
          { clipPath: 'inset(10% 8% 10% 8%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 45%', scrub: true } },
        )
      })
    })
    cleanups.push(() => mm.revert())
    // Created after the pin so its end accounts for the pinned distance.
    ScrollTrigger.create({
      trigger: '.work',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? gallery?.start() : gallery?.stop()),
    })

    // ── Hairlines draw themselves ───────────────────────────────────
    gsap.utils.toArray<HTMLElement>('.row__line, .job__line').forEach((line) => {
      gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: line, start: 'top 92%' } })
    })
    gsap.utils.toArray<HTMLElement>('.row__head > *').forEach((el, i) => {
      gsap.from(el, { yPercent: 60, opacity: 0, duration: 0.9, delay: (i % 5) * 0.04, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%' } })
    })

    // ── Stats count on scroll ───────────────────────────────────────
    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const o = { v: Number(el.dataset.count) }
      gsap.to(o, {
        v: Number(el.dataset.to),
        duration: 2,
        ease: 'expo.out',
        onUpdate: () => (el.textContent = String(Math.round(o.v))),
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
    gsap.from('.stat', { y: 60, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 80%' } })

    // ── Experience ──────────────────────────────────────────────────
    gsap.utils.toArray<HTMLElement>('.job').forEach((job) => {
      gsap.from(job.querySelectorAll('.job__when, .job__org, .job__title, .job__points li'), {
        y: 24,
        opacity: 0,
        stagger: 0.05,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: job, start: 'top 82%' },
      })
    })

    // ── Tools strip runs faster with scroll speed ───────────────────
    const loop = gsap.to('.tools__track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 })
    ScrollTrigger.create({
      trigger: '.tools',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        gsap.to(loop, { timeScale: (1 + Math.min(8, Math.abs(v) / 250)) * self.direction, duration: 0.25, overwrite: true })
      },
    })

    // ── The page turns navy for the ending ──────────────────────────
    ScrollTrigger.create({
      trigger: '.contact',
      start: 'top 55%',
      onToggle: (self) => root.classList.toggle('is-night', self.isActive),
      end: 'bottom top',
    })
    gsap.from('.contact__sub, .mail, .contact__links li', {
      y: 40,
      opacity: 0,
      stagger: 0.08,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact__sub', start: 'top 88%' },
    })

    // ── Nav hides on the way down ───────────────────────────────────
    const nav = document.querySelector('.nav')
    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => nav?.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 200),
    })
  })

  // ── Pointer: cursor, magnetic, row previews, globe tilt ───────────
  if (fine && !reduced) {
    root.classList.add('has-cursor')
    const cursor = document.querySelector<HTMLElement>('.cursor')!
    const label = cursor.querySelector<HTMLElement>('.cursor__label')!
    const preview = document.querySelector<HTMLElement>('.preview')!
    const previewImg = preview.querySelector('img')!
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' })
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' })
    const px = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' })
    const py = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' })
    const pr = gsap.quickTo(preview, 'rotate', { duration: 0.7, ease: 'power3' })
    let lastX = 0
    on(window, 'pointermove', (e) => {
      cursor.classList.add('is-live')
      cx(e.clientX)
      cy(e.clientY)
      px(e.clientX)
      py(e.clientY)
      pr(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6))
      lastX = e.clientX
      const t = e.target as HTMLElement
      const hit = t.closest<HTMLElement>('a, button, [data-cursor]')
      cursor.classList.toggle('is-hover', !!hit)
      const text = hit?.dataset.cursor ?? ''
      cursor.classList.toggle('has-label', !!text)
      if (label.textContent !== text) label.textContent = text
      const row = t.closest<HTMLElement>('.row:not(.is-open)')
      const src = row?.dataset.preview
      preview.classList.toggle('is-on', !!src)
      if (src && !previewImg.src.endsWith(src)) previewImg.src = src
    })
    document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' })
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - r.left - r.width / 2) * 0.25)
        yTo((e.clientY - r.top - r.height / 2) * 0.35)
      })
      el.addEventListener('pointerleave', () => {
        xTo(0)
        yTo(0)
      })
    })
  }
  on(window, 'pointermove', (e) => globe?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1))
  on(window, 'resize', () => {
    globe?.resize()
    gallery?.resize()
  })
  const onVis = () => {
    if (document.hidden) {
      globe?.stop()
      gallery?.stop()
    } else if (window.scrollY < window.innerHeight) {
      globe?.start()
    }
  }
  document.addEventListener('visibilitychange', onVis)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVis))
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  return () => {
    cleanups.forEach((c) => c())
    ctx.revert()
    lenis?.destroy()
    globe?.dispose()
    gallery?.dispose()
  }
}
