import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BlogPage from "./BlogPage";

describe("BlogPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads runtime blog content and shows the structured footer archive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              heroTitle: "Runtime Blog",
              heroSubtitle: "Fresh content from runtime JSON.",
              generatedAt: "2026-03-10T09:00:00.000Z",
              refreshHours: 3,
              posts: [
                {
                  id: "runtime-post",
                  slug: "runtime-post",
                  title: "Runtime loaded post",
                  excerpt: "This post came from the runtime config feed.",
                  date: "2026-03-10T09:00:00.000Z",
                  readTime: "5 min read",
                  imageUrl:
                    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
                  imageAlt: "Runtime blog cover",
                  tags: ["runtime", "blog"],
                  url: "/blog#runtime-post",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
      )
    );

    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Runtime Blog")).toBeInTheDocument();
    expect(screen.getAllByText("Runtime loaded post")).toHaveLength(2);
    expect(screen.getByText(/Refreshes every 3 hours/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(
          "Every extra page now has one organized place to live."
        )
      ).toBeInTheDocument();
    });
  });
});
