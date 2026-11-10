import { createRoot } from 'react-dom/client'
import '@fontsource-variable/anybody/wdth.css'
import '@fontsource-variable/instrument-sans'
import './index.css'
import App from './App.tsx'

// No StrictMode: the page owns one Lenis instance and one scroll loop for its lifetime.
createRoot(document.getElementById('root')!).render(<App />)
