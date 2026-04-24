import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { FizzyButton } from '@/components/ui/FizzyButton';
import { Zap, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Success = () => {
  const [params] = useSearchParams();
  const provider = (params.get('provider') || 'stripe').toLowerCase();
  const plan = (params.get('plan') || '').toLowerCase();
  const sessionId = params.get('session_id') || '';
  const tx = sessionId ? sessionId.slice(-12) : '';

  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ffffff', '#ec4899']
    });
  }, []);

  return (
    <div className="min-h-screen pt-40 px-6 flex flex-col items-center justify-center text-center space-y-12">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)]"
      >
        <CheckCircle2 size={64} className="text-white" />
      </motion.div>

      <div className="space-y-6">
        <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none lights-header">
          Neural Sync <br /> <span className="text-indigo-500 ultra-glow">Successful.</span>
        </h1>
        <p className="max-w-xl mx-auto text-xl text-slate-400 font-light italic leading-relaxed">
          Your power level has been elevated. You now have unrestricted access to the building engine. All monetization protocols are active.
        </p>
      </div>

      <div className="pt-12">
        <Link to={`/setup?provider=${encodeURIComponent(provider)}&plan=${encodeURIComponent(plan)}&session_id=${encodeURIComponent(sessionId)}`}>
          <FizzyButton label="SETUP ACCESS + ENTER DASHBOARD" />
        </Link>
      </div>

      <div className="pt-24 opacity-20 flex gap-12 items-center italic text-[10px] uppercase tracking-[0.5em] font-black font-mono">
        <div className="flex items-center gap-2">
            <Zap size={14} className="text-indigo-500" />
            Empowered by AI3KBOT
        </div>
        {tx ? <span>Transaction ID: {tx.toUpperCase()}</span> : null}
      </div>
    </div>
  );
};
