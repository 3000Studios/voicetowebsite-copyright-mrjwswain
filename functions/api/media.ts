export interface Env {
  UNSPLASH_API_KEY?: string;
  PEXELS_API_KEY?: string;
  COVER_API_KEY?: string;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

const fallbackImage =
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80";
const fallbackVideo =
  "https://cdn.coverr.co/videos/coverr-cinematic-city-pan-7153/1080p.mp4";

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") || "business website").trim();

  let imageUrl = fallbackImage;
  let gallery: string[] = [];
  let videoUrl = fallbackVideo;

  try {
    if (context.env.UNSPLASH_API_KEY) {
      const unsplash = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=6`,
        {
          headers: {
            Authorization: `Client-ID ${context.env.UNSPLASH_API_KEY}`,
          },
        },
      );
      if (unsplash.ok) {
        const data = (await unsplash.json()) as {
          results?: Array<{ urls?: { regular?: string } }>;
        };
        const images = (data.results || [])
          .map((item) => item.urls?.regular)
          .filter((value): value is string => !!value);
        if (images.length) {
          imageUrl = images[0];
          gallery = images.slice(0, 3);
        }
      }
    }
  } catch {}

  try {
    if (context.env.PEXELS_API_KEY) {
      const pexels = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
        {
          headers: {
            Authorization: context.env.PEXELS_API_KEY,
          },
        },
      );
      if (pexels.ok) {
        const data = (await pexels.json()) as {
          videos?: Array<{
            video_files?: Array<{ quality?: string; width?: number; link?: string }>;
          }>;
        };
        const files =
          data.videos?.flatMap((video) => video.video_files || []) || [];
        const best =
          files.find((file) => file.quality === "hd" && (file.width || 0) >= 1280) ||
          files.find((file) => (file.width || 0) >= 960) ||
          files[0];
        if (best?.link) {
          videoUrl = best.link;
        }
      }
    }
  } catch {}

  return json({
    query,
    imageUrl,
    gallery: gallery.length ? gallery : [imageUrl],
    videoUrl,
  });
};
