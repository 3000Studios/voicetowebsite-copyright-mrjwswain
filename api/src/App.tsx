import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { Home } from '@/pages/Home';
import { Stories } from '@/pages/Stories';
import { About } from '@/pages/About';
import { Legal } from '@/pages/Legal';
import { Admin } from '@/pages/Admin';
import { Dashboard } from '@/pages/Dashboard';
import { SiteViewer } from '@/components/SiteViewer';
import { ChatBot } from '@/components/ChatBot';

// Lazy load the store page
const Store = lazy(() => import('@/pages/Store'));

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200 bg-black">
        <WaveBackground />
        <Navbar />
        
        <main className="relative z-10 w-full">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <PageTransition>
                  <Home />
                </PageTransition>
              } />
              <Route path="/stories" element={
                <PageTransition>
                  <Stories />
                </PageTransition>
              } />
              <Route path="/about" element={
                <PageTransition>
                  <About />
                </PageTransition>
              } />
              <Route path="/legal" element={
                <PageTransition>
                  <Legal />
                </PageTransition>
              } />
              <Route path="/store" element={
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-indigo-500 animate-pulse opacity-20" />
                      <div className="w-8 h-8 bg-indigo-500 animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]" />
                    </div>
                  </div>
                }>
                  <PageTransition>
                    <Store />
                  </PageTransition>
                </Suspense>
              } />
              <Route path="/admin" element={
                <PageTransition>
                  <Admin />
                </PageTransition>
              } />
              <Route path="/dashboard" element={
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              } />
              <Route path="/:id" element={<SiteViewer />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
        <ChatBot />
      </div>
    </Router>
  );
}
