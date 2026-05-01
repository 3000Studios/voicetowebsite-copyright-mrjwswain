import { GlassCard } from "@/components/GlassCard";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VideoHero } from "@/components/VideoHero";
import { ArrowRight, ChevronRight, MessageCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How does VoiceToWebsite work?",
    answer:
      "Simply describe your website using voice or text. Our AI understands your requirements and generates a complete, styled website instantly. You can preview it for free, then upgrade to save and deploy your site.",
  },
  {
    category: "Getting Started",
    question: "Do I need any technical skills?",
    answer:
      "Not at all. VoiceToWebsite is designed for non-technical users. Just describe what you want in plain English, and our AI handles all the coding, design, and deployment.",
  },
  {
    category: "Getting Started",
    question: "How long does it take to build a website?",
    answer:
      "Most websites are generated in under 5 minutes. The actual generation takes seconds, and the rest is preview and refinement time.",
  },
  {
    category: "Pricing & Plans",
    question: "Is there a free plan?",
    answer:
      "Yes! You can generate unlimited previews for free. To save, deploy, and export your websites, you'll need to upgrade to a paid plan.",
  },
  {
    category: "Pricing & Plans",
    question: "What's included in each plan?",
    answer:
      "Starter ($15/month): 3 hosted sites and 10 commands per cycle. Pro ($39/month): 15 hosted sites, 50 commands per cycle, code export, and watermark removal. Enterprise ($99/month): unlimited hosted sites and commands with priority support.",
  },
  {
    category: "Pricing & Plans",
    question: "Can I change plans later?",
    answer:
      "Yes. You can change plans from your account, and the new entitlements apply as soon as the update is confirmed.",
  },
  {
    category: "Payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All payments are processed securely through Stripe.",
  },
  {
    category: "Payments",
    question: "Is there a refund policy?",
    answer:
      "All sales are final. Payments are non-refundable once checkout is completed because generation capacity and hosting resources are allocated immediately.",
  },
  {
    category: "Website Features",
    question: "Are the websites mobile-responsive?",
    answer:
      "Yes, every website generated is automatically optimized for all devices - desktop, tablet, and mobile. They use modern responsive design principles.",
  },
  {
    category: "Website Features",
    question: "Can I use my own domain?",
    answer:
      "Yes, all paid plans support custom domains. You can connect your existing domain or purchase a new one through our integration with Namecheap.",
  },
  {
    category: "Website Features",
    question: "Do you offer e-commerce functionality?",
    answer:
      "Yes, our Pro and Enterprise plans include e-commerce templates with product catalogs, shopping carts, and payment integration via Stripe.",
  },
  {
    category: "Website Features",
    question: "Can I edit my website after it's generated?",
    answer:
      "Absolutely. You can regenerate any section using voice commands, or manually edit the code if you're on a Pro or Enterprise plan.",
  },
  {
    category: "Technical",
    question: "Where are the websites hosted?",
    answer:
      "We use Cloudflare's global edge network for hosting, ensuring fast load times worldwide with 99.9% uptime and enterprise-grade security.",
  },
  {
    category: "Technical",
    question: "Do I own the website code?",
    answer:
      "Yes, with Pro and Enterprise plans you can export your website's source code and host it anywhere. You retain full ownership of your content.",
  },
  {
    category: "Technical",
    question: "Is my data secure?",
    answer:
      "Yes, we use industry-standard encryption for all data. Your voice recordings are processed in real-time and not stored. Website data is backed up daily.",
  },
  {
    category: "Support",
    question: "How do I get support?",
    answer:
      "You can reach our support team via email at support@voicetowebsite.com or through the live chat on your dashboard. Enterprise customers get priority support with dedicated account managers.",
  },
  {
    category: "Support",
    question: "Do you offer custom development?",
    answer:
      "For Enterprise customers, we offer custom development services for complex requirements that go beyond our standard templates.",
  },
];

const categories = [
  "All",
  "Getting Started",
  "Pricing & Plans",
  "Payments",
  "Website Features",
  "Technical",
  "Support",
];

export const FAQ = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative">
      <Helmet>
        <title>FAQ | VoiceToWebsite - Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to common questions about VoiceToWebsite. Learn about pricing, features, and how to build websites with AI."
        />
        <link rel="canonical" href="https://voicetowebsite.com/faq" />
      </Helmet>

      {/* Hero with Video */}
      <VideoHero
        videoSrc="/videos/voice-to-website-woman-talking-to-phone.mp4"
        title="How Can We Help?"
        subtitle="Find answers to your questions about VoiceToWebsite"
        overlayOpacity={0.6}
        showControls={false}
      />

      {/* Main Content */}
      <div className="relative z-10 bg-[#05070b]">
        {/* AdSense */}
        <div className="pt-8">
          <GoogleAdSense slot="faq-top" />
        </div>

        {/* Search Section */}
        <section className="section-shell pb-12">
          <div className="content-grid">
            <ScrollReveal className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Category Filter */}
        <section className="section-shell py-0 pb-12">
          <div className="content-grid">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm ${
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

        {/* FAQ Accordion */}
        <section className="section-shell pt-0">
          <div className="content-grid max-w-4xl">
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <ScrollReveal key={index} delay={index * 0.05}>
                  <GlassCard
                    className={`${openItem === faq.question ? "border-indigo-500/30" : ""}`}
                  >
                    <button
                      onClick={() =>
                        setOpenItem(
                          openItem === faq.question ? null : faq.question,
                        )
                      }
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 block">
                          {faq.category}
                        </span>
                        <h3 className="text-lg font-bold text-white pr-8">
                          {faq.question}
                        </h3>
                      </div>
                      <motion.div
                        animate={{ rotate: openItem === faq.question ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openItem === faq.question && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-white/10">
                            <p className="text-slate-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </ScrollReveal>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-400 text-lg">
                  No results found for "{searchQuery}"
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="section-shell">
          <div className="content-grid">
            <ScrollReveal>
              <div className="rounded-[32px] border border-white/10 bg-linear-to-br from-indigo-500/10 via-white/5 to-cyan-500/10 backdrop-blur-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  Our support team is here to help. Reach out and we'll get back
                  to you within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@voicetowebsite.com"
                    className="hero-primary-button"
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                  <Link to="/pricing" className="hero-secondary-button">
                    View Pricing
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

export default FAQ;
