import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import ScrollReveal from "../components/ScrollReveal";
import {
  DEFAULT_BLOG_FEED,
  type BlogFeed,
  normalizeBlogFeedPayload,
} from "../data/blogPosts";

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
        if (active) setFeed(normalizeBlogFeedPayload(payload));
      } catch (_) {
        // Keep bundled feed when runtime content is unavailable.
      } finally {
        if (active) setIsLoading(false);
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
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <ScrollReveal as="section" className="vtw-grid-2" variant="blur">
          <article
            className="vtw-glass-card vtw-card-hover"
            style={{ padding: "1rem" }}
          >
            {featuredPost && (
              <>
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.imageAlt}
                  style={{
                    width: "100%",
                    height: "clamp(260px, 38vw, 420px)",
                    objectFit: "cover",
                    borderRadius: "24px",
                  }}
                />
                <div
                  style={{ display: "grid", gap: "0.9rem", marginTop: "1rem" }}
                >
                  <div className="vtw-inline-meta">
                    <span className="vtw-chip">Featured article</span>
                    <span className="vtw-chip">{featuredPost.readTime}</span>
                  </div>
                  <h2
                    className="vtw-card-title"
                    style={{
                      margin: 0,
                      fontSize: "clamp(1.8rem, 4vw, 3rem)",
                      lineHeight: 0.98,
                    }}
                  >
                    {featuredPost.title}
                  </h2>
                  <p className="vtw-body-text" style={{ margin: 0 }}>
                    {featuredPost.excerpt}
                  </p>
                  <div className="vtw-inline-meta">
                    {featuredPost.tags.map((tag) => (
                      <span key={tag} className="vtw-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <article className="vtw-glass-card" style={{ padding: "1.25rem" }}>
              <div className="vtw-inline-meta">
                <span className="vtw-chip">
                  {isLoading ? "Loading feed" : "Live feed"}
                </span>
                <span className="vtw-chip">
                  Refreshes every {feed.refreshHours} hours
                </span>
              </div>
              <h3
                style={{
                  margin: "1rem 0 0.6rem",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.8rem",
                }}
              >
                Search coverage that keeps updating.
              </h3>
              <p className="vtw-body-text" style={{ margin: 0 }}>
                The blog is driven by runtime JSON so new posts can appear
                without a full frontend rebuild. That keeps the content layer
                active for search and easier to inspect.
              </p>
              <div className="vtw-metric-grid" style={{ marginTop: "1.1rem" }}>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Last generated</span>
                  <span
                    className="vtw-metric__value"
                    style={{ fontSize: "1rem", letterSpacing: 0 }}
                  >
                    {formatGeneratedTime(feed.generatedAt)}
                  </span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Total posts</span>
                  <span className="vtw-metric__value">{feed.posts.length}</span>
                </div>
                <div className="vtw-metric">
                  <span className="vtw-metric__label">Publish cycle</span>
                  <span className="vtw-metric__value">
                    {feed.refreshHours}h
                  </span>
                </div>
              </div>
            </article>

            <article
              className="vtw-glass-card vtw-card-hover"
              style={{ padding: "1.2rem" }}
            >
              <div
                className="vtw-section-label"
                style={{ marginBottom: "0.8rem" }}
              >
                Editorial spotlight
              </div>
              <div
                style={{
                  minHeight: "100%",
                  padding: "1.2rem",
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(150deg, rgba(255,0,200,0.12), rgba(0,242,255,0.08) 46%, rgba(15,20,27,0.94))",
                  display: "grid",
                  gap: "1rem",
                }}
              >
                <div className="vtw-inline-meta">
                  <span className="vtw-chip">Runtime content</span>
                  <span className="vtw-chip">
                    {feed.posts.length} posts live
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.55rem, 3vw, 2.3rem)",
                    lineHeight: 1,
                  }}
                >
                  The blog stays active even when the frontend shell does not
                  change.
                </h3>
                <p className="vtw-body-text" style={{ margin: 0 }}>
                  Runtime JSON keeps the editorial layer easy to refresh,
                  inspect, and recover without depending on an external media
                  embed.
                </p>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {[
                    `Featured story: ${featuredPost?.title || "VoiceToWebsite updates"}`,
                    `Generated ${formatGeneratedTime(feed.generatedAt)}`,
                    `Refresh cadence: every ${feed.refreshHours} hours`,
                  ].map((point) => (
                    <div
                      key={point}
                      style={{
                        padding: "0.85rem 0.95rem",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.04)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </ScrollReveal>

        <ScrollReveal as="section" className="vtw-grid-auto">
          {feed.posts.map((post) => (
            <article
              key={`${post.id}-${post.date}`}
              id={post.slug}
              className="vtw-glass-card vtw-card-hover"
              style={{ padding: "1rem" }}
            >
              <img
                src={post.imageUrl}
                alt={post.imageAlt}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "22px",
                }}
              />
              <div
                style={{ display: "grid", gap: "0.8rem", marginTop: "1rem" }}
              >
                <div className="vtw-inline-meta">
                  <span className="vtw-chip">
                    {formatPublishedDate(post.date)}
                  </span>
                  <span className="vtw-chip">{post.readTime}</span>
                </div>
                <h2
                  className="vtw-card-title"
                  style={{ margin: 0, fontSize: "1.35rem", lineHeight: 1.04 }}
                >
                  {post.title}
                </h2>
                <p className="vtw-body-text" style={{ margin: 0 }}>
                  {post.excerpt}
                </p>
                <div className="vtw-inline-meta">
                  {post.tags.map((tag) => (
                    <span key={tag} className="vtw-chip">
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={post.url || `/blog#${post.slug}`}
                  style={{
                    color: "var(--accent-cyan)",
                    fontWeight: 600,
                  }}
                >
                  Read this update
                </a>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </PageLayout>
  );
};

export default BlogPage;
