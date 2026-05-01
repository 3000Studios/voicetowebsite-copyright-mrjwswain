import { ArrowRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Examples', href: '/examples' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
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
  const isHash = href.startsWith('/#');
  const className = 'text-sm font-semibold text-slate-200/86 transition hover:text-white';

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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
              ? 'border-white/12 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl'
              : 'border-white/10 bg-slate-950/58 backdrop-blur-xl'
          }`}
        >
          <Link to="/" aria-label="VoiceToWebsite home" className="shrink-0">
            <Logo />
          </Link>

          <div className={`hidden flex-1 items-center justify-center px-6 lg:flex ${isScrolled ? "translate-y-[-140%] opacity-0" : "translate-y-0 opacity-100"} transition-all duration-500`}>
            <div className="nav-brand-wave w-full max-w-[34rem]">
              <div className="nav-brand-wave-track">
                <span>Speak. Build. Launch.</span>
                <span>Voice to website in minutes.</span>
                <span>Animated. Responsive. Live.</span>
                <span>Speak. Build. Launch.</span>
                <span>Voice to website in minutes.</span>
                <span>Animated. Responsive. Live.</span>
              </div>
            </div>
          </div>

          <nav className={`hidden items-center gap-8 lg:flex transition-all duration-500 ${isScrolled ? "translate-x-4 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
            {navLinks.map((link) => (
              <NavAnchor key={link.label} href={link.href}>
                {link.label}
              </NavAnchor>
            ))}
          </nav>

          <div className={`hidden items-center gap-3 lg:flex transition-all duration-500 ${isScrolled ? "translate-x-4 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
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
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white lg:hidden"
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
            className="fixed inset-x-4 top-24 z-40 rounded-[2rem] border border-white/12 bg-slate-950/94 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl lg:hidden"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16),transparent_38%)]" />
            <div className="relative space-y-3">
              <div className="grid gap-3 pb-3">
                <Link to="/login" onClick={() => setIsOpen(false)} className="nav-ghost-button flex w-full justify-center">
                  Login
                </Link>
                <Link to="/login?mode=create" onClick={() => setIsOpen(false)} className="nav-primary-button flex w-full justify-center">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {navLinks.map((link) => (
                <NavAnchor key={link.label} href={link.href} onClick={() => setIsOpen(false)}>
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
