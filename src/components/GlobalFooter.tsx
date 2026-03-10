import React from "react";
import { Link } from "react-router-dom";
import { SITE_FOOTER_GROUPS } from "../shared/siteManifest";

const GlobalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const trustLinks =
    SITE_FOOTER_GROUPS.find((group) => group.id === "trust")?.links.length || 0;
  const archiveLinks =
    SITE_FOOTER_GROUPS.find((group) => group.id === "archive")?.links.length ||
    0;

  return (
    <footer className="relative z-10 mt-20 border-t border-white/10 bg-slate-950/92 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <p className="text-[0.72rem] uppercase tracking-[0.3em] text-cyan-200/80">
              Footer Archive
            </p>
            <h2 className="font-outfit text-3xl font-black leading-tight text-white md:text-4xl">
              Every extra page now has one organized place to live.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
              This footer acts like a clean site directory. Core revenue pages
              stay easy to reach, and lower-priority pages move here instead of
              cluttering the main navigation. That also gives crawlers stronger
              internal linking and makes missing content easier to spot.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
                  Trust pages
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {trustLinks}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
                  Archive pages
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {archiveLinks}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
                  Blog refresh
                </p>
                <p className="mt-2 text-xl font-black text-white">3 hrs</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {SITE_FOOTER_GROUPS.map((group) => (
              <section
                key={group.id}
                aria-labelledby={`footer-group-${group.id}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3
                  id={`footer-group-${group.id}`}
                  className="font-outfit text-lg font-black text-white"
                >
                  {group.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {group.description}
                </p>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      {link.fullReload ? (
                        <a
                          href={link.href}
                          className="block rounded-2xl border border-white/8 bg-black/20 px-4 py-3 transition-colors hover:border-cyan-300/25 hover:bg-cyan-400/6"
                        >
                          <span className="block text-sm font-semibold text-white">
                            {link.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-white/58">
                            {link.description}
                          </span>
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="block rounded-2xl border border-white/8 bg-black/20 px-4 py-3 transition-colors hover:border-cyan-300/25 hover:bg-cyan-400/6"
                        >
                          <span className="block text-sm font-semibold text-white">
                            {link.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-white/58">
                            {link.description}
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {currentYear} VoiceToWebsite. Structured pages, trust content, and
            live runtime updates.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">
              Support
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
