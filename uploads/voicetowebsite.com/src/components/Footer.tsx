import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Mail, Zap, Globe, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { SplitLink } from './ui/SplitLink';

export const Footer = () => {
  return (
    <footer className="relative bg-transparent py-40 px-6 lg:px-24 overflow-hidden group">
      {/* Fading Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="glow-bloom mesh-blue bottom-[-10%] left-[-10%] w-[30%] h-[30%] opacity-[0.03]" />
      <div className="max-w-7xl mx-auto relative z-10 moon-light phase-driven">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-24">
          {/* Main Visual Call */}
          <div className="md:col-span-6 space-y-12">
            <Logo className="scale-150 origin-left" />
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none italic">
              Speak. <br /> Manifest. <span className="text-white/20">Dominate.</span>
            </h2>
            <div className="space-y-4">
              <span className="block text-[10px] font-black uppercase tracking-[0.6em] opacity-20">Direct Inquiries</span>
              <a href="mailto:support@voicetowebsite.com" className="text-2xl font-light italic hover:text-indigo-500 transition-colors block">
                <SplitLink>support@voicetowebsite.com</SplitLink>
              </a>
            </div>
          </div>

          {/* Sitemaps */}
          <div className="md:col-span-2 space-y-8">
            <span className="block text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Navigation</span>
            <div className="flex flex-col gap-4">
              {['Home', 'About', 'Archives', 'Command'].map(link => (
                <Link key={link} to={link === 'Home' ? '/' : `/${link.toLowerCase()}`} className="text-sm font-light italic hover:opacity-100 transition-opacity">
                  <SplitLink className="animate-lights">{link}</SplitLink>
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
             <span className="block text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Protocols</span>
             <div className="flex flex-col gap-4">
               <Link to="/legal" className="text-sm font-light italic hover:opacity-100 transition-opacity">
                 <SplitLink className="animate-lights">Terms of Logic</SplitLink>
               </Link>
               <Link to="/legal" className="text-sm font-light italic hover:opacity-100 transition-opacity">
                 <SplitLink className="animate-lights">Privacy Shield</SplitLink>
               </Link>
               <Link to="/legal" className="text-sm font-light italic hover:opacity-100 transition-opacity">
                 <SplitLink className="animate-lights">Deployment SLA</SplitLink>
               </Link>
             </div>
          </div>

          <div className="md:col-span-2 space-y-8">
             <span className="block text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Follow</span>
             <div className="flex flex-col gap-4">
               {['Twitter', 'Instagram', 'LinkedIn', 'Github'].map(s => (
                 <a key={s} href="#" className="text-sm font-light italic hover:opacity-100 transition-opacity">
                   <SplitLink className="animate-lights">{s}</SplitLink>
                 </a>
               ))}
             </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="mt-40 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-8">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20 italic">© 2026 Neural Architect</span>
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Core Status: Optimal</span>
             </div>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.6em] opacity-20 italic">
             <span>v8.2.0</span>
             <span>AI3KBOT SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Pink Asset Glow / Liquid Sync */}
      <div className="absolute bottom-[-5vh] left-0 w-full h-[15vh] bg-gradient-to-t from-pink-600/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scaleY: [1, 1.2, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-full h-4 bg-pink-500/10 blur-xl"
      />
    </footer>
  );
};
