import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCode, StylePreferences, ComponentType } from "../types";

let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_API_KEY is not set. AI features will fail.");
      throw new Error("API Key missing");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const analyzeSource = async (
  source: string,
  preferences: StylePreferences,
  componentType: ComponentType,
  customContent: string = "",
  isUrl: boolean = false
): Promise<GeneratedCode> => {
  const prompt = `
    Analyze this ${isUrl ? "website URL" : "website screenshot"}.
    TASK: Forge a professional, store-ready ${componentType === "Full Page" ? "high-converting web page" : componentType}.

    CONTENT REQUIREMENTS:
    1. REPLACEMENT: ${customContent || "N/A: Extract essence from source."}
    2. ADDITION: Include a modern social media sharing bar (Twitter, FB, LinkedIn).

    STYLE PROTOCOL:
    - Theme: Primary ${preferences.primaryColor}, Font ${preferences.fontFamily}, Spacing ${preferences.spacing}.
    - UX: Add subtle entrance animations (fade-in, slide-up) and premium hover states.
    - Performance: Optimized Tailwind usage, minimal DOM depth, efficient CSS.

    ACCESSIBILITY:
    - Full ARIA compliance, semantic HTML5, keyboard accessible.

    TECH: Single-file HTML, CDN Tailwind, Vanilla JS, Lucide icons (via CDN).
    IMPORTANT: Provide the response in JSON format with 'title', 'explanation', and 'html'.
  `;

  const config = {
    model: "gemini-3-pro-preview",
    contents: isUrl
      ? prompt
      : {
          parts: [
            { inlineData: { mimeType: "image/png", data: source.replace(/^data:image\/(png|jpeg|jpg);base64,/, "") } },
            { text: prompt },
          ],
        },
    config: {
      tools: isUrl ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          explanation: { type: Type.STRING },
          html: { type: Type.STRING },
        },
        required: ["title", "explanation", "html"],
      },
    },
  };

  const response = await getAi().models.generateContent(config as any);
  return JSON.parse(response.text!) as GeneratedCode;
};

export const forgeWebsite = async (
  description: string,
  sections: { header: boolean; main: boolean; footer: boolean },
  preferences: StylePreferences
): Promise<GeneratedCode> => {
  const prompt = `
    CREATE A BRAND NEW HIGH-FIDELITY WEB COMPONENT: "${description}".
    SECTIONS: ${Object.entries(sections)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(", ")}.

    STORE-READY FEATURES:
    - Auto-insert high-definition background videos from Pexels/Mixkit.
    - Realistic placeholder content (Copywriting by AI).
    - Full Social Sharing Integration.
    - Advanced Hover/Scroll Animations (Keyframes).
    - Responsive across Mobile/Tablet/Desktop (Tailwind sm/md/lg).
    - Accessibility (ARIA labels, alt text).

    STYLE: Color ${preferences.primaryColor}, Font ${preferences.fontFamily}.
    IMPORTANT: Provide the response in JSON format with 'title', 'explanation', and 'html'.
  `;

  const response = await getAi().models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          explanation: { type: Type.STRING },
          html: { type: Type.STRING },
        },
        required: ["title", "explanation", "html"],
      },
    },
  });
  return JSON.parse(response.text!) as GeneratedCode;
};

export const refineCode = async (currentHtml: string, instructions: string): Promise<GeneratedCode> => {
  const prompt = `
    Refine the following code based on these instructions: "${instructions}"
    Maintain the 100% store-ready quality (Social sharing, animations, accessibility, responsiveness).
    IMPORTANT: Provide the response in JSON format with 'title', 'explanation', and 'html'.
  `;

  const response = await getAi().models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [{ text: currentHtml }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          explanation: { type: Type.STRING },
          html: { type: Type.STRING },
        },
        required: ["title", "explanation", "html"],
      },
    },
  });
  return JSON.parse(response.text!) as GeneratedCode;
};

export const enhanceCode = async (currentHtml: string): Promise<GeneratedCode> => {
  const prompt = `
    AUTO-ENHANCE PROTOCOL (PLATINUM GRADE):
    - Inject high-end animations (framer-motion inspired).
    - Perfect the color balance and typography.
    - Ensure 100% responsiveness and accessibility.
    - Optimize assets and CSS.
    IMPORTANT: Provide the response in JSON format with 'title', 'explanation', and 'html'.
  `;

  const response = await getAi().models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [{ text: currentHtml }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          explanation: { type: Type.STRING },
          html: { type: Type.STRING },
        },
        required: ["title", "explanation", "html"],
      },
    },
  });
  return JSON.parse(response.text!) as GeneratedCode;
};
