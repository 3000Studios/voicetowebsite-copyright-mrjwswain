import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  TrendingUp, 
  ExternalLink, 
  Users, 
  DollarSign, 
  Activity, 
  Database,
  Terminal,
  Lock,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, handleFirestoreError } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export const Admin = () => {
  const { user, isReady, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'nexus'>('overview');
  const [sites, setSites] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: "$42.5K",
    activeUsers: "1,240",
    totalManifests: "842",
    neuralUptime: "100%"
  });

  const ADMIN_EMAIL = 'mr.jwswain@gmail.com';
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isReady) return;
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isReady, isAdmin]);

  const fetchAdminData = async () => {
    try {
      const q = query(collection(db, 'sites'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      setSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, 'list', 'sites');
    }
  };

  if (!isReady) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Terminal className="text-indigo-500 animate-pulse" size={48} />
        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] italic">Scanning Authentication Layers...</span>
      </div>
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-blur p-12 border-t-4 border-red-600 brutal-shadow space-y-8 text-center">
          <div className="w-20 h-20 bg-red-600/10 flex items-center justify-center mx-auto rounded-full border border-red-600/20 mb-6">
            <Lock className="text-red-500" size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Access <span className="text-red-600">Denied</span></h2>
            <p className="text-slate-500 font-medium italic text-sm">This terminal is reserved for Neural Architect Swain. Unauthorized entry is logged.</p>
          </div>
          {!user ? (
            <button 
              onClick={loginWithGoogle}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest italic hover:bg-indigo-600 hover:text-white transition-all brutal-shadow"
            >
              Authorize Identity
            </button>
          ) : (
            <button 
              onClick={logout}
              className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest italic hover:bg-white/10 transition-all border border-white/10"
            >
              Terminate Session ({user.email})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6 font-mono">
      <Navbar />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0,transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Overseer Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-20 gap-12 border-b border-white/10 pb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 text-indigo-500 font-mono text-[9px] uppercase tracking-[0.6em] font-black">
              <ShieldAlert size={14} className="animate-pulse" />
              Directorial Override: Active
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
              Nexus <span className="text-white/20">Overseer</span>
            </h1>
            <p className="text-slate-500 font-black italic text-xs tracking-widest uppercase flex items-center gap-4">
              <span>Root: <span className="text-white">{user.email}</span></span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span>Manifests: <span className="text-indigo-400">{sites.length}</span></span>
            </p>
          </div>

          <div className="flex bg-white/5 p-1 border border-white/10 brutal-shadow">
            {(['overview', 'revenue', 'users', 'nexus'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] italic transition-all ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-20">
          <div className="bg-[#050505] p-12 space-y-4 hover:bg-white/[0.02] transition-colors group">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black italic flex items-center gap-2">
              <DollarSign size={12} className="text-indigo-500" /> Revenue_Flow
            </div>
            <div className="text-5xl font-black text-white italic group-hover:translate-x-2 transition-transform">{stats.totalRevenue}</div>
            <div className="flex items-center gap-2 text-[8px] text-emerald-500 font-bold uppercase tracking-widest">
              <TrendingUp size={12} /> +18.4% Net Manifest
            </div>
          </div>
          
          <div className="bg-[#050505] p-12 space-y-4 hover:bg-white/[0.02] transition-colors group">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black italic flex items-center gap-2">
              <Users size={12} className="text-indigo-500" /> Active_Architects
            </div>
            <div className="text-5xl font-black text-white italic group-hover:translate-x-2 transition-transform">{stats.activeUsers}</div>
            <div className="flex items-center gap-2 text-[8px] text-emerald-500 font-bold uppercase tracking-widest">
              <Activity size={12} /> +2.1k Sync Requests
            </div>
          </div>

          <div className="bg-[#050505] p-12 space-y-4 hover:bg-white/[0.02] transition-colors group">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black italic flex items-center gap-2">
              <Database size={12} className="text-indigo-500" /> Storage_Index
            </div>
            <div className="text-5xl font-black text-white italic group-hover:translate-x-2 transition-transform">{stats.totalManifests}</div>
            <div className="flex items-center gap-2 text-[8px] text-indigo-500 font-bold uppercase tracking-widest">
              <Zap size={12} /> 1.2TB PERSISTED
            </div>
          </div>

          <div className="bg-[#050505] p-12 space-y-4 hover:bg-white/[0.02] transition-colors group">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black italic flex items-center gap-2">
              <RefreshCcw size={12} className="text-indigo-500" /> System_Health
            </div>
            <div className="text-5xl font-black text-emerald-500 italic group-hover:translate-x-2 transition-transform">{stats.neuralUptime}</div>
            <div className="flex items-center gap-2 text-[8px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">
              ALL SYSTEMS OPTIMAL
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h2 className="text-3xl font-black uppercase italic tracking-widest text-white">Edge_Sync_Logs</h2>
                <div className="flex gap-4">
                  <button onClick={fetchAdminData} className="px-6 py-2 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all">Flush Buffer</button>
                </div>
              </div>

              <div className="space-y-1">
                {sites.map((site, i) => (
                  <div key={site.id} className="group flex items-center justify-between p-8 bg-white/[0.01] border border-white/5 hover:bg-indigo-600/5 hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-8">
                      <span className="text-slate-800 font-black text-xs w-8">{i + 1}</span>
                      <div className="space-y-2">
                        <div className="text-xs font-black uppercase tracking-widest text-white">{site.title || 'Spectral-Entity'}</div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">{site.ownerId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{site.timestamp?.toDate().toLocaleDateString()}</span>
                        <span className="text-[8px] font-mono text-indigo-500 uppercase tracking-widest">{site.timestamp?.toDate().toLocaleTimeString()}</span>
                      </div>
                      <div className="flex gap-4">
                        <button className="p-3 bg-white/5 text-slate-500 hover:text-white transition-colors border border-white/5"><ExternalLink size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Other tabs would go here if needed */}
        </AnimatePresence>
      </div>
    </div>
  );
};
