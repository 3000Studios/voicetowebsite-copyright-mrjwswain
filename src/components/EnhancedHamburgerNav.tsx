import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  Lock,
  Menu,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SHARED_NAV_ITEMS } from "../constants/navigation";

const ADMIN_CODES = new Set(["ADMIN_ACCESS_2024", "UNLOCK_ADMIN_123"]);
const PRIMARY_LABELS = new Set([
  "Home",
  "Features",
  "Demo",
  "Pricing",
  "Store",
  "App Store",
  "Blog",
  "Support",
]);

const isAdminOrStatic = (href: string) =>
  href.startsWith("/admin") || href.includes(".html");

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

interface EnhancedHamburgerNavProps {
  isAdminAuthenticated?: boolean;
  onAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

const EnhancedHamburgerNav: React.FC<EnhancedHamburgerNavProps> = ({
  isAdminAuthenticated = false,
  onAdminLogin,
  onAdminLogout,
}) => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem("VTW_ADMIN_UNLOCKED");
    setIsAdminUnlocked(storedValue === "true");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        setIsAdminModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isAdminEnabled = isAdminAuthenticated || isAdminUnlocked;
  const primaryLinks = useMemo(
    () =>
      SHARED_NAV_ITEMS.filter(
        (item) => !item.requiresAuth && PRIMARY_LABELS.has(item.label)
      ),
    []
  );
  const secondaryLinks = useMemo(
    () =>
      SHARED_NAV_ITEMS.filter(
        (item) => !item.requiresAuth && !PRIMARY_LABELS.has(item.label)
      ),
    []
  );
  const adminLinks = useMemo(
    () => SHARED_NAV_ITEMS.filter((item) => item.requiresAuth),
    []
  );

  const handleRevealEverything = () => {
    document
      .querySelectorAll(".hidden-content, .admin-only, .developer-only")
      .forEach((node) => {
        const element = node as HTMLElement;
        element.classList.remove(
          "hidden-content",
          "admin-only",
          "developer-only"
        );
        element.style.display = "block";
        element.style.visibility = "visible";
      });

    window.localStorage.setItem("VTW_UNLOCKED", "true");
    window.localStorage.setItem("VTW_UNLOCK_TIME", Date.now().toString());
    setIsDrawerOpen(false);
    window.alert("All hidden utility surfaces were revealed.");
  };

  const handleAdminSubmit = () => {
    const normalized = adminCode.trim();
    if (!ADMIN_CODES.has(normalized)) {
      setAdminError("Access code was not recognized.");
      return;
    }

    window.localStorage.setItem("VTW_ADMIN_UNLOCKED", "true");
    setIsAdminUnlocked(true);
    setAdminCode("");
    setAdminError("");
    setIsAdminModalOpen(false);
    onAdminLogin?.();
  };

  const handleAdminLogout = () => {
    window.localStorage.removeItem("VTW_ADMIN_UNLOCKED");
    setIsAdminUnlocked(false);
    setIsDrawerOpen(false);
    onAdminLogout?.();
  };

  const renderLink = (
    key: string,
    href: string,
    label: string,
    className: string,
    onClick?: () => void
  ) => {
    if (isAdminOrStatic(href)) {
      return (
        <a key={key} href={href} className={className} onClick={onClick}>
          <span>{label}</span>
          <ArrowRight size={16} />
        </a>
      );
    }

    return (
      <Link key={key} to={href} className={className} onClick={onClick}>
        <span>{label}</span>
        <ArrowRight size={16} />
      </Link>
    );
  };

  return (
    <>
      <header className="vtw-floating-nav" aria-label="Main navigation">
        <Link className="vtw-floating-nav__brand" to="/">
          <span className="vtw-logo-mark">VTW</span>
          <span>
            <span className="vtw-floating-nav__title">VoiceToWebsite</span>
            <span className="vtw-floating-nav__meta">
              Premium launch system
            </span>
          </span>
        </Link>

        <nav className="vtw-floating-nav__links">
          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              className={`vtw-floating-nav__link ${
                isActiveRoute(location.pathname, item.href) ? "is-active" : ""
              }`}
              to={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="vtw-floating-nav__actions">
          <Link className="vtw-button vtw-button-secondary" to="/pricing">
            Plans
          </Link>
          <button
            type="button"
            className="vtw-nav-toggle"
            aria-expanded={isDrawerOpen}
            aria-label={isDrawerOpen ? "Close site menu" : "Open site menu"}
            onClick={() => setIsDrawerOpen((current) => !current)}
          >
            {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation drawer"
              className="vtw-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.aside
              className="vtw-mobile-drawer"
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="vtw-mobile-drawer__header">
                <div>
                  <div className="vtw-mobile-drawer__title">
                    Explore the site
                  </div>
                  <div
                    style={{
                      marginTop: "0.35rem",
                      color: "rgba(245,243,238,0.78)",
                      fontWeight: 600,
                    }}
                  >
                    Every public route in one place.
                  </div>
                </div>
                <button
                  type="button"
                  className="vtw-icon-button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close site menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="vtw-mobile-drawer__section">
                <div className="vtw-mobile-drawer__title">Primary</div>
                {primaryLinks.map((item) =>
                  renderLink(
                    item.href,
                    item.href,
                    item.label,
                    "vtw-mobile-drawer__link",
                    () => setIsDrawerOpen(false)
                  )
                )}
              </div>

              <div className="vtw-mobile-drawer__section">
                <div className="vtw-mobile-drawer__title">Explore</div>
                {secondaryLinks.map((item) =>
                  renderLink(
                    item.href,
                    item.href,
                    item.label,
                    "vtw-mobile-drawer__link",
                    () => setIsDrawerOpen(false)
                  )
                )}
              </div>

              <div className="vtw-mobile-drawer__section">
                <div className="vtw-mobile-drawer__title">Admin</div>
                <button
                  type="button"
                  className="vtw-mobile-drawer__link"
                  onClick={() => {
                    setAdminError("");
                    setIsAdminModalOpen(true);
                  }}
                >
                  <span>
                    {isAdminEnabled
                      ? "Admin routes unlocked"
                      : "Unlock admin routes"}
                  </span>
                  <Lock size={16} />
                </button>
                {isAdminEnabled &&
                  adminLinks.map((item) =>
                    renderLink(
                      item.href,
                      item.href,
                      item.label,
                      "vtw-mobile-drawer__link",
                      () => setIsDrawerOpen(false)
                    )
                  )}
                {isAdminEnabled && (
                  <button
                    type="button"
                    className="vtw-mobile-drawer__link"
                    onClick={handleAdminLogout}
                  >
                    <span>Lock admin routes</span>
                    <Shield size={16} />
                  </button>
                )}
              </div>

              <div className="vtw-mobile-drawer__section">
                <div className="vtw-mobile-drawer__title">Utilities</div>
                <button
                  type="button"
                  className="vtw-mobile-drawer__link"
                  onClick={handleRevealEverything}
                >
                  <span>Reveal hidden utility content</span>
                  <Sparkles size={16} />
                </button>
              </div>

              <div className="vtw-mobile-drawer__section">
                <div className="vtw-mobile-drawer__title">Fast paths</div>
                <Link
                  to="/pricing"
                  className="vtw-button vtw-button-primary"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Launch with pricing
                </Link>
                <a
                  href="/admin/login.html"
                  className="vtw-button vtw-button-secondary"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Open admin login
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close admin access dialog"
              className="vtw-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminModalOpen(false)}
            />

            <motion.section
              aria-labelledby="vtw-admin-access-title"
              className="glass-metal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                zIndex: 78,
                width: "min(480px, calc(100vw - 24px))",
                padding: "1.35rem",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  marginBottom: "1rem",
                }}
              >
                <span
                  className="vtw-logo-mark"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <Command size={16} />
                </span>
                <div>
                  <h2
                    id="vtw-admin-access-title"
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: "1.3rem",
                    }}
                  >
                    Admin Access
                  </h2>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    Unlock protected routes or use the dedicated login page.
                  </p>
                </div>
              </div>

              <label htmlFor="vtw-admin-code" className="sr-only">
                Enter admin access code
              </label>
              <input
                id="vtw-admin-code"
                type="password"
                value={adminCode}
                onChange={(event) => {
                  setAdminCode(event.target.value);
                  setAdminError("");
                }}
                placeholder="Enter admin access code"
                style={{
                  width: "100%",
                  minHeight: "3.2rem",
                  marginBottom: "0.9rem",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />

              {adminError && (
                <p style={{ margin: "0 0 0.9rem", color: "#f38ea3" }}>
                  {adminError}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gap: "0.8rem",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                }}
              >
                <button
                  type="button"
                  className="vtw-button vtw-button-primary"
                  onClick={handleAdminSubmit}
                >
                  Unlock
                </button>
                <a
                  href="/admin/login.html"
                  className="vtw-button vtw-button-secondary"
                >
                  Login page
                </a>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedHamburgerNav;
