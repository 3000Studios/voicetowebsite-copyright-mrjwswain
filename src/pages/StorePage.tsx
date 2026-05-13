import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Layers3,
  Rocket,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";
import { FEATURED_TRY_NOW_APPS } from "../content/featuredApps";
import { PRICING_SUPPORT_POINTS, PRICING_TIERS } from "../content/pricingData";
import { handlePayPalPurchase, handleStripePurchase } from "../commerce";
import { trackRevenueEvent } from "../utils/revenueTracking";

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => unknown;
  }
}

type CatalogItem = {
  id: string;
  type?: string;
  title?: string;
  label?: string;
  desc?: string;
  price?: number;
  currency?: string;
  interval?: string;
  features?: string[];
  previewUrl?: string;
  downloadUrl?: string;
};

type CatalogResponse = {
  products?: CatalogItem[];
  apps?: CatalogItem[];
};

const PRIMARY_SERVICE_IDS = new Set(["starter", "growth", "enterprise"]);

const StorePage: React.FC = () => {
  const location = useLocation();
  const [catalog, setCatalog] = useState<CatalogResponse>({});
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error" | "">("");
  const [stripeReady, setStripeReady] = useState(
    typeof window !== "undefined" && typeof window.Stripe === "function"
  );
  const attemptedAutoLaunchRef = useRef(false);

  useEffect(() => {
    let active = true;

    fetch("/api/catalog", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Catalog unavailable.");
        return res.json();
      })
      .then((data: CatalogResponse) => {
        if (!active) return;
        setCatalog(data || {});
      })
      .catch((error: Error) => {
        if (!active) return;
        setStatusTone("error");
        setStatusMessage(error.message || "Catalog unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.Stripe === "function") {
      setStripeReady(typeof window !== "undefined");
      return;
    }

    const existing = document.querySelector('script[data-vtw-stripe="true"]');
    if (existing) {
      existing.addEventListener("load", () => setStripeReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3";
    script.async = true;
    script.dataset.vtwStripe = "true";
    script.onload = () => setStripeReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setStatusTone("success");
      setStatusMessage("Checkout completed. Your order is being prepared.");
      return;
    }
    if (checkout === "cancel") {
      setStatusTone("error");
      setStatusMessage("Checkout was canceled. You can start again anytime.");
      return;
    }

    const plan = String(params.get("plan") || "")
      .trim()
      .toLowerCase();
    const pay = String(params.get("pay") || "")
      .trim()
      .toLowerCase();
    if (!plan || !pay || attemptedAutoLaunchRef.current) return;
    if (pay !== "stripe" && pay !== "paypal") return;

    const serviceProducts = (catalog.products || []).filter((item) =>
      PRIMARY_SERVICE_IDS.has(String(item.id || "").toLowerCase())
    );
    const product = serviceProducts.find(
      (item) => String(item.id || "").toLowerCase() === plan
    );
    if (!product) return;
    if (pay === "stripe" && !stripeReady) return;

    attemptedAutoLaunchRef.current = true;
    void beginCheckout(product, pay);
  }, [catalog.products, location.search, stripeReady]);

  const serviceProducts = (catalog.products || []).filter((item) =>
    PRIMARY_SERVICE_IDS.has(String(item.id || "").toLowerCase())
  );
  const previewApps = (catalog.apps || []).filter(
    (item) =>
      String(item.previewUrl || "").trim() ||
      String(item.downloadUrl || "").trim()
  );

  const beginCheckout = async (
    product: CatalogItem,
    provider: "stripe" | "paypal"
  ) => {
    const productId = String(product.id || "")
      .trim()
      .toLowerCase();
    const productTitle = String(product.title || product.label || "Product");
    const amount = Number(product.price || 0);
    const redirectUrl = `${window.location.origin}/store?checkout=success&product=${encodeURIComponent(productId)}`;

    setStatusTone("");
    setStatusMessage("");
    trackRevenueEvent("store_checkout_intent", {
      provider,
      product: productId,
      surface: "react_storefront",
    });

    try {
      if (provider === "stripe") {
        await handleStripePurchase(productId, amount, redirectUrl);
      } else {
        await handlePayPalPurchase(
          productId,
          productTitle,
          amount,
          redirectUrl
        );
      }
    } catch (error: any) {
      setStatusTone("error");
      setStatusMessage(error?.message || "Checkout failed.");
    }
  };

  return (
    <PageLayout
      title="Store"
      subtitle="Buy a voice-built website, test the live apps first, and move into a launch package without fighting the UI."
      wallpaper="store"
    >
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <ScrollReveal as="section" className="vtw-grid-2" variant="blur">
          <article className="vtw-glass-card" style={{ padding: "1.5rem" }}>
            <div className="vtw-inline-meta">
              <span className="vtw-chip">Storefront</span>
              <span className="vtw-chip">Voice-built launches</span>
            </div>
            <h2
              className="vtw-section-title"
              style={{ margin: "1rem 0 0.7rem", maxWidth: "13ch" }}
            >
              Start small, test the apps, then scale the site.
            </h2>
            <p className="vtw-section-copy" style={{ margin: 0 }}>
              The store is now focused on what a customer actually needs: launch
              packages, real app previews, and a cleaner purchase path.
            </p>
            <div className="vtw-metric-grid" style={{ marginTop: "1.2rem" }}>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Starting point</span>
                <span className="vtw-metric__value">$29</span>
              </div>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Live previews</span>
                <span className="vtw-metric__value">
                  {previewApps.length || FEATURED_TRY_NOW_APPS.length}
                </span>
              </div>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Checkout</span>
                <span className="vtw-metric__value">Stripe + PayPal</span>
              </div>
            </div>
          </article>

          <article className="vtw-glass-card" style={{ padding: "1.5rem" }}>
            <div className="vtw-section-label">What you are buying</div>
            <div style={{ display: "grid", gap: "0.8rem", marginTop: "1rem" }}>
              {[
                {
                  icon: Rocket,
                  title: "Voice-built launch",
                  copy: "Capture the brief, shape the page, and publish without building the layout by hand.",
                },
                {
                  icon: Globe,
                  title: "Domain-ready delivery",
                  copy: "Paid packages include domain connection guidance so the site can be launched on a real URL fast.",
                },
                {
                  icon: Layers3,
                  title: "Growth path",
                  copy: "Move from a single page into a fuller site, storefront, or custom workflow when revenue starts to grow.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "0.9rem",
                    padding: "0.95rem",
                    borderRadius: "22px",
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
        </ScrollReveal>

        {statusMessage && (
          <ScrollReveal
            as="section"
            className="vtw-glass-card"
            style={{ padding: "1rem 1.2rem" }}
          >
            <p
              style={{
                margin: 0,
                color: statusTone === "error" ? "#ff9dbf" : "#9ff7d8",
                fontWeight: 600,
              }}
            >
              {statusMessage}
            </p>
          </ScrollReveal>
        )}

        <ScrollReveal as="section" className="vtw-section">
          <div className="vtw-section__heading">
            <div className="vtw-section-label">Launch packages</div>
            <h2 className="vtw-section-title">
              Choose the website package that matches your current stage.
            </h2>
            <p className="vtw-section-copy">
              These tiers are intentionally lower and clearer. Start with one
              page, then move into a fuller system when the business needs more.
            </p>
          </div>
          <div className="vtw-grid-3">
            {serviceProducts.map((product) => {
              const plan = PRICING_TIERS.find((tier) => tier.id === product.id);
              return (
                <article
                  key={product.id}
                  className="vtw-glass-card vtw-card-hover"
                  style={{
                    padding: "1.35rem",
                    borderColor: plan?.highlight
                      ? "rgba(0,242,255,0.34)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="vtw-inline-meta">
                    <span className="vtw-chip">
                      {product.label || product.title}
                    </span>
                    {plan?.highlight && (
                      <span className="vtw-chip">Recommended</span>
                    )}
                  </div>
                  <h3
                    style={{
                      margin: "0.9rem 0 0.4rem",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.7rem",
                    }}
                  >
                    {product.title}
                  </h3>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                      color: "var(--accent-cyan)",
                      letterSpacing: "-0.06em",
                    }}
                  >
                    ${Number(product.price || 0).toFixed(0)}
                  </div>
                  <p className="vtw-body-text" style={{ margin: "0.7rem 0 0" }}>
                    {product.desc}
                  </p>
                  <ul className="vtw-list" style={{ marginTop: "1rem" }}>
                    {(product.features || []).map((feature) => (
                      <li key={`${product.id}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                  <div
                    className="vtw-hero-actions"
                    style={{ marginTop: "1.2rem" }}
                  >
                    <button
                      type="button"
                      className="vtw-button vtw-button-primary"
                      onClick={() => void beginCheckout(product, "stripe")}
                      disabled={!stripeReady}
                    >
                      {stripeReady ? "Pay with Stripe" : "Loading Stripe"}
                    </button>
                    <button
                      type="button"
                      className="vtw-button vtw-button-secondary"
                      onClick={() => void beginCheckout(product, "paypal")}
                    >
                      Pay with PayPal
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="vtw-section">
          <div className="vtw-section__heading">
            <div className="vtw-section-label">Try before you buy</div>
            <h2 className="vtw-section-title">
              Open real app previews right now.
            </h2>
            <p className="vtw-section-copy">
              The fastest way to understand the platform is to try the working
              app surfaces before committing to a bigger site package.
            </p>
          </div>
          <div className="vtw-grid-3">
            {FEATURED_TRY_NOW_APPS.map((app) => (
              <article
                key={app.id}
                className="vtw-glass-card vtw-card-hover"
                style={{ padding: "1.3rem" }}
              >
                <div className="vtw-chip">Live preview</div>
                <h3
                  style={{
                    margin: "0.9rem 0 0.55rem",
                    fontFamily: "var(--font-display)",
                    fontSize: "1.38rem",
                  }}
                >
                  {app.title}
                </h3>
                <p className="vtw-body-text" style={{ margin: 0 }}>
                  {app.copy}
                </p>
                <div className="vtw-hero-actions" style={{ marginTop: "1rem" }}>
                  <a
                    className="vtw-button vtw-button-secondary"
                    href={app.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {app.cta}
                    <ExternalLink size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="vtw-section">
          <div className="vtw-section__heading">
            <div className="vtw-section-label">All apps</div>
            <h2 className="vtw-section-title">
              Every app available to buy. Preview, then pay with Stripe or
              PayPal.
            </h2>
            <p className="vtw-section-copy">
              Each card includes the price and direct checkout. Try the preview
              link first when available.
            </p>
          </div>
          <div className="vtw-app-cards-grid">
            {(catalog.apps || []).map((app) => {
              const price = Number(app.price ?? 0);
              const previewUrl = String(app.previewUrl || "").trim();
              const downloadUrl = String(app.downloadUrl || "").trim();
              return (
                <article
                  key={app.id}
                  className="vtw-glass-card vtw-card-hover vtw-app-card"
                  style={{ padding: "1.35rem" }}
                >
                  <div className="vtw-inline-meta">
                    <span className="vtw-chip">
                      {app.label || app.type || "App"}
                    </span>
                    <span className="vtw-chip vtw-app-price">
                      ${price.toFixed(2)}{" "}
                      {app.interval === "month" ? "/mo" : ""}
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: "0.9rem 0 0.4rem",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.35rem",
                    }}
                  >
                    {app.title}
                  </h3>
                  <p className="vtw-body-text" style={{ margin: 0 }}>
                    {app.desc}
                  </p>
                  <div
                    className="vtw-hero-actions"
                    style={{
                      marginTop: "1rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    {previewUrl && (
                      <a
                        className="vtw-button vtw-button-secondary"
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {downloadUrl && !previewUrl && (
                      <a
                        className="vtw-button vtw-button-secondary"
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      className="vtw-button vtw-button-primary"
                      onClick={() =>
                        void beginCheckout(app as CatalogItem, "stripe")
                      }
                      disabled={!stripeReady}
                    >
                      {stripeReady ? "Stripe" : "…"}
                    </button>
                    <button
                      type="button"
                      className="vtw-button vtw-button-secondary"
                      onClick={() =>
                        void beginCheckout(app as CatalogItem, "paypal")
                      }
                    >
                      PayPal
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="vtw-grid-2">
          <article className="vtw-glass-card" style={{ padding: "1.35rem" }}>
            <div className="vtw-section-label">One-stop-shop direction</div>
            <h2
              className="vtw-section-title"
              style={{
                margin: "0.75rem 0 0.6rem",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              }}
            >
              Domains, signup flows, and databases belong in the same customer
              path.
            </h2>
            <p className="vtw-section-copy">
              The commercial direction is straightforward: voice-built pages
              first, then domain hookup, database-backed signup, and
              partner-powered registrar revenue as the next layer.
            </p>
            <ul className="vtw-list" style={{ marginTop: "1rem" }}>
              {PRICING_SUPPORT_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="vtw-glass-card" style={{ padding: "1.35rem" }}>
            <div className="vtw-section-label">Need a guided build?</div>
            <h2
              className="vtw-section-title"
              style={{
                margin: "0.75rem 0 0.6rem",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              }}
            >
              Start with pricing or talk to us about a fuller system.
            </h2>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {[
                "Single-page launch for speed and validation.",
                "Small-site package with trust pages and conversion structure.",
                "Commerce expansion when you need catalog, checkout, and more content depth.",
              ].map((point) => (
                <div
                  key={point}
                  style={{
                    display: "flex",
                    gap: "0.65rem",
                    alignItems: "center",
                    color: "var(--text-soft)",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div className="vtw-hero-actions" style={{ marginTop: "1.2rem" }}>
              <Link to="/pricing" className="vtw-button vtw-button-primary">
                Review pricing
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="vtw-button vtw-button-secondary">
                Talk about a custom build
              </Link>
            </div>
          </article>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          className="vtw-glass-card"
          style={{ padding: "1.25rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div className="vtw-section-label">Catalog status</div>
              <h3
                style={{
                  margin: "0.55rem 0 0.25rem",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                }}
              >
                {loading
                  ? "Loading catalog..."
                  : `${serviceProducts.length} launch packages and ${previewApps.length} previewable apps live`}
              </h3>
              <p className="vtw-body-text" style={{ margin: 0 }}>
                Catalog data is coming from the live worker source, not
                hardcoded page markup.
              </p>
            </div>
            <Link to="/" className="vtw-button vtw-button-secondary">
              Back to homepage
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </PageLayout>
  );
};

export default StorePage;
