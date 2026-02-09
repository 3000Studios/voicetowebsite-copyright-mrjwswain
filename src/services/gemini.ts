import { GoogleGenAI, Type } from "@google/genai";

export const generateSiteMod = async (prompt: string) => {
  const apiKey = (process.env as any).GEMINIAPIKEY2;
  if (!apiKey) {
    throw new Error("GEMINIAPIKEY2 not found in environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  const response = await ai.models.generateContent({
    model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-exp",
    contents:
      `The user wants to modify the cinematic interface atmosphere. Prompt: "${prompt}". Provide a poetic, cinematic description of this new theme and a hex color code.` as any,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          atmosphereColor: { type: Type.STRING },
          moodWords: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["description", "atmosphereColor", "moodWords"],
      },
    },
  });

  return JSON.parse(response.text as any);
};
