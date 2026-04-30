import { motion } from 'framer-motion';
import { Check, X, Mic, Zap, Code2, Globe, Sparkles } from 'lucide-react';

interface Competitor {
  name: string;
  logo: string;
  strengths: string[];
  weaknesses: string[];
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

const competitors: Competitor[] = [
  {
    name: 'Durable',
    logo: 'D',
    strengths: ['Instant setup', 'Business tools bundled', 'Frequent updates'],
    weaknesses: ['Generic AI copy', 'Limited e-commerce', 'Mobile optimization issues'],
    price: '$15/mo',
    features: {
      voiceInput: false,
      codeExport: false,
      customDomain: true,
      aiContent: true,
      analytics: true,
      whiteLabel: false,
    },
  },
  {
    name: 'Framer',
    logo: 'F',
    strengths: ['Design freedom', 'Free-form canvas', 'Plugin ecosystem'],
    weaknesses: ['Steep learning curve', 'Higher monthly fees', 'Community support only'],
    price: '$20/mo',
    features: {
      voiceInput: false,
      codeExport: true,
      customDomain: true,
      aiContent: false,
      analytics: true,
      whiteLabel: false,
    },
  },
  {
    name: '10Web',
    logo: '10',
    strengths: ['WordPress-based', 'Fast hosting', 'Elementor customization'],
    weaknesses: ['Traffic restrictions', 'Rigid designs', 'WP learning curve'],
    price: '$20/mo',
    features: {
      voiceInput: false,
      codeExport: false,
      customDomain: true,
      aiContent: true,
      analytics: true,
      whiteLabel: false,
    },
  },
  {
    name: 'Wix ADI',
    logo: 'W',
    strengths: ['Brand recognition', 'Template library', 'SEO tools'],
    weaknesses: ['Generic layouts', 'Expensive upsells', 'Limited code access'],
    price: '$16/mo',
    features: {
      voiceInput: false,
      codeExport: false,
      customDomain: true,
      aiContent: true,
      analytics: true,
      whiteLabel: false,
    },
  },
];

const ourFeatures = {
  name: 'VoiceToWebsite',
  logo: 'V',
  price: '$15/mo',
  features: {
    voiceInput: true,
    codeExport: true,
    customDomain: true,
    aiContent: true,
    analytics: true,
    whiteLabel: true,
  },
};

const featureLabels: Record<string, { label: string; icon: React.ElementType }> = {
  voiceInput: { label: 'Voice Input', icon: Mic },
  codeExport: { label: 'Full Code Export', icon: Code2 },
  customDomain: { label: 'Custom Domain', icon: Globe },
  aiContent: { label: 'AI Content Generation', icon: Sparkles },
  analytics: { label: 'Built-in Analytics', icon: Zap },
  whiteLabel: { label: 'White-Label Option', icon: Check },
};

export function CompetitorComparison() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
            Why We're the <span className="gradient-text">Better Choice</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-body max-w-2xl mx-auto"
          >
            See how VoiceToWebsite compares to other AI website builders
          </motion.p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 p-6 border-b border-white/10 bg-white/5">
            <div className="text-white font-semibold">Feature</div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">{ourFeatures.logo}</span>
              </div>
              <p className="text-white text-sm font-medium">{ourFeatures.name}</p>
              <p className="text-indigo-400 text-xs">{ourFeatures.price}</p>
            </div>
            {competitors.slice(0, 4).map((comp) => (
              <div key={comp.name} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-white/60 font-bold">{comp.logo}</span>
                </div>
                <p className="text-white/60 text-sm">{comp.name}</p>
                <p className="text-white/40 text-xs">{comp.price}</p>
              </div>
            ))}
          </div>

          {/* Feature Rows */}
          {Object.entries(featureLabels).map(([key, { label, icon: Icon }], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-6 gap-4 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-white/40" />
                <span className="text-white/80 text-sm">{label}</span>
              </div>
              <div className="flex justify-center">
                {ourFeatures.features[key as keyof typeof ourFeatures.features] ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                )}
              </div>
              {competitors.slice(0, 4).map((comp) => (
                <div key={comp.name} className="flex justify-center">
                  {comp.features[key as keyof typeof comp.features] ? (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white/40" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                      <X className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>

        {/* Kill Switch Advantages */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Voice-First Creation',
              description: 'The only platform that builds sites from voice descriptions. No typing, no templates to browse.',
              icon: Mic,
            },
            {
              title: 'Full Code Ownership',
              description: 'Export clean React/Next.js code and host anywhere. No vendor lock-in, ever.',
              icon: Code2,
            },
            {
              title: '2-Minute Generation',
              description: 'From voice to live site faster than any competitor. Optimized AI pipeline delivers instantly.',
              icon: Zap,
            },
          ].map((advantage, index) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                <advantage.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{advantage.title}</h3>
              <p className="text-white/60 text-sm">{advantage.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="btn-primary text-lg px-8 py-4">
            Start Building Free
          </button>
          <p className="text-white/40 text-sm mt-4">
            No credit card required. Full feature preview.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
