import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mic2, Youtube, Twitch, Twitter, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/5 pt-24 pb-12 px-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic mix-blend-difference">
                VoiceTo<span className="text-indigo-500">Website</span>
              </span>
            </Link>
            <p className="text-slate-500 max-w-md mb-10 text-xl font-light leading-relaxed italic">
              Manifesting the digital future through neural-voice synthesis. 
              The boundary between thought and reality has dissolved.
            </p>
            <div className="flex items-center gap-6">
              {[Youtube, Twitch, Twitter, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all duration-500">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-10 italic">Product</h4>
            <ul className="space-y-6">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Features</Link></li>
              <li><Link to="/stories" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Stories</Link></li>
              <li><Link to="/store" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Pricing</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-10 italic">Legal</h4>
            <ul className="space-y-6">
              <li><Link to="/legal" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Privacy Policy</Link></li>
              <li><Link to="/legal" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Terms of Service</Link></li>
              <li><Link to="/legal" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">Cookie Policy</Link></li>
              <li><Link to="/legal" className="text-slate-400 hover:text-indigo-400 font-black uppercase tracking-widest text-xs transition-colors illuminate-hover">GDPR</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t-2 border-slate-900 gap-8">
          <p className="text-slate-500 text-sm font-medium">
            © 2026 VoiceToWebsite.com. All rights reserved. Award-winning design by <span className="text-indigo-400 font-black italic">Ai3kBot</span>.
          </p>
          <div className="flex items-center gap-8">
            <span className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              All systems operational
            </span>
            <div className="flex gap-3">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="w-10 h-6 bg-slate-900 border-2 border-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
