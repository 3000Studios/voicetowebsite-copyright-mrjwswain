import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";

import { useClickSound } from "./useClickSound";

const cols: Array<{ heading: string; links: Array<{ label: string; to: string; external?: boolean }> }> = [
  {
    heading: "Product",
    links: [
      { label: "How it works", to: "/#how-it-works" },
      { label: "Pricing", to: "/pricing" },
      { label: "Examples", to: "/examples" },
      { label: "Features", to: "/features" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Refund Policy", to: "/refunds" },
      { label: "DMCA", to: "/dmca" },
    ],
  },
];

export const FooterV2: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const fold = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, 0]);
  const reveal = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.6, 1]);
  const click = useClickSound("tick");

  return (
    <motion.footer
      ref={ref}
      style={{ y: fold, opacity: reveal }}
      className="relative mt-24 overflow-hidden border-t border-white/10 bg-linear-to-b from-black via-[#06080f] to-black"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_0%,rgba(0,242,255,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(157,0,255,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 hidden h-[420px] w-[1200px] -translate-x-1/2 select-none font-display text-[18rem] font-black tracking-tighter text-white/[0.04] lg:block">
        voicetowebsite
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_2fr] lg:px-12 lg:py-24">
        <div>
          <Link to="/" onClick={() => click()} className="inline-flex items-center gap-2 font-display text-2xl font-black tracking-tight">
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-cyan-300 via-indigo-400 to-fuchsia-500 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.45)]">
              <span className="absolute inset-[1px] rounded-[10px] bg-black/70" />
              <span className="relative z-10 text-cyan-100">V</span>
            </span>
            Voice<span className="text-cyan-300">To</span>Website
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
            Speak a 60-second business brief. Get a hosted homepage with real Gemini copy, live media, and a checkout already wired.
          </p>
          <a
            href="mailto:mr.jwswain@gmail.com"
            onClick={() => click()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 transition hover:border-cyan-300/40 hover:text-white"
          >
            <Mail className="h-4 w-4 text-cyan-300" /> mr.jwswain@gmail.com
          </a>
          <Link
            to="/pricing"
            onClick={() => click()}
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-5 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_30px_-8px_rgba(34,211,238,0.45)] transition hover:-translate-y-px"
          >
            Start a build <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">{col.heading}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      onClick={() => click()}
                      className="text-white/70 transition hover:text-white hover:[text-shadow:_0_0_18px_rgba(34,211,238,0.45)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-white/8 px-5 py-5 text-center text-xs text-white/40 sm:px-8 lg:px-12">
        © 2026 3000 Studios LLC · VoiceToWebsite.com · Hosted on Cloudflare · Powered by Gemini
      </div>
    </motion.footer>
  );
};
