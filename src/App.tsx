/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BarChart3,
  Cpu,
  CreditCard,
  Globe,
  Layout,
  Menu,
  MessageSquare,
  Mic,
  Plus,
  Settings,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { initSecretFeatures, handleLogoClick } from "./lib/secretFeatures";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { BrandWallpaper } from "./components/BrandSystem";
import { PricingSection, TrustSection } from "./components/home/HomeContent";
import { cn } from "./lib/utils";

// --- Components ---
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();

  // Fold-on-scroll-down, reveal-on-scroll-up behavior. Threshold prevents
  // jitter on small wheel deltas. Always shown at the very top of the page.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        setIsScrolled(y > 20);
        if (y < 80) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Features", path: "/features" },
    { name: "Gallery", path: "/examples" },
    { name: "Pricing", path: "/pricing" },
    { name: "Mission", path: "/about" },
  ];

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "site-header-wallpaper fixed top-0 left-0 right-0 z-50 transition-[transform,background-color,backdrop-filter,height,border-color] duration-500 ease-out px-5 lg:px-10 flex items-center justify-between overflow-hidden",
        isScrolled
          ? "h-16 bg-black/65 backdrop-blur-xl border-b border-white/8"
          : "h-24 bg-transparent border-b border-transparent",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Link
        to="/"
        className="relative z-10 flex items-center gap-3 group"
        onClick={handleLogoClick}
        aria-label="VoiceToWebsite home"
      >
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-cyan to-brand-purple flex items-center justify-center neon-glow-cyan group-hover:scale-110 transition-transform">
          <Mic className="text-white w-5 h-5 animate-pulse" aria-hidden="true" />
        </div>
        <span className="hidden sm:inline-flex font-display text-lg font-black tracking-tight text-white">
          Voice<span className="bg-linear-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">ToWebsite</span>
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="relative z-10 hidden lg:flex items-center gap-9 text-[10px] uppercase font-black tracking-[0.22em] text-white/55">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            aria-current={location.pathname === link.path ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-cyan-200 relative py-2",
              location.pathname === link.path &&
                "text-cyan-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-cyan-300",
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="relative z-10 hidden lg:flex items-center gap-5">
        <Link
          to="/signin"
          className="text-[10px] uppercase font-black tracking-[0.22em] text-white/55 hover:text-white transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-15px_rgba(34,211,238,0.6)] active:translate-y-0"
        >
          Generate Now
        </Link>
      </div>

      {/* Mobile Menu Trigger */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="relative z-10 lg:hidden p-2.5 rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/15 transition"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
        {isOpen && (
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            className="fixed inset-y-0 right-0 z-60 flex w-full max-w-sm flex-col bg-[#050507]/98 backdrop-blur-2xl border-l border-white/10 p-8"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-display text-lg font-black tracking-tight">
                Voice<span className="bg-linear-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">ToWebsite</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-1 text-2xl font-black tracking-tight">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    aria-current={location.pathname === link.path ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3 transition-colors hover:bg-white/5 hover:text-cyan-200",
                      location.pathname === link.path && "bg-white/5 text-cyan-200",
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl px-4 py-3 hover:bg-white/5 hover:text-cyan-200 transition-colors"
                >
                  Dashboard
                </Link>
              </motion.div>
            </nav>
            <div className="mt-auto space-y-3">
              <Link
                to="/signin"
                onClick={() => setIsOpen(false)}
                className="block w-full py-4 rounded-2xl border border-white/12 bg-white/5 text-center font-bold uppercase tracking-[0.18em] text-xs hover:bg-white/10 transition"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="block w-full py-4 rounded-2xl bg-linear-to-r from-cyan-300 to-fuchsia-400 text-black text-center font-black uppercase tracking-[0.18em] text-xs shadow-[0_18px_60px_-15px_rgba(232,121,249,0.5)]"
              >
                Generate Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="site-footer-wallpaper relative overflow-hidden pt-32 pb-20 px-6 lg:px-12 bg-black/50 border-t border-white/5">
    {/* Synthwave horizon — GPU-only transforms, hidden under prefers-reduced-motion */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 motion-reduce:hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-fuchsia-400/40 blur-3xl animate-pulse" />
      <div className="absolute inset-x-0 bottom-0 h-24 [background:repeating-linear-gradient(90deg,transparent_0,transparent_38px,rgba(34,211,238,0.18)_38px,rgba(34,211,238,0.18)_39px)] mask-[linear-gradient(to_top,black,transparent)] perspective-near transform-[rotateX(60deg)] origin-bottom" />
      <div className="absolute inset-x-0 bottom-0 h-24 [background:repeating-linear-gradient(0deg,transparent_0,transparent_18px,rgba(232,121,249,0.22)_18px,rgba(232,121,249,0.22)_19px)] mask-[linear-gradient(to_top,black,transparent)] perspective-near transform-[rotateX(60deg)] origin-bottom" />
    </div>
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative">
      <div className="lg:col-span-2">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-cyan to-brand-purple flex items-center justify-center">
            <Mic className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter">
            VoiceToWebsite<span className="text-brand-cyan">.com</span>
          </span>
        </Link>
        <p className="text-white/40 max-w-xs text-sm leading-relaxed">
          The future of web design is here. Speak your vision into existence
          with the world's most advanced AI website builder.
        </p>
      </div>
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">
          Product
        </h4>
        <ul className="space-y-4 text-sm text-white/60">
          <li>
            <Link to="/features" className="hover:text-brand-cyan">
              Features
            </Link>
          </li>
          <li>
            <Link to="/examples" className="hover:text-brand-cyan">
              Examples
            </Link>
          </li>
          <li>
            <Link to="/pricing" className="hover:text-brand-cyan">
              Pricing
            </Link>
          </li>
          <li>
            <Link
              to="/deployment-ready-prompt"
              className="hover:text-brand-cyan"
            >
              Launch Prompt
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className="hover:text-brand-cyan">
              Dashboard
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">
          Company
        </h4>
        <ul className="space-y-4 text-sm text-white/60">
          <li>
            <Link to="/about" className="hover:text-brand-cyan">
              About
            </Link>
          </li>
          <li>
            <Link to="/blog" className="hover:text-brand-cyan">
              Blog
            </Link>
          </li>
          <li>
            <Link to="/stories" className="hover:text-brand-cyan">
              Stories
            </Link>
          </li>
          <li>
            <Link to="/legal" className="hover:text-brand-cyan">
              Legal
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">
          Legal
        </h4>
        <ul className="space-y-4 text-sm text-white/60">
          <li>
            <Link to="/terms" className="hover:text-brand-cyan">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="hover:text-brand-cyan">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link to="/dmca" className="hover:text-brand-cyan">
              DMCA
            </Link>
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/20">
      <p>© 2026 VoiceToWebsite.com. All rights reserved.</p>
      <p>
        All sales are final. No refunds. User is responsible for generated
        content.
      </p>
    </div>
  </footer>
);

import { HomeV2 } from "./components/home/v2/HomeV2";
import { PricingV2 } from "./pages/PricingV2";
import { Blog as BlogV2 } from "./pages/Blog";
import { BlogPost as BlogPostV2 } from "./pages/BlogPost";
import { Features as FeaturesReal } from "./pages/Features";
import { FAQ as FAQReal } from "./pages/FAQ";
import ExamplesReal from "./pages/Examples";
import { About as AboutReal } from "./pages/About";
import { Contact as ContactReal } from "./pages/Contact";
import GlobalSearch from "./components/GlobalSearch";
import { UniversalDeploymentPrompt } from "./pages/UniversalDeploymentPrompt";
import EngineTester from "./pages/EngineTester";
// --- AdSense Component (real) ---
import { GoogleAdSense } from "./components/GoogleAdSense";
export const AdContainer = ({ className, slot }: { className?: string; slot?: string }) => (
  <div className={cn("w-full", className)}>
    <GoogleAdSense slot={slot || "homepage-mid"} />
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Authentication Pages ---
import { sendMagicLink, signInWithGoogle } from "./lib/firebase";

type AuthMode = "signin" | "signup";

const AuthCard: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const successPath = mode === "signin" ? "/dashboard" : "/pricing";

  const handleGoogle = async () => {
    setErr(null);
    setBusy("google");
    try {
      await signInWithGoogle();
      window.location.href = successPath;
    } catch (error) {
      console.error("Google auth failed", error);
      setErr(error instanceof Error ? error.message : "Google sign-in failed. Try again.");
      setBusy(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Enter a valid email address.");
      return;
    }
    setBusy("email");
    try {
      await sendMagicLink(email.trim(), successPath);
      setLinkSent(true);
    } catch (error) {
      console.error("Magic link failed", error);
      setErr(error instanceof Error ? error.message : "Could not send sign-in link. Try Google instead.");
    } finally {
      setBusy(null);
    }
  };

  const titles = {
    signin: { h1: "Welcome back.", sub: "Sign in to manage your sites, billing, and team." },
    signup: { h1: "Join the Elite.", sub: "Start building premium websites with voice in seconds." },
  };
  const t = titles[mode];

  return (
    <div className="pt-32 pb-24 px-5 sm:px-8 flex flex-col items-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-8 backdrop-blur-2xl sm:p-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-300 to-fuchsia-400 flex items-center justify-center shadow-[0_18px_60px_-15px_rgba(34,211,238,0.6)]">
            <User className="text-black w-7 h-7" aria-hidden="true" />
          </div>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-center tracking-tight">
          {t.h1}
        </h1>
        <p className="text-center text-white/55 text-sm mt-3 mb-8 leading-6">
          {t.sub}
        </p>

        {linkSent ? (
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/8 p-5 text-center">
            <div className="font-display text-lg font-black tracking-tight text-cyan-100">Check your inbox.</div>
            <p className="mt-2 text-sm text-white/70 leading-6">
              We sent a one-click sign-in link to <strong className="text-white">{email}</strong>. Open it on this device to continue.
            </p>
            <button
              type="button"
              onClick={() => {
                setLinkSent(false);
                setEmail("");
              }}
              className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200 hover:text-white"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={busy !== null}
              type="button"
              className="w-full py-3.5 rounded-2xl bg-white text-black flex items-center justify-center gap-3 font-bold transition hover:-translate-y-px hover:shadow-[0_18px_60px_-15px_rgba(255,255,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt=""
                className="w-5 h-5"
              />
              {busy === "google" ? "Opening Google…" : "Continue with Google"}
            </button>

            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/35">or email link</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              <label className="block">
                <span className="sr-only">Email address</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-black/30 px-5 py-3.5 text-sm text-white placeholder-white/35 outline-none transition focus:border-cyan-300/60 focus:bg-black/40"
                />
              </label>
              <button
                type="submit"
                disabled={busy !== null}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-cyan-300 to-fuchsia-400 text-black font-black uppercase tracking-[0.18em] text-xs transition hover:-translate-y-px hover:shadow-[0_18px_60px_-15px_rgba(232,121,249,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "email" ? "Sending link…" : "Send sign-in link"}
              </button>
            </form>

            {err && (
              <p role="alert" className="mt-4 text-center text-xs text-rose-300">
                {err}
              </p>
            )}
          </>
        )}

        <p className="mt-8 text-[10px] text-white/40 leading-relaxed text-center">
          By continuing you agree to the{" "}
          <Link to="/terms" className="text-white underline">Terms of Service</Link>{" "}and{" "}
          <Link to="/privacy" className="text-white underline">Privacy Policy</Link>.
        </p>

        <p className="mt-5 text-center text-xs text-white/55">
          {mode === "signin" ? (
            <>New here? <Link to="/signup" className="text-cyan-200 font-bold hover:underline">Create an account</Link></>
          ) : (
            <>Already have an account? <Link to="/signin" className="text-cyan-200 font-bold hover:underline">Sign in</Link></>
          )}
        </p>
      </motion.div>
    </div>
  );
};

const LoginPage = () => <AuthCard mode="signin" />;
const SignUpPage = () => <AuthCard mode="signup" />;

const AuthCallbackPage = () => {
  const [state, setState] = useState<"working" | "error">("working");
  const [err, setErr] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { completeMagicLinkSignIn, isMagicLinkUrl } = await import("./lib/firebase");
        if (!isMagicLinkUrl()) {
          if (!cancelled) {
            setErr("This link isn't a valid sign-in link or has already been used.");
            setState("error");
          }
          return;
        }
        await completeMagicLinkSignIn();
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/dashboard";
        window.location.replace(next);
      } catch (error) {
        if (!cancelled) {
          setErr(error instanceof Error ? error.message : "Could not finish sign-in.");
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-32 pb-24 px-5 flex flex-col items-center min-h-screen">
      <div className="w-full max-w-md rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-10 text-center backdrop-blur-2xl">
        {state === "working" ? (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" aria-hidden="true" />
            <h1 className="mt-6 font-display text-2xl font-black tracking-tight">Signing you in…</h1>
            <p className="mt-2 text-sm text-white/60">Verifying your email link. This takes about a second.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-black tracking-tight text-rose-200">Sign-in link problem</h1>
            <p className="mt-2 text-sm text-white/70">{err}</p>
            <Link
              to="/signin"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "./lib/AuthContext";
import { db } from "./lib/firebase";

type DashSite = {
  id: string;
  title?: string;
  industry?: string;
  status?: string;
  url?: string;
  ownerId?: string;
  createdAt?: string | number | Date;
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [sites, setSites] = useState<DashSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setSitesLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q = query(collection(db, "sites"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        const list: DashSite[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<DashSite, "id">) }));
        if (!cancelled) setSites(list);
      } catch (err) {
        console.error("Error fetching sites:", err);
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
      </div>
    );
  }

  // Signed-out empty state
  if (!user) {
    return (
      <section className="relative px-5 pt-28 pb-20 sm:px-8 lg:px-12 lg:pt-44">
        <div className="mx-auto max-w-2xl rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-10 text-center backdrop-blur-2xl sm:p-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200">
            <User className="h-3 w-3" /> Sign in to continue
          </span>
          <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.4rem)] font-black leading-[1.02] tracking-tight">
            Sign in to see your dashboard.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/65">
            Your sites, command balance, and billing live here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black"
            >
              Sign in <Plus className="h-4 w-4" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 hover:text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const firstName = (user.displayName || user.email?.split("@")[0] || "there").split(" ")[0];

  return (
    <main className="relative px-5 pt-28 pb-24 sm:px-8 lg:px-12 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Dashboard</div>
            <h1 className="mt-2 font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-black leading-[1.02] tracking-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Manage your sites, billing, and team in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-15px_rgba(232,121,249,0.5)]"
            >
              <Plus className="h-4 w-4" /> New site
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/85 hover:border-cyan-300/40 hover:text-white transition"
            >
              Manage plan
            </Link>
          </div>
        </header>

        {/* QUICK TILES */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Layout, label: "My sites", value: String(sites.length), caption: sites.length === 0 ? "Get started" : "Click a card below" },
            { icon: Zap, label: "Commands", value: "—", caption: "Plan-based balance" },
            { icon: BarChart3, label: "30-day visits", value: "—", caption: "Connect analytics" },
            { icon: CreditCard, label: "Plan", value: "Active", caption: "Billing in pricing" },
          ].map(({ icon: Icon, label, value, caption }) => (
            <div key={label} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/1 p-5 backdrop-blur-xl">
              <div className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-cyan-300/8 blur-3xl transition group-hover:bg-cyan-300/15" />
              <Icon className="h-5 w-5 text-cyan-300/80" aria-hidden="true" />
              <div className="mt-3 font-display text-3xl font-black tracking-tight">{value}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{label}</div>
              <div className="mt-1.5 text-xs text-white/55">{caption}</div>
            </div>
          ))}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* SITES */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-black tracking-tight flex items-center gap-2">
                <Layout className="h-5 w-5 text-cyan-300" /> Your sites
              </h2>
              <Link
                to="/"
                aria-label="Create new site"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:text-cyan-200 transition"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>

            {sitesLoading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-3xl border border-white/8 bg-white/4" />
                ))}
              </div>
            ) : sites.length === 0 ? (
              <div className="mt-6 overflow-hidden rounded-4xl border border-white/10 bg-linear-to-b from-white/5 to-white/1 p-10 text-center backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-300/20 to-fuchsia-400/20">
                  <Globe className="h-6 w-6 text-cyan-200" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-black tracking-tight">Build your first site</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
                  Speak a 60-second brief and we'll generate a hosted homepage with real Gemini copy. You can swap sections, edit copy, and publish in minutes.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
                  >
                    Start building <Plus className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/examples"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/85 hover:text-white"
                  >
                    See examples
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {sites.map((site, i) => (
                  <motion.article
                    key={site.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 p-5 backdrop-blur-xl transition hover:border-cyan-300/40 hover:shadow-[0_30px_120px_-30px_rgba(34,211,238,0.35)]"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-cyan-300/10 to-fuchsia-400/10">
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 transition group-hover:scale-110 group-hover:opacity-30">
                        <Globe className="h-16 w-16" aria-hidden="true" />
                      </div>
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-200 backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        {site.status || "Draft"}
                      </div>
                    </div>
                    <div className="mt-4 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                        {site.industry || "General"} · {site.id.substring(0, 6)}
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-black tracking-tight line-clamp-1">
                        {site.title || "Untitled site"}
                      </h3>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <Link
                        to={`/preview?id=${site.id}`}
                        className="grow rounded-2xl bg-white/5 py-3 text-center text-[10px] font-black uppercase tracking-[0.22em] hover:bg-white/10 transition"
                      >
                        Preview
                      </Link>
                      <Link
                        to={`/setup?id=${site.id}`}
                        aria-label={`Edit ${site.title || "untitled site"}`}
                        title="Edit site"
                        className="rounded-2xl bg-white/5 p-3 hover:text-cyan-200 hover:bg-white/10 transition"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}

            {/* WHAT'S NEXT */}
            <div className="mt-10">
              <h2 className="font-display text-lg font-black tracking-tight">What to do next</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Connect a custom domain", body: "Pro and Ultimate plans — point your domain in Settings.", to: "/pricing" },
                  { title: "Invite your team", body: "Whitelabel dashboards on Ultimate. Coming soon to the menu.", to: "/contact" },
                  { title: "Read the help docs", body: "Common how-tos for editing, publishing, and SEO.", to: "/faq" },
                ].map((c) => (
                  <Link
                    key={c.title}
                    to={c.to}
                    className="group rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl hover:border-cyan-300/40 transition"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">Tip</div>
                    <div className="mt-1.5 font-display text-base font-black tracking-tight">{c.title}</div>
                    <p className="mt-1 text-xs leading-5 text-white/55">{c.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Performance</h3>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Visits / 24h", val: "—", icon: BarChart3 },
                  { label: "Conversion rate", val: "—", icon: Zap },
                  { label: "Avg load", val: "—", icon: Cpu },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-xl font-black tracking-tight">{val}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] leading-5 text-white/40">
                Analytics will populate once your site has published traffic.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-fuchsia-300/30 bg-linear-to-br from-fuchsia-400/15 via-white/4 to-cyan-300/10 p-6 backdrop-blur-xl">
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-fuchsia-400/25 blur-3xl" />
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-100">Upgrade</div>
                <h3 className="mt-2 font-display text-xl font-black tracking-tight">Unlock code export + custom domain</h3>
                <p className="mt-2 text-xs leading-5 text-white/70">
                  Pro is $19.99/mo. Ultimate adds 50 hosted sites and a whitelabel dashboard.
                </p>
                <Link
                  to="/pricing"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-black hover:-translate-y-px transition"
                >
                  See plans <Plus className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Support</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Stuck or want a custom build? Reply to our founder.
              </p>
              <a
                href="mailto:mr.jwswain@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white hover:border-cyan-300/40 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Contact founder
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

import { DMCA, PrivacyPolicy, RefundPolicy, TermsOfService } from "./components/Legal";
import {
  AboutPage,
  ExamplesPage,
  FAQPage,
  SitePreviewPage,
  StoriesPage,
  SupportPage,
} from "./components/Pages";
import { Success as SuccessPage } from "./pages/Success";
import { Setup as SetupPage } from "./pages/Setup";

const AdminPanel = () => {
  const { user, role, loading } = useAuth();
  const [stats, setStats] = React.useState({ users: 0, sites: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [recentUsers, setRecentUsers] = React.useState<any[]>([]);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user || role !== "admin") return;
    const loadData = async () => {
      setDataLoading(true);
      try {
        if (db) {
          const { getDocs, collection, query, orderBy, limit } = await import("firebase/firestore");
          const [sitesSnap, usersSnap] = await Promise.all([
            getDocs(query(collection(db, "sites"), orderBy("timestamp", "desc"), limit(200))),
            getDocs(query(collection(db, "users"), limit(500))),
          ]);
          let ordersData: any[] = [];
          try {
            const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50)));
            ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch { /* orders collection may not exist yet */ }

          const sitesData = sitesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const paidOrders = ordersData.filter((o: any) => o.status === "paid" || o.status === "active");
          const revenue = paidOrders.reduce((sum: number, o: any) => {
            const amt = parseFloat(o.amount || o.price || "0");
            return sum + (isNaN(amt) ? 0 : amt);
          }, 0);

          setStats({ users: usersData.length, sites: sitesData.length, orders: paidOrders.length, revenue });
          setRecentOrders(ordersData.slice(0, 10));
          setRecentUsers(usersData.slice(0, 10));

          const feed = [
            ...sitesData.slice(0, 5).map((s: any) => ({
              type: "site",
              label: `Site generated: ${s.title || "Untitled"}`,
              email: s.ownerId || "—",
              time: s.timestamp?.toDate?.()?.toLocaleString() || "—",
            })),
            ...ordersData.slice(0, 5).map((o: any) => ({
              type: "order",
              label: `Order: ${o.plan || "Plan"} — ${o.status || "pending"}`,
              email: o.email || "—",
              time: o.createdAt?.toDate?.()?.toLocaleString() || "—",
            })),
          ].sort((a, b) => (a.time > b.time ? -1 : 1)).slice(0, 12);
          setActivity(feed);
        }
      } catch (err) {
        console.error("Admin data load error:", err);
      } finally {
        setDataLoading(false);
      }
    };
    void loadData();
  }, [user, role]);

  if (loading)
    return <div className="pt-40 pb-24 px-6 min-h-screen text-center text-white">Loading...</div>;

  if (!user || role !== "admin") {
    return (
      <div className="pt-40 pb-24 px-6 flex flex-col items-center min-h-screen text-center">
        <Shield className="w-16 h-16 text-brand-purple mx-auto mb-6" />
        <h1 className="text-4xl font-black mb-4 text-white">Access Denied</h1>
        <p className="text-white/40">You do not have administrative privileges.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: BarChart3, color: "text-cyan-400" },
    { label: "Total Users", value: String(stats.users), icon: User, color: "text-purple-400" },
    { label: "Sites Generated", value: String(stats.sites), icon: Layout, color: "text-blue-400" },
    { label: "Paid Orders", value: String(stats.orders), icon: CreditCard, color: "text-green-400" },
  ];

  return (
    <div className="pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold italic tracking-tight text-white underline decoration-purple-500 underline-offset-8">
              Admin Nexus
            </h1>
            <p className="text-slate-400 text-sm mt-1">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-3">
            <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700 transition">
              Stripe ↗
            </a>
            <a href="https://console.firebase.google.com/project/gen-lang-client-0914367944" target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg text-sm hover:bg-orange-700 transition">
              Firebase ↗
            </a>
            <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg text-sm hover:bg-yellow-700 transition">
              Cloudflare ↗
            </a>
          </div>
        </div>

        {dataLoading ? (
          <div className="text-slate-400 text-sm animate-pulse">Loading live data from Firebase...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="glass p-6 rounded-4xl border border-white/5">
                <s.icon className={cn("w-7 h-7 mb-3", s.color)} />
                <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-4xl border border-white/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white italic">
              <CreditCard className="w-5 h-5 text-cyan-400" /> Recent Orders
            </h2>
            {recentOrders.length === 0 ? (
              <p className="text-white/30 text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                    <div>
                      <span className="text-white font-semibold">{o.email || o.userId || "—"}</span>
                      <span className="ml-2 text-slate-400">{o.plan || "—"}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold",
                      o.status === "paid" || o.status === "active" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
                    )}>{o.status || "pending"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-4xl border border-white/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white italic">
              <User className="w-5 h-5 text-purple-400" /> Recent Users
            </h2>
            {recentUsers.length === 0 ? (
              <p className="text-white/30 text-sm">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-white">{u.email || u.username || "—"}</span>
                    <span className="text-slate-400 text-xs">{u.plan || "free"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-4xl border border-white/5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white italic">
            <Zap className="w-5 h-5 text-purple-400" /> Live Activity Feed
          </h2>
          {activity.length === 0 ? (
            <p className="text-white/30 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full shrink-0",
                      a.type === "order" ? "bg-green-400" : "bg-blue-400"
                    )} />
                    <span className="text-white">{a.label}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-4xl border border-white/5">
          <h2 className="text-lg font-bold mb-4 text-white italic">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Stripe Payments", url: "https://dashboard.stripe.com/payments" },
              { label: "Stripe Customers", url: "https://dashboard.stripe.com/customers" },
              { label: "Firebase Auth Users", url: "https://console.firebase.google.com/project/gen-lang-client-0914367944/authentication/users" },
              { label: "Firebase Firestore", url: "https://console.firebase.google.com/project/gen-lang-client-0914367944/firestore" },
              { label: "Cloudflare Analytics", url: "https://dash.cloudflare.com" },
              { label: "Google Analytics", url: "https://analytics.google.com" },
              { label: "AdSense", url: "https://adsense.google.com" },
            ].map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Root App ---
export default function App() {
  useEffect(() => { initSecretFeatures(); }, []);
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen relative flex flex-col">
        <BrandWallpaper />
        <div className="fixed inset-0 -z-10 bg-black/45 pointer-events-none" />

        <Navbar />
        <GlobalSearch />

        <main className="grow">
          <Routes>
            <Route path="/" element={<HomeV2 />} />
            <Route path="/features" element={<FeaturesReal />} />
            <Route path="/examples" element={<ExamplesReal />} />
            <Route path="/pricing" element={<PricingV2 />} />
            <Route
              path="/deployment-ready-prompt"
              element={<UniversalDeploymentPrompt />}
            />
            <Route path="/blog" element={<BlogV2 />} />
            <Route path="/blog/:slug" element={<BlogPostV2 />} />
            <Route path="/stories" element={<BlogV2 />} />
            <Route path="/about" element={<AboutReal />} />
            <Route path="/contact" element={<ContactReal />} />
            <Route path="/faq" element={<FAQReal />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/preview" element={<SitePreviewPage />} />
            <Route path="/legal" element={<TermsOfService />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refunds" element={<RefundPolicy />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/engines" element={<EngineTester />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

const PricingPage = () => (
  <div className="pt-24">
    <PricingSection />
    <TrustSection />
  </div>
);
