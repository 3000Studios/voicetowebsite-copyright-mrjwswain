import { motion } from "framer-motion";
import React from "react";
import PageLayout from "../components/PageLayout";
import { BLOG_POSTS } from "../data/blogPosts";

const YOUTUBE_EMBED = "https://www.youtube.com/embed/2DTrkD0Ffzk?autoplay=0";
const HERO_IMG =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80";

const BlogPage: React.FC = () => {
  return (
    <PageLayout
      title="Blog"
      subtitle="Updates, tutorials, and ideas from the VoiceToWebsite team."
      wallpaper="blog"
    >
      <div className="space-y-16">
        {/* Hero media: 1 image + 1 video */}
        <motion.section
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30">
            <img
              src={HERO_IMG}
              alt="Blog and content"
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
          <div className="vtw-card-hover rounded-3xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <iframe
              src={YOUTUBE_EMBED}
              title="Blog overview"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.section>

        {/* Auto-populated blog grid */}
        <motion.section
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {BLOG_POSTS.map((post, i) => (
            <motion.article
              key={post.id}
              className="vtw-card-hover rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
            >
              <img
                src={post.imageUrl}
                alt={post.imageAlt}
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex gap-2 text-xs text-white/50 vtw-body-text mb-2">
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="vtw-card-title text-lg text-white mb-2">
                  {post.title}
                </h2>
                <p className="vtw-body-text text-white/70 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>
      </div>
    </PageLayout>
  );
};

export default BlogPage;
