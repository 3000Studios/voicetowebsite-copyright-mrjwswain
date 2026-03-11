import React from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";

const IMG =
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80";
const VIDEO = "https://www.youtube.com/embed/Wm6CUgyLu94?autoplay=0";

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
            style={{ padding: "1rem" }}
          >
            <div style={{ overflow: "hidden", borderRadius: "24px" }}>
              <iframe
                src={VIDEO}
                title={title}
                className="vt-preview-frame"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
