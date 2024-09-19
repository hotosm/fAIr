import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/hot-sl.css'
import './styles/index.css'
import { App } from './app'
// @ts-ignore
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.16.0/cdn/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
