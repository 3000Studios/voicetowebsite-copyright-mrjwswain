import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Examples", href: "/examples" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Stories", href: "/stories" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Admin", href: "/admin" },
];

const NavAnchor = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const isHash = href.startsWith("/#");
  const className =
    "text-sm font-semibold text-slate-200/86 transition hover:text-white";

  if (isHash) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
};

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-10">
        <div
          className={`mx-auto flex w-full max-w-7xl items-center justify-between overflow-hidden rounded-full border px-4 py-3 transition-all duration-300 sm:px-6 ${
            isScrolled
              ? "border-white/12 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
              : "border-white/10 bg-slate-950/58 backdrop-blur-xl"
          } ${isScrolled ? "lg:pl-4 lg:pr-4" : ""}`}
        >
          <Link
            to="/"
            aria-label="VoiceToWebsite home"
            className={`shrink-0 transition-all duration-500 ${isScrolled ? "scale-95 opacity-0 pointer-events-none w-0 overflow-hidden" : "scale-100 opacity-100"}`}
          >
            <Logo />
          </Link>

          <div
            className={`flex-1 items-center justify-center px-6 lg:flex transition-all duration-700 ease-in-out ${isScrolled ? "w-12 translate-x-0" : "w-auto translate-x-0"}`}
          >
            <div
              className={`nav-brand-wave transition-all duration-700 ease-in-out ${isScrolled ? "w-12 h-12 rounded-full bg-linear-to-r from-cyan-500 to-indigo-500 scale-75 opacity-80" : "w-full max-w-136 scale-100 opacity-100"}`}
            >
              <div
                className={`nav-brand-wave-track transition-all duration-700 ease-in-out ${isScrolled ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
              >
                <span>Speak. Build. Launch.</span>
                <span>Voice to website in minutes.</span>
                <span>Animated. Responsive. Live.</span>
                <span>Speak. Build. Launch.</span>
                <span>Voice to website in minutes.</span>
                <span>Animated. Responsive. Live.</span>
              </div>
              {isScrolled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/30 animate-ping"></div>
                  <div className="absolute w-2 h-2 rounded-full bg-white/60"></div>
                </div>
              )}
            </div>
          </div>

          <nav
            className={`hidden items-center gap-8 lg:flex transition-all duration-500 ${isScrolled ? "translate-x-4 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}
          >
            {navLinks.map((link) => (
              <NavAnchor key={link.label} href={link.href}>
                {link.label}
              </NavAnchor>
            ))}
          </nav>

          <div
            className={`hidden items-center gap-3 lg:flex transition-all duration-500 ${isScrolled ? "translate-x-4 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}
          >
            <Link to="/login" className="nav-ghost-button">
              Login
            </Link>
            <Link to="/login?mode=create" className="nav-primary-button">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-label="Toggle menu"
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition-all duration-500 ${isScrolled ? "lg:translate-x-0" : ""}`}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-24 z-40 rounded-4xl border border-white/12 bg-slate-950/94 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl lg:hidden"
          >
            <div className="absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16),transparent_38%)]" />
            <div className="relative space-y-3">
              <div className="grid gap-3 pb-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="nav-ghost-button flex w-full justify-center"
                >
                  Login
                </Link>
                <Link
                  to="/login?mode=create"
                  onClick={() => setIsOpen(false)}
                  className="nav-primary-button flex w-full justify-center"
                >
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {navLinks.map((link) => (
                <NavAnchor
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="block rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-base font-semibold text-white">
                    {link.label}
                  </span>
                </NavAnchor>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
