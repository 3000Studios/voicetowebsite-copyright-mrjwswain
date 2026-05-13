import { CheckCircle2, Database, Globe, Mic2 } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";
import { PRICING_SUPPORT_POINTS, PRICING_TIERS } from "../content/pricingData";

const PricingPage: React.FC = () => (
  <PageLayout
    title="Pricing"
    subtitle="Lower, clearer pricing for voice-built launches, with room to grow into domains, data flows, and commerce."
    wallpaper="pricing"
  >
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <ScrollReveal as="section" className="vtw-grid-3" variant="blur">
        {PRICING_TIERS.map((tier) => (
          <article
            key={tier.id}
            className="vtw-glass-card vtw-card-hover"
            style={{
              padding: "1.35rem",
              borderColor: tier.highlight
                ? "rgba(0,242,255,0.34)"
                : "rgba(255,255,255,0.1)",
            }}
          >
            <div className="vtw-inline-meta">
              <span className="vtw-chip">{tier.pages}</span>
              {tier.highlight && (
                <span className="vtw-chip">Best starting point</span>
              )}
            </div>
            <h2
              style={{
                margin: "0.95rem 0 0.35rem",
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
              }}
            >
              {tier.name}
            </h2>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                color: "var(--accent-cyan)",
                letterSpacing: "-0.06em",
              }}
            >
              {tier.price}
            </div>
            <p className="vtw-body-text" style={{ margin: "0.7rem 0 0" }}>
              {tier.desc}
            </p>
            <ul className="vtw-list" style={{ marginTop: "1rem" }}>
              {tier.features.map((feature) => (
                <li key={`${tier.id}-${feature}`}>{feature}</li>
              ))}
            </ul>
            <Link
              to={`/store?plan=${tier.id}`}
              className={`vtw-button ${
                tier.highlight ? "vtw-button-primary" : "vtw-button-secondary"
              }`}
              style={{ width: "100%", marginTop: "1.1rem" }}
            >
              Choose {tier.name}
            </Link>
          </article>
        ))}
      </ScrollReveal>

      <ScrollReveal as="section" className="vtw-grid-2">
        <article className="vtw-glass-card" style={{ padding: "1.35rem" }}>
          <div className="vtw-section-label">What is included</div>
          <h2
            className="vtw-section-title"
            style={{
              margin: "0.75rem 0 0.6rem",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            }}
          >
            Voice-built pages first. Growth layers when you need them.
          </h2>
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {[
              {
                icon: Mic2,
                title: "Voice-first brief capture",
                copy: "Describe the site in plain language and use that input to shape page structure quickly.",
              },
              {
                icon: Globe,
                title: "Domain connection path",
                copy: "Launch packages include domain connection guidance instead of leaving the last mile unfinished.",
              },
              {
                icon: Database,
                title: "Data-backed growth options",
                copy: "Database-backed signup flows and custom app logic can be added when the project grows beyond a brochure site.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.85rem",
                  padding: "0.95rem",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="vtw-chip">
                  <Icon size={16} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: "1.05rem",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="vtw-body-text"
                    style={{ margin: "0.35rem 0 0" }}
                  >
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="vtw-glass-card" style={{ padding: "1.35rem" }}>
          <div className="vtw-section-label">Roadmap and partnerships</div>
          <h2
            className="vtw-section-title"
            style={{
              margin: "0.75rem 0 0.6rem",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            }}
          >
            The one-stop-shop model is a rollout decision, not homepage clutter.
          </h2>
          <p className="vtw-section-copy">
            Domains, registrar partnerships, and transaction layers can increase
            revenue, but the public pricing page should stay clear about what is
            live today versus what is being staged next.
          </p>
          <ul className="vtw-list" style={{ marginTop: "1rem" }}>
            {PRICING_SUPPORT_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
            {[
              "Start with a fast launch page.",
              "Add more pages when the business story gets bigger.",
              "Layer in data, commerce, and partner flows when revenue justifies the complexity.",
            ].map((point) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  color: "var(--text-soft)",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <div className="vtw-hero-actions" style={{ marginTop: "1.2rem" }}>
            <Link to="/store" className="vtw-button vtw-button-primary">
              Open store
            </Link>
            <Link to="/contact" className="vtw-button vtw-button-secondary">
              Talk through your build
            </Link>
          </div>
        </article>
      </ScrollReveal>
    </div>
  </PageLayout>
);

export default PricingPage;
