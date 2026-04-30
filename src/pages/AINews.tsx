import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import index from "@/content/ai-news/index.json";

export const AINews = () => {
  const items = (index as any).items || [];

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <Helmet>
        <title>AI News | Voice2Website</title>
        <meta
          name="description"
          content="AI News for builders: monetization, automation, product strategy, and practical playbooks — indexed and SEO-ready."
        />
        <meta
          name="keywords"
          content="AI news, AI website builder, voice to website, SaaS, subscriptions"
        />
        <link rel="canonical" href="https://voice2website.com/ai-news" />
        <meta property="og:title" content="AI News | Voice2Website" />
        <meta
          property="og:description"
          content="AI News for builders: monetization, automation, product strategy, and practical playbooks."
        />
      </Helmet>

      <div className="text-center space-y-8 mb-20">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none lights-header"
        >
          AI <span className="text-indigo-500 ultra-glow">News</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 font-light italic max-w-3xl mx-auto"
        >
          Indexed briefings designed to rank, convert, and compound traffic into
          subscribers.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {items.map((item: any, i: number) => (
          <motion.div
            key={item.slug}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
            className="glass-premium p-10 border border-white/5 hover:border-indigo-500/40 transition-all duration-700 overflow-hidden relative group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="glow-soft mesh-blue top-[-20%] right-[-10%] w-[40%] h-[40%] opacity-[0.08]" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">
                {new Date(item.publishedAt).toLocaleDateString()}
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-tight">
                {item.title}
              </h2>
              <p className="text-sm text-slate-400 italic leading-relaxed">
                {item.description}
              </p>
              <div className="pt-6">
                <Link
                  to={`/ai-news/${item.slug}`}
                  className="btn-minimal hover:ultra-glow inline-flex"
                >
                  Read Story
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 opacity-70">
                {(item.keywords || []).slice(0, 6).map((k: string) => (
                  <span
                    key={k}
                    className="text-[9px] font-black uppercase tracking-widest border border-white/10 px-3 py-1 bg-white/2"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
