import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock,
  Code2,
  Cpu,
  Globe2,
  Heart,
  Mic,
  Rocket,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import { Reveal, StaggeredReveal } from "@/components/home/v2/Reveal";
import { useClickSound } from "@/components/home/v2/useClickSound";

const stats = [
  { icon: Clock, label: "Avg. launch time", value: "< 60s", caption: "From voice → live site" },
  { icon: Globe2, label: "Sites generated", value: "10,000+", caption: "By real businesses" },
  { icon: Shield, label: "Uptime SLA", value: "99.9%", caption: "Cloudflare-backed" },
  { icon: Code2, label: "Code ownership", value: "100%", caption: "Pro + Ultimate plans" },
];

const principles = [
  {
    icon: Mic,
    title: "Voice is the fastest interface.",
    body: "Typing a creative brief takes 10 minutes. Speaking one takes 30 seconds. We bet the product on that gap.",
  },
  {
    icon: Zap,
    title: "Speed earns trust.",
    body: "We render Gemini-written copy, layouts, and sections in under a minute. A demo that lands fast converts.",
  },
  {
    icon: Building2,
    title: "Built for non-technical owners.",
    body: "Salons, gyms, law firms, contractors. The customer should never see a config file or a JSON error.",
  },
  {
    icon: Heart,
    title: "Honest pricing forever.",
    body: "$9.99, $19.99, $49.99. No launch-discount gotchas, no surprise re-billing, cancel anytime in one click.",
  },
];

const timeline = [
  {
    year: "2025",
    title: "The brief problem.",
    body: "Watching small-business owners struggle for weeks with Wix, Squarespace, and Webflow when all they needed was a one-page launch site that ranks on Google.",
  },
  {
    year: "2026 Q1",
    title: "Voice prototype.",
    body: "Combined Gemini for copy, React for the rendered site, and Cloudflare Pages for sub-second hosting. A voice brief became a real, deployed URL in under a minute.",
  },
  {
    year: "2026 Q2",
    title: "Locked pricing.",
    body: "Rebuilt billing after an early overcharge incident. Inline price_data, three plans, no stale dashboard objects. Pricing has been frozen and honest since.",
  },
  {
    year: "Today",
    title: "Daily Gemini blog + Pro launches.",
    body: "Auto-publishing growth content while customers ship Starter, Pro, and Ultimate sites to custom domains every day.",
  },
];

export const About: React.FC = () => {
  const click = useClickSound("tick");
  const ding = useClickSound("ding");

  return (
    <>
      <Helmet>
        <title>About — VoiceToWebsite | Voice-controlled AI website builder</title>
        <meta
          name="description"
          content="VoiceToWebsite turns a 30-second voice brief into a launch-ready website with Gemini-written copy, mobile-first layouts, and Cloudflare hosting. Built for small businesses that need to ship today, not next month."
        />
        <meta name="keywords" content="voice website builder, AI website generator, Gemini website, instant website, no-code site builder" />
        <link rel="canonical" href="https://voicetowebsite.com/about" />
        <meta property="og:title" content="About VoiceToWebsite — The fastest way from idea to live site" />
        <meta property="og:description" content="Speak your business. Get a real, hosted, mobile-ready website in under a minute." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://voicetowebsite.com/about" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "VoiceToWebsite",
            url: "https://voicetowebsite.com",
            description: "Voice-controlled AI website builder. From spoken brief to live site in under 60 seconds.",
            sameAs: ["https://voicetowebsite.com"],
          })}
        </script>
      </Helmet>

      {/* HERO */}
      <section className="relative px-5 pt-32 pb-16 sm:px-8 lg:px-12 lg:pt-44 lg:pb-24">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Our mission
            </span>
            <h1 className="mt-7 font-display text-[clamp(2.6rem,6.5vw,5.2rem)] font-black leading-[0.96] tracking-tight">
              From <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">spoken brief</span>
              <br />
              to live website.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              We built VoiceToWebsite for the salon owner, the contractor, the coach, and the founder who needs a real site on Google <em>today</em> — not after a 6-week build with an agency that charges $5,000.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/pricing"
                onClick={() => ding()}
                className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-10px_rgba(34,211,238,0.6)]"
              >
                See pricing <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/"
                onClick={() => click()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                Try a free preview <Mic className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* STATS STRIP */}
      <section className="relative px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <StaggeredReveal className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/1 p-6 backdrop-blur-xl transition hover:border-cyan-300/40"
                >
                  <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl transition group-hover:bg-cyan-300/20" />
                  <Icon className="h-5 w-5 text-cyan-300/80" aria-hidden="true" />
                  <div className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">{s.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">{s.label}</div>
                  <div className="mt-2 text-xs leading-5 text-white/60">{s.caption}</div>
                </div>
              );
            })}
          </StaggeredReveal>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-fuchsia-200">
              <Cpu className="h-3 w-3" /> What we believe
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Four product principles.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              Every feature decision runs through these. If it doesn't fit, it doesn't ship.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 0.08}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/1 p-7 backdrop-blur-xl transition hover:border-fuchsia-300/40 hover:shadow-[0_30px_120px_-30px_rgba(232,121,249,0.35)]">
                  <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-linear-to-br from-fuchsia-400/20 to-cyan-300/0 blur-3xl" />
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-fuchsia-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-black tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{p.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="relative px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200">
              <Rocket className="h-3 w-3" /> The story
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              How we got here.
            </h2>
          </div>
        </Reveal>

        <div className="relative mx-auto max-w-3xl">
          <div className="pointer-events-none absolute left-3.75 top-0 bottom-0 w-px bg-linear-to-b from-cyan-300/40 via-fuchsia-400/30 to-transparent md:left-1/2" />
          {timeline.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.1}>
              <div className={`relative mb-10 grid grid-cols-[40px_1fr] gap-5 md:grid-cols-2 md:gap-10 ${i % 2 === 0 ? "md:[direction:rtl]" : ""}`}>
                <div className="flex justify-start md:[direction:ltr]">
                  <div className="relative">
                    <span className="absolute -left-0.75 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-cyan-300/70 bg-black/80 md:left-auto md:-right-2.5">
                      <span className="h-2 w-2 rounded-full bg-linear-to-br from-cyan-300 to-fuchsia-400" />
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl md:[direction:ltr]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">{t.year}</div>
                  <h3 className="mt-2 font-display text-xl font-black tracking-tight">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{t.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRUST + CONTACT */}
      <section className="relative px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/12 bg-linear-to-br from-cyan-300/10 via-white/4 to-fuchsia-400/10 p-10 backdrop-blur-2xl sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-white">
                  <Shield className="h-3 w-3" /> Built by 3000 Studios
                </span>
                <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] font-black leading-[1.05] tracking-tight">
                  A real company. A real product. A real voice.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/70">
                  VoiceToWebsite is owned and operated by Mr. J. Swain at 3000 Studios. Same team behind PlayStoreWizard, FindMeRates, and 7 other live products. We answer customer email personally and we ship updates every week.
                </p>
                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    to="/pricing"
                    onClick={() => ding()}
                    className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-10px_rgba(34,211,238,0.6)]"
                  >
                    Choose a plan <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => click()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                  >
                    Talk to the founder
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-br from-cyan-300/20 to-fuchsia-400/20 blur-3xl" />
                <div className="rounded-3xl border border-white/12 bg-black/30 p-6 backdrop-blur-xl">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">Direct line</div>
                  <a
                    href="mailto:mr.jwswain@gmail.com"
                    className="mt-2 block font-display text-xl font-black tracking-tight hover:text-cyan-200"
                  >
                    mr.jwswain@gmail.com
                  </a>
                  <div className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">Studio</div>
                  <div className="mt-2 font-display text-xl font-black tracking-tight">3000 Studios</div>
                  <div className="mt-1 text-xs text-white/60">Independent, customer-funded.</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default About;
