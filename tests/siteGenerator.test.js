import { describe, expect, it } from "vitest";

import {
  renderPreviewHtml,
  resolveStylePackIds,
} from "../functions/siteGenerator.js";

describe("siteGenerator preview rendering", () => {
  it("renders a single hero block and preserves section content", () => {
    const html = renderPreviewHtml({
      siteId: "preview-123",
      css: "",
      layout: {
        title: "Studio Forge",
        headline: "Build faster with a sharper launch system",
        description: "Voice-generated preview",
        heroCaption: "A focused preview experience",
        theme: "ocean",
        layoutType: "tech",
        pages: [
          {
            slug: "home",
            title: "Home",
            sections: [
              {
                title: "Launch plan",
                body: "Clear milestones and shipping workflow.",
                items: ["Plan", "Preview", "Publish"],
              },
            ],
          },
        ],
      },
    });

    expect((html.match(/class="vtw-hero"/g) || []).length).toBe(1);
    expect(html).toContain("Launch plan");
    expect(html).toContain("Plan");
    expect(html).toContain('href="#home"');
  });

  it("keeps default, layout, and requested style packs", () => {
    const stylePackIds = resolveStylePackIds({
      requestedIds: ["glass-ui", "large-type"],
      layoutType: "portfolio",
    });

    expect(stylePackIds).toContain("subtle-motion");
    expect(stylePackIds).toContain("rich-links");
    expect(stylePackIds).toContain("glass-ui");
    expect(stylePackIds).toContain("spacious-density");
    expect(stylePackIds).toContain("large-type");
  });
});
