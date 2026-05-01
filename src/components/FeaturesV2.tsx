import { motion } from "motion/react";
import { Code2, Globe, Mic, Palette, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Powered Creation",
    description:
      "Simply speak your vision. Our AI transcribes, understands, and builds your entire website from just your voice description.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Code2,
    title: "Full Code Ownership",
    description:
      "Export clean, production-ready React/Next.js code. Host anywhere. No vendor lock-in. Your site, your rules.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "2-Minute Generation",
    description:
      "From voice to live site in under 2 minutes. Our optimized AI pipeline delivers stunning results at lightning speed.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "SEO Optimized",
    description:
      "Built-in SEO best practices. Meta tags, structured data, semantic HTML, and Core Web Vitals optimization included.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SSL certificates, DDoS protection, and secure hosting on Cloudflare edge network. Your data is always protected.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Palette,
    title: "Premium Templates",
    description:
      "Access a growing library of stunning templates. From portfolios to SaaS landing pages, all professionally designed.",
    color: "from-indigo-500 to-violet-500",
  },
];

export function FeaturesV2() {
  const marqueeTop = [features[0], features[1], features[2]];
  const marqueeBottom = [features[3], features[4], features[5]];

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
            Powerful Features
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-headline mb-4"
          >
            Core capabilities that{" "}
            <span className="gradient-text">move fast</span>
          </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-body max-w-2xl mx-auto"
        >
          Voice brief, layout generation, hosted delivery, and export options
          in one production flow.
        </motion.p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-200/90">Voice brief</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Speak the site idea, audience, and mood.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-200/90">Live preview</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Watch the page compile into a usable structure.</p>
          </div>
        </div>
      </div>

        <div className="space-y-6 overflow-hidden">
          <div className="feature-marquee feature-marquee-left">
            <div className="feature-marquee-track">
              {[...marqueeTop, ...marqueeTop].map((feature, index) => (
                <motion.div
                  key={`${feature.title}-top-${index}`}
                  whileHover={{ y: -4 }}
                  className="feature-marquee-card"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="feature-marquee feature-marquee-right">
            <div className="feature-marquee-track">
              {[...marqueeBottom, ...marqueeBottom].map((feature, index) => (
                <motion.div
                  key={`${feature.title}-bottom-${index}`}
                  whileHover={{ y: -4 }}
                  className="feature-marquee-card"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

