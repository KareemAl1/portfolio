import { createRoot } from 'react-dom/client'
import '@fontsource-variable/funnel-display'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'
import App from './App.tsx'

// No StrictMode: the scroll scene owns one WebGL context and one Lenis instance for the page's lifetime.
createRoot(document.getElementById('root')!).render(<App />)
