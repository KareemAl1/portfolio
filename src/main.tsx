import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter-tight'
import './index.css'
import App from './App.tsx'

// No StrictMode: the page owns one Lenis instance and one set of scroll triggers for its lifetime.
createRoot(document.getElementById('root')!).render(<App />)
