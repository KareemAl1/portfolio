# Kareem Alwan, portfolio

My personal site. White paper, navy ink, and motion that answers the scroll.

- **Live:** kareemalwan.com (coming soon)
- **Stack:** React 19, TypeScript, Vite, Three.js with custom GLSL, GSAP ScrollTrigger, Lenis

## The 30-second version

- **Point globe:** the hero globe is ~4,000 navy points drawn with a custom shader so it reads on a white page. A satellite rides a tilted orbit, the globe follows the cursor, and on scroll the points scatter as the two halves of my name slide apart.
- **Bending gallery:** project screenshots are mirrored into WebGL planes (one world unit equals one CSS pixel). While you scroll, each plane bends with your scroll speed and splits its color channels, then settles flat when you stop. The section pins and scrolls sideways on desktop.
- **Scroll choreography:** the about text comes into focus word by word, headings rise character by character, hairlines draw themselves, numbers count up, and the whole page turns navy for the contact section.
- **Details:** an expanding project index with a cursor-following preview, magnetic buttons, a cursor that labels what a click will do, and a tools strip that speeds up with scroll velocity.
- **Accessible by default:** with Reduce Motion on there is no smooth scrolling, no loader and no scroll animation, and every section is readable. If WebGL is unavailable the regular images show instead.

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
- Alibi: real-time multiplayer party game (private repo)

All code and copy are original. Fonts: Funnel Display, Geist and Geist Mono, all under the SIL Open Font License. The earlier black and gold version lives on the `gold-version` branch.
