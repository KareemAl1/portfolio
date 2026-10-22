# Kareem Alwan, portfolio

My personal site: a scroll story where one field of 7,000 gold particles becomes each project I've built.

- **Live:** coming soon at kareemalwan.com
- **Stack:** React 19, TypeScript, Vite, Three.js (custom GLSL shader), GSAP ScrollTrigger, Lenis

## The 30-second version

- The particle field is a single `THREE.Points` draw call. Every shape (sphere, handheld, headphones, shoe, speech bubbles, halo) is generated procedurally in [`src/scene/shapes.ts`](src/scene/shapes.ts) with the same point count, so the vertex shader can morph between any two of them. Each particle leaves at a slightly different moment, which makes shapes dissolve instead of slide.
- Scroll drives everything: hero letters drift apart, the statement lights up word by word, project names fill in as you reach them, screenshots unmask with clip-path, the timeline draws itself and the PageSpeed gauge counts from 44 to 86.
- Reduced motion is respected: no smooth scroll, no preloader, every element in its final state, shapes swap instantly.
- The ticker reacts to scroll velocity, buttons are magnetic, and a custom cursor labels what a click will do. Touch devices keep native behavior.

## Run locally

```sh
npm ci
npm run dev
```

`npm run build` typechecks and outputs a static site to `dist/`.

## Projects featured

- [Handheld Studio](https://github.com/KareemAl1/handheld-studio): 3D console configurator with a playable game
- [Sona](https://github.com/KareemAl1/sona-store): storefront with hand-written Web Animations
- [PACE](https://github.com/KareemAl1/pace-studio): scroll-driven 3D shoe campaign
- Alibi: multiplayer party game (private repo)

All code, shapes and copy are original. Fonts: Bricolage Grotesque and Geist, both under the SIL Open Font License.
