import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { PLAN_LIMITS, PlanType } from '@/constants/plans';
import { FizzyButton } from '@/components/ui/FizzyButton';

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const Setup = () => {
  const { user, isReady, isLoggedIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const provider = (params.get('provider') || 'stripe').toLowerCase();
  const plan = (params.get('plan') || '').toLowerCase() as PlanType;
  const sessionId = params.get('session_id') || '';

  const [username, setUsername] = useState(user?.profile?.username || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planConfig = useMemo(() => PLAN_LIMITS[plan], [plan]);

  const verifyStripe = async () => {
    const res = await fetch('/api/stripe-verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Verification failed');
    return data as { email: string; plan: string };
  };

  const onSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      setError('Username required');
      return;
    }
    if (!planConfig) {
      setError('Missing plan');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (provider === 'stripe') {
        const verified = await verifyStripe();
        if ((verified.email || '').toLowerCase() !== (user.email || '').toLowerCase()) {
          throw new Error('This purchase email does not match your login.');
        }
        if (verified.plan !== plan) {
          throw new Error('Plan mismatch. Please retry checkout from Pricing.');
        }
      } else if (provider === 'paypal') {
        const paypalToken = params.get('token') || params.get('subscription_id');
        if (!paypalToken) {
          throw new Error('PayPal return token missing. Please retry checkout from Pricing.');
        }
      } else {
        throw new Error('Unknown provider. Please retry checkout from Pricing.');
      }

      const accessKey = (await sha256Hex(`${user.uid}:${provider}:${sessionId}:${plan}`)).slice(0, 24).toUpperCase();

      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          username: username.trim(),
          email: user.email || '',
          plan,
          tokens:
            planConfig.commandsPerCycle === Number.MAX_SAFE_INTEGER
              ? 999999
              : planConfig.commandsPerCycle,
          accessKey,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Setup failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-40 px-6 flex flex-col items-center justify-center text-center space-y-10">
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none lights-header">
          Complete <span className="text-indigo-500 ultra-glow">Setup</span>
        </h1>
        <p className="max-w-xl text-slate-400 italic">
          Sign in so we can attach your subscription to your account and unlock your dashboard.
        </p>
        <Link className="btn-minimal bg-indigo-600 text-white hover:bg-white hover:text-black border-none" to="/login">
          Continue to Sign In
        </Link>
        <Link className="btn-minimal" to="/pricing/">
          Back to Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 px-6 max-w-3xl mx-auto">
      <div className="space-y-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none lights-header"
        >
          Setup <span className="text-indigo-500 ultra-glow">Access</span>
        </motion.h1>

        <div className="glass-premium p-10 border border-white/5 space-y-8">
          <div className="text-left space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Plan</div>
            <div className="text-2xl font-black uppercase italic">{planConfig?.name || plan}</div>
            <div className="text-sm text-slate-400 italic">{planConfig?.description}</div>
          </div>

          <div className="text-left space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-4 text-white italic focus:border-indigo-500 outline-none"
              placeholder="Your handle"
            />
          </div>

          {error ? <div className="text-red-400 text-sm italic">{error}</div> : null}

          <div className="pt-2">
            <FizzyButton label={saving ? 'FINALIZING...' : 'ENTER DASHBOARD'} onClick={() => !saving && onSave()} />
          </div>

          <div className="text-[10px] uppercase tracking-[0.4em] opacity-30 italic">
            This binds your purchase to your login and generates your access key.
          </div>
        </div>
      </div>
    </div>
  );
};
