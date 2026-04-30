import { FeatureCard, GlassCard } from "@/components/GlassCard";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ScrollReveal";
import { VideoHero } from "@/components/VideoHero";
import {
  CheckCircle2,
  Code2,
  Globe,
  Mic2,
  Palette,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Mic2 className="w-7 h-7" />,
    title: "Voice-to-Website",
    description:
      "Simply speak your vision. Our AI understands natural language and translates your voice commands into fully functional websites.",
  },
  {
    icon: <Wand2 className="w-7 h-7" />,
    title: "AI-Powered Generation",
    description:
      "Advanced AI models analyze your requirements and generate optimized HTML, CSS, and JavaScript in seconds.",
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: "Instant Hosting",
    description:
      "Every site is instantly hosted on Cloudflare's global edge network for lightning-fast load times worldwide.",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Lightning Fast",
    description:
      "Go from idea to live website in under 5 minutes. No coding, no design skills, no waiting.",
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: "Mobile-First Design",
    description:
      "Every generated site is fully responsive and optimized for all devices from day one.",
  },
  {
    icon: <Palette className="w-7 h-7" />,
    title: "Premium Templates",
    description:
      "Access professionally designed templates with glassmorphism, gradients, and modern aesthetics.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "SSL & Security",
    description:
      "All sites come with automatic SSL certificates and enterprise-grade security built-in.",
  },
  {
    icon: <Code2 className="w-7 h-7" />,
    title: "Export & Edit",
    description:
      "Download your site's source code or edit it directly in our visual editor (Pro plans).",
  },
  {
    icon: <TrendingUp className="w-7 h-7" />,
    title: "SEO Optimized",
    description:
      "Built-in SEO best practices help your site rank higher in search results automatically.",
  },
];

const comparisonFeatures = [
  {
    name: "Voice Generation",
    us: true,
    wix: false,
    webflow: false,
    framer: false,
  },
  {
    name: "AI Content Writer",
    us: true,
    wix: false,
    webflow: false,
    framer: false,
  },
  {
    name: "Instant Hosting",
    us: true,
    wix: true,
    webflow: false,
    framer: true,
  },
  {
    name: "Free Plan Available",
    us: true,
    wix: true,
    webflow: false,
    framer: true,
  },
  { name: "Code Export", us: true, wix: false, webflow: true, framer: true },
  { name: "Custom Domains", us: true, wix: true, webflow: true, framer: true },
  {
    name: "E-commerce Ready",
    us: true,
    wix: true,
    webflow: true,
    framer: false,
  },
  {
    name: "Zero Learning Curve",
    us: true,
    wix: false,
    webflow: false,
    framer: false,
  },
];

export const Features = () => {
  return (
    <div className="relative">
      <Helmet>
        <title>Features | VoiceToWebsite - AI Website Builder</title>
        <meta
          name="description"
          content="Discover the powerful features that make VoiceToWebsite the fastest way to build professional websites with AI and voice commands."
        />
      </Helmet>

      {/* Hero with Video */}
      <VideoHero
        videoSrc="/videos/voiceto-website-video.mp4"
        title="Powerful Features"
        subtitle="Everything you need to build, launch, and grow your online presence"
        overlayOpacity={0.6}
        showControls={false}
      />

      {/* Main Content */}
      <div className="relative z-10 bg-[#05070b]">
        {/* AdSense */}
        <div className="pt-8">
          <GoogleAdSense slot="features-top" />
        </div>

        {/* Features Grid */}
        <section className="section-shell">
          <div className="content-grid">
            <ScrollReveal className="text-center mb-16">
              <span className="eyebrow mb-4">Platform Capabilities</span>
              <h2 className="section-title text-gradient mb-4">
                Everything You Need
              </h2>
              <p className="section-copy max-w-2xl mx-auto">
                A complete toolkit for building professional websites without
                touching a line of code.
              </p>
            </ScrollReveal>

            <StaggerContainer
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              staggerDelay={0.1}
            >
              {features.map((feature, index) => (
                <StaggerItem key={index}>
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* How It Works */}
        <section className="section-shell bg-linear-to-b from-transparent via-white/2 to-transparent">
          <div className="content-grid">
            <ScrollReveal className="text-center mb-16">
              <span className="eyebrow mb-4">Simple Process</span>
              <h2 className="section-title text-gradient mb-4">
                Three Steps to Launch
              </h2>
            </ScrollReveal>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Describe Your Vision",
                  description:
                    "Speak or type what you want. Describe your business, style preferences, and goals.",
                  icon: <Mic2 className="w-8 h-8" />,
                },
                {
                  step: "02",
                  title: "AI Generation",
                  description:
                    "Our AI analyzes your input and builds a complete, styled website in seconds.",
                  icon: <Sparkles className="w-8 h-8" />,
                },
                {
                  step: "03",
                  title: "Launch Instantly",
                  description:
                    "Your site is immediately live on a global CDN with SSL and all optimizations.",
                  icon: <Rocket className="w-8 h-8" />,
                },
              ].map((item, index) => (
                <ScrollReveal key={index} delay={index * 0.2}>
                  <GlassCard className="relative h-full">
                    <div className="text-7xl font-black text-white/5 absolute top-4 right-4">
                      {item.step}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </GlassCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="section-shell">
          <div className="content-grid">
            <ScrollReveal className="text-center mb-16">
              <span className="eyebrow mb-4">Why Choose Us</span>
              <h2 className="section-title text-gradient mb-4">
                Built Different
              </h2>
              <p className="section-copy max-w-2xl mx-auto">
                See how VoiceToWebsite compares to traditional website builders.
              </p>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-[32px] border border-white/10 bg-linear-to-br from-white/5 to-transparent backdrop-blur-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-5 gap-4 p-6 bg-white/5 border-b border-white/10 text-sm font-bold uppercase tracking-wider">
                  <div className="text-slate-300">Feature</div>
                  <div className="text-indigo-400 text-center">
                    VoiceToWebsite
                  </div>
                  <div className="text-slate-400 text-center">Wix</div>
                  <div className="text-slate-400 text-center">Webflow</div>
                  <div className="text-slate-400 text-center">Framer</div>
                </div>

                {/* Rows */}
                {comparisonFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 p-6 border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <div className="text-white font-medium">{feature.name}</div>
                    <div className="text-center">
                      {feature.us ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                    <div className="text-center">
                      {feature.wix ? (
                        <CheckCircle2 className="w-5 h-5 text-slate-500 mx-auto" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                    <div className="text-center">
                      {feature.webflow ? (
                        <CheckCircle2 className="w-5 h-5 text-slate-500 mx-auto" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                    <div className="text-center">
                      {feature.framer ? (
                        <CheckCircle2 className="w-5 h-5 text-slate-500 mx-auto" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats */}
        <section className="section-shell bg-linear-to-b from-transparent via-white/2 to-transparent">
          <div className="content-grid">
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { value: "< 5 min", label: "Average build time" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "200+", label: "Global edge locations" },
                { value: "50K+", label: "Sites generated" },
              ].map((stat, index) => (
                <ScrollReveal key={index} delay={index * 0.1}>
                  <div className="text-center p-8 rounded-[24px] border border-white/10 bg-linear-to-br from-white/5 to-transparent">
                    <div className="text-4xl md:text-5xl font-black text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-slate-400 uppercase tracking-wider text-sm">
                      {stat.label}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-shell pb-32">
          <div className="content-grid">
            <ScrollReveal>
              <div className="rounded-[40px] border border-white/10 bg-linear-to-br from-indigo-500/10 via-white/5 to-cyan-500/10 backdrop-blur-2xl p-12 md:p-20 text-center">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                  Ready to Build?
                </h2>
                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                  Join thousands of creators who have already launched their
                  websites with VoiceToWebsite.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/pricing"
                    className="hero-primary-button text-lg px-10 py-5"
                  >
                    Get Started Free
                    <Rocket className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/examples"
                    className="hero-secondary-button text-lg px-10 py-5"
                  >
                    See Examples
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Features;
