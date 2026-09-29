import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/geist'
import './index.css'
import App from './App'
import { FavoritesProvider } from './lib/favorites'
import { CatalogProvider } from './lib/catalog'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </CatalogProvider>
    </BrowserRouter>
  </StrictMode>,
)
