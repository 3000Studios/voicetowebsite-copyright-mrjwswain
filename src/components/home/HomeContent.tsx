import {
  ArrowRight,
  Check,
  Code,
  CreditCard,
  Image as ImageIcon,
  Layers,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Target,
  Type,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export const HowItWorks = () => {
  const steps = [
    {
      title: "Describe Business",
      desc: "Speak or type your mission, values, and goals.",
      icon: Target,
    },
    {
      title: "AI Generation",
      desc: "Our neural engine builds 3 premium architectural directions.",
      icon: Zap,
    },
    {
      title: "Pick & Launch",
      desc: "Select your favorite version and deploy with one click.",
      icon: Rocket,
    },
    {
      title: "Edit with Voice",
      desc: "Fine-tune any detail simply by telling the AI what to change.",
      icon: Layers,
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-black/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl lg:text-6xl font-black mb-16 italic tracking-tight text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-[2rem] glass border border-brand-cyan/30 flex items-center justify-center mb-6 text-brand-cyan relative">
                <step.icon className="w-8 h-8" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">
                  0{i + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const WhatYouGet = () => {
  const features = [
    { title: "Custom Homepage", icon: Layers },
    { title: "AI Copywriting", icon: Type },
    { title: "Premium Fonts", icon: Code },
    { title: "Dynamic Grid", icon: Palette },
    { title: "Adaptive Media", icon: ImageIcon },
    { title: "Mobile Optimized", icon: Smartphone },
    { title: "SEO Architecture", icon: Search },
    { title: "Animated BG", icon: Zap },
  ];

  return (
    <section className="py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-1">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 italic leading-tight">
              Everything for a{" "}
              <span className="text-brand-cyan">Masterpiece</span>
            </h2>
            <p className="text-white/40 mb-8 leading-relaxed">
              We don't do templates. Every line of code, every pixel, and every
              word is generated uniquely for your brand.
            </p>
            <ul className="space-y-4">
              {["No Watermarks (Pro)", "Full Hosting", "Domain Setup"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-bold"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass p-6 rounded-3xl flex flex-col items-center text-center group hover:border-brand-cyan transition-colors"
              >
                <f.icon className="w-8 h-8 mb-4 text-white/40 group-hover:text-brand-cyan transition-colors" />
                <span className="text-[10px] uppercase font-black tracking-widest leading-tight">
                  {f.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const ExamplesSection = () => {
  const examples = [
    {
      industry: "Beauty Salon",
      name: "Lumière Aesthetics",
      gradient: "from-pink-500/30 via-fuchsia-500/20 to-cyan-400/20",
    },
    {
      industry: "Restaurant",
      name: "Osteria Volare",
      gradient: "from-amber-500/30 via-orange-500/20 to-rose-500/20",
    },
    {
      industry: "Real Estate",
      name: "Summit Estates",
      gradient: "from-emerald-400/25 via-cyan-500/20 to-blue-500/20",
    },
    {
      industry: "Fitness Coach",
      name: "Iron Peak Performance",
      gradient: "from-red-500/30 via-violet-500/20 to-cyan-400/20",
    },
    {
      industry: "Music Artist",
      name: "Lunar Echoes",
      gradient: "from-indigo-500/30 via-purple-500/20 to-pink-500/20",
    },
    {
      industry: "Consultant",
      name: "Strategy Lab",
      gradient: "from-sky-400/25 via-blue-500/20 to-slate-400/20",
    },
    {
      industry: "SaaS Startup",
      name: "Nexis Cloud",
      gradient: "from-cyan-400/30 via-indigo-500/20 to-purple-500/20",
    },
    {
      industry: "Auto Detailer",
      name: "Gloss Armor",
      gradient: "from-zinc-300/25 via-cyan-400/20 to-blue-700/20",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl lg:text-6xl font-black italic mb-4">
              Generated Results
            </h2>
            <p className="text-white/40 text-sm">
              Real websites built for real businesses. No templates, just pure
              AI architecture.
            </p>
          </div>
          <Link
            to="/examples"
            className="text-brand-cyan font-bold flex items-center gap-2 hover:translate-x-2 transition-transform underline text-sm"
          >
            View All Showcase <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative glass rounded-[2.5rem] p-4 border-white/10 hover:border-brand-cyan/50 transition-all overflow-hidden"
            >
              <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative">
                <div
                  role="img"
                  aria-label={`${ex.name} generated website preview`}
                  className={`flex h-full w-full items-center justify-center bg-linear-to-br ${ex.gradient} transition-transform duration-700 group-hover:scale-110`}
                >
                  <ImageIcon className="h-16 w-16 text-white/45" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Variation {["A", "B", "C"][i % 3]}
                </div>
              </div>
              <p className="text-[10px] uppercase font-black text-brand-cyan mb-1 tracking-[0.2em]">
                {ex.industry}
              </p>
              <h4 className="text-xl font-bold italic">{ex.name}</h4>
              <button className="mt-4 w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                View Variation
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PricingSection = () => {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "9.99",
      commands: "50",
      popular: false,
      features: [
        "Standard AI Engine",
        "Community Support",
        "Hosted Subdomain",
        "Basic Sections",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "19.99",
      commands: "150",
      popular: true,
      features: [
        "Elite AI Engine",
        "Code Export (React/Vite)",
        "Custom Domain",
        "Unlocked Premium Sections",
        "No Watermarks",
      ],
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: "49.99",
      commands: "500",
      popular: false,
      features: [
        "Max Commands",
        "50 Hosted Sites",
        "Priority Generation",
        "Whitelabel Dashboard",
        "Early Beta Access",
      ],
    },
  ];

  const handleCheckout = async (
    planId: string,
    provider: "stripe" | "paypal",
  ) => {
    try {
      const endpoint =
        provider === "stripe"
          ? "/api/create-checkout-session"
          : "/api/create-paypal-order";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnUrl: window.location.origin }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(
          `Checkout failed: ${data.error || "Unknown error"}. Please try again.`,
        );
      }
    } catch (e) {
      console.error("Payment error:", e);
      alert(
        "An unexpected error occurred during checkout. Please try again later.",
      );
    }
  };

  return (
    <section className="py-24 px-6 lg:px-12" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-7xl font-black mb-6 italic tracking-tight">
            Invest in Your vision
          </h2>
          <p className="text-white/40 max-w-xl mx-auto">
            Choose a plan that scales with your ambition. Professional grade
            results, every single time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "group relative p-8 lg:p-12 rounded-[3rem] glass border-white/5 transition-all",
                plan.popular
                  ? "border-brand-cyan bg-white/5 scale-105 z-10 neon-glow-cyan"
                  : "hover:border-white/20",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-cyan text-black text-[10px] font-black rounded-full uppercase tracking-widest">
                  Best Value
                </div>
              )}
              <h3 className="text-2xl font-black italic mb-6">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-black">${plan.price}</span>
                <span className="text-white/40 text-sm">/month</span>
              </div>
              <ul className="space-y-6 mb-12">
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="font-bold underline decoration-brand-cyan/30 underline-offset-4">
                    {plan.commands} Commands
                  </span>
                </li>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-white/60"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                      <Check className="w-3 h-3" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="space-y-4">
                <button
                  onClick={() => handleCheckout(plan.id, "stripe")}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black hover:bg-brand-cyan transition-colors flex items-center justify-center gap-2"
                >
                  Get Started <CreditCard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCheckout(plan.id, "paypal")}
                  className="w-full py-4 rounded-2xl bg-[#0070ba] text-white font-black hover:bg-[#003087] transition-colors flex items-center justify-center gap-2"
                >
                  Checkout with PayPal
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-xs text-white/20 max-w-2xl mx-auto italic">
          Need more power?{" "}
          <button
            onClick={() => handleCheckout("commands", "stripe")}
            className="text-white hover:text-brand-cyan underline"
          >
            <strong>$2.99 Bundle</strong>
          </button>{" "}
          adds 10 extra commands on any plan.
          <br />
          <br />
          All sales are final. No refunds. Generated sites are protected by
          VoiceToWebsite.com copyright unless exported on Pro/Ultimate plans.
        </div>
      </div>
    </section>
  );
};

export const TrustSection = () => (
  <section className="py-24 px-6 lg:px-12 bg-black border-y border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
      <div className="max-w-md">
        <div className="flex items-center gap-2 text-brand-cyan mb-4">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-sm font-black uppercase tracking-widest">
            Secure & Compliant
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-4 italic">
          Your Vision, Protected.
        </h3>
        <p className="text-white/40 text-sm leading-relaxed">
          We use enterprise-grade encryption and ethical AI generation
          protocols. VoiceToWebsite.com is not liable for user-published content
          or outcomes.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-8 opacity-30 grayscale invert">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
          alt="Stripe"
          className="h-6"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
          alt="PayPal"
          className="h-6"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
          alt="Google"
          className="h-6"
        />
      </div>
    </div>
  </section>
);
