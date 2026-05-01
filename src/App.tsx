import { BrandWallpaper } from "@/components/BrandSystem";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SiteViewer } from "@/components/SiteViewer";
import { AuthProvider } from "@/context/AuthContext";
import { ScrollToTop } from "@/hooks/useScrollToTop";
import { Home } from "@/pages/Home";
import { Pricing } from "@/pages/Pricing";
import { Setup } from "@/pages/Setup";
import { Success } from "@/pages/Success";
import { AnimatePresence } from "motion/react";
import React, { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

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
const Legal = lazy(() =>
  import("@/pages/Legal").then((module) => ({ default: module.Legal })),
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

const AppFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-transparent text-slate-50">
    <BrandWallpaper />
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
                <Route path="/legal" element={<Legal />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/setup" element={<Setup />} />
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

