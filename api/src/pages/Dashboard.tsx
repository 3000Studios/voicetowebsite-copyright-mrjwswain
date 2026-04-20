import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Layout, 
  Settings, 
  Globe, 
  Zap, 
  Sparkles, 
  Layers, 
  MousePointer2, 
  Flame,
  RotateCcw,
  Grid,
  Mic
} from 'lucide-react';
import { VoiceApp } from '@/components/VoiceApp';

export const Dashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'features' | 'analytics' | 'settings'>('builder');
  const [showSuccessKey, setShowSuccessKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [userSites, setUserSites] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const newKey = `KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setGeneratedKey(newKey);
      setShowSuccessKey(true);
    }
    
    if (isLoggedIn) {
      fetchUserSites();
    }
  }, [isLoggedIn]);

  const fetchUserSites = async () => {
    try {
      const res = await fetch('/api/admin/sites'); // In real app, filter by user
      const data = await res.json();
      setUserSites(data.filter((s: any) => s.username === 'anonymous' || s.username === email));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Hardcoded credentials for the owner as requested
    if (email === 'mr.jwswain@gmail.com' && key === '5555') {
      setIsLoggedIn(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, key }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
      } else {
        alert("Invalid email or subscription key");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md lifted-section bg-slate-900 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Pro <span className="text-indigo-400">Access</span></h1>
            <p className="text-slate-400 font-medium">Enter your credentials to unlock the full potential.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-2 border-slate-800 text-white h-14 rounded-none focus:border-indigo-500 transition-all font-bold"
              required
            />
            <Input 
              type="text"
              placeholder="Subscription Key (e.g. KEY-123)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-slate-950 border-2 border-slate-800 text-white h-14 rounded-none focus:border-indigo-500 transition-all font-bold"
              required
            />
            <button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.4)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </button>
            <p className="text-center text-xs text-slate-500 font-black uppercase tracking-widest">
              Don't have a key? <a href="/store" className="text-indigo-400 hover:underline">Get one here</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tighter uppercase italic">PRO <span className="text-indigo-400">DASHBOARD</span></h1>
          <p className="text-slate-400 text-xl font-medium italic">Welcome back, {email}. Your Pro subscription is active.</p>
        </div>
        <div className="flex bg-slate-900 p-2 border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <button 
            onClick={() => setActiveTab('builder')}
            className={`px-6 py-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'builder' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Builder
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'features' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Features
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Settings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccessKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
          >
            <div className="w-full max-w-md lifted-section bg-indigo-600 p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-white" />
              <div className="w-24 h-24 bg-white flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                <Sparkles className="text-indigo-600" size={48} />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">SUCCESS!</h2>
              <p className="text-indigo-100 mb-10 font-medium">Your Pro subscription is now active. Here is your unique subscription key:</p>
              <div className="bg-white p-6 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                <code className="text-3xl font-black text-indigo-600 tracking-widest select-all">{generatedKey}</code>
              </div>
              <p className="text-xs text-indigo-200 mb-10 font-black uppercase tracking-widest">Please save this key. You will need it to log in.</p>
              <button 
                onClick={() => setShowSuccessKey(false)}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest h-16 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] transition-all"
              >
                Start Building Pro
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 space-y-12">
                <div className="lifted-section bg-slate-900 p-8">
                  <h3 className="text-2xl font-black text-white mb-6 uppercase italic tracking-tight flex items-center gap-3">
                    <Mic size={24} className="text-indigo-400" />
                    Voice
                  </h3>
                  <div className="space-y-4">
                    {["Make the header text on fire", "Spin the logo backwards", "Change layout to 3-column grid", "Add a neon glow to all buttons"].map((cmd, i) => (
                      <div key={i} className="p-4 bg-slate-950 border-2 border-slate-800 text-sm font-medium text-slate-400 hover:border-indigo-500 transition-all cursor-pointer italic">
                        "{cmd}"
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lifted-section bg-slate-900 p-8">
                  <h3 className="text-2xl font-black text-white mb-6 uppercase italic tracking-tight flex items-center gap-3">
                    <Layers size={24} className="text-purple-400" />
                    Styles
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {["Dark Mode", "Glassmorphism", "Neumorphism", "Brutalist"].map((style, i) => (
                      <button key={i} className="h-12 bg-slate-950 border-2 border-slate-800 text-white font-black uppercase tracking-widest text-[10px] hover:border-indigo-500 transition-all">
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <VoiceApp />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            <FeaturePreviewCard 
              icon={MousePointer2}
              title="Click-to-Edit"
              description="Highlight any section of your generated site and use your voice to modify it instantly."
              color="indigo"
            />
            <FeaturePreviewCard 
              icon={Flame}
              title="Neural Effects"
              description="Apply complex CSS animations like fire, liquid distortion, and particle systems via voice."
              color="orange"
            />
            <FeaturePreviewCard 
              icon={RotateCcw}
              title="Reverse Motion"
              description="Animate elements backwards, spin them in 3D, or create custom physics-based transitions."
              color="purple"
            />
            <FeaturePreviewCard 
              icon={Grid}
              title="Dynamic Grid Engine"
              description="Instantly swap between bento grids, masonry layouts, and standard flex containers."
              color="blue"
            />
            <FeaturePreviewCard 
              icon={Zap}
              title="Quick Setting Library"
              description="Access a plethora of pre-built styles and themes that can be fetched and applied in milliseconds."
              color="yellow"
            />
            <FeaturePreviewCard 
              icon={Sparkles}
              title="AI Asset Generation"
              description="Generate custom icons, logos, and hero images directly within the builder."
              color="pink"
            />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
              <div className="lifted-section bg-slate-900 p-8">
                <h4 className="text-slate-500 font-black uppercase tracking-widest text-xs mb-2">Total Sites</h4>
                <div className="text-4xl font-black text-white uppercase italic">{userSites.length}</div>
              </div>
              <div className="lifted-section bg-slate-900 p-8">
                <h4 className="text-slate-500 font-black uppercase tracking-widest text-xs mb-2">Generations Left</h4>
                <div className="text-4xl font-black text-white uppercase italic">25 / 25</div>
              </div>
              <div className="lifted-section bg-slate-900 p-8">
                <h4 className="text-slate-500 font-black uppercase tracking-widest text-xs mb-2">Total Views</h4>
                <div className="text-4xl font-black text-white uppercase italic">0</div>
              </div>
            </div>

            <div className="lifted-section bg-slate-900 overflow-hidden">
              <div className="p-8 border-b-2 border-slate-800 bg-slate-950/50">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">My Generated Sites</h3>
              </div>
              <div className="divide-y-2 divide-slate-800">
                {userSites.length > 0 ? userSites.map((site) => (
                  <div key={site.id} className="p-8 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div>
                      <div className="font-black text-white uppercase italic tracking-tight text-lg mb-1">{site.id}</div>
                      <div className="text-xs text-slate-500 font-medium italic">Created: {new Date(site.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-4">
                      <a 
                        href={`/${site.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-indigo-500 transition-all"
                      >
                        View
                      </a>
                      <button className="px-6 py-3 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-slate-700 transition-all">
                        Settings
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-16 text-center text-slate-500 font-black uppercase tracking-widest italic">You haven't generated any sites yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FeaturePreviewCard = ({ icon: Icon, title, description, color }: any) => {
  const colorClasses: any = {
    indigo: 'bg-indigo-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
    orange: 'bg-orange-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
    purple: 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
    blue: 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
    yellow: 'bg-yellow-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
    pink: 'bg-pink-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]',
  };

  return (
    <div className="lifted-section bg-slate-900 p-10 hover:translate-y-[-8px] transition-all group cursor-pointer border-t-4 border-indigo-600">
      <div className={`w-16 h-16 flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${colorClasses[color]}`}>
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed mb-8">{description}</p>
      <div className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-widest text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Try Now</span>
        <Zap size={16} />
      </div>
    </div>
  );
};
