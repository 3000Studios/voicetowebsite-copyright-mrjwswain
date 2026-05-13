import React, { useMemo } from 'react'
import { DEFAULT_SITE_MEDIA } from '../src/siteMeta.js'

export default function MediaShowcase({ media, compact = false }) {
  const asset = media ?? DEFAULT_SITE_MEDIA
  const className = compact ? 'media-showcase media-showcase--compact' : 'media-showcase'
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  return (
    <section className={className}>
      <div className="media-showcase__frame">
        {asset.videoUrl ? (
          <video
            className="media-showcase__video"
            src={asset.videoUrl}
            poster={asset.posterUrl ?? asset.imageUrl}
            autoPlay={!prefersReducedMotion}
            muted
            loop
            playsInline
            preload="metadata"
            controls={Boolean(asset.controls)}
          />
        ) : asset.imageUrl ? (
          <img
            className="media-showcase__image"
            src={asset.imageUrl}
            alt={asset.alt ?? asset.title ?? 'Site preview'}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        {asset.badges?.length ? (
          <div className="media-showcase__badges">
            {asset.badges.map((badge) => (
              <span key={badge} className="tag">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="media-showcase__copy">
        <span className="eyebrow">{asset.eyebrow ?? 'Preview'}</span>
        <h2>{asset.title ?? 'Platform preview'}</h2>
        <p>{asset.body ?? 'A lightweight media surface keeps the page visual without sacrificing performance or readability.'}</p>
      </div>
    </section>
  )
}
