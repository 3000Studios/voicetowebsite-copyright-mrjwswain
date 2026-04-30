import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface Story {
  id?: string;
  title: string;
  content: string;
  author: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  videoUrl: string;
  timestamp: Timestamp;
}

export const TechStoryService = {
  getLatestStory: async (): Promise<Story | null> => {
    try {
      const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Story;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  getAllStories: async (): Promise<Story[]> => {
    try {
      const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  checkAndGenerateStory: async () => {
    const latest = await TechStoryService.getLatestStory();
    const now = Date.now();
    const oneHour = 3600 * 1000;

    if (!latest || (now - latest.timestamp.toMillis() > oneHour)) {
      console.log("Generating new tech story...");
      return await TechStoryService.generateNewStory();
    }
    return latest;
  },

  generateNewStory: async () => {
    try {
      const prompt = `Generate a cutting-edge breakthrough tech story for VoiceToWebsite.com. 
      The story should be about AI, Vocal computing, or digital empires.
      Format the response as a JSON object with:
      title: string (Elite, catchy title)
      content: string (Markdown formatted, heavy SEO content, approx 500 words)
      author: string (Neural Aura)
      seoTitle: string (High ranking title)
      seoDescription: string (Deeply optimized description)
      seoKeywords: string (Comma separated elite tech keywords)
      videoKeyword: string (A keyword to find a background video, e.g. "cyberpunk city", "neural network")
      
      Return ONLY raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const data = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());

      // Use a placeholder video repo
      const videos = [
        "https://assets.mixkit.co/videos/preview/mixkit-abstract-neural-network-animation-9999-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-working-with-digital-tech-interface-31853-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-circuit-board-animation-9998-large.mp4"
      ];
      const videoUrl = videos[Math.floor(Math.random() * videos.length)];

      const docRef = await addDoc(collection(db, 'stories'), {
        ...data,
        videoUrl,
        timestamp: serverTimestamp()
      });

      return { id: docRef.id, ...data, videoUrl, timestamp: Timestamp.now() } as Story;
    } catch (err) {
      console.error("Story generation failed:", err);
      return null;
    }
  }
};
