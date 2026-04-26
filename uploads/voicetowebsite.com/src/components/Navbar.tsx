import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, Mic2, Menu, X, Zap, Activity } from 'lucide-react';
import { useSound } from '@/lib/sounds';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';
import { StarCluster } from './StarCluster';
import { Howl } from 'howler';
import { SplitLink } from './ui/SplitLink';

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <motion.div 
      className="relative w-12 h-12 flex flex-col items-center justify-center gap-1.5 group"
    >
      {/* Spinning Static State & Illuminating Transition */}
      <motion.div 
        className="w-8 h-0.5 bg-white relative z-10"
        animate={{ 
          rotate: isOpen ? 45 : [0, 90, 180, 270, 360], 
          y: isOpen ? 8 : 0,
          scale: [1, 1.1, 1],
          boxShadow: isOpen ? "0 0 20px #6366f1" : "0 0 5px rgba(255,255,255,0.2)"
        }}
        transition={{ 
          rotate: isOpen ? { duration: 0.5 } : { duration: 10, repeat: Infinity, ease: "linear" },
          duration: 0.5 
        }}
      />
      <motion.div 
        className="w-8 h-0.5 bg-white relative z-10"
        animate={{ 
          opacity: isOpen ? 0 : 1,
          scale: [1, 1.2, 1],
          rotate: isOpen ? 0 : [0, -90, -180, -270, -360],
        }}
        transition={{ 
          rotate: isOpen ? { duration: 0.5 } : { duration: 8, repeat: Infinity, ease: "linear" },
          duration: 0.3 
        }}
      />
      <motion.div 
        className="w-8 h-0.5 bg-white relative z-10"
        animate={{ 
          rotate: isOpen ? -45 : [0, 90, 180, 270, 360], 
          y: isOpen ? -8 : 0,
          scale: [1, 1.1, 1],
          boxShadow: isOpen ? "0 0 20px #6366f1" : "0 0 5px rgba(255,255,255,0.2)"
        }}
        transition={{ 
          rotate: isOpen ? { duration: 0.5 } : { duration: 12, repeat: Infinity, ease: "linear" },
          duration: 0.5 
        }}
      />

      {/* Illuminating Orbs on Click */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 bg-indigo-500 rounded-full blur-xl z-0"
            />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 2, 1.5], opacity: [0.8, 0.4, 0.6] }}
              className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full blur-sm"
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 2, 1.5], opacity: [0.8, 0.4, 0.6] }}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-400 rounded-full blur-sm"
              transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Persistent Spin Container */}
      {!isOpen && (
        <motion.div 
          className="absolute inset-x-[-4px] inset-y-[-4px] border border-white/5 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        />
      )}
    </motion.div>
  );
};

const NavLink = ({ link, onClick, location }: any) => {
  const { playTick, playClick } = useSound();

  const handleLinkClick = (e: React.MouseEvent) => {
    playClick();
    setTimeout(() => {
      onClick();
    }, 600);
  };

  return (
    <motion.div
      className="relative overflow-visible group/item"
      whileHover={{ x: 20 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <Link
        to={link.path}
        onClick={handleLinkClick}
        onMouseEnter={playTick}
        className="block relative max-w-full"
      >
        <SplitLink className={`navlink-fit font-black tracking-tighter uppercase leading-none transition-all duration-500 italic inline-block animate-lights ${
          location.pathname === link.path ? 'opacity-100' : 'opacity-85'
        } hover:opacity-100`}>
          {link.name}
        </SplitLink>
      </Link>
    </motion.div>
  );
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { playClick, playTick } = useSound();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [audioStarted, setAudioStarted] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  // Background Audio Management
  useEffect(() => {
    // Neural Audio Initialization
    soundRef.current = new Howl({
      src: ['https://audio.com/mr-jwswain/audio/go-to-voice-to-website-dot-com.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'], // Fallback included for testing
      autoplay: true,
      loop: true,
      volume: 0.3,
      html5: true,
      onplay: () => setAudioStarted(true),
      onloaderror: (id, err) => console.log('Neural Audio Error:', err)
    });

    const handleFirstInteraction = () => {
      if (soundRef.current) {
        soundRef.current.stop();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      soundRef.current?.stop();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const handleCheckout = async (plan: 'starter' | 'pro' | 'enterprise' | 'commands', method: 'stripe' | 'paypal' = 'stripe') => {
    try {
      const endpoint = method === 'stripe' ? '/api/create-checkout-session' : '/api/create-paypal-order';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await response.json();
      
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Showcase', path: '/stories' },
    { name: 'About', path: '/about' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-700 phase-driven ${isScrolled ? 'py-4 px-6 lg:px-24 glass-premium stacked-shadow-nav sun-light' : 'py-8 px-6 lg:px-24'}`}>
        <div className="w-full flex items-center justify-between">
          <Link to="/" className="group" onClick={() => setIsMenuOpen(false)}>
            <Logo />
          </Link>

          <div className="flex items-center gap-12">
            <div className="hidden lg:flex items-center gap-16">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onMouseEnter={playTick}
                  className={`text-[14px] font-black uppercase tracking-[0.4em] transition-all duration-300 relative group/link animate-lights ${
                    location.pathname === link.path ? 'opacity-100' : 'opacity-75'
                  } hover:opacity-100`}
                >
                  <SplitLink>{link.name}</SplitLink>
                </Link>
              ))}
            </div>

            <button 
              onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }}
              className="flex items-center gap-6 group relative"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-70 group-hover:opacity-100 transition-opacity hidden sm:block">
                {isMenuOpen ? 'TERMINATE' : 'INITIALIZE'}
              </span>
              <HamburgerIcon isOpen={isMenuOpen} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '100vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[900] bg-black text-white p-12 lg:p-24 flex flex-col justify-between overflow-hidden"
          >
            {/* Sound Wave Reveal Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <motion.div 
                className="absolute inset-0 flex items-center justify-center opacity-40"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                transition={{ duration: 1 }}
              >
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-indigo-500/30 mx-1 rounded-full"
                    animate={{ height: [40, 140, 40] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
                  />
                ))}
              </motion.div>
              
              {/* Wallpaper Backdrop */}
              <motion.div 
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 0.3, scale: 1 }}
                className="absolute inset-0 z-0"
              >
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover grayscale brightness-50"
                >
                  <source src="/input_file_0.mp4" type="video/mp4" />
                </video>
              </motion.div>
              
              <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
              <div className="absolute inset-0 bg-black/60 shadow-[inset_0_0_100px_black]" />
            </div>

            <StarCluster />
            <div className="noise-overlay" />
            <div className="grid-structure absolute inset-0 opacity-10" />
            
            <div className="w-full flex justify-between items-start opacity-70 relative z-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] lights-header">Neural Interface active</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Monetization Engine Online</span>
            </div>

            <div className="flex flex-col gap-4 relative z-10 py-12">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.4 }}
                >
                  <NavLink link={link} location={location} onClick={() => setIsMenuOpen(false)} />
                </motion.div>
              ))}
            </div>

            <div className="w-full flex flex-col lg:flex-row justify-between items-end gap-12 relative z-10 pt-12 border-t border-white/5">
              <div className="space-y-6">
                <span className="block text-[8px] uppercase tracking-[0.5em] opacity-70 font-black">Strategic Protocols</span>
                <div className="flex flex-wrap gap-8">
                   {['Twitter', 'Instagram', 'Github', 'Stripe', 'PayPal'].map(s => (
                     <button 
                      key={s} 
                      onClick={(e) => {
                        if (s === 'Stripe' || s === 'PayPal') {
                          handleCheckout('pro', s === 'Stripe' ? 'stripe' : 'paypal');
                        }
                      }}
                      className={`text-[12px] font-black uppercase tracking-[0.3em] transition-all italic ${s === 'Stripe' || s === 'PayPal' ? 'text-indigo-400 opacity-100 hover:ultra-glow' : 'opacity-40 hover:opacity-100'}`}
                    >
                      {s}
                    </button>
                   ))}
                </div>
              </div>
              
              {user ? (
                <div className="text-right space-y-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-widest opacity-20 mb-2 font-black">Authorized Operator</span>
                    <span className="text-xl font-bold uppercase italic text-indigo-400">{user.email}</span>
                  </div>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block">
                    <SplitLink className="text-2xl font-black italic uppercase tracking-tighter hover:text-red-500 transition-colors">Terminate Access</SplitLink>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-4">
                  <Link to="/#pricing" onClick={() => setIsMenuOpen(false)} className="block">
                    <SplitLink className="text-xl lg:text-3xl font-black italic uppercase tracking-tighter hover:text-indigo-500 transition-colors drop-shadow-2xl animate-lights">Subscribe for Access</SplitLink>
                  </Link>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity italic">
                    Already an Operator? Sync Now
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
