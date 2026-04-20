import React from 'react';
import { motion } from 'motion/react';
import { VoiceApp } from '@/components/VoiceApp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Globe, Sparkles, BarChart3, Mic2, Play } from 'lucide-react';
import { Logo3D } from '@/components/Logo3D';

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="bg-white/5 backdrop-blur-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500">
    <div className="w-12 h-12 bg-white/10 flex items-center justify-center mb-6">
      <Icon className="text-white" size={24} />
    </div>
    <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">{title}</h3>
    <p className="text-slate-500 font-light leading-relaxed">{description}</p>
  </div>
);

const WizardStep = ({ number, title, description, icon, isGlobe }: any) => (
  <div className="text-center group">
    <motion.div 
      whileHover={{ scale: 1.1, y: -10 }}
      className="text-7xl font-black text-white/10 mb-4 group-hover:text-indigo-500 transition-all relative inline-block italic"
    >
      {number}
    </motion.div>
    <motion.div 
      whileHover={{ rotate: isGlobe ? 360 : 10, scale: 1.2 }}
      transition={{ duration: isGlobe ? 2 : 0.3, ease: "easeInOut" }}
      className="w-24 h-24 bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:border-white transition-all overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {icon}
    </motion.div>
    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight italic">{title}</h3>
    <p className="text-slate-500 font-light leading-relaxed italic">{description}</p>
  </div>
);

import { NeuralLusionBackground } from '@/components/NeuralLusionBackground';
import { SynthBackground } from '@/components/SynthBackground';
import { RandomTextEffect } from '@/components/RandomTextEffect';
import { useSound } from '@/lib/sounds';

export const Home = () => {
  const { playTick } = useSound();

  return (
    <div className="relative space-y-32 pb-32 overflow-hidden bg-black">
      <NeuralLusionBackground />
      <SynthBackground />
      
      {/* Hero Section: Interactive Workspace */}
      <section className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
        {/* Hero Video Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <video 
            src="/input_file_4.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Badge className="bg-indigo-500 text-white mb-6 uppercase tracking-[0.3em] font-black rounded-none px-6 py-2">2026 Neural Engine</Badge>
              <h1 className="text-6xl md:text-8xl lusion-text text-white mb-8 text-3d">
                <RandomTextEffect text="VoiceTo" /> <br />
                <span className="text-indigo-500"><RandomTextEffect text="Website" /></span>
              </h1>
              <p className="text-xl text-slate-400 mb-12 font-light tracking-widest uppercase italic leading-relaxed">
                The boundary between thought and digital reality has dissolved. 
                Speak your empire into existence in sub-seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onMouseEnter={playTick}
                  onClick={() => document.getElementById('engine-workspace')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-oval text-white"
                >
                  Start Building Free
                </button>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://picsum.photos/seed/${i}/40/40`} className="w-10 h-10 rounded-full border-2 border-black" alt="User" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                    <span className="text-white">1,240+</span> sites manifested today
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              id="engine-workspace"
              className="relative"
            >
              <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-2">
                <VoiceApp />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Industry Templates */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl lusion-text text-white mb-4 text-3d">
              <RandomTextEffect text="Industry Blueprints" />
            </h2>
            <p className="text-slate-500 font-light italic uppercase tracking-widest">Optimized for conversion. Manifested for you.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 group overflow-hidden">
              <h3 className="text-3xl font-black text-white mb-4 italic uppercase text-3d">Restaurant Manifest</h3>
              <p className="text-slate-500 mb-8 font-light italic">Voice-to-Menu, reservation integration, and local SEO auto-injected.</p>
              <img src="https://picsum.photos/seed/restaurant/800/400" className="w-full h-64 object-cover rounded-3xl" alt="Restaurant" />
            </div>
            
            <div className="group overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-4 italic uppercase text-3d">Portfolio Link</h3>
              <p className="text-slate-500 mb-8 font-light italic">Showcase your work with neural-curated layouts.</p>
              <img src="https://picsum.photos/seed/portfolio/400/400" className="w-full h-64 object-cover rounded-3xl" alt="Portfolio" />
            </div>

            <div className="group overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-4 italic uppercase text-3d">SaaS Landing</h3>
              <p className="text-slate-500 mb-8 font-light italic">High-conversion waitlists and feature grids.</p>
              <img src="https://picsum.photos/seed/saas/400/400" className="w-full h-64 object-cover rounded-3xl" alt="SaaS" />
            </div>

            <div className="md:col-span-2 group overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-white mb-4 italic uppercase text-3d">E-Commerce Flow</h3>
                  <p className="text-slate-500 mb-8 font-light italic">Voice-to-Product pages with Stripe integration ready to manifest.</p>
                  <button onMouseEnter={playTick} className="btn-oval text-white text-xs">Explore Blueprint</button>
                </div>
                <img src="https://picsum.photos/seed/shop/400/300" className="w-full md:w-64 h-64 object-cover rounded-3xl" alt="Shop" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof: Live Feed */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden border border-white/10">
                <video src="/input_file_2.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white uppercase italic mb-2 text-3d">Live Manifestation Feed</h4>
                <p className="text-slate-500 text-sm font-light italic">Real-time updates from the neural network.</p>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                {[
                  { user: 'Jeremy', action: 'shipped a site for', target: 'The Cajun Menu', time: '2m ago' },
                  { user: 'Sarah', action: 'manifested a portfolio for', target: 'Design Studio X', time: '5m ago' },
                  { user: 'Alex', action: 'launched an empire for', target: 'CryptoFlow', time: '12m ago' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                      <span className="text-white">{item.user}</span> {item.action} <span className="text-indigo-400">{item.target}</span>
                    </p>
                    <span className="text-[10px] text-slate-600 ml-auto">{item.time}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <section id="engine-workspace" className="px-6 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-9xl lusion-text text-white mb-8 text-3d">
              <RandomTextEffect text="The Engine" />
            </h2>
            <p className="text-slate-500 text-2xl max-w-3xl mx-auto font-light italic tracking-widest uppercase">
              Don't just build a website. Speak a legacy into existence.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-1"
          >
            <VoiceApp />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <FeatureCard 
              icon={Zap}
              title="Neural Speed"
              description="Proprietary LLM architecture optimized for sub-second layout generation and real-time voice processing."
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <FeatureCard 
              icon={Shield}
              title="IP Protection"
              description="Encrypted preview containers ensure your unique designs and copy remain yours until you're ready to launch."
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <FeatureCard 
              icon={Globe}
              title="Global Edge"
              description="Automatic deployment to 250+ global edge locations for lightning-fast performance in every country."
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
            {[
              { label: 'Sites Built', value: '10M+' },
              { label: 'Satisfaction', value: '99.9%' },
              { label: 'Design Awards', value: '240+' },
              { label: 'Uptime', value: '100%' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-6xl md:text-8xl font-black text-white mb-4 italic tracking-tighter mix-blend-difference text-3d">{stat.value}</div>
                <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs italic">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-9xl lusion-text text-white mb-8 text-3d">
              <RandomTextEffect text="Token Economy" />
            </h2>
            <p className="text-slate-500 text-2xl max-w-3xl mx-auto font-light italic tracking-widest uppercase">
              1 Page = 10 Tokens. 1 Dollar = 10 Tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Starter */}
            <div className="flex flex-col group transition-all">
              <h3 className="text-2xl font-black text-white uppercase italic mb-4 text-3d">Basic Pack</h3>
              <div className="text-5xl font-black text-white mb-8 italic">$5.00<span className="text-sm text-slate-500 font-light tracking-widest">/min</span></div>
              <ul className="space-y-6 mb-12 flex-1">
                {['50 Tokens Included', 'User Dashboard Access', 'Save Progress', 'Basic Voice Edits'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-light italic">
                    <Zap size={14} className="text-indigo-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button onMouseEnter={playTick} className="btn-oval text-white">Buy 50 Tokens</button>
            </div>

            {/* Pro */}
            <div className="flex flex-col relative group z-10">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-1 text-[10px] font-black uppercase tracking-[0.3em] italic">Best Value</div>
              <h3 className="text-2xl font-black text-white uppercase italic mb-4 text-3d">Empire Subscription</h3>
              <div className="text-5xl font-black text-white mb-8 italic">$10.00<span className="text-sm text-slate-500 font-light tracking-widest">/mo</span></div>
              <ul className="space-y-6 mb-12 flex-1">
                {['100 Tokens / mo', 'Advanced User Dashboard', 'Full Code Export', 'Multi-Page Voice Building', 'Priority Neural Support'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-white text-sm font-bold italic">
                    <Zap size={14} className="text-indigo-500 fill-indigo-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button onMouseEnter={playTick} className="btn-oval text-white">Subscribe Now</button>
            </div>

            {/* Agency */}
            <div className="flex flex-col group transition-all">
              <h3 className="text-2xl font-black text-white uppercase italic mb-4 text-3d">Agency Pack</h3>
              <div className="text-5xl font-black text-white mb-8 italic">$50.00<span className="text-sm text-slate-500 font-light tracking-widest">/one-time</span></div>
              <ul className="space-y-6 mb-12 flex-1">
                {['600 Tokens (Bonus 100)', 'White-Label Dashboard', 'Bulk Page Generation', 'API Access', 'Dedicated Strategist'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-light italic">
                    <Zap size={14} className="text-indigo-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button onMouseEnter={playTick} className="btn-oval text-white">Buy 600 Tokens</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 dot-pattern opacity-10" />
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-black text-white mb-10 uppercase italic tracking-tighter leading-none text-3d">
              <RandomTextEffect text="Your Empire" /> <br /> <RandomTextEffect text="Awaits Your Voice." />
            </h2>
            <p className="text-2xl text-indigo-100/80 mb-16 max-w-3xl mx-auto font-light italic leading-relaxed">
              Stop typing. Start speaking. Join the elite 1% of entrepreneurs building at the speed of thought.
            </p>
            <button onMouseEnter={playTick} className="btn-oval text-white text-2xl px-20">
              Get Started Now
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
