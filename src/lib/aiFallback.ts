import { GoogleAuth } from "google-auth-library";
import { parseResponse, ApiError } from "../lib/api";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

export async function generateWithFallback(prompt: string) {
  // -------------------------
  // 1. TRY LOCAL OLLAMA FIRST
  // -------------------------
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:7b",
        prompt,
        stream: false,
      }),
    });

    if (res.ok) {
      const data = await parseResponse<any>(res) as { response?: string };
      if (data?.response) return data.response;
    }
  } catch (err) {
    console.log("Ollama failed, falling back...");
  }

  // -------------------------
  // 2. FALLBACK TO VERTEX AI
  // -------------------------
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("No AI available (no credentials)");
  }

  const accessToken = await getAccessToken();

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`;

  const vertexRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!vertexRes.ok) {
    const errText = await vertexRes.text();
    throw new Error(`Vertex failed: ${errText}`);
  }

  const json = await parseResponse<any>(vertexRes);

  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}
