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
import { useState } from "react";
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
}

const exampleSites: ExampleSite[] = [
  {
    id: "coach-consultant",
    title: "Elite Coaching",
    category: "Coach / Consultant",
    description:
      "Premium coaching business with booking integration and testimonials.",
    previewImage: "/examples/coach.jpg",
    color: "from-indigo-500/20 to-purple-500/10",
    prompt:
      'A premium coaching website with dark navy theme, hero section with headline "Transform Your Life", booking calendar integration, testimonials section, and contact form.',
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#0d0d1f;color:white;}</style></head><body><h1>Elite Coaching</h1><p>Premium coaching services.</p></body></html>`,
    liveUrl: "https://demo-coach.voicetowebsite.com",
    badgeText: "⭐ Featured Site",
  },
  {
    id: "local-service",
    title: "Premier Plumbing",
    category: "Local Business",
    description:
      "Service business with quote forms and emergency call features.",
    previewImage: "/examples/local.jpg",
    color: "from-cyan-500/20 to-blue-500/10",
    prompt:
      "A professional plumbing service website with bright blue theme, emergency call button, service area map, quote request form, and customer reviews.",
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#0d1f2f;color:white;}</style></head><body><h1>Premier Plumbing</h1><p>24/7 Emergency Services.</p></body></html>`,
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
    prompt:
      "A modern SaaS productivity app landing page with gradient hero, feature grid, pricing table with 3 tiers, customer logos, and CTA sections.",
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#0d1f15;color:white;}</style></head><body><h1>TaskFlow Pro</h1><p>Boost your productivity.</p></body></html>`,
    liveUrl: "https://demo-saas.voicetowebsite.com",
    badgeText: "🚀 Startup Choice",
  },
  {
    id: "real-estate",
    title: "Luxury Estates",
    category: "Real Estate",
    description: "Property showcase with listings and agent profiles.",
    previewImage: "/examples/realestate.jpg",
    color: "from-amber-500/20 to-orange-500/10",
    prompt:
      "A luxury real estate website with gold accents, property gallery, agent team section, mortgage calculator, and contact forms.",
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#1f1a0d;color:white;}</style></head><body><h1>Luxury Estates</h1><p>Find your dream home.</p></body></html>`,
    liveUrl: "https://demo-realestate.voicetowebsite.com",
    badgeText: "🏠 Top Real Estate",
  },
  {
    id: "restaurant",
    title: "Bistro Central",
    category: "Restaurant",
    description: "Restaurant with menu, reservations, and location info.",
    previewImage: "/examples/restaurant.jpg",
    color: "from-rose-500/20 to-red-500/10",
    prompt:
      "An elegant restaurant website with warm colors, full menu display, online reservation system, chef profiles, and location map.",
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#1f0d0d;color:white;}</style></head><body><h1>Bistro Central</h1><p>Fine dining experience.</p></body></html>`,
    liveUrl: "https://demo-restaurant.voicetowebsite.com",
    badgeText: "🍽️ Top Restaurant",
  },
  {
    id: "fitness",
    title: "PowerFit Gym",
    category: "Fitness",
    description: "Gym website with class schedules and membership plans.",
    previewImage: "/examples/fitness.jpg",
    color: "from-violet-500/20 to-fuchsia-500/10",
    prompt:
      "A high-energy gym website with bold typography, class schedule, trainer profiles, membership pricing, and before/after gallery.",
    html: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;background:#1a0d1f;color:white;}</style></head><body><h1>PowerFit Gym</h1><p>Transform your body.</p></body></html>`,
    liveUrl: "https://demo-gym.voicetowebsite.com",
    badgeText: "💪 Top Fitness",
  },
];

const categories = [
  "All",
  "Coach / Consultant",
  "Local Business",
  "Product / SaaS",
  "Real Estate",
  "Restaurant",
  "Fitness",
];

export const Examples = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedExample, setSelectedExample] = useState<ExampleSite | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const filteredExamples =
    selectedCategory === "All"
      ? exampleSites
      : exampleSites.filter((e) => e.category === selectedCategory);

  return (
    <div className="relative">
      <Helmet>
        <title>Examples | VoiceToWebsite - Website Showcase</title>
        <meta
          name="description"
          content="See real websites built with VoiceToWebsite AI. Browse examples for coaches, businesses, SaaS, and more."
        />
      </Helmet>

      {/* Hero with Video */}
      <VideoHero
        videoSrc="/videos/Vocietowebsite.com-video-black-woman.mp4"
        title="Website Showcase"
        subtitle="Real websites built with voice commands and AI"
        overlayOpacity={0.6}
        showControls={false}
      />

      {/* Main Content */}
      <div className="relative z-10 bg-[#05070b]">
        {/* AdSense */}
        <div className="pt-8">
          <GoogleAdSense slot="examples-top" />
        </div>

        {/* Category Filter */}
        <section className="section-shell pb-12">
          <div className="content-grid">
            <ScrollReveal className="text-center mb-12">
              <span className="eyebrow mb-4">Gallery</span>
              <h2 className="section-title text-gradient mb-4">
                Browse Examples
              </h2>
              <p className="section-copy max-w-2xl mx-auto">
                Explore websites built with VoiceToWebsite across different
                industries.
              </p>
            </ScrollReveal>

            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-indigo-500 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section className="section-shell pt-0">
          <div className="content-grid">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredExamples.map((example, index) => (
                  <motion.div
                    key={example.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard
                      onClick={() => setSelectedExample(example)}
                      className="cursor-pointer group overflow-hidden p-0 relative"
                    >
                      {/* Badge */}
                      {example.badgeText && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-400">
                          {example.badgeText}
                        </div>
                      )}

                      {/* Preview Image Area */}
                      <div
                        className={`h-48 bg-linear-to-br ${example.color} relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                        {/* Live Demo Badge on Hover */}
                        {example.liveUrl && (
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
                              <ExternalLink className="w-3 h-3" />
                              View Live Site
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                            {example.category}
                          </span>
                          {example.liveUrl && (
                            <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                          {example.title}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {example.description}
                        </p>

                        {/* Built with Badge */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <span className="text-[10px] text-white/40 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            Built with VoiceToWebsite
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-shell bg-linear-to-b from-transparent via-white/2 to-transparent">
          <div className="content-grid">
            <ScrollReveal className="text-center mb-16">
              <span className="eyebrow mb-4">Success Stories</span>
              <h2 className="section-title text-gradient mb-4">
                What Our Users Say
              </h2>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote:
                    "I literally described my coaching business to my phone and had a professional website 3 minutes later. Unbelievable.",
                  author: "Sarah Mitchell",
                  role: "Business Coach",
                },
                {
                  quote:
                    "We needed a landing page for a product launch by morning. VoiceToWebsite delivered in 5 minutes. The quality was outstanding.",
                  author: "Marcus Chen",
                  role: "Startup Founder",
                },
                {
                  quote:
                    "As a non-tech person, this is a dream come true. I just speak what I need and it appears. My clients love my new site.",
                  author: "Jennifer Rodriguez",
                  role: "Real Estate Agent",
                },
              ].map((testimonial, index) => (
                <ScrollReveal key={index} delay={index * 0.1}>
                  <GlassCard className="h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="w-4 h-4 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <div className="font-bold text-white">
                        {testimonial.author}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {testimonial.role}
                      </div>
                    </div>
                  </GlassCard>
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
                  Build Yours Today
                </h2>
                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                  Join thousands of creators who have launched their websites
                  with VoiceToWebsite.
                </p>
                <Link
                  to="/pricing"
                  className="hero-primary-button text-lg px-10 py-5 inline-flex"
                >
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedExample && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedExample(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-[32px] border border-white/10 bg-[#0d0d1f]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedExample.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {selectedExample.category}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExample(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 p-4 border-b border-white/10">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "preview"
                      ? "bg-indigo-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "code"
                      ? "bg-indigo-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {viewMode === "preview" ? (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white">
                    <iframe
                      srcDoc={selectedExample.html}
                      className="w-full h-full"
                      title={selectedExample.title}
                    />
                  </div>
                ) : (
                  <pre className="aspect-video overflow-auto rounded-2xl bg-slate-950 p-6 text-sm text-slate-300 font-mono">
                    {selectedExample.html}
                  </pre>
                )}

                {/* Prompt */}
                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
                    Prompt Used
                  </span>
                  <p className="text-slate-300">{selectedExample.prompt}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center p-6 border-t border-white/10">
                <div className="flex gap-3">
                  {selectedExample.liveUrl && (
                    <a
                      href={selectedExample.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live Site
                    </a>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedExample(null)}
                    className="px-6 py-3 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
                  >
                    Build Similar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Examples;
