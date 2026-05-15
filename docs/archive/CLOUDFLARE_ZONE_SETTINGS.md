# Cloudflare zone settings — load speed and smooth site

Configure these in **Cloudflare Dashboard → your domain (e.g. voicetowebsite.com)** or apply them
via the API using your **CLOUD_FLARE_API_TOKEN** and **CF_ZONE_ID**.

## Apply via API (recommended)

Set `CLOUD_FLARE_API_TOKEN` and `CF_ZONE_ID` (e.g. in `.env` or your shell), then run:

```bash
npm run apply:zone-settings
```

**Token permissions:** Zone > Zone Settings > Read, Edit.

- **PowerShell:**
  `$env:CLOUD_FLARE_API_TOKEN="your-token"; $env:CF_ZONE_ID="your-zone-id"; npm run apply:zone-settings`
- **Bash:** `CLOUD_FLARE_API_TOKEN=xxx CF_ZONE_ID=xxx npm run apply:zone-settings`

The script sets: Auto Minify (JS/CSS/HTML), Brotli, Early Hints, Rocket Loader off, Polish
(lossless), cache level standard, browser cache TTL (respect existing headers), HTTP/2, HTTP/3,
0-RTT, SSL full, Always Use HTTPS. Build caching must still be enabled in Workers & Pages → Builds
(see below).

---

## Speed → Optimization (dashboard reference)

| Setting           | Recommendation               | Notes                                                                   |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------- |
| **Auto Minify**   | Enable JavaScript, CSS, HTML | Reduces size; Vite already minifies; usually safe to enable.            |
| **Brotli**        | Enable if available          | Better compression than gzip.                                           |
| **Early Hints**   | Enable                       | Sends 103 responses for critical assets (e.g. CSS/fonts); improves LCP. |
| **Rocket Loader** | Off (default)                | Can break SPAs; enable only if tested.                                  |

## Speed → Content Optimization → Polish (Images)

| Setting    | Recommendation                   |
| ---------- | -------------------------------- | ----------------------------------------------------------- |
| **Polish** | Enable **Lossless** or **Lossy** | Optimizes images at the edge (smaller files, faster loads). |

## Caching → Configuration

| Setting               | Recommendation               | Notes                                                                                                    |
| --------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Caching Level**     | Standard                     | “Cache Everything” only if you want more aggressive caching; Worker already sets Cache-Control per path. |
| **Browser Cache TTL** | **Respect Existing Headers** | Worker sends `Cache-Control` (e.g. 1 year for static, 10 min for HTML); zone should honor it.            |
| **Cache Rules**       | Optional                     | Add a rule to cache static assets by extension/path with long TTL if you want to reinforce edge caching. |

## Network

| Setting           | Recommendation                        |
| ----------------- | ------------------------------------- |
| **HTTP/2**        | Enable                                |
| **HTTP/3 (QUIC)** | Enable                                |
| **0-RTT**         | Enable (faster connection resumption) |

## SSL/TLS

| Setting                            | Recommendation |
| ---------------------------------- | -------------- |
| **SSL/TLS encryption mode**        | Full (strict)  |
| **Always Use HTTPS**               | On             |
| HSTS is already set by the Worker. |

## Workers Builds (when using Git-based deploys)

In **Workers & Pages → voicetowebsite → Builds**:

- Use the build configuration from [CLOUDFLARE_BUILDS.md](CLOUDFLARE_BUILDS.md).
- **Enable build caching** in the Build configuration so dependencies and build output are cached
  between builds (faster CI).

---

Summary: enable Auto Minify, Brotli, Early Hints, Polish, Respect Existing Headers, HTTP/2, HTTP/3,
0-RTT, and build caching for best load speed and a smooth site.
