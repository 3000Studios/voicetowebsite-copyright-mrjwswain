import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  buildDocumentTitle,
  DEFAULT_SEO_DESCRIPTION,
  getSeoCopyForPath,
} from "../shared/siteManifest";
import GlobalFooter from "./GlobalFooter";
import ScrollReveal from "./ScrollReveal";

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

const formatWallpaperLabel = (value: WallpaperVariant) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const upsertMetaTag = (
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

const upsertLinkTag = (
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

const upsertJsonLd = (id: string, payload: Record<string, unknown>) => {
  let tag = document.head.querySelector(
    `script[data-vtw-jsonld="${id}"]`
  ) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.dataset.vtwJsonld = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(payload);
};

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  wallpaper = "default",
  title,
  subtitle,
  className = "",
}) => {
  const location = useLocation();
  const seoCopy = getSeoCopyForPath(location.pathname);

  useEffect(() => {
    const description =
      subtitle?.trim() || seoCopy.description || DEFAULT_SEO_DESCRIPTION;
    const canonicalHref = window.location.href;
    const pageTitle = buildDocumentTitle(title);

    document.title = pageTitle;

    upsertMetaTag(
      'meta[name="description"]',
      { name: "description" },
      description
    );
    upsertMetaTag(
      'meta[property="og:title"]',
      { property: "og:title" },
      pageTitle
    );
    upsertMetaTag(
      'meta[property="og:description"]',
      { property: "og:description" },
      description
    );
    upsertMetaTag(
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      pageTitle
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description
    );
    upsertLinkTag('link[rel="canonical"]', { rel: "canonical" }, canonicalHref);

    upsertJsonLd("page", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: pageTitle,
      description,
      url: canonicalHref,
      isPartOf: {
        "@type": "WebSite",
        name: "VoiceToWebsite",
        url: window.location.origin,
      },
    });
  }, [location.pathname, seoCopy.description, subtitle, title]);

  return (
    <div
      className={`vtw-page-layout ${className}`.trim()}
      data-wallpaper={wallpaper}
    >
      <main className="vtw-page-layout__main">
        <ScrollReveal
          as="header"
          className="vtw-page-layout__header"
          variant="blur"
        >
          <div className="vtw-page-layout__eyebrow">
            {formatWallpaperLabel(wallpaper)} Experience
          </div>
          <h1 className="vtw-page-title">{title}</h1>
          {subtitle && <p className="vtw-page-subtitle">{subtitle}</p>}
          <div className="vtw-inline-meta">
            <span className="vtw-chip">Route {location.pathname}</span>
            <span className="vtw-chip">Live public page</span>
          </div>
        </ScrollReveal>
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
};

export default PageLayout;
