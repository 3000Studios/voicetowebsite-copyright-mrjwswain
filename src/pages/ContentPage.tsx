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
    videoUrl,
    videoTitle,
    paragraphs,
    cards = [],
    extra,
  } = config;

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
            style={{ padding: "1rem" }}
          >
            <div
              style={{
                overflow: "hidden",
                borderRadius: "24px",
                background: "rgba(5,7,10,0.8)",
              }}
            >
              <iframe
                src={videoUrl}
                title={videoTitle}
                className="vt-preview-frame"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
