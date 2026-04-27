import React, { useEffect, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteRuntimeProvider } from './SiteRuntimeContext.jsx'
import { theme } from './siteData.js'
import '../styles/app.css'

// Lazy components
const SiteFrame = lazy(() => import('../components/SiteFrame.jsx'))
const HomePage = lazy(() => import('../pages/HomePage.jsx'))
const BlogPage = lazy(() => import('../pages/BlogPage.jsx'))
const BlogPostPage = lazy(() => import('../pages/BlogPostPage.jsx'))
const ProductsPage = lazy(() => import('../pages/ProductsPage.jsx'))
const ProductPage = lazy(() => import('../pages/ProductPage.jsx'))
const ContactPage = lazy(() => import('../pages/ContactPage.jsx'))
const CheckoutSuccessPage = lazy(() => import('../pages/CheckoutSuccessPage.jsx'))
const CheckoutCancelPage = lazy(() => import('../pages/CheckoutCancelPage.jsx'))
const CustomerDashboardPage = lazy(() => import('../pages/CustomerDashboardPage.jsx'))
const GenericPage = lazy(() => import('../pages/GenericPage.jsx'))
const AdminLayout = lazy(() => import('../components/admin/AdminLayout.jsx'))
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage.jsx'))
const AdminOverviewPage = lazy(() => import('../pages/admin/AdminOverviewPage.jsx'))
const AdminDeployPage = lazy(() => import('../pages/admin/AdminDeployPage.jsx'))
const AdminTrafficPage = lazy(() => import('../pages/admin/AdminTrafficPage.jsx'))
const AdminContentPage = lazy(() => import('../pages/admin/AdminContentPage.jsx'))
const AdminConsolePage = lazy(() => import('../pages/admin/AdminConsolePage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="spinner"></div>
  </div>
)

function applyTheme(themeConfig) {
  const palette = themeConfig.palette ?? {}
  for (const [key, value] of Object.entries(palette)) {
    document.documentElement.style.setProperty(`--${key}`, value)
  }
}

export default function App() {
  useEffect(() => {
    applyTheme(theme)
  }, [])

  return (
    <SiteRuntimeProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<SiteFrame />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/:slug" element={<GenericPage />} />
            <Route path="*" element={<NotFoundPage />} />
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
        </Routes>
      </Suspense>
    </SiteRuntimeProvider>
  )
}
