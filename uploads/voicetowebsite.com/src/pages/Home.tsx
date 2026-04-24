import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  ArrowRight, 
  Mic2, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  CreditCard,
  Layout,
  Command,
  Smartphone,
  Star,
  MousePointer2,
  ExternalLink,
  ChevronRight,
  Monitor,
  Search,
  Volume2,
  Menu
} from 'lucide-react';
import { VoiceApp } from '@/components/VoiceApp';
import { GoogleAdSense } from '@/components/GoogleAdSense';
// import { Navbar } from '@/components/Navbar';
// import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { SplitLink } from '@/components/ui/SplitLink';
import { FizzyButton } from '@/components/ui/FizzyButton';

import { SoundWave } from '@/components/SoundWave';
import { SynthWaveBackground } from '@/components/SynthWaveBackground';

const slideLeft = {
  hidden: { x: -200, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { 
      duration: 1.5, 
      ease: [0.22, 1, 0.36, 1] as any,
      delay: 0.5
    } 
  }
};

const dirtGrow = {
  hidden: { y: 100, scale: 0.9, opacity: 0 },
  visible: { 
    y: 0, 
    scale: 1, 
    opacity: 1, 
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as any } 
  }
};

const skyDrop = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as any } 
  }
};

const FeatureProject = ({ number, title, description, video, link }: any) => (
  <motion.div 
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    className="group relative border-t border-white/5 py-24 flex flex-col md:flex-row gap-12 items-start phase-driven"
  >
    <div className="flex-shrink-0 w-24">
      <motion.span variants={skyDrop} className="text-[10px] font-black tracking-[0.4em] opacity-20 uppercase font-mono group-hover:opacity-100 group-hover:text-indigo-500 group-hover:ultra-glow transition-all">{number}</motion.span>
    </div>
    <div className="flex-grow space-y-8 w-full overflow-hidden">
      <div className="space-y-4">
        <motion.h3 variants={dirtGrow} className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none group-hover:text-indigo-500 transition-colors uppercase font-display italic phase-driven">
          {title}
        </motion.h3>
        <motion.p variants={skyDrop} className="max-w-xl text-xl text-slate-400 font-light italic leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity phase-driven">
          {description}
        </motion.p>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }} 
        whileInView={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 1.5 }} 
        className="relative aspect-video w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 border border-white/5 premium-shadow rounded-2xl"
      >
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
        >
          <source src={video} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-1000" />
      </motion.div>
    </div>
    <div className="flex-shrink-0">
      <Link to={link} className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
        <ArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform" />
      </Link>
    </div>
  </motion.div>
);

const PreviewGenerator = () => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'exploding' | 'revealed'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === 'generating') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStatus('exploding'), 500);
            return 100;
          }
          return p + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
    if (status === 'exploding') {
      setTimeout(() => setStatus('revealed'), 800);
    }
  }, [status]);

  return (
    <div className="relative group/preview py-20">
      {/* Gothic Metal Border Component */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-slate-500 to-transparent blur-sm" />
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-slate-500 to-transparent blur-sm" />
         <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-2 bg-gradient-to-b from-transparent via-slate-500 to-transparent blur-sm" />
         <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3/4 w-2 bg-gradient-to-b from-transparent via-slate-500 to-transparent blur-sm" />
         
         {/* Circling Light Effect */}
         {status === 'generating' && (
           <motion.div 
             animate={{ 
               rotate: 360,
               borderColor: ['#4f46e5', '#06b6d4', '#10b981', '#4f46e5']
             }}
             transition={{ 
               rotate: { duration: 2, repeat: Infinity, ease: "linear" },
               borderColor: { duration: 4, repeat: Infinity }
             }}
             className="absolute inset-[-100px] border-[4px] border-indigo-500/20 blur-3xl rounded-full"
           />
         )}
      </div>

      <div 
        className={`w-full max-w-5xl mx-auto overflow-hidden relative transition-all duration-700 metal-gothic-border
          ${status === 'exploding' ? 'scale-150 opacity-0 blur-2xl' : 'scale-100 opacity-100'}
          ${status === 'generating' ? 'shadow-[0_0_80px_rgba(99,102,241,0.4)]' : 'shadow-[0_0_50px_rgba(0,0,0,0.8)]'}
        `}
      >
        {/* Metal Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-400 opacity-30" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-400 opacity-30" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-400 opacity-30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-400 opacity-30" />

        {/* Browser Bar - Gothic Mode */}
        <div className="bg-gradient-to-b from-slate-900 to-black border-b border-slate-800 px-6 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
          </div>
          <div className="flex-1 max-w-md mx-auto">
             <div className="h-8 bg-black/60 rounded border border-slate-800/50 flex items-center px-4 justify-center shadow-inner">
                <span className="text-[10px] font-mono text-slate-600 tracking-widest italic truncate">neural_creative_x_protocol</span>
             </div>
          </div>
          <div className="flex gap-4 opacity-40">
            <Layout size={14} className="text-slate-400" />
          </div>
        </div>

        {/* Generation Overlays */}
        <AnimatePresence>
          {(status === 'idle' || status === 'generating') && (
            <motion.div 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-20 text-center space-y-8"
            >
              {status === 'idle' ? (
                <button 
                  onClick={() => setStatus('generating')}
                  className="px-8 py-4 border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-all uppercase tracking-[0.5em] text-[10px] font-black italic glass-premium"
                >
                  Initiate Build
                </button>
              ) : (
                <>
                  {/* Lighting and Sparks Effects */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      boxShadow: ["0 0 20px rgba(99,102,241,0.2)", "0 0 60px rgba(99,102,241,0.6)", "0 0 20px rgba(99,102,241,0.2)"]
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-48 h-1 bg-indigo-500 rounded-full"
                  />
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[1em] text-indigo-500 animate-pulse">Generating Site Core</span>
                    <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                       />
                    </div>
                  </div>
                  {/* Sparks */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: "50%", y: "50%", opacity: 0 }}
                        animate={{ 
                          x: [`${Math.random()*100}%`, `${Math.random()*100}%`], 
                          y: [`${Math.random()*100}%`, `${Math.random()*100}%`],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]"
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Frame */}
        <div className={`h-[600px] relative bg-[#050505] overflow-y-auto custom-scrollbar ${status === 'revealed' ? 'pointer-events-auto' : 'pointer-events-none opacity-10'}`}>
           <div className="p-20 space-y-20">
              <div className="space-y-6">
                 <div className="w-32 h-2 bg-indigo-500/40 rounded-full" />
                 <h1 className="text-8xl font-black uppercase italic tracking-tighter text-white">Manifested <br /> Authority.</h1>
                 <div className="w-full h-[500px] bg-white/[0.03] border border-white/5 rounded-2xl p-12 flex items-center justify-center">
                    <p className="text-4xl font-light italic text-slate-500">Precision Generated Codebase</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-12">
                 {[1,2].map(i => (
                   <div key={i} className="aspect-[4/3] bg-white/[0.02] border border-white/5 rounded-2xl" />
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const VideoSection = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(videoRef, { amount: 0.5 });

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isInView]);

  return (
    <video 
      ref={videoRef}
      loop 
      muted 
      playsInline
      className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-1000"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

const EngineTester = () => {
  const [input, setInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleTest = () => {
    if (!input.trim()) return;
    setIsSynthesizing(true);
    setTimeout(() => setIsSynthesizing(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 glass-premium p-8 border border-indigo-500/20 brutal-shadow relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="flex-grow space-y-4 w-full">
          <div className="flex items-center gap-3">
             <Mic2 className="text-indigo-500 animate-pulse" size={18} />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Live Engine Sandbox</span>
          </div>
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak or type your architectural intent..."
              className="w-full bg-black/40 border-b-2 border-white/10 px-0 py-4 text-xl font-light italic focus:border-indigo-500 outline-none transition-all placeholder:opacity-20"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-4">
               <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><Mic2 size={18} /></button>
            </div>
          </div>
        </div>
        
        <FizzyButton 
          label="Make my Site"
          onClick={handleTest}
          className="whitespace-nowrap"
        />
      </div>
      
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const Home = () => {
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
      console.error('Neural Sync Timeout:', error);
    }
  };

  return (
    <div className="min-h-screen text-white selection:bg-white selection:text-black sm:smooth-scroll antialiased-premium relative scroll-smooth overflow-x-hidden">
      <SynthWaveBackground />
      
      <main className="relative z-10 w-full overflow-hidden">
        {/* Elite Hero - Neural Intro with Video Background */}
        <section className="min-h-screen flex flex-col justify-center px-6 lg:px-24 bg-transparent relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-10 grayscale brightness-30"
            >
              <source src="/input_file_0.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-7xl relative z-10"
          >
            <div className="space-y-6 mb-12 text-center lg:text-left">
              <motion.div variants={skyDrop} className="flex items-center justify-center lg:justify-start gap-6 mb-8">
                 <div className="h-px w-12 bg-indigo-500 hidden lg:block" />
                 <span className="text-[10px] font-black tracking-[0.8em] text-indigo-500 uppercase italic scale-110">World's First Voice-To-Website Engine</span>
                 <SoundWave />
              </motion.div>
              <motion.h1 
                variants={slideLeft}
                className="text-[10vw] lg:text-[8vw] font-black uppercase italic tracking-tighter leading-[0.8] phase-driven break-words px-4 text-white"
              >
                Build a <br /> <span className="text-indigo-500">Money-Making</span> <br /> Website <span className="text-white/20">in 60s.</span>
              </motion.h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-4 space-y-8 text-center lg:text-left">
                <motion.p variants={skyDrop} className="text-lg md:text-2xl text-slate-400 font-light italic leading-relaxed opacity-60 phase-driven mx-auto lg:mx-0 break-words px-4">
                  No coding. No design. Just speak — and your site is live, monetized, and ready to dominate. <span className="text-white opacity-100 font-medium italic underline decoration-indigo-500 underline-offset-8">Neural Speed. Professional ROI.</span>
                </motion.p>
                <motion.div variants={dirtGrow} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-8">
                  <Link to="/pricing/" className="btn-minimal bg-indigo-600 text-white hover:bg-white hover:text-black transition-all border-none">
                    <SplitLink>Create Account</SplitLink>
                  </Link>
                  <Link to="/pricing/" className="text-[10px] items-center gap-2 flex font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                    <SplitLink>View Plans</SplitLink> <ChevronRight size={14} />
                  </Link>
                </motion.div>
              </div>
              
              <div className="lg:col-span-8 flex justify-end">
                <motion.div variants={dirtGrow} className="w-full max-w-2xl border-t border-r border-white/5 pt-8 pr-8 flex justify-between items-start phase-driven">
                   <div className="space-y-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-20">Voice Sync Engine</span>
                      <Logo className="opacity-80 translate-x-[-10%]" />
                   </div>
                   <div className="text-right space-y-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-20">Synchronization</span>
                      <span className="block text-sm font-mono opacity-80 text-emerald-500 italic">99.8% Neural Match</span>
                   </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Neural Marquee - Conversion Pressure */}
        <div className="py-4 border-y border-white/10 bg-indigo-950/20 marquee-container relative z-20 backdrop-blur-md">
          <div className="marquee-content text-[10px] font-black uppercase tracking-[1em] text-indigo-400 py-2">
            BUILD A WEBSITE JUST BY TALKING • NO CODE REQUIRED • FAST DEPLOYMENTS • SUBSCRIBE TO UNLOCK PUBLISHING • PRO + ENTERPRISE SUPPORT CUSTOM DOMAINS • GROW TRAFFIC • GAIN SUBSCRIBERS • 
          </div>
        </div>

        {/* [Ad Block Above Fold] */}
        <GoogleAdSense slot="home-fold-top" />

        {/* The Preview Showcase */}
        <section className="py-60 px-6 lg:px-24 relative overflow-hidden group bg-transparent">
          <div className="glow-bloom mesh-purple top-[-10%] left-[-10%] w-[50%] h-[50%] opacity-[0.03]" />
          <div className="max-w-7xl mx-auto space-y-32">
             <div className="max-w-3xl space-y-8 text-center lg:text-left mx-auto lg:mx-0">
                <span className="subheading italic text-indigo-400">Live Manifestation Generator</span>
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none phase-driven lights-header">
                  Interface <span className="text-white/20">Impenetrable.</span> <br /> Architecture <span className="ultra-glow">Elite.</span>
                </h2>
                <p className="text-xl text-slate-500 font-light italic leading-relaxed">
                  Our websites are built with proprietary neural defensive layers. Non-inspectable by default, optimized for pure speed and conversion.
                </p>
             </div>
             
             <div className="space-y-12">
               <EngineTester />
               <PreviewGenerator />
             </div>
          </div>
        </section>

        {/* Primary Engine Section */}
        <section className="py-60 px-6 lg:px-24 bg-transparent relative overflow-hidden group">
          <div className="grid-structure absolute inset-0 opacity-10" />
          
          <div className="glow-bloom mesh-purple top-[10%] left-[20%] w-[30%] h-[30%] opacity-[0.05]" />
          <div className="glow-soft mesh-pink bottom-[10%] right-[20%] w-[25%] h-[25%] opacity-[0.05]" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
              <div className="lg:col-span-6 relative group/card">
                <div className="absolute -inset-10 bg-indigo-500/5 blur-[80px] pointer-events-none group-hover/card:bg-indigo-500/10 transition-all duration-1000 -z-10" />
                <div className="luxury-card relative z-10 glass-premium premium-shadow overflow-hidden sun-light phase-driven aspect-video">
                  <video 
                    src="/input_file_0.mp4"
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-8 left-8 flex items-center gap-4">
                     <Volume2 className="text-indigo-500 animate-pulse" size={24} />
                  </div>
                </div>
              </div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="lg:col-span-6 space-y-12">
                <div className="space-y-6">
                  <motion.span variants={skyDrop} className="subheading text-indigo-400 font-bold glass-premium py-1 px-3 rounded-sm inline-block phase-driven moon-light">Proprietary Voice AI</motion.span>
                  <motion.h2 variants={dirtGrow} className="text-7xl md:text-8xl font-bold tracking-tighter uppercase italic leading-[0.8] phase-driven text-white lights-header">
                    Your Command <br /> <span className="text-indigo-500 ultra-glow">Is Our Code.</span>
                  </motion.h2>
                </div>
                <motion.p variants={skyDrop} className="text-2xl text-slate-400 font-light italic leading-relaxed opacity-60 max-w-xl phase-driven">
                  The VoiceToWebsite engine translates vocal cadence into visual hierarchy. It doesn't just build sites; it launches digital authority.
                </motion.p>
                <div className="grid grid-cols-2 gap-12 pt-8">
                  <div className="phase-driven hover:translate-y-[-4px] transition-transform">
                     <div className="flex items-center gap-4 mb-2">
                        <Mic2 className="text-indigo-500" size={16} />
                        <div className="text-xl font-display italic text-white ultra-glow">REAL-TIME</div>
                     </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 uppercase">Vocal Latency</div>
                  </div>
                  <div className="phase-driven hover:translate-y-[-4px] transition-transform">
                    <div className="flex items-center gap-4 mb-2">
                        <Monitor className="text-indigo-500" size={16} />
                        <div className="text-xl font-display italic text-white ultra-glow">1-PUSH</div>
                     </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 uppercase">Domain Hookup</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* [Ad Block After Paragraph] */}
        <GoogleAdSense slot="home-content-mid" />

        {/* Selected Projects (Features) */}
        <section id="work" className="py-40 px-6 lg:px-24 relative overflow-hidden group bg-transparent">
          <div className="glow-bloom mesh-purple top-[-10%] right-[-10%] w-[40%] h-[40%] opacity-[0.02]" />
          <div className="absolute top-0 left-0 w-full h-px bg-white/5 shadow-sun-light" />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-7xl mx-auto">
            <div className="mb-32 flex flex-col md:flex-row justify-between items-center md:items-end gap-12 text-center md:text-left">
              <div className="space-y-4">
                <motion.span variants={skyDrop} className="subheading italic">Engine Showcase</motion.span>
                <motion.h2 variants={dirtGrow} className="text-6xl font-bold tracking-tighter uppercase italic phase-driven text-white/50">Neural <br /> <span className="text-white">Case Studies</span></motion.h2>
              </div>
              <motion.span variants={skyDrop} className="text-[10px] font-black tracking-widest opacity-20 uppercase font-mono italic underline decoration-indigo-500 underline-offset-4">Project History 2026</motion.span>
            </div>

            <div className="space-y-0 w-full max-w-5xl mx-auto">
              <FeatureProject 
                number="01"
                title="SaaS Empire"
                description="Built entirely via voice in 4 minutes. High-conversion grid layouts with neural color mapping."
                video="/input_file_5.mp4"
                link="/dashboard"
              />
              <FeatureProject 
                number="02"
                title="Elite Brand"
                description="Luxury fashion experience. Speak the brand vibe, and our engine sources high-def visuals instantly."
                video="/input_file_6.mp4"
                link="/dashboard"
              />
              <FeatureProject 
                number="03"
                title="Agency Command"
                description="Multipage project synchronization. One voice command, entire fleet updated."
                video="/input_file_4.mp4"
                link="/dashboard"
              />
            </div>
          </motion.div>
        </section>

        {/* [Ad Block] */}
        <GoogleAdSense slot="home-guide-bottom" />

        {/* [FAQ] */}
        <section id="faq" className="py-40 px-6 lg:px-24 bg-transparent relative overflow-hidden group">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="subheading text-indigo-400 font-bold italic">Common Inquiries</span>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">Building <span className="text-white/20">Protocols</span></h2>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "How fast is building?", a: "Neural processing begins instantly upon vocal input. Initial sites are completed in < 60 seconds." },
                { q: "Can I edit the generated code?", a: "Yes. Use voice commands to modify any section in real-time or export to your GitHub repository for manual architectural tuning." },
                { q: "Is the monetization engine ready?", a: "Elite and Pro plans include direct Stripe and PayPal integration blocks optimized for maximum ROI." },
                { q: "Do you own my digital empire?", a: "No. You retain 100% intellectual authority over all launched assets." }
              ].map((faq, idx) => (
                <div key={idx} className="glass-premium p-8 border border-white/5 transition-all hover:border-indigo-500/30">
                  <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs mb-4 italic flex items-center gap-4">
                    <Zap size={14} className="animate-pulse" /> {faq.q}
                  </h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed italic">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing is on its own page now. */}

        {/* AdSense Slot */}
        <div className="max-w-7xl mx-auto px-6 lg:px-24 py-32 border-b border-white/5 bg-transparent moon-light">
          <GoogleAdSense slot="banner-home" />
        </div>

        {/* Final Manifesto */}
        <section className="py-80 px-6 lg:px-24 text-center bg-transparent text-white relative antialiased-premium">
          <div className="absolute inset-x-0 top-0 h-px bg-white opacity-10" />
          <motion.div 
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="max-w-5xl mx-auto space-y-12"
          >
            <Logo className="mb-12 opacity-80" />
            <motion.span variants={skyDrop} className="text-[10px] font-black uppercase tracking-[0.8em] opacity-40 italic">The Final Recognition</motion.span>
            <motion.h2 variants={dirtGrow} className="text-[14vw] lg:text-[12vw] font-bold tracking-tighter uppercase leading-[0.8] italic">Build Your <br /> <span className="text-indigo-500">Reality.</span></motion.h2>
            <motion.p variants={skyDrop} className="text-2xl font-light italic leading-relaxed text-white/60 max-w-2xl mx-auto tracking-tight">
               Your thoughts are vibrating. Capture the frequency. Speak your empire into existence with VoiceToWebsite.com.
            </motion.p>
            <motion.div variants={dirtGrow} className="flex justify-center pt-12">
               <Link to="/dashboard" className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all scale-150 relative group">
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                  <div className="absolute inset-[-4px] rounded-full border border-white/5 animate-ping" />
               </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};
