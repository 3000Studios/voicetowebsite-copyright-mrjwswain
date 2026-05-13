import React from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";

const IMG =
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80";

const CategoryPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const categoryName = name ? name.replace(/-/g, " ") : "Apps";
  const title = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return (
    <PageLayout
      title={title}
      subtitle={`Apps and tools in the ${title} category.`}
      wallpaper="templates"
    >
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <ScrollReveal as="section" className="vtw-grid-2" variant="blur">
          <article
            className="vtw-glass-card vtw-card-hover"
            style={{ padding: "1rem" }}
          >
            <img
              src={IMG}
              alt={title}
              style={{
                width: "100%",
                height: "clamp(240px, 34vw, 420px)",
                objectFit: "cover",
                borderRadius: "24px",
              }}
            />
          </article>
          <article
            className="vtw-glass-card vtw-card-hover"
            style={{ padding: "1.2rem" }}
          >
            <div
              className="vtw-section-label"
              style={{ marginBottom: "0.8rem" }}
            >
              Category spotlight
            </div>
            <div
              style={{
                minHeight: "100%",
                padding: "1.2rem",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(150deg, rgba(28,207,156,0.14), rgba(112,0,255,0.1) 48%, rgba(15,20,27,0.94))",
                display: "grid",
                gap: "1rem",
              }}
            >
              <div className="vtw-inline-meta">
                <span className="vtw-chip">Category route</span>
                <span className="vtw-chip">{title}</span>
              </div>
              <h2
                className="vtw-card-title"
                style={{
                  margin: 0,
                  fontSize: "clamp(1.6rem, 3vw, 2.35rem)",
                  lineHeight: 1,
                }}
              >
                Explore this app cluster without losing the site structure.
              </h2>
              <p className="vtw-body-text" style={{ margin: 0 }}>
                Category routes keep app discovery indexable, easier to scan,
                and more organized than a single oversized catalog page.
              </p>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {[
                  "Structured discovery surfaces support SEO and cleaner browsing.",
                  "Each category can grow with filters, descriptions, and internal links.",
                  "The premium shell stays consistent across app pages and archive routes.",
                ].map((point) => (
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

        <ScrollReveal as="section" className="vtw-grid-3">
          {[
            "Category pages keep app discovery cleaner than one long catalog.",
            "Each category route can support SEO, filtering, and internal linking.",
            "App store expansion stays organized instead of burying tools in one page.",
          ].map((copy, index) => (
            <article
              key={copy}
              className="vtw-glass-card vtw-card-hover"
              style={{ padding: "1.25rem" }}
            >
              <div className="vtw-section-label">Panel {index + 1}</div>
              <p className="vtw-body-text" style={{ margin: "0.75rem 0 0" }}>
                {copy}
              </p>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </PageLayout>
  );
};

export default CategoryPage;
