# kareemalwan.vercel.app

My portfolio. Dark, quiet and built around the work.

**[Live site](https://kareemalwan.vercel.app)**

## How it works

- **Hero wheel.** Project screenshots sit on one shared pivot far below the screen. A single CSS variable turns them along an arc as you scroll away.
- **Projects grow to fill the screen.** Each project pins while its screenshot scales up from a card to full screen, then the details scroll in underneath.
- **Text reads itself.** The intro brightens word by word in reading order.
- **Smooth on purpose.** Every animation moves only `transform` and `opacity`, so the browser keeps it on the compositor. In a 60 fps test the scroll held 16.7 ms frames with no long tasks. Lenis smooths the wheel, and GSAP ScrollTrigger ties motion to scroll position.
- **Reduced motion respected.** With Reduce Motion on there's no smooth scrolling or pinning, and every section shows in its final state.

Built with React 19, TypeScript, Vite, GSAP and Lenis. The font is Inter Tight.

## Run it

```sh
npm ci
npm run dev
npm run build
```

## Featured projects

- [Handheld Studio](https://github.com/KareemAl1/handheld-studio): 3D console configurator with a playable game
- [Alibi](https://github.com/KareemAl1/alibi): real-time party game for friends on a voice call
- [Sona](https://github.com/KareemAl1/sona-store): storefront with hand-written Web Animations
- [PACE](https://github.com/KareemAl1/pace-studio): scroll-driven 3D shoe campaign
