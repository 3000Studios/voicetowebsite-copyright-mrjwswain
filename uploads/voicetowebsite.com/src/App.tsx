import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Global3DBackground } from '@/components/Global3DBackground';
import { AuthProvider } from '@/context/AuthContext';
import { Home } from '@/pages/Home';
import { Stories } from '@/pages/Stories';
import { StoryDetail } from '@/pages/StoryDetail';
import { About } from '@/pages/About';
import { Legal } from '@/pages/Legal';
import { AINews } from '@/pages/AINews';
import { AINewsStory } from '@/pages/AINewsStory';
import { Admin } from '@/pages/Admin';
import { Dashboard } from '@/pages/Dashboard';
import { Pricing } from '@/pages/Pricing';
import { Success } from '@/pages/Success';
import { Login } from '@/pages/Login';
import { SiteViewer } from '@/components/SiteViewer';
import { LiquidLoader } from '@/components/LiquidLoader';
import { AICompanion } from '@/components/AICompanion';
import { SynthWaves } from '@/components/SynthWaves';

const SVGFilters = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
    <defs>
      <filter id="premiumShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur" />
        <feOffset dx="0" dy="16" result="offsetBlur" />
        <feFlood floodColor="black" floodOpacity="0.4" result="offsetColor" />
        <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="ultraGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

const BackgroundLayers = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Canvas Particle Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-20" />
      
      {/* Mesh Gradient Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] mesh-coral glow-bloom" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] mesh-purple glow-bloom" />
      <div className="absolute bottom-[-15%] left-[10%] w-[45%] h-[45%] mesh-blue glow-bloom" />
      <div className="absolute bottom-[30%] right-[20%] w-[35%] h-[35%] mesh-pink glow-soft" />
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? (scrolled / height) * 100 : 0;
      document.documentElement.style.setProperty('--phase-pct', progress.toString());
    };

    let phase = 0;
    const updatePhase = () => {
      phase = (phase + 0.1) % 100;
      document.body.style.setProperty('--phase', phase.toString());
      requestAnimationFrame(updatePhase);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    const phaseId = requestAnimationFrame(updatePhase);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(phaseId);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AnimatePresence>
          {loading && <LiquidLoader onComplete={() => setLoading(false)} />}
        </AnimatePresence>
        <SVGFilters />
        <BackgroundLayers />
        <div className="noise-overlay" />
        <div className="relative min-h-screen text-white selection:bg-white selection:text-black antialiased-premium transition-all duration-700 phase-driven">
          <Global3DBackground />
          <SynthWaves />
          <Navbar />
          
          <div className="relative z-10 w-full overflow-x-hidden pt-32 flex flex-col min-h-screen">
            <main className="relative w-full flex-1">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                  <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                  <Route path="/stories" element={<PageTransition><Stories /></PageTransition>} />
                  <Route path="/stories/:id" element={<PageTransition><StoryDetail /></PageTransition>} />
                  <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                  <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
                  <Route path="/ai-news" element={<PageTransition><AINews /></PageTransition>} />
                  <Route path="/ai-news/:slug" element={<PageTransition><AINewsStory /></PageTransition>} />
                  <Route path="/store" element={
                    <Suspense fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="w-16 h-16 bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-indigo-500 animate-pulse opacity-20" />
                          <div className="w-8 h-8 bg-indigo-500 animate-spin shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]" />
                        </div>
                      </div>
                    }>
                      <PageTransition><Store /></PageTransition>
                    </Suspense>
                  } />
                  <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
                  <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                  <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                  <Route path="/success" element={<PageTransition><Success /></PageTransition>} />
                  <Route path="/:id" element={<SiteViewer />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
            <AICompanion />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
