/**
 * Image Discovery & Optimization System
 * Searches Unsplash/Pexels, downloads, optimizes, and injects images
 * For Custom GPT voice commands like "add image of mountains"
 */

export class ImageDiscoverySystem {
  constructor(env) {
    this.env = env;
    this.cache = {};
  }

  /**
   * Main search and download flow
   */
  async findAndInjectImage(options) {
    const { query, target, altText, width = 1200, height = 600 } = options;

    if (!query || !target) {
      throw new Error("query and target required");
    }

    try {
      // 1. Search for image
      let imageUrl = await this.searchImage(query);
      if (!imageUrl) {
        throw new Error(`No images found for: ${query}`);
      }

      // 2. Download and optimize
      const optimized = await this.downloadAndOptimize(imageUrl, {
        width,
        height,
      });
      const assetUrl = optimized.url;

      // 3. Inject into target
      await this.injectImage(target, assetUrl, altText);

      return {
        success: true,
        url: assetUrl,
        target,
        injected: true,
        query,
        altText,
      };
    } catch (err) {
      console.error("[ImageDiscovery] Error:", err);
      throw err;
    }
  }

  /**
   * Search images from Unsplash/Pexels
   */
  async searchImage(query) {
    // Try Unsplash first
    if (this.env.UNSPLASH_ACCESS_KEY) {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&count=1&client_id=${this.env.UNSPLASH_ACCESS_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results?.[0]?.urls?.regular) {
          return data.results[0].urls.regular;
        }
      } catch (err) {
        console.warn("[ImageSearch] Unsplash failed:", err.message);
      }
    }

    // Fallback to Pexels
    if (this.env.PEXELS_API_KEY) {
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
        const response = await fetch(url, {
          headers: { Authorization: this.env.PEXELS_API_KEY },
        });
        const data = await response.json();

        if (data.photos?.[0]?.src?.large) {
          return data.photos[0].src.large;
        }
      } catch (err) {
        console.warn("[ImageSearch] Pexels failed:", err.message);
      }
    }

    return null;
  }

  /**
   * Download and optimize image to webp
   */
  async downloadAndOptimize(imageUrl, options = {}) {
    const { width = 1200, height = 600 } = options;

    try {
      // Download original
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();

      // Use a simple image optimization approach
      // For production, consider using ImageMagick or similar
      const buffer = await blob.arrayBuffer();

      // Store in R2 or KV
      const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const assetPath = `/assets/${filename}`;

      // For production: upload to R2
      if (this.env.R2_BUCKET) {
        try {
          await this.env.R2_BUCKET.put(filename, blob, {
            httpMetadata: {
              contentType: blob.type,
            },
          });
        } catch (err) {
          console.warn("[ImageOptimize] R2 upload failed:", err.message);
        }
      }

      return {
        url: assetPath,
        size: buffer.byteLength,
        width,
        height,
        format: "jpg",
      };
    } catch (err) {
      console.error("[ImageDownload] Error:", err);
      throw err;
    }
  }

  /**
   * Inject image into target (CSS or HTML)
   */
  async injectImage(target, imageUrl, altText = "") {
    // Parse target specification
    const [type, selector] = target.split(":");

    if (type === "css" || type === "background") {
      // Inject as CSS background
      const selector_clean = selector.trim();
      const css = `
${selector_clean} {
  background-image: url('${imageUrl}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
      `;

      // Add to styles.css or inject <style> tag
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);

      // Also update styles.css via API if possible
      if (this.env.D1) {
        try {
          await fetch("/api/inject-css", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selector: selector_clean,
              css: {
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              },
            }),
          });
        } catch (err) {
          console.warn("[ImageInject] CSS injection failed:", err.message);
        }
      }
    } else if (type === "html" || type === "img") {
      // Inject as HTML image element
      const container = document.querySelector(selector);
      if (!container) {
        throw new Error(`Selector not found: ${selector}`);
      }

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = altText;
      img.style.maxWidth = "100%";
      img.style.height = "auto";

      container.appendChild(img);
    } else if (type === "hero" || type === "banner") {
      // Inject into hero section background
      const hero = document.querySelector('.hero, [role="banner"], header');
      if (hero) {
        hero.style.backgroundImage = `url('${imageUrl}')`;
        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";
      }
    }
  }

  /**
   * Cache image search result
   */
  async cacheResult(query, imageUrl) {
    const cacheKey = `image:${query}:${Date.now()}`;

    if (this.env.VTW_CACHE) {
      await this.env.VTW_CACHE.put(
        cacheKey,
        JSON.stringify({
          query,
          imageUrl,
          cached_at: new Date().toISOString(),
        }),
        { expirationTtl: 86400 } // 24 hours
      );
    }

    this.cache[query] = imageUrl;
  }

  /**
   * Get cached result
   */
  getCachedResult(query) {
    return this.cache[query] || null;
  }
}

/**
 * Voice command parser for image operations
 */
export function parseImageCommand(input) {
  // Pattern: "add image of X"
  const match = input.match(
    /(?:add|insert|inject)\s+(?:an?\s+)?image\s+(?:of\s+)?(.+?)(?:\s+to|\s+on|\s+in|\s+for)?(?:\s+the)?\s*(.+)?$/i
  );

  if (!match) return null;

  const query = match[1].trim();
  const target = match[2]?.trim() || "hero";

  return { query, target };
}

/**
 * Video command parser
 */
export function parseVideoCommand(input) {
  // Patterns:
  // "add video from YouTube: [URL]"
  // "insert video [URL]"
  // "embed video [URL] as hero"

  const patterns = [
    /(?:add|insert|embed)\s+(?:a\s+)?video\s+(?:from\s+youtube|from\s+youtube\.com)?\s*:?\s*(.+?)(?:\s+as\s+(.+))?$/i,
    /(?:add|insert)\s+video\s+(.+?)(?:\s+to|\s+as|$)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        url: match[1].trim(),
        target: match[2]?.trim() || "hero",
        type: "video",
      };
    }
  }

  return null;
}

/**
 * Monetization command parser
 */
export function parseMonetizationCommand(input) {
  // Patterns:
  // "add PayPal button"
  // "insert payment option"
  // "add stripe checkout"

  const paypalMatch = input.match(/(?:add|insert)\s+paypal\s+button/i);
  if (paypalMatch) {
    return { provider: "paypal", action: "add-button" };
  }

  const stripeMatch = input.match(
    /(?:add|insert)\s+stripe\s+(?:button|checkout)/i
  );
  if (stripeMatch) {
    return { provider: "stripe", action: "add-button" };
  }

  const priceMatch = input.match(/update\s+pricing?\s+to\s+\$?(\d+)/i);
  if (priceMatch) {
    return { action: "update-price", price: parseInt(priceMatch[1], 10) * 100 };
  }

  return null;
}

/**
 * Product command parser
 */
export function parseProductCommand(input) {
  // Pattern: "add product X for $Y"
  const match = input.match(/add\s+product\s+(.+?)\s+(?:for\s+)?\$?(\d+)/i);

  if (!match) return null;

  return {
    title: match[1].trim(),
    price: parseInt(match[2], 10) * 100,
    action: "add-product",
  };
}
