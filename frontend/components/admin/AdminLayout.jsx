import React from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import AdminChrome from './AdminChrome.jsx'
import { AdminDashboardProvider, useAdminDashboard } from '../../context/AdminDashboardContext.jsx'
import { getAdminSession } from '../../src/adminSession.js'
import { SITE_DISPLAY_NAME } from '../../src/siteMeta.js'

const nav = [
  { to: '/admin/overview', label: 'Overview', end: false },
  { to: '/admin/deploy', label: 'Deploy', end: false },
  { to: '/admin/traffic', label: 'Traffic & SEO', end: false },
  { to: '/admin/content', label: 'Content', end: false },
  { to: '/admin/console', label: 'AI console', end: false }
]

function AdminLayoutInner() {
  const { adminSession, error, handleRefresh, handleSignOut } = useAdminDashboard()

  return (
    <div className="admin-app">
      <AdminChrome />
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__mark" aria-hidden="true" />
          <div>
            <span className="admin-sidebar__title">{SITE_DISPLAY_NAME}</span>
            <span className="admin-sidebar__subtitle">Operations</span>
          </div>
        </div>
        <nav className="admin-sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              end={item.end}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <NavLink className="admin-nav-link admin-nav-link--quiet" to="/">
            View site
          </NavLink>
          <NavLink className="admin-nav-link admin-nav-link--quiet" to="/admin/login">
            Switch account
          </NavLink>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__titles">
            <span className="eyebrow">Signed in</span>
            <p className="admin-topbar__email">{adminSession?.adminEmail}</p>
          </div>
          <div className="admin-topbar__actions">
            <button className="button button--primary" type="button" onClick={handleRefresh}>
              Sync data
            </button>
            <button className="button button--ghost" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        {error ? <div className="error-banner admin-error">{error}</div> : null}

        <div className="admin-outlet">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function AdminGate() {
  const session = getAdminSession()
  if (!session?.adminEmail || !session?.adminCode) {
    return <Navigate to="/admin/login" replace />
  }
  return (
    <AdminDashboardProvider>
      <AdminLayoutInner />
    </AdminDashboardProvider>
  )
}

export default function AdminLayout() {
  return <AdminGate />
}
