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
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", path: "/features" },
    { name: "Gallery", path: "/examples" },
    { name: "Pricing", path: "/pricing" },
    { name: "Mission", path: "/about" },
  ];

  return (
    <nav
      className={cn(
        "site-header-wallpaper fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 lg:px-12 flex items-center justify-between overflow-hidden",
        isScrolled
          ? "h-20 bg-black/60 backdrop-blur-xl border-b border-white/5"
          : "h-28 bg-transparent",
      )}
    >
      <Link to="/" className="relative z-10 flex items-center gap-3 group" onClick={handleLogoClick}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center neon-glow-cyan group-hover:scale-110 transition-transform">
          <Mic className="text-white w-5 h-5 animate-pulse" />
        </div>
      </Link>

      {/* Desktop Menu */}
      <div className="relative z-10 hidden lg:flex items-center gap-10 text-[10px] uppercase font-black tracking-[0.2em] text-white/50">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "transition-colors hover:text-brand-cyan relative py-2",
              location.pathname === link.path &&
                "text-brand-cyan after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-brand-cyan",
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="relative z-10 hidden lg:flex items-center gap-6">
        <Link
          to="/signin"
          className="text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Access Nexus
        </Link>
        <Link
          to="/signup"
          className="px-8 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan transition-all hover:scale-105 active:scale-95"
        >
          Generate Now
        </Link>
      </div>

      {/* Mobile Menu Trigger */}
      <button
        className="relative z-10 lg:hidden p-2 glass rounded-xl text-white"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] bg-[#050505]/95 backdrop-blur-2xl flex flex-col p-12"
          >
            <div className="flex justify-between items-center mb-20">
              <span className="text-xl font-black italic">
                VoiceToWebsite<span className="text-brand-cyan">.com</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 glass rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-8 text-4xl font-black italic">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="hover:text-brand-cyan transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
            </div>
            <div className="mt-auto space-y-6">
              <Link
                to="/signin"
                onClick={() => setIsOpen(false)}
                className="block w-full py-6 glass rounded-[2rem] text-center font-black italic text-xl"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="block w-full py-6 bg-brand-cyan text-black rounded-[2rem] text-center font-black italic text-xl"
              >
                Build Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="site-footer-wallpaper relative overflow-hidden py-20 px-6 lg:px-12 bg-black/50 border-t border-white/5">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
      <div className="lg:col-span-2">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center">
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

import { Home } from "./components/Home";
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
import { signInWithGoogle } from "./lib/firebase";

const LoginPage = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Sign in failed", error);
      alert("Sign in failed");
    }
  };

  return (
    <div className="pt-40 pb-24 px-6 flex flex-col items-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-premium p-12 rounded-[3.5rem] w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center neon-glow-cyan">
            <User className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-center mb-2 italic">
          Access Nexus
        </h1>
        <p className="text-center text-white/40 text-sm mb-10">
          Enter your credentials to manage your digital empire.
        </p>

        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="mt-6 w-full py-4 glass rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google"
            className="w-5 h-5 grayscale"
          />
          Google Authentication
        </button>

        <p className="mt-8 text-center text-xs text-white/40">
          New to the future?{" "}
          <Link
            to="/signup"
            className="text-brand-cyan font-bold hover:underline"
          >
            Create Identity
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const SignUpPage = () => {
  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      window.location.href = "/pricing";
    } catch (error) {
      console.error("Sign up failed", error);
      alert("Sign up failed");
    }
  };
  return (
    <div className="pt-40 pb-24 px-6 flex flex-col items-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium p-12 rounded-[3.5rem] w-full max-w-lg"
      >
        <h1 className="text-4xl font-black mb-2 italic">Join the Elite</h1>
        <p className="text-white/40 text-sm mb-10">
          Start building premium websites with voice in seconds.
        </p>

        <button
          onClick={handleGoogleSignUp}
          type="button"
          className="w-full py-4 glass rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="mt-8 text-[10px] text-white/40 leading-relaxed text-center">
          By continuing you agree to the{" "}
          <Link to="/terms" className="text-white underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-white underline">
            Privacy Policy
          </Link>
          . All sales are final.
        </p>

        <p className="mt-6 text-center text-xs text-white/40">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-cyan font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "./lib/AuthContext";
import { db } from "./lib/firebase";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user && db) {
      const fetchUserSites = async () => {
        try {
          const q = query(
            collection(db, "sites"),
            where("ownerId", "==", user.uid),
          );
          const querySnapshot = await getDocs(q);
          const userSites: any[] = [];
          querySnapshot.forEach((doc) => {
            userSites.push({ id: doc.id, ...doc.data() });
          });
          setSites(userSites);
        } catch (error) {
          console.error("Error fetching sites:", error);
        }
      };
      fetchUserSites();
    }
  }, [user]);

  if (loading)
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen text-center">
        Loading...
      </div>
    );

  return (
    <div className="pt-32 pb-20 px-6 lg:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter mb-2">
              Command Center
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 italic">
                Sync Level: <span className="text-white">Neural Maximum</span>
              </p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {!user ? (
              <Link
                to="/signin"
                className="glass px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-brand-cyan hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                Sign In To Sync
              </Link>
            ) : null}
            <div className="glass px-8 py-4 rounded-[1.5rem] flex-grow md:flex-grow-0">
              <p className="text-[8px] uppercase font-black text-white/20 mb-1">
                Commands Remaining
              </p>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-brand-purple" />
                <p className="font-black text-brand-purple tracking-tighter">
                  {user ? "? / ?" : "3 Demo"}
                </p>
              </div>
            </div>
            <Link
              to="/pricing"
              className="px-8 py-4 bg-brand-cyan text-black font-black rounded-[1.5rem] hover:scale-105 transition-transform shadow-xl shadow-brand-cyan/20 flex items-center justify-center"
            >
              Recharge
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sites List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3 italic">
                <Layout className="w-6 h-6 text-brand-cyan" /> Your
                Architectures
              </h2>
              <Link
                to="/"
                className="p-3 glass rounded-full hover:bg-white/10 transition-all hover:rotate-90"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sites.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center p-12 glass border-white/5 rounded-3xl">
                  <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">
                    No architectures generated yet.
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-block px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Start Building
                  </Link>
                </div>
              ) : (
                sites.map((site, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group glass p-6 rounded-[3rem] border-white/5 hover:border-brand-cyan/50 transition-all flex flex-col min-h-[340px]"
                  >
                    <div className="aspect-video bg-[#0a0a0a] rounded-[2rem] mb-6 overflow-hidden relative border border-white/5">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform">
                        <Globe className="w-20 h-20" />
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 glass rounded-lg text-[8px] font-black uppercase tracking-widest text-brand-cyan">
                        {site.status || "Draft"}
                      </div>
                    </div>
                    <div className="px-2 flex-grow">
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">
                        {site.industry || "General"} // ID:{" "}
                        {site.id.substring(0, 6)}
                      </p>
                      <h3 className="text-xl font-bold mb-6 italic">
                        {site.title || "Untitled"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Link
                        to={`/preview?id=${site.id}`}
                        className="flex-grow py-4 text-center bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                      >
                        Preview
                      </Link>
                      <button className="p-4 bg-white/5 rounded-2xl hover:text-brand-cyan transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-8">
            <div className="glass-premium p-10 rounded-[3.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
              <h3 className="text-[11px] uppercase font-black tracking-[0.2em] text-white/20 mb-8">
                Neural Performance
              </h3>
              <div className="space-y-10">
                {[
                  {
                    label: "Visits / 24h",
                    val: "0",
                    icon: BarChart3,
                    col: "text-brand-cyan",
                  },
                  {
                    label: "Conversion rate",
                    val: "0%",
                    icon: Zap,
                    col: "text-brand-purple",
                  },
                  {
                    label: "Avg Load",
                    val: "0s",
                    icon: Cpu,
                    col: "text-green-400",
                  },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center",
                        stat.col,
                      )}
                    >
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black italic tracking-tighter">
                        {stat.val}
                      </p>
                      <p className="text-[9px] uppercase font-black tracking-widest text-white/20">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-10 rounded-[3.5rem] border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent relative group">
              <div className="relative z-10">
                <h3 className="text-sm font-black italic mb-2">
                  Upgrade Identity
                </h3>
                <p className="text-xs text-white/40 mb-8 leading-relaxed italic">
                  Enable code export, high-speed CDN, and custom white-labeling.
                </p>
                <Link
                  to="/pricing"
                  className="block w-full py-5 bg-brand-purple text-center font-black rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-brand-purple/20"
                >
                  Expand Power
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { DMCA, PrivacyPolicy, RefundPolicy, TermsOfService } from "./components/Legal";
import {
  AboutPage,
  ExamplesPage,
  FAQPage,
  SetupPage,
  SitePreviewPage,
  StoriesPage,
  SuccessPage,
  SupportPage,
} from "./components/Pages";

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
              <div key={i} className="glass p-6 rounded-[2rem] border border-white/5">
                <s.icon className={cn("w-7 h-7 mb-3", s.color)} />
                <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-[2rem] border border-white/5">
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

          <div className="glass p-6 rounded-[2rem] border border-white/5">
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

        <div className="glass p-6 rounded-[2rem] border border-white/5">
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
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
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

        <div className="glass p-6 rounded-[2rem] border border-white/5">
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

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<AboutPage />} />
            <Route path="/examples" element={<ExamplesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route
              path="/deployment-ready-prompt"
              element={<UniversalDeploymentPrompt />}
            />
            <Route path="/blog" element={<StoriesPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/store" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
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
