import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/geist'
import './index.css'
import App from './App.tsx'

// No StrictMode: the scroll scene owns one WebGL context and one Lenis instance for the page's lifetime.
createRoot(document.getElementById('root')!).render(<App />)
