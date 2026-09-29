import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Listing from './pages/Listing'
import Saved from './pages/Saved'
import Agents from './pages/Agents'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import { lazy, Suspense } from 'react'

const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="listing/:slug" element={<Listing />} />
        <Route path="saved" element={<Saved />} />
        <Route path="agents" element={<Agents />} />
        <Route path="contact" element={<Contact />} />
        <Route path="admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
