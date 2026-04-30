import { motion } from "motion/react";
import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "indigo" | "cyan" | "violet" | "none";
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hover = true,
  glow = "none",
  onClick,
}) => {
  const glowClasses = {
    indigo:
      "hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.4)] hover:border-indigo-500/30",
    cyan: "hover:shadow-[0_0_60px_-10px_rgba(34,211,238,0.4)] hover:border-cyan-500/30",
    violet:
      "hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.4)] hover:border-violet-500/30",
    none: "",
  };

  return (
    <motion.div
      whileHover={hover ? { y: -8, scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative rounded-[28px] border border-white/10
        bg-linear-to-br from-white/8 to-white/2
        backdrop-blur-2xl p-8
        transition-all duration-500
        ${hover ? "hover:border-white/20 hover:from-white/12" : ""}
        ${glowClasses[glow]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-[28px] bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className = "",
}) => {
  return (
    <GlassCard hover glow="indigo" className={className}>
      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
        <div className="text-indigo-400">{icon}</div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </GlassCard>
  );
};

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  featured?: boolean;
  ctaText: string;
  onCta: () => void;
  className?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period = "/month",
  description,
  features,
  featured = false,
  ctaText,
  onCta,
  className = "",
}) => {
  return (
    <motion.div
      whileHover={{ y: -12 }}
      className={`
        relative flex flex-col rounded-[32px] p-8
        ${
          featured
            ? "bg-linear-to-b from-indigo-500/20 via-white/5 to-transparent border-2 border-indigo-500/40 shadow-[0_0_80px_-20px_rgba(99,102,241,0.3)]"
            : "bg-linear-to-b from-white/8 to-transparent border border-white/10"
        }
        backdrop-blur-2xl
        ${className}
      `}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
          {name}
        </h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-8">
        <span className="text-5xl font-black text-white">{price}</span>
        <span className="text-slate-400 ml-2">{period}</span>
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8 grow">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-slate-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onCta}
        className={`
          w-full py-4 rounded-2xl font-bold uppercase tracking-wider text-sm
          transition-all duration-300
          ${
            featured
              ? "bg-linear-to-r from-indigo-500 via-violet-500 to-cyan-400 text-white hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
              : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
          }
        `}
      >
        {ctaText}
      </button>
    </motion.div>
  );
};

export default GlassCard;
