import { GlassCard } from "@/components/GlassCard";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VideoHero } from "@/components/VideoHero";
import {
  ArrowRight,
  Code2,
  ExternalLink,
  Eye,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

interface ExampleSite {
  id: string;
  title: string;
  category: string;
  description: string;
  previewImage: string;
  color: string;
  prompt: string;
  html: string;
  liveUrl?: string;
  badgeText?: string;
  isGenerated?: boolean;
}

// ── Static curated examples ───────────────────────────────────────────────────
const STATIC_EXAMPLES: ExampleSite[] = [
  {
    id: "coach-consultant",
    title: "Elite Coaching",
    category: "Coach / Consultant",
    description: "Premium coaching business with booking integration and testimonials.",
    previewImage: "/examples/coach.jpg",
    color: "from-indigo-500/20 to-purple-500/10",
    prompt: 'A premium coaching website with dark navy theme, hero section with headline "Transform Your Life", booking calendar integration, testimonials section, and contact form.',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Elite Coaching</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#0d0d1f;color:#fff;overflow-x:hidden}.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#0d0d1f 0%,#1a1a3e 100%);padding:4rem 2rem}.hero h1{font-family:'Playfair Display',serif;font-size:clamp(3rem,7vw,6rem);font-weight:900;background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1.5rem}.hero p{font-size:1.2rem;color:rgba(255,255,255,.7);max-width:600px;margin:0 auto 2rem}.btn{display:inline-block;padding:1rem 2.5rem;background:linear-gradient(135deg,#a855f7,#06b6d4);color:#fff;border-radius:50px;font-weight:700;text-decoration:none;font-size:1rem}section{padding:5rem 2rem;max-width:1200px;margin:0 auto}h2{font-family:'Playfair Display',serif;font-size:2.5rem;margin-bottom:2rem;color:#a855f7}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem}.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:2rem}.card h3{font-size:1.2rem;margin-bottom:.75rem;color:#06b6d4}.card p{color:rgba(255,255,255,.65);line-height:1.7}</style></head><body><div class="hero"><div><h1>Transform Your Life</h1><p>Premium coaching services to unlock your full potential and achieve extraordinary results.</p><a href="#contact" class="btn">Book Free Session</a></div></div><div style="background:#0a0a1a;padding:5rem 2rem"><section><h2>Our Services</h2><div class="grid"><div class="card"><h3>1-on-1 Coaching</h3><p>Personalized sessions tailored to your unique goals and challenges.</p></div><div class="card"><h3>Group Programs</h3><p>Join a community of high-achievers on the same transformational journey.</p></div><div class="card"><h3>Online Courses</h3><p>Self-paced learning modules you can access from anywhere, anytime.</p></div></div></section></div></body></html>`,
    liveUrl: "https://demo-coach.voicetowebsite.com",
    badgeText: "⭐ Featured Site",
  },
  {
    id: "local-service",
    title: "Premier Plumbing",
    category: "Local Business",
    description: "Service business with quote forms and emergency call features.",
    previewImage: "/examples/local.jpg",
    color: "from-cyan-500/20 to-blue-500/10",
    prompt: "A professional plumbing service website with bright blue theme, emergency call button, service area map, quote request form, and customer reviews.",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Premier Plumbing</title><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#0d1f2f;color:#fff}.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#0d1f2f,#0a3d5c);padding:4rem 2rem}.hero h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(2.5rem,6vw,5rem);font-weight:900;color:#06b6d4;margin-bottom:1rem}.emergency{display:inline-block;padding:1rem 2rem;background:#ef4444;color:#fff;border-radius:50px;font-weight:700;font-size:1.1rem;margin-bottom:1rem;text-decoration:none}.btn{display:inline-block;padding:.9rem 2rem;background:#06b6d4;color:#fff;border-radius:50px;font-weight:700;text-decoration:none;margin-left:1rem}section{padding:5rem 2rem;max-width:1100px;margin:0 auto}h2{font-family:'Space Grotesk',sans-serif;font-size:2rem;color:#06b6d4;margin-bottom:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem}.card{background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:14px;padding:1.75rem}.card h3{color:#06b6d4;margin-bottom:.5rem}.card p{color:rgba(255,255,255,.65);line-height:1.7}</style></head><body><div class="hero"><div><h1>Premier Plumbing</h1><p style="color:rgba(255,255,255,.7);font-size:1.1rem;margin-bottom:1.5rem">24/7 Emergency Service — Licensed &amp; Insured</p><a href="tel:+15550001234" class="emergency">📞 Emergency: (555) 000-1234</a><a href="#quote" class="btn">Get Free Quote</a></div></div><div style="background:#091929;padding:5rem 2rem"><section><h2>Our Services</h2><div class="grid"><div class="card"><h3>Emergency Repairs</h3><p>Available 24/7 for burst pipes, leaks, and urgent plumbing issues.</p></div><div class="card"><h3>Drain Cleaning</h3><p>Professional drain clearing for kitchens, bathrooms, and main lines.</p></div><div class="card"><h3>Water Heaters</h3><p>Installation, repair, and replacement of all water heater types.</p></div><div class="card"><h3>Pipe Installation</h3><p>New construction and remodel piping for residential and commercial.</p></div></div></section></div></body></html>`,
    liveUrl: "https://demo-plumber.voicetowebsite.com",
    badgeText: "🏆 Best Local Site",
  },
  {
    id: "saas-product",
    title: "TaskFlow Pro",
    category: "Product / SaaS",
    description: "SaaS landing page with pricing tiers and feature comparison.",
    previewImage: "/examples/saas.jpg",
    color: "from-emerald-500/20 to-teal-500/10",
    prompt: "A modern SaaS productivity app landing page with gradient hero, feature grid, pricing table with 3 tiers, customer logos, and CTA sections.",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>TaskFlow Pro</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#030712;color:#fff}.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at top,#064e3b 0%,#030712 60%);padding:4rem 2rem}.badge{display:inline-block;padding:.4rem 1rem;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);border-radius:50px;color:#10b981;font-size:.8rem;margin-bottom:1.5rem}.hero h1{font-size:clamp(2.5rem,6vw,5.5rem);font-weight:900;margin-bottom:1.5rem;line-height:1.05}.hero h1 span{background:linear-gradient(135deg,#10b981,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.btn{display:inline-block;padding:.9rem 2.2rem;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;border-radius:50px;font-weight:700;text-decoration:none}section{padding:5rem 2rem;max-width:1100px;margin:0 auto}h2{font-size:2.2rem;font-weight:900;margin-bottom:2rem;text-align:center}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2rem}.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem}.price{font-size:2.5rem;font-weight:900;color:#10b981;margin:1rem 0}.price span{font-size:1rem;color:rgba(255,255,255,.4)}</style></head><body><div class="hero"><div><div class="badge">🚀 Now in Public Beta</div><h1>Work Smarter with <span>TaskFlow Pro</span></h1><p style="color:rgba(255,255,255,.65);font-size:1.1rem;max-width:550px;margin:0 auto 2rem">The AI-powered productivity platform that helps teams ship faster and stay focused.</p><a href="#pricing" class="btn">Start Free Trial</a></div></div><div style="background:#050d1a;padding:5rem 2rem"><section><h2>Simple Pricing</h2><div class="grid"><div class="card" style="text-align:center"><h3>Starter</h3><div class="price">$9<span>/mo</span></div><p style="color:rgba(255,255,255,.6)">5 projects, 2 users, core features</p></div><div class="card" style="text-align:center;border-color:rgba(16,185,129,.3)"><h3>Pro</h3><div class="price">$29<span>/mo</span></div><p style="color:rgba(255,255,255,.6)">Unlimited projects, 10 users, AI features</p></div><div class="card" style="text-align:center"><h3>Enterprise</h3><div class="price">$99<span>/mo</span></div><p style="color:rgba(255,255,255,.6)">Unlimited everything, SSO, priority support</p></div></div></section></div></body></html>`,
    liveUrl: "https://demo-saas.voicetowebsite.com",
    badgeText: "🚀 Startup Choice",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Examples() {
  const [selectedSite, setSelectedSite] = useState<ExampleSite | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [allSites, setAllSites] = useState<ExampleSite[]>(STATIC_EXAMPLES);

  // Load AI-generated examples from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("vtw_examples") || "[]") as Array<{
        id: string; prompt: string; name: string; html: string; imageUrl: string; savedAt: string;
      }>;
      if (stored.length) {
        const generated: ExampleSite[] = stored.map((e) => ({
          id: e.id,
          title: e.name,
          category: "AI Generated",
          description: e.prompt.slice(0, 100) + (e.prompt.length > 100 ? "..." : ""),
          previewImage: e.imageUrl,
          color: "from-cyan-500/20 to-violet-500/10",
          prompt: e.prompt,
          html: e.html,
          badgeText: "✨ AI Generated",
          isGenerated: true,
        }));
        setAllSites([...generated, ...STATIC_EXAMPLES]);
      }
    } catch { /* non-critical */ }
  }, []);

  const categories = ["All", "AI Generated", "Coach / Consultant", "Local Business", "Product / SaaS", "Real Estate", "Restaurant", "Fitness"];

  const filtered = activeCategory === "All"
    ? allSites
    : allSites.filter((s) => s.category === activeCategory);

  return (
    <>
      <Helmet>
        <title>Website Examples | VoiceToWebsite.com</title>
        <meta name="description" content="Browse premium AI-generated website examples across every industry. See what VoiceToWebsite.com can build for your business." />
      </Helmet>

      <VideoHero
        title="Premium Website Examples"
        subtitle="Every site below was generated from a voice or text prompt — fully coded, fully custom."
        videoUrl="https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4"
      />

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-linear-to-r from-cyan-500 to-violet-600 text-white"
                    : "border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/25"
                }`}
              >
                {cat}
                {cat === "AI Generated" && allSites.filter((s) => s.isGenerated).length > 0 && (
                  <span className="ml-2 bg-cyan-500/30 text-cyan-300 text-xs px-1.5 py-0.5 rounded-full">
                    {allSites.filter((s) => s.isGenerated).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Generate CTA */}
          <div className="text-center mb-12">
            <Link
              to="/#generator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-cyan-500/20 to-violet-600/20 border border-cyan-400/30 text-white font-semibold hover:from-cyan-500/30 hover:to-violet-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Generate Your Own Preview — Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((site, i) => (
              <ScrollReveal key={site.id} delay={i * 0.05}>
                <GlassCard className={`group cursor-pointer bg-linear-to-br ${site.color} border border-white/10 hover:border-white/25 transition-all overflow-hidden`}>
                  {/* Preview thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-black/30">
                    {site.html ? (
                      <iframe
                        srcDoc={site.html}
                        title={site.title}
                        className="w-full h-full border-0 pointer-events-none"
                        style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}
                        sandbox="allow-scripts"
                        loading="lazy"
                      />
                    ) : (
                      <img src={site.previewImage} alt={site.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    {site.badgeText && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1 text-xs text-white font-semibold">
                        {site.badgeText}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSite(site)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-white text-sm font-semibold flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Full Preview
                      </div>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-bold text-lg leading-tight">{site.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 whitespace-nowrap">{site.category}</span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">{site.description}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSite(site)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs hover:text-white hover:border-white/25 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      {site.liveUrl && (
                        <a
                          href={site.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs hover:text-white hover:border-white/25 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Live
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>

          <GoogleAdSense slot="examples-bottom" className="mt-16" />
        </div>
      </section>

      {/* Full-screen preview modal */}
      <AnimatePresence>
        {selectedSite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 shrink-0">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-white font-bold">{selectedSite.title}</h3>
                  <p className="text-white/50 text-xs">{selectedSite.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/pricing"
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Get This Site
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedSite(null)}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable iframe */}
            <div className="flex-1 overflow-hidden relative">
              <iframe
                srcDoc={selectedSite.html}
                title={`Full preview: ${selectedSite.title}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Prompt bar */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/60 shrink-0">
              <p className="text-xs text-white/40 mb-1">Prompt used:</p>
              <p className="text-white/70 text-sm italic">"{selectedSite.prompt}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
