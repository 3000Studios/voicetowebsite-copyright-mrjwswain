import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SiteViewer } from "@/components/SiteViewer";
import { AuthProvider } from "@/context/AuthContext";
import { ScrollToTop } from "@/hooks/useScrollToTop";
import { Home } from "@/pages/Home";
import { Pricing } from "@/pages/Pricing";
import { Success } from "@/pages/Success";
import { AnimatePresence } from "motion/react";
import React, { Suspense, lazy, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Features = lazy(() =>
  import("@/pages/Features").then((module) => ({ default: module.Features })),
);
const Examples = lazy(() =>
  import("@/pages/Examples").then((module) => ({ default: module.Examples })),
);
const FAQ = lazy(() =>
  import("@/pages/FAQ").then((module) => ({ default: module.FAQ })),
);
const Blog = lazy(() =>
  import("@/pages/Blog").then((module) => ({ default: module.Blog })),
);
const BlogPost = lazy(() =>
  import("@/pages/BlogPost").then((module) => ({ default: module.BlogPost })),
);
const Admin = lazy(() =>
  import("@/pages/Admin").then((module) => ({ default: module.Admin })),
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Login = lazy(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login })),
);

const BackgroundLayers = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f2a44_0%,#09111f_42%,#05070b_100%)]" />
    <div className="absolute left-[-10%] -top-32 h-112 w-112 rounded-full bg-indigo-500/18 blur-3xl" />
    <div className="absolute right-[-12%] top-[18%] h-96 w-96 rounded-full bg-cyan-400/14 blur-3xl" />
    <div className="absolute -bottom-40 left-[18%] h-88 w-88 rounded-full bg-fuchsia-500/12 blur-3xl" />
    <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
    <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[72px_72px] opacity-[0.08]" />
  </div>
);

const AppFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-transparent text-slate-50">
    <BackgroundLayers />
    <Navbar />
    <div className="relative z-10 flex min-h-screen flex-col pt-24">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="content-grid section-shell">
    <div className="rounded-[32px] border border-white/10 bg-white/4 p-10 text-center text-slate-300 backdrop-blur-xl">
      Loading…
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppFrame>
          <AnimatePresence mode="wait">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/features" element={<Features />} />
                <Route path="/examples" element={<Examples />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/success" element={<Success />} />
                <Route path="/:id" element={<SiteViewer />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </AppFrame>
      </Router>
    </AuthProvider>
  );
}
