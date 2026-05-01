import { motion } from "framer-motion";
import { Building2, Check, Crown, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    price: 0,
    description: "Perfect for trying out VoiceToWebsite",
    features: [
      "Unlimited preview generations",
      "Subdomain hosting (yoursite.voicetowebsite.com)",
      "5 AI-generated pages per month",
      "Community support",
      "Basic templates",
      "Voice & text input",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Starter",
    icon: Zap,
    price: 9.99,
    description: "For creators and small businesses",
    features: [
      "Everything in Free, plus:",
      "Custom domain connection",
      "50 commands per month",
      "Hosted starter site delivery",
      "Analytics dashboard",
      "Premium templates",
      "Priority support",
    ],
    cta: "Get Starter",
    popular: true,
  },
  {
    name: "Pro",
    icon: Building2,
    price: 19.99,
    description: "For agencies and power users",
    features: [
      "Everything in Starter, plus:",
      "150 commands per month",
      "Code export path",
      "Premium sections",
      "Advanced analytics",
      "Dedicated support",
    ],
    cta: "Get Pro",
    popular: false,
  },
  {
    name: "Ultimate",
    icon: Crown,
    price: 49.99,
    description: "For high-volume launch teams",
    features: [
      "Everything in Pro, plus:",
      "500 commands per month",
      "50 hosted sites",
      "Priority generation workflow",
      "Advanced handoff support",
      "Agency-ready usage",
    ],
    cta: "Get Ultimate",
    popular: false,
  },
];

export function PricingV2() {
  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-indigo-500/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-400 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Simple, Transparent Pricing
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-headline mb-4"
          >
            Choose Your <span className="gradient-text">Power Level</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-body max-w-2xl mx-auto"
          >
            Start free, upgrade when you're ready. No hidden fees. Cancel
            anytime.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
            >
              <div
                className={`h-full rounded-2xl p-6 ${
                  plan.popular
                    ? "bg-linear-to-br from-indigo-600 to-purple-600 border-0"
                    : "glass-card"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-white text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? "bg-white/20" : "bg-indigo-500/20"
                  }`}
                >
                  <plan.icon
                    className={`w-6 h-6 ${
                      plan.popular ? "text-white" : "text-indigo-400"
                    }`}
                  />
                </div>

                {/* Plan Name */}
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.popular ? "text-white" : "text-white"
                  }`}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold ${
                          plan.popular ? "text-white" : "text-white"
                        }`}
                      >
                        ${plan.price}
                      </span>
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-white/80" : "text-white/50"
                        }`}
                      >
                        /month
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-2xl font-bold ${
                        plan.popular ? "text-white" : "text-white"
                      }`}
                    >
                      Custom
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  className={`text-sm mb-6 ${
                    plan.popular ? "text-white/80" : "text-white/50"
                  }`}
                >
                  {plan.description}
                </p>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-xl font-semibold mb-6 transition-all ${
                    plan.popular
                      ? "bg-white text-indigo-600 hover:shadow-lg"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  {plan.cta}
                </motion.button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          plan.popular ? "text-white/80" : "text-indigo-400"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-white/80" : "text-white/60"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Refund Disclosure */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/40 text-sm">
            All sales are final and non-refundable. Review terms before purchase.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
