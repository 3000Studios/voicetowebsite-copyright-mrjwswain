import React, { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteFrame from '../components/SiteFrame.jsx'
import HomePage from '../pages/HomePage.jsx'
import BlogPage from '../pages/BlogPage.jsx'
import BlogPostPage from '../pages/BlogPostPage.jsx'
import ProductsPage from '../pages/ProductsPage.jsx'
import ProductPage from '../pages/ProductPage.jsx'
import CheckoutSuccessPage from '../pages/CheckoutSuccessPage.jsx'
import GenericPage from '../pages/GenericPage.jsx'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import AdminLoginPage from '../pages/AdminLoginPage.jsx'
import AdminOverviewPage from '../pages/admin/AdminOverviewPage.jsx'
import AdminDeployPage from '../pages/admin/AdminDeployPage.jsx'
import AdminTrafficPage from '../pages/admin/AdminTrafficPage.jsx'
import AdminContentPage from '../pages/admin/AdminContentPage.jsx'
import AdminConsolePage from '../pages/admin/AdminConsolePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import PrismCursor from '../components/PrismCursor.jsx'
import { SiteRuntimeProvider } from './SiteRuntimeContext.jsx'
import { theme } from './siteData.js'
import '../styles/app.css'

function applyTheme(themeConfig) {
  const palette = themeConfig.palette ?? {}

  for (const [key, value] of Object.entries(palette)) {
    document.documentElement.style.setProperty(`--${key}`, value)
  }
}

function AdminAwareCursor() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) {
    return null
  }
  return <PrismCursor />
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
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<NotFoundPage />} />
          <Route path="/:slug" element={<GenericPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage />} />
          <Route path="deploy" element={<AdminDeployPage />} />
          <Route path="traffic" element={<AdminTrafficPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="console" element={<AdminConsolePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteRuntimeProvider>
  )
}
