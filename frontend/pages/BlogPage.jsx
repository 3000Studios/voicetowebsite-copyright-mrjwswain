import React from 'react'
import { Link } from 'react-router-dom'
import MediaShowcase from '../components/MediaShowcase.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import { blogIndex } from '../src/siteData.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'

export default function BlogPage() {
  return (
    <div className="stack-xl page-remix">
      <section className="section-card page-remix__hero">
        <span className="eyebrow">Insights</span>
        <PrismHeadline text="Strategy for AI-run operations" />
        <p className="section-intro">
          Long-form content redesigned for readability, authority, and conversion support across SEO entry pages.
        </p>
      </section>

      <MediaShowcase media={{ title: `${SITE_DISPLAY_NAME} editorial system`, description: 'Trust-building content that supports product conversion.' }} />

      <section className="card-grid page-remix__surface">
        {blogIndex.posts.map((post) => (
          <article key={post.slug} className="content-card">
            <span className="meta-line">{post.publishedAt}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <div className="tag-row">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <Link className="button button--ghost" to={`/blog/${post.slug}`}>
              Read insight
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
