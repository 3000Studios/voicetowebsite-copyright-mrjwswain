import React from "react";
import PageLayout, { WallpaperVariant } from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";

export interface CardItem {
  title: string;
  body: string;
}

export interface ContentPageConfig {
  title: string;
  subtitle?: string;
  wallpaper: WallpaperVariant;
  imageUrl: string;
  imageAlt: string;
  /** Optional extra images for a gallery section on the page */
  extraImageUrls?: string[];
  extraImageAlts?: string[];
  videoUrl: string;
  videoTitle: string;
  paragraphs: string[];
  cards?: CardItem[];
  extra?: React.ReactNode;
}

interface ContentPageProps {
  config: ContentPageConfig;
}

const ContentPage: React.FC<ContentPageProps> = ({ config }) => {
  const {
    title,
    subtitle,
    wallpaper,
    imageUrl,
    imageAlt,
    extraImageUrls = [],
    extraImageAlts = [],
    videoTitle,
    paragraphs,
    cards = [],
    extra,
  } = config;
  const spotlightPoints = [
    subtitle,
    paragraphs[0],
    cards[0]?.body,
    "Route-level content stays fast, indexable, and easier to review without a fragile third-party embed.",
  ].filter(Boolean) as string[];

  return (
    <PageLayout title={title} subtitle={subtitle} wallpaper={wallpaper}>
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <ScrollReveal as="section" className="vtw-grid-2" variant="blur">
          <article
            className="vtw-glass-card vtw-card-hover"
            style={{ padding: "1rem" }}
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              style={{
                width: "100%",
                height: "clamp(240px, 34vw, 420px)",
                objectFit: "cover",
                borderRadius: "24px",
              }}
            />
            <p style={{ margin: "0.9rem 0 0", color: "var(--text-muted)" }}>
              {imageAlt}
            </p>
          </article>
          <article
            className="vtw-glass-card vtw-card-hover"
            style={{ padding: "1.2rem" }}
          >
            <div
              className="vtw-section-label"
              style={{ marginBottom: "0.8rem" }}
            >
              Route spotlight
            </div>
            <div
              style={{
                minHeight: "100%",
                padding: "1.2rem",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(160deg, rgba(0,242,255,0.08), rgba(112,0,255,0.12) 42%, rgba(15,20,27,0.94))",
                display: "grid",
                gap: "1rem",
              }}
            >
              <div className="vtw-inline-meta">
                <span className="vtw-chip">Live route</span>
                <span className="vtw-chip">{title}</span>
              </div>
              <div>
                <h2
                  className="vtw-card-title"
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.55rem, 3vw, 2.4rem)",
                    lineHeight: 1,
                  }}
                >
                  {videoTitle}
                </h2>
                <p className="vtw-body-text" style={{ margin: "0.75rem 0 0" }}>
                  Structured copy, discovery context, and route-specific detail
                  stay inside the product shell so the page remains durable in
                  preview and production.
                </p>
              </div>
              <div className="vtw-metric-grid" style={{ marginTop: "0.2rem" }}>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Page type</span>
                  <span className="vtw-metric__value">Content route</span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Delivery</span>
                  <span className="vtw-metric__value">Fast shell</span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Review mode</span>
                  <span className="vtw-metric__value">Embed-safe</span>
                </div>
              </div>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {spotlightPoints.slice(0, 3).map((point) => (
                  <div
                    key={point}
                    style={{
                      padding: "0.85rem 0.95rem",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.04)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          className="vtw-glass-card"
          style={{ padding: "1.4rem" }}
        >
          <div
            className="vtw-section__heading"
            style={{ marginBottom: "1rem" }}
          >
            <div className="vtw-section-label">Overview</div>
            <h2
              className="vtw-section-title"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
            >
              A clearer explanation of this route.
            </h2>
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
            {paragraphs.map((paragraph, idx) => (
              <p
                key={`p-${idx}`}
                className="vtw-body-text"
                style={{ margin: 0, fontSize: "1.02rem" }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollReveal>

        {extraImageUrls.length > 0 && (
          <ScrollReveal
            as="section"
            className="vtw-glass-card"
            style={{ padding: "1.4rem" }}
          >
            <div
              className="vtw-section__heading"
              style={{ marginBottom: "1rem" }}
            >
              <div className="vtw-section-label">Gallery</div>
              <h2
                className="vtw-section-title"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}
              >
                More from VoiceToWebsite
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              {extraImageUrls.map((src, idx) => (
                <article
                  key={`img-${idx}`}
                  className="vtw-card-hover"
                  style={{
                    overflow: "hidden",
                    borderRadius: "16px",
                    background: "rgba(5,7,10,0.6)",
                  }}
                >
                  <img
                    src={src}
                    alt={extraImageAlts[idx] ?? imageAlt}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                  />
                  <p
                    style={{
                      margin: "0.5rem 0.75rem 0.75rem",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {extraImageAlts[idx] ?? imageAlt}
                  </p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        )}

        {cards.length > 0 && (
          <ScrollReveal as="section" className="vtw-grid-3" variant="up">
            {cards.map((card) => (
              <article
                key={card.title}
                className="vtw-glass-card vtw-card-hover"
                style={{ padding: "1.25rem" }}
              >
                <div
                  className="vtw-section-label"
                  style={{ marginBottom: "0.8rem" }}
                >
                  Detail
                </div>
                <h3
                  className="vtw-card-title"
                  style={{ margin: 0, fontSize: "1.3rem", lineHeight: 1.05 }}
                >
                  {card.title}
                </h3>
                <p className="vtw-body-text" style={{ margin: "0.9rem 0 0" }}>
                  {card.body}
                </p>
              </article>
            ))}
          </ScrollReveal>
        )}

        {extra}
      </div>
    </PageLayout>
  );
};

export default ContentPage;
