export type FeaturedApp = {
  id: string;
  title: string;
  copy: string;
  previewUrl: string;
  cta: string;
};

export const FEATURED_TRY_NOW_APPS: FeaturedApp[] = [
  {
    id: "webforge",
    title: "Webforge",
    copy: "Prompt, upload, and iterate on a real browser-based build studio before you buy a larger launch package.",
    previewUrl: "/webforge.html",
    cta: "Try Webforge now",
  },
  {
    id: "ai-content-generator",
    title: "AI Content Generator",
    copy: "Test article, landing page, and campaign copy generation on a live app preview.",
    previewUrl: "/src/apps/ai-content-generator.html",
    cta: "Try content generation",
  },
  {
    id: "project-planning-hub",
    title: "Project Planning Hub",
    copy: "Open the planning workspace and see how project structure is mapped before the site goes live.",
    previewUrl: "/project-planning-hub.html",
    cta: "Try the planning hub",
  },
];
