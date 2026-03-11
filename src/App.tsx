import { AnimatePresence, motion } from "framer-motion";
import {
  AppWindow,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Music3,
  PauseCircle,
  ShoppingBag,
  Tv,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import AudioWaveform from "./components/AudioWaveform";
import AvatarAssistant from "./components/AvatarAssistant";
import EnhancedHamburgerNav from "./components/EnhancedHamburgerNav";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalFooter from "./components/GlobalFooter";
import ScrollReveal from "./components/ScrollReveal";
import TectonicBackground from "./components/TectonicBackground";
import { FALLBACK_INTRO_SONG, INTRO_SONG } from "./constants";
import {
  HOME_EXPERIENCES,
  HOME_FEATURES,
  HOME_PROCESS,
  HOME_TESTIMONIALS,
} from "./content/homeContent";
import BlogPage from "./pages/BlogPage";
import CategoryPage from "./pages/CategoryPage";
import GenericContentPage from "./pages/GenericContentPage";
import { audioEngine } from "./services/audioEngine";
import { getSeoCopyForPath } from "./shared/siteManifest";
import siteConfig from "./site-config.json";
import { escapeHtml } from "./utils/htmlSanitizer";
import { trackRevenueEvent } from "./utils/revenueTracking";

declare global {
  interface Window {
    __VTW_REACT_NAVIGATE__?: (to: string) => void;
    __ENV?: Record<string, unknown>;
  }
}

type PricingTier = {
  name: string;
  pages: string;
  price: string;
  desc: string;
  highlight?: boolean;
  features: string[];
};

type AdSlotKey =
  | "ADSENSE_SLOT_TOP"
  | "ADSENSE_SLOT_MID"
  | "ADSENSE_SLOT_BOTTOM";

type FaqItem = {
  question: string;
  answer: string;
};

type RuntimeHomeConfig = {
  hero?: {
    headline?: string;
    subheadline?: string;
  };
};

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Solo",
    pages: "1 page",
    price: "$49",
    desc: "For single landing pages, portfolios, and focused launch campaigns.",
    features: [
      "Custom domain and SSL",
      "Fast launch shell",
      "Basic SEO structure",
      "Email support",
    ],
  },
  {
    name: "Business",
    pages: "5 pages",
    price: "$199",
    desc: "For teams that need a premium public presence with stronger conversion depth.",
    highlight: true,
    features: [
      "Everything in Solo",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    pages: "Unlimited",
    price: "$499",
    desc: "For full ecosystems, white-label delivery, and more controlled rollout paths.",
    features: [
      "Everything in Business",
      "Dedicated support",
      "White-label options",
      "Custom development",
      "SLA guarantees",
    ],
  },
];

const AD_COMPLIANCE_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Trust Center", href: "/trust" },
  { label: "Status", href: "/status" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I activate live AdSense units?",
    answer:
      "Set ADSENSE_PUBLISHER and slot values in environment config. Until then, placeholders render so layout stays review-friendly.",
  },
  {
    question: "Can I control ad density?",
    answer:
      "Yes. Placement controls keep the editorial-to-ad ratio predictable and easier to review.",
  },
  {
    question: "How are metrics calculated?",
    answer:
      "Dashboard metrics are derived from orders, sessions, and trailing windows with consistent formulas.",
  },
];

const readRuntimeEnvValue = (key: string): string => {
  if (typeof window === "undefined") return "";
  const value = window.__ENV?.[key];
  return typeof value === "string" ? value.trim() : "";
};

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

const RouterNavigationBridge: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.__VTW_REACT_NAVIGATE__ = (to: string) => {
      navigate(to);
    };

    return () => {
      delete window.__VTW_REACT_NAVIGATE__;
    };
  }, [navigate]);

  return null;
};

const AdSensePlacement: React.FC<{
  slotKey: AdSlotKey;
  title: string;
  description: string;
}> = ({ slotKey, title, description }) => {
  const publisher = readRuntimeEnvValue("ADSENSE_PUBLISHER");
  const slot =
    readRuntimeEnvValue(slotKey) || readRuntimeEnvValue("ADSENSE_SLOT");
  const showLiveUnit = Boolean(publisher && slot);

  useEffect(() => {
    if (!showLiveUnit) return;
    try {
      (
        (window as Window & { adsbygoogle?: Record<string, unknown>[] })
          .adsbygoogle || []
      ).push({});
    } catch (_) {
      // Ad script can throw before network or hydration is fully ready.
    }
  }, [showLiveUnit]);

  return (
    <ScrollReveal as="aside" className="vtw-section" variant="fade">
      <div className="vtw-glass-card" style={{ padding: "1.2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "0.9rem",
          }}
        >
          <span className="vtw-chip">Advertisement</span>
          <span className="vtw-chip">
            {showLiveUnit ? "Live slot" : "Placeholder"}
          </span>
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "1.3rem",
          }}
        >
          {title}
        </h3>
        <p className="vtw-body-text" style={{ margin: "0.6rem 0 0" }}>
          {description}
        </p>
        <div
          style={{
            minHeight: "130px",
            marginTop: "1rem",
            padding: "1rem",
            border: "1px dashed rgba(255,255,255,0.18)",
            borderRadius: "22px",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {showLiveUnit ? (
            <ins
              className="adsbygoogle vtw-ad-block"
              data-ad-client={publisher}
              data-ad-slot={slot}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          ) : (
            <p className="vtw-body-text" style={{ margin: 0 }}>
              Configure <code>ADSENSE_PUBLISHER</code> and slot variables to
              render live ads. The placeholder keeps spacing stable during
              review.
            </p>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
};

const HomeView: React.FC = () => {
  const audioPlayingRef = useRef(false);
  const musicManuallyStoppedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const flowPhaseRef = useRef("ready");

  const [tryPrompt, setTryPrompt] = useState("");
  const [flowPhase, setFlowPhase] = useState<
    "ready" | "listening" | "confirm" | "generating" | "result"
  >("ready");
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [generatedSiteId, setGeneratedSiteId] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [previewLoadState, setPreviewLoadState] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [heroClock, setHeroClock] = useState("");
  const [runtimeHomeConfig, setRuntimeHomeConfig] =
    useState<RuntimeHomeConfig | null>(null);

  const FALLBACK_PREVIEW_URL = "/demo";
  const heroHeadline =
    runtimeHomeConfig?.hero?.headline?.trim() ||
    siteConfig?.copy?.headline?.trim() ||
    "Launch production-ready sites with one spoken command.";
  const heroSubhead =
    runtimeHomeConfig?.hero?.subheadline?.trim() ||
    siteConfig?.copy?.subhead?.trim() ||
    "Voice-to-website automation that builds, tests, and deploys in minutes with no handoffs or guesswork.";
  const homeSeoCopy = getSeoCopyForPath("/");
  const activeTier = PRICING_TIERS[activeTierIndex];
  const resolvedPreviewUrl =
    generatedPreviewUrl ||
    (generatedSiteId ? `/preview/${generatedSiteId}` : "") ||
    FALLBACK_PREVIEW_URL;

  useEffect(() => {
    flowPhaseRef.current = flowPhase;
  }, [flowPhase]);

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

    setHeroClock(format());
    const id = window.setInterval(() => setHeroClock(format()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;

    const loadRuntimeHomeConfig = async () => {
      try {
        const response = await fetch("/config/home.json", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const data = (await response.json()) as RuntimeHomeConfig;
        if (active) setRuntimeHomeConfig(data);
      } catch (_) {
        // Fall back to bundled copy.
      }
    };

    loadRuntimeHomeConfig();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (flowPhase !== "result" || previewLoadState !== "loading") return;
    const timer = window.setTimeout(() => {
      setPreviewLoadState((current) =>
        current === "loading" ? "error" : current
      );
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [flowPhase, previewLoadState]);

  useEffect(() => {
    document.title = homeSeoCopy.title;
    const description = heroSubhead.trim() || homeSeoCopy.description;

    upsertMetaTag(
      'meta[name="description"]',
      { name: "description" },
      description
    );
    upsertMetaTag(
      'meta[property="og:title"]',
      { property: "og:title" },
      homeSeoCopy.title
    );
    upsertMetaTag(
      'meta[property="og:description"]',
      { property: "og:description" },
      description
    );
    upsertMetaTag(
      'meta[name="twitter:title"]',
      { name: "twitter:title" },
      homeSeoCopy.title
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description
    );

    const canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (canonical) canonical.href = window.location.href;

    upsertJsonLd("home", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "VoiceToWebsite",
      description,
      url: window.location.href,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "49",
        priceCurrency: "USD",
      },
    });
  }, [heroSubhead, homeSeoCopy.description, homeSeoCopy.title]);

  const startThemeSong = useCallback(async (overrideManualStop = false) => {
    if (musicManuallyStoppedRef.current && !overrideManualStop) return false;
    await audioEngine.enable();
    audioEngine.unmuteMusicIfNeeded?.();

    let ok = await audioEngine.playMusic(INTRO_SONG);
    if (!ok) ok = await audioEngine.playMusic(FALLBACK_INTRO_SONG);

    audioPlayingRef.current = ok;
    setIsMusicPlaying(ok);
    return ok;
  }, []);

  const stopThemeSong = useCallback(() => {
    musicManuallyStoppedRef.current = true;
    audioEngine.stopMusic();
    audioPlayingRef.current = false;
    setIsMusicPlaying(false);
  }, []);

  useEffect(() => {
    // Keep music opt-in so production and preview do not trigger autoplay warnings.
    audioEngine.setVolume(0.36);
  }, []);

  const initializeSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      if (flowPhaseRef.current !== "listening") return;
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      setTryPrompt(transcript);
    };

    recognition.onend = () => {
      if (flowPhaseRef.current === "listening") setFlowPhase("confirm");
    };

    recognition.onerror = (error: any) => {
      if (flowPhaseRef.current !== "listening") return;
      console.error("Speech recognition error:", error);
      setFlowPhase("ready");
      setGenerateError(
        error?.message || "Voice recognition encountered an error"
      );
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  useEffect(() => {
    const recognition = initializeSpeechRecognition();
    if (!recognition) return;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [initializeSpeechRecognition]);

  const startListening = () => {
    const recognition = initializeSpeechRecognition();
    if (!recognition) {
      setGenerateError(
        "Voice capture is not available in this browser. Use Chrome or Edge."
      );
      return;
    }

    setGenerateError("");
    setTryPrompt("");
    setFlowPhase("listening");

    try {
      recognition.start();
    } catch (_) {
      setFlowPhase("ready");
      setGenerateError(
        "Microphone could not start. Check browser permissions."
      );
    }
  };

  const stopMic = () => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    setFlowPhase("confirm");
  };

  const resetFlow = () => {
    setFlowPhase("ready");
    setTryPrompt("");
    setGeneratedPreviewUrl("");
    setGeneratedSiteId("");
    setGenerateError("");
    setPreviewLoadState("idle");
  };

  const validatePrompt = (
    prompt: string
  ): { valid: boolean; error?: string } => {
    if (!prompt || !prompt.trim()) {
      return { valid: false, error: "Prompt cannot be empty" };
    }

    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      return {
        valid: false,
        error: "Prompt must be at least 3 characters long",
      };
    }

    if (trimmed.length > 5000) {
      return {
        valid: false,
        error: "Prompt is too long (max 5000 characters)",
      };
    }

    if (escapeHtml(trimmed) !== trimmed) {
      return {
        valid: false,
        error: "Prompt contains invalid characters or HTML content",
      };
    }

    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /@import/gi,
      /expression\s*\(/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return { valid: false, error: "Prompt contains invalid content" };
      }
    }

    if (/\s{20,}/.test(trimmed)) {
      return { valid: false, error: "Prompt contains excessive whitespace" };
    }

    if (/(.)\1{50,}/.test(trimmed)) {
      return {
        valid: false,
        error: "Prompt contains excessive repeated characters",
      };
    }

    return { valid: true };
  };

  const generateSite = async () => {
    const validation = validatePrompt(tryPrompt);
    if (!validation.valid) {
      setGenerateError(validation.error || "Invalid input");
      return;
    }

    setFlowPhase("generating");
    setGenerateError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tryPrompt.trim(), tone: "default" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error || `Generate failed (HTTP ${response.status})`
        );
      }

      const siteId = String(data?.siteId || "");
      const previewPath =
        String(data?.previewUrl || "").trim() ||
        (siteId ? `/preview/${siteId}` : "");

      let previewUrl = "";
      try {
        previewUrl = previewPath
          ? new URL(previewPath, window.location.origin).toString()
          : "";
      } catch (_) {
        previewUrl = previewPath;
      }

      setGeneratedSiteId(siteId);
      setGeneratedPreviewUrl(previewUrl || FALLBACK_PREVIEW_URL);
      setPreviewLoadState("loading");
      setFlowPhase("result");
    } catch (error: any) {
      setGenerateError(error?.message || "Generate failed.");
      setFlowPhase("confirm");
    }
  };

  const shiftTier = useCallback((direction: number) => {
    setActiveTierIndex((current) => {
      const next =
        (current + direction + PRICING_TIERS.length) % PRICING_TIERS.length;
      return next;
    });
  }, []);

  const handleTierTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTierTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    if (delta > 40) shiftTier(-1);
    if (delta < -40) shiftTier(1);
    setTouchStartX(null);
  };

  const toggleThemeSong = () => {
    if (isMusicPlaying) {
      stopThemeSong();
      return;
    }
    musicManuallyStoppedRef.current = false;
    startThemeSong(true).catch(() => {});
  };

  const routeToStore = useCallback(
    (source: string, params: Record<string, string> = {}) => {
      trackRevenueEvent("store_cta_clicked", {
        source,
        ...params,
      });

      const search = new URLSearchParams({
        utm_source: source,
        utm_medium: "website",
        utm_campaign: "website",
      });

      Object.entries(params).forEach(([key, value]) => {
        if (!value) return;
        search.set(key, value);
      });

      window.location.href = `/store.html?${search.toString()}`;
    },
    []
  );

  return (
    <ErrorBoundary>
      <div className="vtw-app-shell">
        <div className="vtw-shell-gradient" aria-hidden="true" />
        <main className="vtw-container-wide" style={{ paddingBottom: "4rem" }}>
          <section className="vtw-hero-shell">
            <ScrollReveal as="div" className="vtw-hero-copy" variant="blur">
              <div className="vtw-inline-meta">
                <span className="vtw-chip">
                  Live clock {heroClock || "00:00:00"}
                </span>
                <span className="vtw-chip">SEO-first shell</span>
                <span className="vtw-chip">Store-ready</span>
              </div>
              <p className="vtw-hero-kicker">
                Modern voice-to-website workflow
              </p>
              <h1 className="vtw-hero-title">
                <span className="glow">{heroHeadline}</span>
              </h1>
              <p className="vtw-hero-body">{heroSubhead}</p>
              <div className="vtw-hero-actions">
                <button
                  type="button"
                  aria-label="Tap to create a website"
                  className="vtw-button vtw-button-primary"
                  onClick={startListening}
                >
                  Tap to create a website
                </button>
                <button
                  type="button"
                  className="vtw-button vtw-button-secondary"
                  onClick={() => routeToStore("home_primary_buy_now")}
                >
                  Buy and launch
                </button>
                <button
                  type="button"
                  className="vtw-button vtw-button-secondary"
                  onClick={toggleThemeSong}
                >
                  {isMusicPlaying ? (
                    <PauseCircle size={16} />
                  ) : (
                    <Music3 size={16} />
                  )}
                  {isMusicPlaying ? "Stop score" : "Play score"}
                </button>
              </div>
              {generateError && (
                <p style={{ margin: 0, color: "#f38ea3", fontWeight: 600 }}>
                  {generateError}
                </p>
              )}
              <div className="vtw-metric-grid">
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Launch flow</span>
                  <span className="vtw-metric__value">Voice to live</span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Content hygiene</span>
                  <span className="vtw-metric__value">Trust pages linked</span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Blog cadence</span>
                  <span className="vtw-metric__value">3 hour refresh</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal as="aside" className="vtw-hero-panel" delayMs={120}>
              <div className="vtw-hero-panel__top">
                <div className="vtw-hero-panel__window" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="vtw-chip">Premium public shell</span>
              </div>
              <div
                className="vtw-section__heading"
                style={{ marginBottom: "1rem" }}
              >
                <div className="vtw-section-label">
                  What the system organizes
                </div>
                <h2
                  className="vtw-section-title"
                  style={{ margin: 0, fontSize: "clamp(1.7rem, 3vw, 2.7rem)" }}
                >
                  One command becomes a structured site map.
                </h2>
              </div>
              <div className="vtw-code-block">
                {[
                  "Voice brief translated into sections and metadata",
                  "Preview-first release keeps production safe",
                  "Pricing, blog, support, and archive routes stay connected",
                ].map((line) => (
                  <div key={line} className="vtw-code-line">
                    {line}
                  </div>
                ))}
              </div>
              <div className="vtw-grid-auto">
                {HOME_PROCESS.map((item) => (
                  <article
                    key={item.step}
                    className="vtw-card-hover"
                    style={{
                      padding: "1rem",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "22px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="vtw-section-label">{item.step}</div>
                    <h3
                      style={{
                        margin: "0.7rem 0 0.45rem",
                        fontFamily: "var(--font-display)",
                        fontSize: "1.08rem",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="vtw-body-text" style={{ margin: 0 }}>
                      {item.copy}
                    </p>
                  </article>
                ))}
              </div>
            </ScrollReveal>
          </section>

          <AdSensePlacement
            slotKey="ADSENSE_SLOT_TOP"
            title="Top placement"
            description="Editorial content appears before and after this area so the page remains balanced and review-ready."
          />

          <ScrollReveal as="section" className="vtw-section" id="features">
            <div className="vtw-section__heading">
              <div className="vtw-section-label">Features</div>
              <h2 className="vtw-section-title">
                A cleaner, premium interface without losing the working engine
                underneath.
              </h2>
              <p className="vtw-section-copy">
                The redesign sharpens the visual system while leaving the public
                routes, generation flow, store CTAs, trust pages, and runtime
                content model intact.
              </p>
            </div>
            <div className="vtw-grid-3">
              {HOME_FEATURES.map((feature, index) => (
                <article
                  key={feature.title}
                  className="vtw-glass-card vtw-card-hover"
                  style={{ padding: "1.35rem" }}
                >
                  <div className="vtw-section-label">{feature.eyebrow}</div>
                  <h3
                    className="vtw-card-title"
                    style={{
                      margin: "0.9rem 0 0.65rem",
                      fontSize: "1.45rem",
                      lineHeight: 1.02,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="vtw-body-text" style={{ margin: 0 }}>
                    {feature.copy}
                  </p>
                  <ul className="vtw-list" style={{ marginTop: "1rem" }}>
                    {feature.points.map((point) => (
                      <li key={`${feature.title}-${point}`}>{point}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "1rem" }} className="vtw-chip">
                    Card {String(index + 1).padStart(2, "0")}
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="vtw-section">
            <div className="vtw-grid-2">
              <article
                className="vtw-glass-card"
                style={{ padding: "1.35rem" }}
              >
                <div
                  className="vtw-section__heading"
                  style={{ marginBottom: "1rem" }}
                >
                  <div className="vtw-section-label">How it works</div>
                  <h2
                    className="vtw-section-title"
                    style={{ margin: 0, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
                  >
                    Distinct steps, less confusion, and a clearer path to
                    launch.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  {HOME_PROCESS.map((item) => (
                    <article
                      key={item.step}
                      style={{
                        display: "grid",
                        gap: "0.45rem",
                        padding: "1rem",
                        borderRadius: "22px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="vtw-section-label">{item.step}</div>
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-display)",
                          fontSize: "1.15rem",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p className="vtw-body-text" style={{ margin: 0 }}>
                        {item.copy}
                      </p>
                    </article>
                  ))}
                </div>
              </article>

              <article
                className="vtw-glass-card"
                style={{ padding: "1.35rem" }}
              >
                <div
                  className="vtw-section__heading"
                  style={{ marginBottom: "1rem" }}
                >
                  <div className="vtw-section-label">Trust and compliance</div>
                  <h2
                    className="vtw-section-title"
                    style={{ margin: 0, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
                  >
                    Core support pages stay one click away.
                  </h2>
                  <p className="vtw-section-copy">
                    These routes remain visible for trust, SEO, and review
                    readiness while the footer carries lower-priority pages.
                  </p>
                </div>
                <div className="vtw-grid-auto">
                  {AD_COMPLIANCE_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="vtw-footer__link"
                    >
                      <span className="vtw-footer__link-label">
                        {item.label}
                      </span>
                      <span className="vtw-footer__link-copy">
                        Keep this page discoverable from the public shell.
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="vtw-section" id="demo">
            <div className="vtw-section__heading">
              <div className="vtw-section-label">Demo</div>
              <h2 className="vtw-section-title">
                The live voice flow still works. It just looks like it belongs
                on a premium product now.
              </h2>
              <p className="vtw-section-copy">
                Start with voice, confirm the prompt, and move into preview
                without leaving the public experience.
              </p>
            </div>
            <div className="vtw-grid-2">
              <article
                className="vtw-glass-card"
                style={{ padding: "1.35rem" }}
              >
                <AnimatePresence mode="wait">
                  {flowPhase === "ready" && (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="vtw-section-label">
                        Voice studio ready
                      </div>
                      <h3
                        style={{
                          margin: "0.8rem 0 0.7rem",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.7rem",
                        }}
                      >
                        Tap once to start the build conversation.
                      </h3>
                      <AudioWaveform
                        active={false}
                        mode="opener"
                        className="vt-waveform"
                      />
                      <div
                        className="vtw-hero-actions"
                        style={{ marginTop: "1rem" }}
                      >
                        <button
                          type="button"
                          aria-label="Start build demo"
                          className="vtw-button vtw-button-primary"
                          onClick={startListening}
                        >
                          Start build demo
                        </button>
                        <button
                          type="button"
                          className="vtw-button vtw-button-secondary"
                          onClick={() => routeToStore("home_demo_buy_now")}
                        >
                          Continue to store
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {flowPhase === "listening" && (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="vtw-section-label">Listening</div>
                      <h3
                        style={{
                          margin: "0.8rem 0 0.7rem",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.7rem",
                        }}
                      >
                        Speak the site you want.
                      </h3>
                      <AudioWaveform
                        active={true}
                        mode="opener"
                        className="vt-waveform"
                      />
                      <p
                        style={{
                          minHeight: "4rem",
                          margin: "0.8rem 0 0",
                          color: "var(--text-soft)",
                          fontSize: "1.15rem",
                        }}
                      >
                        {tryPrompt || "Listening for your command..."}
                      </p>
                      <button
                        type="button"
                        className="vtw-button vtw-button-secondary"
                        onClick={stopMic}
                        style={{ marginTop: "1rem" }}
                      >
                        Finish command
                      </button>
                    </motion.div>
                  )}

                  {flowPhase === "confirm" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="vtw-section-label">Confirm prompt</div>
                      <h3
                        style={{
                          margin: "0.8rem 0 0.7rem",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.7rem",
                        }}
                      >
                        Ready to generate?
                      </h3>
                      <div
                        style={{
                          padding: "1rem",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "24px",
                          background: "rgba(255,255,255,0.03)",
                          color: "var(--text-soft)",
                          fontSize: "1.08rem",
                        }}
                      >
                        "{tryPrompt}"
                      </div>
                      <div
                        className="vtw-hero-actions"
                        style={{ marginTop: "1rem" }}
                      >
                        <button
                          type="button"
                          className="vtw-button vtw-button-secondary"
                          onClick={resetFlow}
                        >
                          Try again
                        </button>
                        <button
                          type="button"
                          className="vtw-button vtw-button-primary"
                          onClick={generateSite}
                        >
                          Make it
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {flowPhase === "generating" && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="vtw-section-label">Generating</div>
                      <h3
                        style={{
                          margin: "0.8rem 0 0.7rem",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.7rem",
                        }}
                      >
                        Building the preview now.
                      </h3>
                      <AudioWaveform
                        active={true}
                        mode="opener"
                        className="vt-waveform"
                      />
                      <p className="vtw-body-text" style={{ margin: 0 }}>
                        Structure, copy, and preview routing are being prepared.
                      </p>
                    </motion.div>
                  )}

                  {flowPhase === "result" && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="vtw-section-label">Result</div>
                      <h3
                        style={{
                          margin: "0.8rem 0 0.7rem",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.7rem",
                        }}
                      >
                        Site identity: {generatedSiteId}
                      </h3>
                      <div
                        className="vtw-inline-meta"
                        style={{ marginBottom: "1rem" }}
                      >
                        <span className="vtw-chip">
                          {previewLoadState === "loaded"
                            ? "Preview loaded"
                            : previewLoadState === "error"
                              ? "Preview fallback"
                              : "Preview loading"}
                        </span>
                        <span className="vtw-chip">Voice flow complete</span>
                      </div>
                      <div className="vtw-hero-actions">
                        <button
                          type="button"
                          className="vtw-button vtw-button-secondary"
                          onClick={resetFlow}
                        >
                          Build another
                        </button>
                        <a
                          href="/license.html"
                          className="vtw-button vtw-button-primary"
                        >
                          Claim ownership
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>

              <article className="vtw-glass-card" style={{ padding: "1.1rem" }}>
                <div
                  className="vtw-section-label"
                  style={{ marginBottom: "0.8rem" }}
                >
                  Preview surface
                </div>
                <div
                  style={{
                    overflow: "hidden",
                    borderRadius: "26px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(5,7,10,0.9)",
                  }}
                >
                  {flowPhase === "result" ? (
                    <div
                      className="vt-preview-scroll"
                      style={{ position: "relative" }}
                    >
                      {previewLoadState === "loading" && (
                        <div
                          aria-live="polite"
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(5,7,10,0.82)",
                            zIndex: 1,
                          }}
                        >
                          Loading preview...
                        </div>
                      )}
                      {previewLoadState === "error" && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            gap: "0.8rem",
                            padding: "1rem",
                            textAlign: "center",
                            background: "rgba(5,7,10,0.88)",
                            zIndex: 1,
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            Preview could not be displayed in-frame.
                          </p>
                          <a
                            href={resolvedPreviewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in new tab
                          </a>
                        </div>
                      )}
                      <iframe
                        key={resolvedPreviewUrl}
                        src={resolvedPreviewUrl}
                        className="vt-preview-frame"
                        title="Website preview"
                        scrolling="yes"
                        onLoad={() => setPreviewLoadState("loaded")}
                        onError={() => {
                          setPreviewLoadState("error");
                          setGeneratedPreviewUrl(FALLBACK_PREVIEW_URL);
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    </div>
                  ) : (
                    <div
                      className="vtw-empty-state"
                      style={{ minHeight: "420px", padding: "1.25rem" }}
                    >
                      <div style={{ display: "grid", gap: "0.8rem" }}>
                        <div className="vtw-chip">Preview first</div>
                        <h3
                          style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "1.5rem",
                          }}
                        >
                          When generation completes, the preview lands here.
                        </h3>
                        <p className="vtw-body-text" style={{ margin: 0 }}>
                          The flow stays in one place: capture the prompt,
                          confirm it, review the output, then move toward
                          launch.
                        </p>
                        <div style={{ display: "grid", gap: "0.55rem" }}>
                          {[
                            "Preview shell stays on the public page",
                            "Fallback opens the preview in a new tab",
                            "License CTA remains connected to the result",
                          ].map((line) => (
                            <div
                              key={line}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                justifyContent: "center",
                                color: "var(--text-soft)",
                              }}
                            >
                              <CheckCircle2 size={16} />
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>
          </ScrollReveal>

          <AdSensePlacement
            slotKey="ADSENSE_SLOT_MID"
            title="Mid-page placement"
            description="Positioned between substantial sections so the content path remains more prominent than the ad unit."
          />

          <ScrollReveal as="section" className="vtw-section" id="pricing">
            <div className="vtw-section__heading">
              <div className="vtw-section-label">Pricing</div>
              <h2 className="vtw-section-title">
                Swipe or step through plans without leaving the premium shell.
              </h2>
              <p className="vtw-section-copy">
                The commercial path stays simple: compare tiers, select the
                plan, and drop into the store with tracking intact.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="vtw-icon-button"
                aria-label="Previous pricing tier"
                onClick={() => shiftTier(-1)}
              >
                <ChevronLeft size={20} />
              </button>

              <div
                onTouchStart={handleTierTouchStart}
                onTouchEnd={handleTierTouchEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeTier.name}
                    className="vtw-glass-card"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{
                      padding: "1.5rem",
                      borderColor: activeTier.highlight
                        ? "rgba(0,242,255,0.34)"
                        : "rgba(255,255,255,0.1)",
                      boxShadow: activeTier.highlight
                        ? "0 28px 90px rgba(0,242,255,0.08)"
                        : undefined,
                    }}
                  >
                    <div className="vtw-inline-meta">
                      <span className="vtw-chip">{activeTier.pages}</span>
                      {activeTier.highlight && (
                        <span className="vtw-chip">Recommended</span>
                      )}
                    </div>
                    <h3
                      style={{
                        margin: "1rem 0 0.35rem",
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(2rem, 4vw, 3rem)",
                      }}
                    >
                      {activeTier.name}
                    </h3>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(2.8rem, 6vw, 4.6rem)",
                        letterSpacing: "-0.07em",
                        color: "var(--accent-cyan)",
                      }}
                    >
                      {activeTier.price}
                    </div>
                    <p
                      className="vtw-body-text"
                      style={{ margin: "0.7rem 0 0" }}
                    >
                      {activeTier.desc}
                    </p>
                    <ul className="vtw-list" style={{ marginTop: "1.1rem" }}>
                      {activeTier.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`vtw-button ${
                        activeTier.highlight
                          ? "vtw-button-primary"
                          : "vtw-button-secondary"
                      }`}
                      style={{ width: "100%", marginTop: "1.3rem" }}
                      onClick={() =>
                        routeToStore("home_pricing_tier", {
                          plan: activeTier.name.toLowerCase(),
                        })
                      }
                    >
                      Select tier
                    </button>
                  </motion.article>
                </AnimatePresence>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.55rem",
                    marginTop: "1rem",
                  }}
                >
                  {PRICING_TIERS.map((tier, index) => (
                    <button
                      key={tier.name}
                      type="button"
                      aria-label={`Go to ${tier.name} tier`}
                      onClick={() => setActiveTierIndex(index)}
                      style={{
                        width: index === activeTierIndex ? "34px" : "10px",
                        height: "10px",
                        borderRadius: "999px",
                        border: "none",
                        background:
                          index === activeTierIndex
                            ? "var(--accent-cyan)"
                            : "rgba(255,255,255,0.24)",
                        cursor: "pointer",
                        transition: "all 220ms ease",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="vtw-icon-button"
                aria-label="Next pricing tier"
                onClick={() => shiftTier(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="vtw-section">
            <div className="vtw-section__heading">
              <div className="vtw-section-label">Ecosystem</div>
              <h2 className="vtw-section-title">
                App store, store, and livestream surfaces are now part of the
                same visual language.
              </h2>
              <p className="vtw-section-copy">
                These supporting areas keep their functionality, but the public
                shell no longer treats them like separate worlds.
              </p>
            </div>
            <div className="vtw-grid-3">
              {HOME_EXPERIENCES.map((experience) => {
                const Icon =
                  experience.title === "App Store"
                    ? AppWindow
                    : experience.title === "Store"
                      ? ShoppingBag
                      : Tv;

                return (
                  <article
                    key={experience.title}
                    className="vtw-glass-card vtw-card-hover"
                    style={{ padding: "1.35rem" }}
                  >
                    <div className="vtw-chip">
                      <Icon size={15} />
                      {experience.title}
                    </div>
                    <h3
                      style={{
                        margin: "0.95rem 0 0.55rem",
                        fontFamily: "var(--font-display)",
                        fontSize: "1.45rem",
                      }}
                    >
                      {experience.title}
                    </h3>
                    <p className="vtw-body-text" style={{ margin: 0 }}>
                      {experience.copy}
                    </p>
                    <Link
                      to={experience.href}
                      className="vtw-button vtw-button-secondary"
                      style={{ marginTop: "1.1rem" }}
                    >
                      {experience.label}
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="vtw-section">
            <div className="vtw-grid-2">
              <article
                className="vtw-glass-card"
                style={{ padding: "1.35rem" }}
              >
                <div
                  className="vtw-section__heading"
                  style={{ marginBottom: "1rem" }}
                >
                  <div className="vtw-section-label">Testimonials</div>
                  <h2
                    className="vtw-section-title"
                    style={{ margin: 0, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
                  >
                    The interface feels calmer, but the real win is clarity.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "0.95rem" }}>
                  {HOME_TESTIMONIALS.map((testimonial) => (
                    <article
                      key={testimonial.name}
                      style={{
                        padding: "1rem",
                        borderRadius: "22px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p style={{ margin: 0, lineHeight: 1.7 }}>
                        “{testimonial.quote}”
                      </p>
                      <div
                        style={{
                          marginTop: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {testimonial.name}, {testimonial.role}
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article
                className="vtw-glass-card"
                style={{ padding: "1.35rem" }}
              >
                <div
                  className="vtw-section__heading"
                  style={{ marginBottom: "1rem" }}
                >
                  <div className="vtw-section-label">FAQ</div>
                  <h2
                    className="vtw-section-title"
                    style={{ margin: 0, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
                  >
                    Operating questions, answered clearly.
                  </h2>
                </div>
                <div style={{ display: "grid", gap: "0.95rem" }}>
                  {FAQ_ITEMS.map((item) => (
                    <article
                      key={item.question}
                      style={{
                        padding: "1rem",
                        borderRadius: "22px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-display)",
                          fontSize: "1.05rem",
                        }}
                      >
                        {item.question}
                      </h3>
                      <p
                        className="vtw-body-text"
                        style={{ margin: "0.55rem 0 0" }}
                      >
                        {item.answer}
                      </p>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </ScrollReveal>

          <AdSensePlacement
            slotKey="ADSENSE_SLOT_BOTTOM"
            title="Lower-page placement"
            description="A lower-page area for visitors who continue exploring after reviewing the product, demo, and pricing sections."
          />

          <ScrollReveal as="section" className="vtw-section">
            <div className="vtw-glass-card" style={{ padding: "1.5rem" }}>
              <div
                className="vtw-section__heading"
                style={{ marginBottom: "1rem" }}
              >
                <div className="vtw-section-label">Call to action</div>
                <h2
                  className="vtw-section-title"
                  style={{ margin: 0, maxWidth: "18ch" }}
                >
                  Move from curiosity to a launch-ready site path.
                </h2>
                <p className="vtw-section-copy">
                  Start the voice demo, review pricing, or dive into the content
                  layer through the blog and structured footer archive.
                </p>
              </div>
              <div className="vtw-hero-actions">
                <button
                  type="button"
                  className="vtw-button vtw-button-primary"
                  onClick={startListening}
                >
                  Start the voice demo
                </button>
                <Link to="/pricing" className="vtw-button vtw-button-secondary">
                  Review plans
                </Link>
                <Link to="/blog" className="vtw-button vtw-button-secondary">
                  Browse the blog
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </main>
        <ErrorBoundary fallback={null}>
          <GlobalFooter />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <RouterNavigationBridge />
      <TectonicBackground />
      <div className="tectonic-border" aria-hidden="true" />
      <EnhancedHamburgerNav />
      <ErrorBoundary fallback={null}>
        <AvatarAssistant />
      </ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/apps/category/:name" element={<CategoryPage />} />
        <Route path="/:slug" element={<GenericContentPage />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
