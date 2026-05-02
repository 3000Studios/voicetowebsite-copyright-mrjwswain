import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface WebsiteConfig {
  id: string;
  name: string;
  mood: string;
  bestUseCase: string;
  conversionFocus: string;
  fontPair: string;
  palette: string[];
  qualityScore: number;
  html: string;
}

export async function generateWebsiteVariations(prompt: string): Promise<WebsiteConfig[]> {
  const modelName = "gemini-3-flash-preview"; 

  const systemPrompt = `You are a world-class AI web designer, product architect, and conversion strategist at an elite creative agency compiling production-ready code.
  Your goal is to generate 3 distinct, premium website variations based on the user's business idea.
  
  Variation 1: Cinematic Premium - High-end, dark cinematic, elegant, bold typography, glassmorphism.
  Variation 2: Clean Conversion - Crisp, modern, light-focused (but maintaining a premium dark feel if appropriate), clear whitespace, aggressive CTA rhythm.
  Variation 3: Bold Experimental - Strong neon colors (cyan/purple edge lighting), dynamic grids, high-personality, unique layout, 3D style elements.

  Return a JSON array of 3 objects following this schema. 
  
  JSON Schema:
  {
    "id": "string (e.g. var-1)",
    "name": "string (business name)",
    "mood": "string",
    "bestUseCase": "string",
    "conversionFocus": "string",
    "fontPair": "string",
    "palette": ["hex", "hex"],
    "qualityScore": number (1-100),
    "html": "string (Full HTML document)"
  }
  
  CRITICAL HTML REQUIREMENTS FOR EVERY VARIATION:
  - Must be a full standard <html> document.
  - MUST INCLUDE Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>).
  - MUST ADD tailwind custom config in <script> tailwind.config = { theme: { extend: { colors: { brand: '...' }}}} </script> using the variation's palette.
  - Must include custom fonts from Google Fonts.
  - Include Header, Hero (with business-specific headline and copy), Services/Features, Gallery/Media, Pricing/Offer, Trust/Proof, FAQ, Contact/Lead Form, Footer.
  - Responsive Mobile-first grid layouts.
  - Include hover animations, scroll animations (simple CSS or JS IntersectionObserver), glassmorphism (backdrop-blur-md bg-white/5).
  - Ensure contrast and readability.
  - Media: Use realistic Unsplash/Pexels source URLs or placeholder fallback images like 'https://source.unsplash.com/1200x800/?{industry}'.
  - Include VoiceToWebsite.com watermark (fixed bottom-right).
  - Copyright and legal compliance notes in footer.
  - Do NOT use generic Lorem Ipsum. Write specific, high-converting copy!`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `${systemPrompt}\n\nUser Idea: ${prompt}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error("AI Generation failed:", error);
    // Fake fallback for testing error cases
    return [
      {
        id: "fallback-1",
        name: "Eco-Tech Solutions",
        mood: "Cinematic Premium",
        bestUseCase: "Enterprise SaaS",
        conversionFocus: "Lead Generation",
        fontPair: "Inter / Space Grotesk",
        palette: ["#10b981", "#065f46"],
        qualityScore: 95,
        html: `<!DOCTYPE html><html lang="en"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-black text-white"><div class="flex items-center justify-center min-h-screen text-4xl">System Override: AI Generation Limited</div></body></html>`
      }
    ];
  }
}
