import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Star, Loader2 } from 'lucide-react';

const PricingCard = ({ title, price, period, description, features, highlighted = false, onSubscribe }: any) => (
  <div className={`glass-card p-12 flex flex-col h-full transition-all duration-500 border-white/5 hover:border-white/20 ${
    highlighted 
      ? 'border-indigo-500/50 scale-105 z-10 shadow-[0_0_50px_rgba(99,102,241,0.2)]' 
      : ''
  }`}>
    {highlighted && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-1 text-[10px] font-black uppercase tracking-[0.3em] italic">
        MOST POPULAR
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">{title}</h3>
      <p className={`text-sm font-light italic ${highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>{description}</p>
    </div>
    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black text-white italic">${price}</span>
        <span className={`text-sm font-light uppercase italic tracking-widest ${highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>/{period}</span>
      </div>
    </div>
    <ul className="space-y-6 mb-12 flex-1">
      {features.map((feature: string, i: number) => (
        <li key={i} className="flex items-center gap-3">
          <Zap className={highlighted ? 'text-indigo-400 fill-indigo-400' : 'text-indigo-500'} size={14} />
          <span className={`text-sm font-light italic ${highlighted ? 'text-white' : 'text-slate-400'}`}>{feature}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onSubscribe}
      className={`w-full py-4 font-black uppercase tracking-widest transition-all duration-500 ${
        highlighted 
          ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
          : 'border border-white/10 text-white hover:bg-white hover:text-black'
      }`}
    >
      Manifest Now
    </button>
  </div>
);

export default function Store() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const session = await response.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        alert("Stripe session creation failed. Please check your environment variables.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-48 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-[10rem] lusion-text text-white mb-8"
        >
          The <span className="text-indigo-500">Investment</span>
        </motion.h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-light italic uppercase tracking-[0.3em]">
          Choose your level of digital dominance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        <PricingCard 
          title="Starter"
          price="19.99"
          period="mo"
          description="Perfect for new empires."
          features={[
            "5 Manifestations / mo",
            "Standard Edge Hosting",
            "Voice-to-SEO",
            "Community Support"
          ]}
          onSubscribe={handleSubscribe}
        />
        <PricingCard 
          title="Pro Manifest"
          price="39.99"
          period="6mo"
          description="For serious digital architects."
          highlighted={true}
          features={[
            "Unlimited Manifestations",
            "Global Edge Priority",
            "Custom Domain Support",
            "24/7 Neural Support",
            "Advanced Analytics"
          ]}
          onSubscribe={handleSubscribe}
        />
        <PricingCard 
          title="Agency"
          price="99.99"
          period="mo"
          description="Scale your digital influence."
          features={[
            "White-Label Dashboard",
            "Client Management",
            "Bulk Manifestation",
            "API Access",
            "Dedicated Strategist"
          ]}
          onSubscribe={handleSubscribe}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="lifted-section p-10 bg-slate-900 text-center">
          <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center mb-6 mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <Zap className="text-white" size={32} />
          </div>
          <h4 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Instant Access</h4>
          <p className="text-slate-400 font-medium">Get started in seconds. No complex setup or onboarding required.</p>
        </div>
        <div className="lifted-section p-10 bg-slate-900 text-center">
          <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center mb-6 mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <Shield className="text-white" size={32} />
          </div>
          <h4 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Secure Payments</h4>
          <p className="text-slate-400 font-medium">All transactions are processed securely via Stripe. Your data is safe with us.</p>
        </div>
        <div className="lifted-section p-10 bg-slate-900 text-center">
          <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center mb-6 mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <Star className="text-white" size={32} />
          </div>
          <h4 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">Award-Winning</h4>
          <p className="text-slate-400 font-medium">Join the thousands of users who have voted us the #1 AI Web Builder of 2026.</p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <p className="text-white font-black uppercase tracking-widest text-xl animate-pulse italic">Redirecting to Secure Checkout...</p>
          </div>
        </div>
      )}
    </div>
  );
}
