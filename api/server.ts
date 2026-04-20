import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

// In-memory store for stories, messages, and appointments
let stories: any[] = [
  {
    id: "1",
    title: "The Future of Voice",
    topic: "AI Innovation",
    heroVideoDescription: "futuristic city",
    storyContent: "Voice technology is revolutionizing how we interact with the digital world..."
  }
];
let messages: any[] = [];
let appointments: any[] = [];
let sites: any[] = [];
let users: any[] = [
  { email: "admin@voicetowebsite.com", key: "ADMIN-123", role: "admin" },
  { email: "test@test.com", key: "KEY-123", role: "user" }
];

app.use(express.json());

// API Routes
app.get("/api/stories", (req, res) => {
  res.json(stories);
});

app.post("/api/stories", (req, res) => {
  const { title, topic, heroVideoDescription, storyContent } = req.body;
  const newStory = {
    id: String(stories.length + 1),
    title,
    topic,
    heroVideoDescription,
    storyContent,
    timestamp: new Date().toISOString()
  };
  stories.unshift(newStory);
  res.json({ success: true, story: newStory });
});

app.post("/api/sites", (req, res) => {
  const { html, username, isDraft } = req.body;
  const id = isDraft ? `draft-${Date.now()}` : username;
  const newSite = { id, html, username, isDraft, timestamp: new Date().toISOString() };
  sites.push(newSite);
  res.json({ success: true, url: `/${id}` });
});

app.get("/api/sites/:id", (req, res) => {
  const site = sites.find(s => s.id === req.params.id);
  if (site) {
    res.json(site);
  } else {
    res.status(404).json({ error: "Site not found" });
  }
});

app.get("/api/admin/sites", (req, res) => {
  res.json(sites);
});

app.post("/api/generate-website", async (req, res) => {
  res.status(410).json({ error: "API moved to client-side. Please use the frontend generator." });
});

app.post("/api/messages", (req, res) => {
  const { name, email, message } = req.body;
  const newMessage = { id: Date.now(), name, email, message, timestamp: new Date().toISOString() };
  messages.push(newMessage);
  console.log(`New message from ${name}: ${message}. Forwarding to 404-640-7734...`);
  res.json({ success: true });
});

app.get("/api/admin/messages", (req, res) => {
  res.json(messages);
});

app.post("/api/appointments", (req, res) => {
  const { name, email, date, time } = req.body;
  const newAppointment = { id: Date.now(), name, email, date, time, timestamp: new Date().toISOString() };
  appointments.push(newAppointment);
  res.json({ success: true });
});

app.get("/api/admin/appointments", (req, res) => {
  res.json(appointments);
});

app.post("/api/login", (req, res) => {
  const { email, key } = req.body;
  const user = users.find(u => u.email === email && u.key === key);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ error: "Invalid email or subscription key" });
  }
});

app.get("/api/admin/stats", (req, res) => {
  res.json({
    totalUsers: users.length,
    totalMessages: messages.length,
    totalAppointments: appointments.length,
    totalStories: stories.length,
    totalSites: sites.length,
    revenue: users.length * 19.99,
    activeSessions: Math.floor(Math.random() * 50) + 10,
    dailyGenerations: sites.filter(s => {
      const today = new Date().toISOString().split('T')[0];
      return s.timestamp.startsWith(today);
    }).length
  });
});

app.post("/api/admin/generate-story", async (req, res) => {
  res.json({ success: true, message: "Story generation moved to client-side." });
});

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "VoiceToWebsite Pro Deployment",
              description: "Deploy your award-winning website to our global edge network",
            },
            unit_amount: 1999, // $19.99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?success=true`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/store`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
