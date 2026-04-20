import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mic2 } from 'lucide-react';

import { useSound } from '@/lib/sounds';

export const Navbar = () => {
  const { playWave, playClick, playTick } = useSound();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Stories', path: '/stories' },
    { name: 'About', path: '/about' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Admin', path: '/admin' },
    { name: 'Legal', path: '/legal' },
  ];

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100]"
      >
        <div className="relative w-full overflow-hidden bg-black/40 backdrop-blur-3xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3">
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic text-3d">
                VoiceTo<span className="text-indigo-500">Website</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onMouseEnter={playTick}
                  onClick={playClick}
                  className={`text-sm font-black uppercase tracking-widest nav-pop link-explode ${
                    location.pathname === link.path ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <Link to="/store" className="hidden sm:block">
                <button 
                  onMouseEnter={playTick}
                  className="btn-oval text-white text-sm"
                >
                  {isScrolled ? 'Upgrade' : 'Try Free'}
                </button>
              </Link>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => { playClick(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
                className={`lg:hidden flex flex-col gap-1.5 p-2 transition-all duration-500 ${isMobileMenuOpen ? 'hamburger-active' : ''}`}
              >
                <div className="hamburger-line line-1" />
                <div className="hamburger-line line-2" />
                <div className="hamburger-line line-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Bust Out) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-12 bust-out-menu"
            >
              {/* Sound Wave Background in Menu */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="synth-wave-3d" style={{ 
                    left: `${Math.random() * 100}%`, 
                    top: `${Math.random() * 100}%`,
                    width: `${200 + Math.random() * 300}px`,
                    height: `${200 + Math.random() * 300}px`,
                    animationDelay: `${i * 0.5}s`
                  }} />
                ))}
              </div>

              <div className="relative z-10 flex flex-col items-center gap-8">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onMouseEnter={playTick}
                      onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
                      className={`text-6xl font-black uppercase tracking-tighter italic nav-pop link-explode ${
                        location.pathname === link.path ? 'text-indigo-400' : 'text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-12 p-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <X size={48} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </AnimatePresence>
  );
};
