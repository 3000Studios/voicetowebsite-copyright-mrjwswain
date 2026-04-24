import React from 'react';
import { motion } from 'motion/react';
import { useSound } from '@/lib/sounds';
import { FizzyButton } from '@/components/ui/FizzyButton';
import { Check, Zap, ShieldCheck, Globe } from 'lucide-react';
import { PLAN_LIMITS, PlanType } from '@/constants/plans';

export const Pricing = () => {
  const { playClick, playTick } = useSound();
  const [cadence, setCadence] = React.useState<'month' | 'year'>('month');

  const handleUpgrade = async (plan: PlanType, provider: 'stripe' | 'paypal' = 'stripe') => {
    playClick();
    try {
      const endpoint = provider === 'stripe' ? '/api/create-checkout-session' : '/api/create-paypal-order';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cadence })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <div className="text-center space-y-8 mb-24">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="subheading text-indigo-400"
        >
          Institutional Resource Allocation
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none lights-header"
        >
          Choose Your <br /> <span className="text-indigo-500 ultra-glow">Power Level.</span>
        </motion.h1>
      </div>

      <div className="flex items-center justify-center gap-3 mb-16">
        <button
          onMouseEnter={playTick}
          onClick={() => setCadence('month')}
          className={`px-6 py-3 border text-[10px] font-black uppercase tracking-[0.4em] italic transition-all ${
            cadence === 'month' ? 'bg-indigo-600 text-white border-indigo-500' : 'border-black/10 text-slate-600 hover:border-indigo-500'
          }`}
        >
          Monthly
        </button>
        <button
          onMouseEnter={playTick}
          onClick={() => setCadence('year')}
          className={`px-6 py-3 border text-[10px] font-black uppercase tracking-[0.4em] italic transition-all ${
            cadence === 'year' ? 'bg-indigo-600 text-white border-indigo-500' : 'border-black/10 text-slate-600 hover:border-indigo-500'
          }`}
        >
          Annual (20% off)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
        {(['starter', 'pro', 'enterprise', 'commands'] as PlanType[]).map((key, i) => {
          const plan = PLAN_LIMITS[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className={`glass-premium p-12 space-y-12 relative overflow-hidden group transition-all duration-500
                ${key === 'pro' ? 'border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.1)] scale-105 z-10' : ''}
                ${key === 'enterprise' ? 'border-slate-900/10 shadow-[0_0_40px_rgba(17,24,39,0.06)] scale-105 z-10' : ''}
                ${key === 'commands' ? 'border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.08)]' : ''}
                ${key !== 'pro' && key !== 'enterprise' ? 'opacity-90 hover:opacity-100' : ''}
              `}
            >
              {(key === 'pro' || key === 'enterprise') && (
                <div
                  className={`absolute top-0 right-0 text-white text-[8px] font-black uppercase tracking-[0.4em] px-4 py-2 italic animate-pulse
                  ${key === 'enterprise' ? 'bg-slate-900' : 'bg-indigo-500'}
                `}
                >
                  {key === 'enterprise' ? 'Agency Tier' : 'Most Popular'}
                </div>
              )}

              {key === 'commands' && (
                <div className="absolute top-0 right-0 text-white text-[8px] font-black uppercase tracking-[0.4em] px-4 py-2 italic bg-cyan-500/80">
                  One-Time Boost
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">
                    {key === 'commands'
                      ? '$2.99'
                      : cadence === 'year'
                        ? `$${(plan.price * 12 * 0.8).toFixed(0)}`
                        : `$${plan.price}`}
                  </span>
                  <span className="text-xs uppercase tracking-widest opacity-40 font-bold">
                    {key === 'commands' ? '/ pack' : cadence === 'year' ? '/ year' : '/ month'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-light italic leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-6">
                {[
                  key === 'commands'
                    ? 'Adds 5 more commands'
                    : `${plan.commands === Number.MAX_SAFE_INTEGER ? 'Unlimited' : plan.commands} commands / cycle`,
                  key === 'commands'
                    ? 'One-time purchase'
                    : `${plan.sites === Number.MAX_SAFE_INTEGER ? 'Unlimited' : plan.sites} websites you can build`,
                  key === 'commands' ? 'Repeat anytime' : '30 days of access',
                  key === 'commands' ? 'Instant unlock' : 'Billed every 31 days',
                  plan.export ? 'Export to GitHub' : 'No GitHub export',
                  plan.watermark ? 'Watermark enabled' : 'No watermark',
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-60 italic"
                  >
                    <Check size={14} className={key === 'enterprise' ? 'text-slate-900' : 'text-indigo-500'} />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="pt-8 space-y-4">
                <FizzyButton
                  label={key === 'commands' ? 'BUY COMMAND PACK' : `SUBSCRIBE ${key.toUpperCase()}`}
                  onClick={() => handleUpgrade(key, 'stripe')}
                />
                <button
                  onMouseEnter={playTick}
                  onClick={() => handleUpgrade(key, 'paypal')}
                  className="w-full py-4 border border-white/10 hover:border-indigo-500/60 text-white/70 hover:text-white transition-all duration-500 text-[9px] font-black uppercase tracking-[0.4em] italic"
                >
                  Pay with PayPal
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-40 text-center space-y-12 max-w-2xl mx-auto">
        <h4 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 italic">Global Infrastructure Guard</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-20">
          <ShieldCheck size={40} className="mx-auto" />
          <Zap size={40} className="mx-auto" />
          <Globe size={40} className="mx-auto" />
          <Check size={40} className="mx-auto" />
        </div>
        <p className="text-sm text-slate-500 italic font-light leading-relaxed">
          All builds are secured by Tier-4 cryptographic protocols. Transactions handled by Stripe and PayPal. 
          Neural limits reset every synchronized epoch.
        </p>
      </div>
    </div>
  );
};
