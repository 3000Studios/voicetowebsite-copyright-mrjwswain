import type React from "react";
import { motion } from "motion/react";
import { Check, Code2, Globe, Mic, Sparkles, X, Zap } from "lucide-react";

interface Competitor {
  name: string;
  logo: string;
  price: string;
  features: {
    voiceInput: boolean;
    codeExport: boolean;
    customDomain: boolean;
    aiContent: boolean;
    analytics: boolean;
    whiteLabel: boolean;
  };
}

type FeatureKey = keyof Competitor["features"];
type FeatureMeta = { label: string; icon: React.ComponentType<{ className?: string }> };

const competitors: Competitor[] = [
  { name: "Durable", logo: "D", price: "$15/mo", features: { voiceInput: false, codeExport: false, customDomain: true, aiContent: true, analytics: true, whiteLabel: false } },
  { name: "Framer", logo: "F", price: "$20/mo", features: { voiceInput: false, codeExport: true, customDomain: true, aiContent: false, analytics: true, whiteLabel: false } },
  { name: "10Web", logo: "10", price: "$20/mo", features: { voiceInput: false, codeExport: false, customDomain: true, aiContent: true, analytics: true, whiteLabel: false } },
  { name: "Wix ADI", logo: "W", price: "$16/mo", features: { voiceInput: false, codeExport: false, customDomain: true, aiContent: true, analytics: true, whiteLabel: false } },
];

const ourFeatures: Competitor = {
  name: "VoiceToWebsite",
  logo: "V",
  price: "$15/mo",
  features: { voiceInput: true, codeExport: true, customDomain: true, aiContent: true, analytics: true, whiteLabel: true },
};

const featureLabels: Record<FeatureKey, FeatureMeta> = {
  voiceInput: { label: "Voice Input", icon: Mic },
  codeExport: { label: "Full Code Export", icon: Code2 },
  customDomain: { label: "Custom Domain", icon: Globe },
  aiContent: { label: "AI Content Generation", icon: Sparkles },
  analytics: { label: "Built-in Analytics", icon: Zap },
  whiteLabel: { label: "White-Label Option", icon: Check },
};

export function CompetitorComparison() {
  const featureKeys = Object.keys(featureLabels) as FeatureKey[];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-400 mb-6"
          >
            <Zap className="w-4 h-4" />
            Competitive Analysis
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-headline mb-4"
          >
            Feature Matrix <span className="gradient-text">At a Glance</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-body max-w-2xl mx-auto"
          >
            Public feature availability and baseline pricing snapshot.
          </motion.p>
        </div>

        <div className="grid gap-4 lg:hidden">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-300">VoiceToWebsite</div>
                <div className="text-xs text-slate-400">{ourFeatures.price}</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                {ourFeatures.logo}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {featureKeys.map((key) => {
                const { label, icon: Icon } = featureLabels[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-white/40" />
                      <div>
                        <div className="font-semibold text-white">{label}</div>
                        <div className="text-xs text-slate-400">Included in our plan</div>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="text-sm font-bold uppercase tracking-[0.28em] text-slate-300">Competitors</div>
            <div className="mt-4 grid gap-3">
              {competitors.map((comp) => (
                <div key={comp.name} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{comp.name}</div>
                      <div className="text-xs text-slate-400">{comp.price}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-bold text-white/70">
                      {comp.logo}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    {!comp.features.voiceInput ? <span>no voice input</span> : null}
                    {!comp.features.codeExport ? <span>no export</span> : null}
                    {!comp.features.whiteLabel ? <span>no whitelabel</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="hidden overflow-hidden rounded-[32px] border border-white/10 bg-linear-to-br from-white/5 to-transparent backdrop-blur-2xl lg:block"
        >
          <div className="grid grid-cols-6 gap-4 border-b border-white/10 bg-white/5 p-6 text-sm font-bold uppercase tracking-wider">
            <div className="text-slate-300">Feature</div>
            <div className="text-center text-indigo-400">VoiceToWebsite</div>
            {competitors.map((comp) => (
              <div key={comp.name} className="text-center text-slate-400">
                {comp.name}
              </div>
            ))}
          </div>

          {featureKeys.map((key, index) => {
            const { label, icon: Icon } = featureLabels[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-6 gap-4 border-b border-white/5 p-4 transition-colors hover:bg-white/2"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-white/40" />
                  <span className="text-sm text-white/80">{label}</span>
                </div>
                <Cell value={ourFeatures.features[key]} highlight />
                {competitors.map((comp) => (
                  <Cell key={comp.name} value={comp.features[key]} />
                ))}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

const Cell = ({ value, highlight = false }: { value: boolean; highlight?: boolean }) => (
  <div className="flex justify-center">
    {value ? (
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${highlight ? "bg-emerald-500/20" : "bg-white/10"}`}>
        <Check className={`h-4 w-4 ${highlight ? "text-emerald-400" : "text-white/40"}`} />
      </div>
    ) : (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
        <X className="h-4 w-4 text-white/20" />
      </div>
    )}
  </div>
);
