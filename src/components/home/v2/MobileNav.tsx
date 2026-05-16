import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";

import { useClickSound } from "./useClickSound";

type NavLink = { label: string; to: string; description: string };

const links: NavLink[] = [
  { label: "Home", to: "/", description: "Cinematic build flow" },
  { label: "Pricing", to: "/pricing", description: "$9.99, $19.99, $49.99" },
  { label: "Examples", to: "/examples", description: "Generated sites" },
  { label: "Features", to: "/features", description: "What the engine does" },
  { label: "Blog", to: "/blog", description: "Daily SEO drops" },
  { label: "About", to: "/about", description: "Why this exists" },
  { label: "FAQ", to: "/faq", description: "Quick answers" },
  { label: "Contact", to: "/contact", description: "Talk to a human" },
];

export const MobileNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const click = useClickSound("tick");
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="lg:hidden relative z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur-xl hover:border-cyan-300/40 transition"
        onClick={() => {
          click();
          setOpen((o) => !o);
        }}
      >
        <span className="sr-only">Toggle navigation</span>
        <span className="relative block h-4 w-6">
          <motion.span
            className="absolute left-0 top-0 h-[2px] w-6 bg-white"
            animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="absolute left-0 top-[7px] h-[2px] w-6 bg-white"
            animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute left-0 top-[14px] h-[2px] w-6 bg-white"
            animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav-overlay"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* rolling wallpaper */}
            <motion.div
              className="absolute inset-0 origin-top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 bg-[url('/vtw-wallpaper.png')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,242,255,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(157,0,255,0.18),transparent_55%)]" />
              <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:36px_36px]" />
            </motion.div>

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between px-6 pt-6">
                <Link
                  to="/"
                  onClick={() => click()}
                  className="font-display text-lg font-black tracking-tight"
                >
                  Voice<span className="text-cyan-300">To</span>Website
                </Link>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">Menu</span>
              </div>

              <nav className="mt-12 flex-1 overflow-y-auto px-6 pb-12">
                <ul className="flex flex-col gap-2">
                  {links.map((link, i) => (
                    <motion.li
                      key={link.to}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => click()}
                        className="group flex items-end justify-between gap-4 border-b border-white/10 py-5 transition hover:border-cyan-300/50"
                      >
                        <div>
                          <div className="font-display text-3xl font-black tracking-tight transition group-hover:text-cyan-200 group-hover:[text-shadow:_0_0_28px_rgba(34,211,238,0.45)]">
                            {link.label}
                          </div>
                          <div className="mt-1 text-xs text-white/45 uppercase tracking-[0.24em]">{link.description}</div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-white/40 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="mt-10 grid gap-3"
                >
                  <Link
                    to="/pricing"
                    onClick={() => click()}
                    className="flex items-center justify-between rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em]"
                  >
                    Start a build
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="mailto:mr.jwswain@gmail.com"
                    onClick={() => click()}
                    className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white/70"
                  >
                    <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> mr.jwswain@gmail.com</span>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </a>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
