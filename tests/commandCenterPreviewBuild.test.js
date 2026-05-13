import { describe, expect, it } from "vitest";
import { handleCommandCenterRequest } from "../functions/commandCenterApi.js";

const parseJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

describe("command-center preview build", () => {
  it("maps non-HTML file updates to a safe site route", async () => {
    const request = new Request("https://example.com/api/preview/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: ["src/App.tsx"] }),
    });
    const response = await handleCommandCenterRequest({
      request,
      env: {},
      url: new URL(request.url),
      assets: null,
    });
    const body = await parseJson(response);
    expect(response.status).toBe(200);
    expect(body.previewRoutes).toContain("/");
    expect(body.previewRoutes).not.toContain("/src/App.tsx");
  });

  it("normalizes preview routes from html files and route inputs", async () => {
    const request = new Request("https://example.com/api/preview/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: ["pricing.html"],
        routes: ["index.html", "/preview/store?shadow=1"],
      }),
    });
    const response = await handleCommandCenterRequest({
      request,
      env: {},
      url: new URL(request.url),
      assets: null,
    });
    const body = await parseJson(response);
    expect(response.status).toBe(200);
    expect(body.previewRoutes).toContain("/");
    expect(body.previewRoutes).toContain("/pricing");
    expect(body.previewRoutes).toContain("/store");
  });
});
