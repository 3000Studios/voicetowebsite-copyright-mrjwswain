
import { GoogleGenAI, Type } from "@google/genai";

export const generateSiteMod = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user wants to modify the cinematic interface atmosphere. Prompt: "${prompt}". Provide a poetic, cinematic description of this new theme and a hex color code.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          atmosphereColor: { type: Type.STRING },
          moodWords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["description", "atmosphereColor", "moodWords"]
      }
    }
  });

  return JSON.parse(response.text);
};
