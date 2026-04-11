import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteFrame from '../components/SiteFrame.jsx'
import HomePage from '../pages/HomePage.jsx'
import BlogPage from '../pages/BlogPage.jsx'
import BlogPostPage from '../pages/BlogPostPage.jsx'
import ProductsPage from '../pages/ProductsPage.jsx'
import ProductPage from '../pages/ProductPage.jsx'
import ContactPage from '../pages/ContactPage.jsx'
import CheckoutSuccessPage from '../pages/CheckoutSuccessPage.jsx'
import GenericPage from '../pages/GenericPage.jsx'
import AdminLoginPage from '../pages/AdminLoginPage.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import PrismCursor from '../components/PrismCursor.jsx'
import { SiteRuntimeProvider } from './SiteRuntimeContext.jsx'
import { theme } from './siteData.js'
import '../styles/app.css'
import '../styles/admin.css'

const ADMIN_SESSION_KEY = 'vtw_admin_authed'

function applyTheme(themeConfig) {
const palette = themeConfig.palette ?? {}
for (const [key, value] of Object.entries(palette)) {
  document.documentElement.style.setProperty(`--${key}`, value)
}
}

function AdminAwareCursor() {
const { pathname } = useLocation()
if (pathname.startsWith('/admin')) return null
return <PrismCursor />
}

function AdminGate() {
const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')

function handleLogin() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
  setAuthed(true)
}

function handleLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
  setAuthed(false)
}

if (!authed) return <AdminLoginPage onLogin={handleLogin} />
return <AdminDashboardPage onLogout={handleLogout} />
}

export default function App() {
useEffect(() => {
  applyTheme(theme)
}, [])

return (
  <SiteRuntimeProvider>
    <AdminAwareCursor />
    <Routes>
      <Route element={<SiteFrame />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<NotFoundPage />} />
        <Route path="/:slug" element={<GenericPage />} />
      </Route>
      <Route path="/admin" element={<AdminGate />} />
      <Route path="/admin/*" element={<AdminGate />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </SiteRuntimeProvider>
)
}