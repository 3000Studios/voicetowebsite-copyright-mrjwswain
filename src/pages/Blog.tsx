import { GlassCard } from "@/components/GlassCard";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: string;
  slug: string;
  featured?: boolean;
  sourceMode?: "original" | "sourced";
  citations?: string[];
}

const categories = [
  "All",
  "AI & Technology",
  "Website Building",
  "Business Growth",
  "SEO & Marketing",
  "Tutorials",
];

export const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    void fetchPosts(1);
  }, []);

  const fetchPosts = async (nextPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "9",
      });
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      const response = await fetch(`/api/blog/posts?${params.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as {
          posts?: BlogPost[];
          pagination?: { hasNext?: boolean };
        };
        setPosts(data.posts || []);
        setPage(nextPage);
        setHasNext(!!data.pagination?.hasNext);
      } else {
        setPosts(getSamplePosts());
      }
    } catch (error) {
      setPosts(getSamplePosts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts(1);
  }, [selectedCategory]);

  const getSamplePosts = (): BlogPost[] => [
    {
      id: "1",
      title: "The Future of AI Website Building: Voice Commands Take Over",
      excerpt:
        "Discover how voice-to-website technology is revolutionizing the way businesses create their online presence. No coding required.",
      content: "",
      category: "AI & Technology",
      tags: ["AI", "Voice Technology", "Future"],
      publishedAt: new Date().toISOString(),
      readTime: "5 min",
      slug: "future-of-ai-website-building",
      featured: true,
    },
    {
      id: "2",
      title: "How to Launch Your Business Website in Under 5 Minutes",
      excerpt:
        "A step-by-step guide to using VoiceToWebsite for rapid website deployment. Perfect for entrepreneurs and small businesses.",
      content: "",
      category: "Tutorials",
      tags: ["Tutorial", "Quick Start", "Business"],
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      readTime: "3 min",
      slug: "launch-website-in-5-minutes",
    },
    {
      id: "3",
      title: "10 AI Tools Every Business Owner Should Know in 2024",
      excerpt:
        "From content creation to customer service, these AI tools will transform how you run your business.",
      content: "",
      category: "Business Growth",
      tags: ["AI Tools", "Productivity", "2024"],
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      readTime: "8 min",
      slug: "ai-tools-2024",
    },
    {
      id: "4",
      title: "SEO Best Practices for AI-Generated Websites",
      excerpt:
        "Learn how to optimize your AI-generated website for search engines and drive organic traffic.",
      content: "",
      category: "SEO & Marketing",
      tags: ["SEO", "Marketing", "Traffic"],
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      readTime: "6 min",
      slug: "seo-for-ai-websites",
    },
    {
      id: "5",
      title: "Why Your Small Business Needs a Professional Website",
      excerpt:
        "The impact of having a professional online presence on customer trust and business growth.",
      content: "",
      category: "Business Growth",
      tags: ["Small Business", "Website", "Growth"],
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      readTime: "4 min",
      slug: "small-business-website-importance",
    },
    {
      id: "6",
      title: "Comparing VoiceToWebsite vs Traditional Builders",
      excerpt:
        "A detailed comparison of speed, cost, and quality between AI voice builders and traditional website builders.",
      content: "",
      category: "Website Building",
      tags: ["Comparison", "Review", "Builders"],
      publishedAt: new Date(Date.now() - 432000000).toISOString(),
      readTime: "7 min",
      slug: "voicetowebsite-vs-builders",
    },
  ];

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative">
      <Helmet>
        <title>Blog | VoiceToWebsite - AI Website Building Insights</title>
        <meta
          name="description"
          content="Stay updated with the latest in AI website building technology, business growth tips, and digital marketing strategies."
        />
        <link rel="canonical" href="https://voicetowebsite.com/blog" />
      </Helmet>

      {/* Header */}
      <section className="section-shell pt-24">
        <div className="content-grid">
          <ScrollReveal className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">
                AI-Powered Blog
              </span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              Latest Insights
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Stay ahead with AI-generated insights on website building,
              business growth, and digital innovation.
            </p>
          </ScrollReveal>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
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

          {/* AdSense */}
          <GoogleAdSense slot="blog-top" />
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === "All" && (
        <section className="section-shell py-0 pb-12">
          <div className="content-grid">
            <ScrollReveal>
              <Link to={`/blog/${featuredPost.slug}`}>
                <GlassCard className="group cursor-pointer overflow-hidden p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="h-64 md:h-auto bg-linear-to-br from-indigo-500/20 to-purple-500/10 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span className="text-indigo-400 font-medium">
                          {featuredPost.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(featuredPost.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-slate-400 mb-6">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-indigo-400 font-medium group-hover:gap-4 transition-all">
                        Read Article <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="section-shell">
        <div className="content-grid">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post, index) => (
                <ScrollReveal key={post.id} delay={index * 0.1}>
                  <Link to={`/blog/${post.slug}`}>
                    <GlassCard className="group cursor-pointer h-full flex flex-col p-0 overflow-hidden">
                      <div className="h-48 bg-linear-to-br from-cyan-500/10 to-blue-500/5 relative">
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col grow">
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-3 grow">
                          {post.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-slate-400 text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}

          {!loading ? (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchPosts(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="hero-secondary-button disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">Page {page}</span>
              <button
                type="button"
                onClick={() => void fetchPosts(page + 1)}
                disabled={!hasNext}
                className="hero-secondary-button disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}

          {!loading && filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">
                No posts found in this category.
              </p>
              <button
                onClick={() => setSelectedCategory("All")}
                className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View all posts
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section-shell pb-32">
        <div className="content-grid">
          <ScrollReveal>
            <div className="rounded-[32px] border border-white/10 bg-linear-to-br from-indigo-500/10 via-white/5 to-cyan-500/10 backdrop-blur-2xl p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Stay Updated
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Get the latest AI website building tips and insights delivered
                to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
                <button className="hero-primary-button whitespace-nowrap">
                  Subscribe
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Blog;
