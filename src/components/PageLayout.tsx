import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import GlobalFooter from "./GlobalFooter";
import {
  buildDocumentTitle,
  DEFAULT_SEO_DESCRIPTION,
} from "../shared/siteManifest";

export type WallpaperVariant =
  | "default"
  | "about"
  | "features"
  | "blog"
  | "contact"
  | "pricing"
  | "support"
  | "trust"
  | "status"
  | "gallery"
  | "templates"
  | "partners"
  | "careers"
  | "press"
  | "legal"
  | "privacy"
  | "terms"
  | "license"
  | "demo"
  | "how-it-works"
  | "store"
  | "livestream"
  | "search"
  | "projects"
  | "the3000"
  | "studio3000"
  | "webforge"
  | "sandbox"
  | "neural-engine"
  | "api-docs"
  | "lexicon"
  | "voice-to-json"
  | "geological"
  | "design-system"
  | "referrals"
  | "copyrights"
  | "appstore";

interface PageLayoutProps {
  children: React.ReactNode;
  wallpaper?: WallpaperVariant;
  title: string;
  subtitle?: string;
  className?: string;
}

const WALLPAPER_GRADIENTS: Record<WallpaperVariant, string> = {
  default:
    "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 50%, rgba(15,23,42,0.98) 100%)",
  about:
    "linear-gradient(160deg, rgba(59,130,246,0.12) 0%, rgba(15,23,42,0.98) 40%, rgba(139,92,246,0.1) 100%)",
  features:
    "linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(16,185,129,0.06) 100%)",
  blog: "linear-gradient(145deg, rgba(251,191,36,0.06) 0%, rgba(15,23,42,0.98) 50%, rgba(236,72,153,0.06) 100%)",
  contact:
    "linear-gradient(200deg, rgba(34,211,238,0.1) 0%, rgba(15,23,42,0.98) 60%, rgba(59,130,246,0.08) 100%)",
  pricing:
    "linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(34,211,238,0.06) 100%)",
  support:
    "linear-gradient(220deg, rgba(139,92,246,0.08) 0%, rgba(15,23,42,0.98) 70% 100%)",
  trust:
    "linear-gradient(140deg, rgba(34,211,238,0.06) 0%, rgba(15,23,42,0.98) 50%, rgba(251,191,36,0.05) 100%)",
  status:
    "linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0.98) 100%)",
  gallery:
    "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(139,92,246,0.06) 100%)",
  templates:
    "linear-gradient(170deg, rgba(59,130,246,0.08) 0%, rgba(15,23,42,0.98) 60% 100%)",
  partners:
    "linear-gradient(120deg, rgba(251,191,36,0.07) 0%, rgba(15,23,42,0.98) 50% 100%)",
  careers:
    "linear-gradient(200deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.98) 70% 100%)",
  press:
    "linear-gradient(150deg, rgba(139,92,246,0.07) 0%, rgba(15,23,42,0.98) 55% 100%)",
  legal:
    "linear-gradient(100deg, rgba(100,116,139,0.1) 0%, rgba(15,23,42,0.98) 50% 100%)",
  privacy:
    "linear-gradient(180deg, rgba(34,211,238,0.05) 0%, rgba(15,23,42,0.98) 60% 100%)",
  terms:
    "linear-gradient(260deg, rgba(251,191,36,0.05) 0%, rgba(15,23,42,0.98) 50% 100%)",
  license:
    "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(15,23,42,0.98) 50% 100%)",
  demo: "linear-gradient(180deg, rgba(236,72,153,0.06) 0%, rgba(15,23,42,0.98) 50% 100%)",
  "how-it-works":
    "linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
  store:
    "linear-gradient(90deg, rgba(251,191,36,0.06) 0%, rgba(15,23,42,0.98) 50% 100%)",
  livestream:
    "linear-gradient(180deg, rgba(239,68,68,0.08) 0%, rgba(15,23,42,0.98) 60% 100%)",
  search:
    "linear-gradient(135deg, rgba(34,211,238,0.07) 0%, rgba(15,23,42,0.98) 50% 100%)",
  projects:
    "linear-gradient(200deg, rgba(139,92,246,0.07) 0%, rgba(15,23,42,0.98) 70% 100%)",
  the3000:
    "linear-gradient(145deg, rgba(251,191,36,0.1) 0%, rgba(15,23,42,0.98) 50% 100%)",
  studio3000:
    "linear-gradient(220deg, rgba(236,72,153,0.08) 0%, rgba(15,23,42,0.98) 60% 100%)",
  webforge:
    "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
  sandbox:
    "linear-gradient(170deg, rgba(34,211,238,0.09) 0%, rgba(15,23,42,0.98) 50% 100%)",
  "neural-engine":
    "linear-gradient(180deg, rgba(139,92,246,0.1) 0%, rgba(15,23,42,0.98) 50% 100%)",
  "api-docs":
    "linear-gradient(100deg, rgba(59,130,246,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
  lexicon:
    "linear-gradient(150deg, rgba(251,191,36,0.06) 0%, rgba(15,23,42,0.98) 50% 100%)",
  "voice-to-json":
    "linear-gradient(200deg, rgba(16,185,129,0.07) 0%, rgba(15,23,42,0.98) 70% 100%)",
  geological:
    "linear-gradient(135deg, rgba(180,83,9,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
  "design-system":
    "linear-gradient(160deg, rgba(236,72,153,0.06) 0%, rgba(15,23,42,0.98) 50% 100%)",
  referrals:
    "linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
  copyrights:
    "linear-gradient(180deg, rgba(100,116,139,0.08) 0%, rgba(15,23,42,0.98) 60% 100%)",
  appstore:
    "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(15,23,42,0.98) 50% 100%)",
};

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  wallpaper = "default",
  title,
  subtitle,
  className = "",
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const total = scrollHeight - clientHeight;
      setScrollProgress(total > 0 ? scrollTop / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gradient =
    WALLPAPER_GRADIENTS[wallpaper] ?? WALLPAPER_GRADIENTS.default;

  useEffect(() => {
    const description = subtitle?.trim() || DEFAULT_SEO_DESCRIPTION;
    const canonicalHref = window.location.href;

    document.title = buildDocumentTitle(title);

    const upsertMeta = (
      selector: string,
      attributes: Record<string, string>,
      content: string
    ) => {
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        Object.entries(attributes).forEach(([key, value]) =>
          tag?.setAttribute(key, value)
        );
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const upsertLink = (
      selector: string,
      attributes: Record<string, string>,
      href: string
    ) => {
      let tag = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!tag) {
        tag = document.createElement("link");
        Object.entries(attributes).forEach(([key, value]) =>
          tag?.setAttribute(key, value)
        );
        document.head.appendChild(tag);
      }
      tag.href = href;
    };

    upsertMeta(
      'meta[name="description"]',
      { name: "description" },
      description
    );
    upsertMeta(
      'meta[property="og:title"]',
      { property: "og:title" },
      buildDocumentTitle(title)
    );
    upsertMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      description
    );
    upsertMeta(
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      buildDocumentTitle(title)
    );
    upsertMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description
    );
    upsertLink('link[rel="canonical"]', { rel: "canonical" }, canonicalHref);
  }, [subtitle, title]);

  return (
    <div
      className={`vtw-page-layout min-h-screen relative overflow-x-hidden ${className}`}
      data-wallpaper={wallpaper}
    >
      {/* Live responsive wallpaper layer */}
      <div
        className="vtw-wallpaper fixed inset-0 z-0 pointer-events-none"
        aria-hidden
        style={{ background: gradient }}
      />
      <div
        className="vtw-wallpaper-shine absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background: `linear-gradient(${scrollProgress * 360}deg, rgba(34,211,238,0.03) 0%, transparent 50%)`,
        }}
      />
      {/* Subtle animated gradient orbs */}
      <div className="vtw-wallpaper-orb vtw-wallpaper-orb-1" />
      <div className="vtw-wallpaper-orb vtw-wallpaper-orb-2" />
      <div className="vtw-wallpaper-orb vtw-wallpaper-orb-3" />

      <main
        ref={sectionRef}
        className="relative z-10 max-w-6xl mx-auto px-6 py-16"
      >
        <motion.header
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="vtw-page-title font-outfit font-black text-4xl md:text-6xl lg:text-7xl tracking-tight text-white mb-4 vtw-scroll-reveal">
            {title}
          </h1>
          {subtitle && (
            <p className="vtw-page-subtitle text-lg md:text-xl text-white/70 max-w-2xl mx-auto vtw-scroll-reveal">
              {subtitle}
            </p>
          )}
        </motion.header>
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
};

export default PageLayout;
