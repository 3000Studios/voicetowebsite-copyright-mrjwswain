import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import {
  DEFAULT_BLOG_FEED,
  type BlogFeed,
  normalizeBlogFeedPayload,
} from "../data/blogPosts";

const YOUTUBE_EMBED = "https://www.youtube.com/embed/2DTrkD0Ffzk?autoplay=0";

const formatPublishedDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatGeneratedTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const BlogPage: React.FC = () => {
  const [feed, setFeed] = useState<BlogFeed>(DEFAULT_BLOG_FEED);
  const [isLoading, setIsLoading] = useState(true);
  const featuredPost = feed.posts[0];

  useEffect(() => {
    let active = true;

    const loadFeed = async () => {
      try {
        const response = await fetch("/config/blog.json", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (active) {
          setFeed(normalizeBlogFeedPayload(payload));
        }
      } catch (_) {
        // Keep the bundled feed when runtime content is unavailable.
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFeed();

    return () => {
      active = false;
    };
  }, []);

  return (
    <PageLayout
      title={feed.heroTitle}
      subtitle={feed.heroSubtitle}
      wallpaper="blog"
    >
      <div className="space-y-16">
        <motion.section
          className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            {featuredPost && (
              <>
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.imageAlt}
                  className="h-64 w-full object-cover md:h-80"
                />
                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-cyan-200/80">
                    <span>Featured article</span>
                    <span>•</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <h2 className="font-outfit text-2xl font-black text-white md:text-4xl">
                    {featuredPost.title}
                  </h2>
                  <p className="max-w-3xl text-base leading-relaxed text-white/72 md:text-lg">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {featuredPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>

          <div className="space-y-6">
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.24em] text-emerald-200">
                  {isLoading ? "Loading feed" : "Live feed"}
                </span>
                <span className="text-sm text-white/55">
                  Refreshes every {feed.refreshHours} hours
                </span>
              </div>
              <h3 className="mt-4 font-outfit text-2xl font-black text-white">
                Search coverage that keeps updating.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                The blog is driven by runtime JSON so new posts can appear
                without a full frontend rebuild. This keeps the content layer
                active for search and easier to inspect from the admin side.
              </p>
              <dl className="mt-5 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <dt className="text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
                    Last generated
                  </dt>
                  <dd className="mt-2 font-medium text-white">
                    {formatGeneratedTime(feed.generatedAt)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <dt className="text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
                    Total posts
                  </dt>
                  <dd className="mt-2 font-medium text-white">
                    {feed.posts.length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black/30">
              <iframe
                src={YOUTUBE_EMBED}
                title="VoiceToWebsite blog overview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </motion.section>

        <motion.section
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {feed.posts.map((post, index) => (
            <motion.article
              key={`${post.id}-${post.date}`}
              id={post.slug}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <img
                src={post.imageUrl}
                alt={post.imageAlt}
                className="h-44 w-full object-cover"
              />
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2 text-xs text-white/55">
                  <span>{formatPublishedDate(post.date)}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="vtw-card-title text-xl text-white">
                  {post.title}
                </h2>
                <p className="vtw-body-text text-sm leading-relaxed text-white/72">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={post.url || `/blog#${post.slug}`}
                  className="inline-flex items-center text-sm font-semibold text-cyan-200 transition-colors hover:text-cyan-100"
                >
                  Read this update
                </a>
              </div>
            </motion.article>
          ))}
        </motion.section>
      </div>
    </PageLayout>
  );
};

export default BlogPage;
