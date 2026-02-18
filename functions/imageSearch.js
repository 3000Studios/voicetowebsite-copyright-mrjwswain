/**
 * Image Search & Discovery API Endpoint
 * Handles /api/image-search for Custom GPT voice commands
 * Integrates with ImageDiscoverySystem
 */

import { ImageDiscoverySystem } from "../src/utils/imageDiscovery.js";
import { logError, logImage } from "../src/utils/vaultLogger.js";

export async function handleImageSearchRequest(request, env) {
  const { method } = request;

  // Only POST allowed
  if (method !== "POST" && method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    // Parse request
    let payload;
    if (method === "POST") {
      payload = await request
        .clone()
        .json()
        .catch(() => ({}));
    } else {
      // GET: ?q=search&target=hero
      const url = new URL(request.url);
      payload = {
        query: url.searchParams.get("q"),
        target: url.searchParams.get("target") || "hero",
        type: url.searchParams.get("type") || "image",
      };
    }

    // Validate
    if (!payload.query) {
      return jsonResponse(400, { error: "Missing query parameter" });
    }

    const discoverySystem = new ImageDiscoverySystem(env);

    // Route by type
    if (payload.type === "video") {
      return await handleVideoSearch(discoverySystem, payload, env);
    }

    // Default: image search
    return await handleImageSearch(discoverySystem, payload, env);
  } catch (err) {
    console.error("[API] Image search error:", err);
    await logError(env, {
      category: "image-search",
      message: err.message,
      endpoint: "/api/image-search",
      method: request.method,
    });

    return jsonResponse(500, { error: err.message });
  }
}

async function handleImageSearch(discoverySystem, payload, env) {
  const { query, target, altText } = payload;

  try {
    // Search and inject
    const result = await discoverySystem.findAndInjectImage({
      query,
      target: `css:${target}`, // Inject as CSS background by default
      altText: altText || query,
      width: 1200,
      height: 600,
    });

    // Log to vault
    await logImage(env, {
      action: "download-inject",
      source: "api",
      url: result.url,
      status: "success",
      searchQuery: query,
      injectedInto: target,
      altText: result.altText,
    });

    return jsonResponse(200, {
      success: true,
      query,
      imageUrl: result.url,
      target,
      message: `Image injected into ${target}`,
    });
  } catch (err) {
    await logImage(env, {
      action: "download-inject",
      source: "api",
      status: "failed",
      searchQuery: query,
      error: err.message,
    });

    return jsonResponse(500, {
      error: err.message,
      query,
    });
  }
}

async function handleVideoSearch(discoverySystem, payload, env) {
  const { query, target } = payload;

  // For now, return video embed instructions
  // In production, would validate URL and generate embed code

  let videoUrl = query;
  let embedCode = "";
  let provider = "unknown";

  // Detect provider
  if (query.includes("youtube.com") || query.includes("youtu.be")) {
    provider = "youtube";
    const videoId = extractYouTubeId(query);
    embedCode = `<iframe width="100%" height="600" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
  } else if (query.includes("vimeo.com")) {
    provider = "vimeo";
    const videoId = extractVimeoId(query);
    embedCode = `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="600" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>`;
  } else if (
    query.includes("mp4") ||
    query.includes("webm") ||
    query.includes("video")
  ) {
    provider = "html5";
    embedCode = `<video width="100%" height="600" controls><source src="${query}" type="video/mp4">Your browser does not support the video tag.</video>`;
  }

  await logImage(env, {
    action: "video-embed",
    source: "api",
    url: videoUrl,
    status: "success",
    injectedInto: target,
    searchQuery: query,
  });

  return jsonResponse(200, {
    success: true,
    query,
    provider,
    embedCode,
    target,
    message: `Video embed code generated for ${provider}`,
  });
}

function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : "";
}

function extractVimeoId(url) {
  const regex = /vimeo\.com\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : "";
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
