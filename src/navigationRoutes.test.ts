import { describe, expect, it } from "vitest";
import { SHARED_NAV_ITEMS } from "./constants/navigation";
import { getPageConfig } from "./data/sitePages";

describe("shared navigation routes", () => {
  it("uses canonical public routes for shared hamburger links", () => {
    const publicRoutes = Object.fromEntries(
      SHARED_NAV_ITEMS.map((item) => [item.label, item.href])
    );

    expect(publicRoutes.Features).toBe("/features");
    expect(publicRoutes.Pricing).toBe("/pricing");
    expect(publicRoutes.Contact).toBe("/contact");
    expect(publicRoutes.Search).toBe("/search");
  });

  it("keeps enhanced route aliases mapped to live content pages", () => {
    expect(getPageConfig("/features-enhanced")?.title).toBe(
      getPageConfig("/features")?.title
    );
    expect(getPageConfig("/pricing-enhanced")?.title).toBe(
      getPageConfig("/pricing")?.title
    );
    expect(getPageConfig("/contact-enhanced")?.title).toBe(
      getPageConfig("/contact")?.title
    );
    expect(getPageConfig("/search-enhanced")?.title).toBe(
      getPageConfig("/search")?.title
    );
  });
});
