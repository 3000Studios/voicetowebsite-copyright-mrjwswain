import { motion } from "framer-motion";
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
            Everything You Need to{" "}
            <span className="gradient-text">Build & Launch</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-body max-w-2xl mx-auto"
          >
            From voice input to live deployment, we handle everything so you can
            focus on your vision.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="glass-card h-full p-6 transition-all duration-300 group-hover:bg-white/5">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "Cloudflare", label: "Global Delivery" },
            { value: "Semantic", label: "SEO Structure" },
            { value: "Stripe + PayPal", label: "Checkout Options" },
            { value: "Plan Gates", label: "Feature Control" },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
