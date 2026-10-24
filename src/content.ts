export const links = {
  email: 'kareemalwan47@gmail.com',
  github: 'https://github.com/KareemAl1',
  linkedin: 'https://www.linkedin.com/in/kareemalwan',
}

export type Project = {
  id: string
  name: string
  year: string
  kind: string
  pitch: string
  body: string
  facts: { value: string; label: string }[]
  stack: string[]
  live?: string
  code?: string
  note?: string
  images: { src: string; alt: string }[]
}

export const projects: Project[] = [
  {
    id: 'handheld',
    name: 'Handheld Studio',
    year: '2026',
    kind: '3D product configurator',
    pitch: 'A game console you can customize, take apart and actually play.',
    body:
      'An original handheld I modeled in Blender and brought to the browser with React Three Fiber. Pick shell and button colors, switch to translucent plastic, explode it into five layers, then play Signal Run, a small game I wrote that renders onto the console screen itself.',
    facts: [
      { value: '92 → 26', label: 'draw calls after batching' },
      { value: '18', label: 'color and material builds' },
      { value: '182', label: 'unit tests passing' },
    ],
    stack: ['React 19', 'TypeScript', 'React Three Fiber', 'Blender', 'Vitest', 'Playwright'],
    live: 'https://handheld-studio.vercel.app',
    code: 'https://github.com/KareemAl1/handheld-studio',
    images: [
      { src: 'work/handheld.webp', alt: 'Handheld Studio configurator with the chalk HS-01 on a cobalt stage' },
      { src: 'work/handheld-exploded.webp', alt: 'The HS-01 exploded into five layers' },
    ],
  },
  {
    id: 'sona',
    name: 'Sona',
    year: '2026',
    kind: 'Ecommerce storefront',
    pitch: 'A listening room for three audio products that only exist here.',
    body:
      'A storefront for headphones, earbuds and a speaker, rendered from my own Three.js models. Finishes, comparisons and the bag all live in the URL, so reload, Back and Forward always land where you expect. Every animation is hand-written with CSS and the Web Animations API.',
    facts: [
      { value: '0', label: 'animation libraries' },
      { value: '3 × 3', label: 'products and finishes' },
      { value: 'URL', label: 'holds the whole bag state' },
    ],
    stack: ['React 19', 'React Router 7', 'TypeScript', 'Web Animations API', 'Vitest', 'axe'],
    live: 'https://sona-store.vercel.app',
    code: 'https://github.com/KareemAl1/sona-store',
    images: [
      { src: 'work/sona.webp', alt: 'Sona homepage with Arc headphones on a plum field' },
      { src: 'work/sona-bag.webp', alt: 'Sona bag with Arc, Dot and Room in Fig' },
    ],
  },
  {
    id: 'pace',
    name: 'PACE',
    year: '2026',
    kind: 'Scroll campaign in 3D',
    pitch: 'A running shoe launch told one scroll at a time.',
    body:
      'One original 3D shoe travels through form, knit, heel and sole as you scroll, then hands you the controls in Explore mode. Volt, Ice and Infrared swap materials and lighting live, and the whole story still works as images when WebGL is off.',
    facts: [
      { value: '4', label: 'scroll chapters' },
      { value: '3', label: 'live finishes' },
      { value: '100%', label: 'story kept without WebGL' },
    ],
    stack: ['TypeScript', 'Three.js', 'Vite', 'GLSL materials'],
    live: 'https://pace-studio-zeta.vercel.app',
    code: 'https://github.com/KareemAl1/pace-studio',
    images: [
      { src: 'work/pace.webp', alt: 'PACE After Hours hero with the Volt shoe' },
      { src: 'work/pace-knit.webp', alt: 'PACE knit chapter close up' },
    ],
  },
  {
    id: 'alibi',
    name: 'Alibi',
    year: '2026',
    kind: 'Multiplayer party game',
    pitch: 'One of you is lying. The site knows who.',
    body:
      'A browser party game for friends. Everyone joins with a link and a nickname, the site deals secret words, picks the imposter, runs turns and voting, then stages the reveal. I am building it to feel smooth enough for the App Store.',
    facts: [
      { value: '4–10', label: 'players per private room' },
      { value: '46', label: 'engine and socket tests' },
      { value: '0', label: 'early peeks at the secret word' },
    ],
    stack: ['Node.js', 'Express', 'Socket.IO', 'GSAP', 'Web Audio', 'Playwright'],
    note: 'Code available on request.',
    images: [
      { src: 'work/alibi.webp', alt: 'Alibi home screen with the interrogation table illustration' },
      { src: 'work/alibi-round.webp', alt: 'An Alibi round with a revealed secret word card' },
    ],
  },
]

export type Role = {
  org: string
  title: string
  when: string
  points: string[]
}

export const roles: Role[] = [
  {
    org: 'CalorAI',
    title: 'Frontend developer, React Native (contract)',
    when: 'Apr 2026 to now',
    points: [
      'Ship features in a live React Native and Expo calorie tracking app on iOS.',
      'Built a native iOS share extension that imports recipes from Instagram and TikTok reels, with a Swift app-group module.',
      'Shipped Dynamic Island Live Activities for meal logging, streaks and reminders.',
      'Made Reduce Motion apply instantly across the app instead of after a restart.',
      'Found a false send-failure bug in the AI chat with Sentry session replay and shipped the fix.',
    ],
  },
  {
    org: 'Adonis Botanicals',
    title: 'Frontend developer, Shopify (contract)',
    when: 'Mar 2026 to now',
    points: [
      'Took mobile PageSpeed from 44 to 86 by fixing lazy loading, fonts and 2.58 MB of unused theme code.',
      'Restored broken Meta Pixel events so ad spend could be measured again.',
    ],
  },
  {
    org: 'FES Institute',
    title: 'Frontend engineering program',
    when: 'Oct 2025 to now',
    points: ['React, TypeScript, Next.js and Firebase, built through shipped projects with code review.'],
  },
]

export const toolbox = [
  'React',
  'React Native',
  'Expo',
  'TypeScript',
  'Next.js',
  'Three.js',
  'React Three Fiber',
  'GSAP',
  'Web Animations API',
  'Swift',
  'HealthKit',
  'Node',
  'Supabase',
  'Firebase',
  'Shopify Liquid',
  'Vitest',
  'Playwright',
  'Figma',
  'Blender',
  'Vercel',
]
