import { CinematicHero } from "@/components/CinematicHero";
import { CompetitorComparison } from "@/components/CompetitorComparison";
import { FeaturesV2 } from "@/components/FeaturesV2";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Globe,
  Heart,
  LayoutTemplate,
  Mic2,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const workflowSteps = [
  {
    title: "Tell us what you do",
    copy: "Describe your business, offer, and audience in plain language. The setup flow keeps the intake short and usable.",
    icon: Mic2,
  },
  {
    title: "Choose the look",
    copy: "Pick a design direction that matches your brand so the first version of your site is usable immediately.",
    icon: LayoutTemplate,
  },
  {
    title: "Get a hosted site link",
    copy: "After checkout and setup, the generator creates a live starter site that you can review, share, and iterate on.",
    icon: Globe,
  },
];

const capabilities = [
  {
    title: "Hosted delivery",
    copy: "Every completed build is delivered as a live link on Cloudflare-backed infrastructure.",
    icon: MonitorSmartphone,
  },
  {
    title: "Fast setup flow",
    copy: "The purchase path leads directly into a short setup and generation flow instead of a complex dashboard maze.",
    icon: Workflow,
  },
  {
    title: "Monetization ready",
    copy: "The stack includes pricing, checkout, ads.txt readiness, and a structure built for lead capture and upgrades.",
    icon: ShieldCheck,
  },
  {
    title: "Export path",
    copy: "Higher plans unlock GitHub export and operational controls for teams that need more than a hosted starter site.",
    icon: Code2,
  },
];

const exampleDirections = [
  {
    name: "Coach / Consultant",
    headline: "Service-led landing page",
    copy: "Hero offer, proof section, booking CTA, and clean contact flow.",
    accent: "from-cyan-400/25 via-indigo-500/18 to-transparent",
  },
  {
    name: "Local Business",
    headline: "Lead generation starter",
    copy: "Built for calls, quote requests, maps, service lists, and trust signals.",
    accent: "from-fuchsia-500/22 via-indigo-500/14 to-transparent",
  },
  {
    name: "Product / SaaS",
    headline: "Conversion-first launch page",
    copy: "Clear product framing, benefits, use cases, and stronger upgrade prompts.",
    accent: "from-emerald-400/20 via-cyan-400/12 to-transparent",
  },
];

const faqs = [
  {
    question: "What happens after I pay?",
    answer:
      "You land on a setup page that verifies your Stripe session, collects your business details, and starts generation immediately.",
  },
  {
    question: "Is this a full custom build?",
    answer:
      "Today it produces a hosted starter site with a clean structure and clear calls to action. More advanced editing and export options depend on the plan you buy.",
  },
  {
    question: "Do I own the site content?",
    answer:
      "You remain responsible for your business content, claims, and compliance. The platform handles generation and hosting of the delivered starter site.",
  },
  {
    question: "Can I get support before buying?",
    answer:
      "Yes. Use the support email in the footer if you need to confirm fit, workflow, or plan scope before checkout.",
  },
];

export const Home = () => {
  return (
    <div className="relative overflow-hidden">
      <Helmet>
        <title>VoiceToWebsite.com — Speak. Build. Launch.</title>
        <meta
          name="description"
          content="Transform your voice into a stunning, professional website in minutes. No coding required."
        />
        <link rel="canonical" href="https://voicetowebsite.com/" />
        {/* Build timestamp: 2026-04-29-2200 */}
      </Helmet>

      <CinematicHero />

      <FeaturesV2 />

      <CompetitorComparison />

      <section id="how-it-works" className="section-shell">
        <div className="content-grid gap-16">
          <div className="section-intro max-w-3xl">
            <span className="eyebrow">The Evolution</span>
            <h2 className="section-title text-gradient">
              From voice brief to hosted site link.
            </h2>
            <p className="section-copy">
              A frictionless 3-step experience designed for business owners who
              value speed over complex editors.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="luxury-card group"
                >
                  <div className="feature-card-icon bg-indigo-500/10! border-indigo-500/20! group-hover:scale-110 transition-transform duration-500">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400/80">
                      Module 0{index + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-400">
                      {step.copy}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <GoogleAdSense slot="home-fold-top" />

      <section className="section-shell">
        <div className="content-grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="eyebrow">Platform Capabilities</span>
              <h2 className="section-title text-gradient leading-tight">
                High-clarity delivery. No blank canvases.
              </h2>
              <p className="section-copy">
                VoiceToWebsite is optimized for the first 24 hours of a business
                launch. We get you online fast, so you can start selling
                immediately.
              </p>
            </div>
            <ul className="space-y-5">
              {[
                "Instant hosting on Cloudflare Global Edge",
                "SEO-optimized semantic HTML structure",
                "Direct-to-checkout monetization flow",
                "Zero-config deployment path",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-4 text-slate-300"
                >
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-base font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link to="/pricing" className="hero-secondary-button group">
                Begin generation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="video-shell premium-shadow ultra-glow rounded-[40px]! border-white/10">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover opacity-80"
              poster="/og-image.png"
            >
              <source src="/input_file_0.mp4" type="video/mp4" />
            </video>
            <div className="video-shell-overlay">
              <div className="glass-premium inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />{" "}
                Live Generator Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="content-grid gap-16">
          <div className="section-intro max-w-3xl">
            <span className="eyebrow">Enterprise Grade</span>
            <h2 className="section-title text-gradient">
              Hardened Infrastructure.
            </h2>
            <p className="section-copy">
              Built on the same stack that powers the most resilient platforms
              on the web.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="luxury-card p-7! group"
                >
                  <div className="feature-card-icon bg-white/5! border-white/10! group-hover:border-indigo-500/30 transition-colors">
                    <Icon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {item.copy}
                  </p>
                </motion.div>
              );
            })}
          </div>

              <div className="comparison-shell bg-white/2! border-white/5">
            <div className="comparison-row comparison-row-header bg-white/5! border-b! border-white/10">
              <span className="text-indigo-400">Platform fit</span>
              <span>VoiceToWebsite</span>
              <span>Manual builders</span>
              <span>Generative AI</span>
            </div>
            {[
              [
                "Best for",
                "Fast hosted starter site",
                "Deep design control",
                "Prompt exploration",
              ],
              [
                "Velocity",
                "Minutes to launch",
                "Days of configuration",
                "Instant but variable",
              ],
              [
                "Integrity",
                "Locked production truth",
                "Manual drift risk",
                "Ghost assets",
              ],
            ].map(([label, v1, v2, v3]) => (
              <div
                key={label}
                className="comparison-row border-white/5! hover:bg-white/2 transition-colors"
              >
                <span className="font-semibold text-slate-200">{label}</span>
                <span className="text-white font-medium">{v1}</span>
                <span>{v2}</span>
                <span>{v3}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoogleAdSense slot="home-content-mid" />

      <section id="examples" className="section-shell">
        <div className="content-grid gap-16">
          <div className="section-intro max-w-3xl">
            <span className="eyebrow">The Gallery</span>
            <h2 className="section-title text-gradient">
              Architectural directions.
            </h2>
            <p className="section-copy">
              Explore the design frameworks available for your starter site
              today.
            </p>
          </div>
          <div className="grid gap-8 xl:grid-cols-3">
            {exampleDirections.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="luxury-card group p-0! overflow-hidden"
              >
                <div
                  className={`example-card-visual rounded-none! h-48! bg-linear-to-br ${item.accent} relative`}
                >
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <div className="p-8 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400/90">
                    {item.name}
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {item.headline}
                  </h3>
                  <p className="text-base leading-relaxed text-slate-400">
                    {item.copy}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="content-grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="section-intro">
            <span className="eyebrow">Monetization Ready</span>
            <h2 className="section-title text-gradient">
              Start with the workflow you need now.
            </h2>
            <p className="section-copy">
              Transparent, tier-based access to the generator. No hidden fees or
              complex subscriptions.
            </p>
          </div>
          <div className="luxury-card bg-white/2! border-white/5 p-8!">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Starter",
                  value: "3 builds",
                  detail: "Perfect for solo operators.",
                },
                {
                  name: "Professional",
                  value: "15 builds",
                  detail: "Includes code export options.",
                },
                {
                  name: "Enterprise",
                  value: "Unlimited",
                  detail: "For agencies and high-volume teams.",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-colors"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {item.name}
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {item.value}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/pricing" className="hero-primary-button px-10!">
                View detailed plans
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="mailto:support@voicetowebsite.com"
                className="hero-secondary-button"
              >
                Custom requirements
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About / Mission Section */}
      <section className="section-shell">
        <div className="content-grid gap-16 lg:grid-cols-[1fr_1fr] items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="eyebrow">Our Mission</span>
            <h2 className="section-title text-gradient">
              Democratizing the web for every entrepreneur.
            </h2>
            <p className="section-copy">
              VoiceToWebsite was born from a simple belief: every business owner
              deserves a beautiful, professional website without the technical
              barriers. We're not just building sites—we're building confidence,
              one voice command at a time.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">2,500+</div>
                <div className="text-xs text-white/50">Sites Created</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-xs text-white/50">Satisfaction</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">&lt;3min</div>
                <div className="text-xs text-white/50">Avg. Build Time</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl">
                    👨‍💻
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Meet the Creator</h4>
                    <p className="text-white/60">J. Swain, Founder</p>
                  </div>
                </div>
                <blockquote className="text-white/80 italic leading-relaxed">
                  "I built VoiceToWebsite because I was tired of seeing talented
                  entrepreneurs struggle with complex website builders. Your
                  business deserves to be online in minutes, not weeks."
                </blockquote>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-white/50">
                    Backed by 3000 Studios — a digital innovation lab focused on
                    AI-powered tools that actually work.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="faq" className="section-shell">
        <div className="content-grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="section-intro">
            <span className="eyebrow">Assurance</span>
            <h2 className="section-title text-gradient">Direct answers.</h2>
            <p className="section-copy">
              Everything you need to know about the generation and hosting flow.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={faq.question}
                className="faq-card group bg-white/3! border-white/5! p-6!"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-bold text-white">
                  <span>{faq.question}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-open:rotate-90 text-indigo-400" />
                </summary>
                <p className="mt-5 text-base leading-relaxed text-slate-400 border-t border-white/5 pt-5">
                  {faq.answer}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell pb-32">
        <div className="content-grid">
          <div className="cta-shell bg-linear-to-br! from-indigo-500/10 via-transparent to-cyan-500/5 premium-shadow ultra-glow p-12! lg:p-16!">
            <div className="max-w-3xl space-y-6">
              <span className="eyebrow glow-bloom">Ready to Launch?</span>
              <h2 className="hero-headline text-5xl! lg:text-6xl! text-gradient">
                Get your business site <br />
                online today.
              </h2>
              <p className="section-copy text-xl!">
                The shortest path from an idea to a hosted, conversion-ready
                starter site.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row pt-4 lg:pt-0">
              <Link
                to="/pricing"
                className="hero-primary-button px-12! py-5! text-lg"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <Link
          to="/pricing"
          className="hero-primary-button flex w-full justify-center rounded-2xl shadow-[0_20px_60px_rgba(79,70,229,0.45)]"
        >
          Launch your site now
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
