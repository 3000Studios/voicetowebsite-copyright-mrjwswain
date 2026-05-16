import { motion, useScroll, useTransform } from "motion/react";
import React from "react";
import { Link } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { useClickSound } from "./useClickSound";

const desktopLinks: Array<{ label: string; to: string }> = [
  { label: "Pricing", to: "/pricing" },
  { label: "Examples", to: "/examples" },
  { label: "Blog", to: "/blog" },
  { label: "FAQ", to: "/faq" },
];

export const TopNav: React.FC = () => {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(3,4,10,0)", "rgba(3,4,10,0.85)"]);
  const border = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);
  const click = useClickSound("tick");

  return (
    <motion.header
      style={{ background: bg, borderBottom: "1px solid", borderBottomColor: border }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:h-20 lg:px-10">
        <Link
          to="/"
          onClick={() => click()}
          className="group inline-flex items-center gap-2 font-display text-lg font-black tracking-tight"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-cyan-300 via-indigo-400 to-fuchsia-500 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.45)]">
            <span className="absolute inset-[1px] rounded-[10px] bg-black/70" />
            <span className="relative z-10 text-cyan-100">V</span>
          </span>
          <span className="hidden sm:inline">Voice<span className="text-cyan-300">To</span>Website</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {desktopLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => click()}
              className="group relative rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:text-white"
            >
              <span className="relative z-10">{l.label}</span>
              <span className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-r from-cyan-400/0 via-cyan-400/0 to-fuchsia-400/0 opacity-0 transition group-hover:from-cyan-400/15 group-hover:via-cyan-400/0 group-hover:to-fuchsia-400/15 group-hover:opacity-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            onClick={() => click()}
            className="hidden lg:inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/30 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            to="/pricing"
            onClick={() => click()}
            className="hidden lg:inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-5 py-2.5 text-sm font-black text-black shadow-[0_10px_40px_-8px_rgba(34,211,238,0.55)] hover:shadow-[0_14px_48px_-6px_rgba(34,211,238,0.7)] hover:-translate-y-px active:translate-y-0 transition"
          >
            Start a build
          </Link>
          <MobileNav />
        </div>
      </div>
    </motion.header>
  );
};
