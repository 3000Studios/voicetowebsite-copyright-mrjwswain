import { NavigationLink } from "./types";

export const BACKGROUND_TUNNEL = "https://pub-6293369f8afa4d849c26002fd232f5ac.r2.dev/looping%20tunnel.mp4";
export const INTRO_SONG = "https://media.voicetowebsite.com/Intro%20funk.mp3";

export const NAV_LINKS: NavigationLink[] = [
  {
    id: "demo",
    label: "WATCH DEMO",
    videoUrl: "https://media.voicetowebsite.com/homenavigation.mp4",
    description: "60-second explainer + interactive funnel.",
    themeColor: "rgba(56, 189, 248, 0.5)",
    url: "/demo#video",
  },
  {
    id: "voice",
    label: "TRY VOICE",
    videoUrl: "https://media.voicetowebsite.com/livenavigation.mp4",
    description: "Speak or type commands and preview in seconds.",
    themeColor: "rgba(34, 211, 238, 0.5)",
    url: "/demo",
  },
  {
    id: "real",
    label: "REAL BUILDS",
    videoUrl: "https://media.voicetowebsite.com/adminnavigation.mp4",
    description: "Case videos, replays, and SEO pages.",
    themeColor: "rgba(148, 163, 184, 0.5)",
    url: "/blog#cases",
  },
  {
    id: "pricing",
    label: "PRICING",
    videoUrl: "https://media.voicetowebsite.com/storenavigation.mp4",
    description: "Free to Enterprise, with yearly savings.",
    themeColor: "rgba(245, 158, 11, 0.5)",
    url: "/pricing",
  },
  {
    id: "appstore",
    label: "APP STORE",
    videoUrl: "https://media.voicetowebsite.com/appstore.mp4",
    description: "Templates, integrations, and automation kits.",
    themeColor: "rgba(34, 197, 94, 0.5)",
    url: "/appstore",
  },
];

export const INTRO_VIDEO = "https://cdn.pixabay.com/video/2024/02/10/199890-911494511_tiny.mp4";
