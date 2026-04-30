import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Payment Configs
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

const paypalClient = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  ? new paypal.core.PayPalHttpClient(
      new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    )
  : null;

// In-memory store
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

  const { plan } = req.body;
  const isElite = plan === 'elite';
  const amount = isElite ? 4999 : 1999;
  const planName = isElite ? "Empire Elite Build" : "VoiceToWebsite Pro Deployment";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: isElite ? "Unlimited neural builds + white-label access" : "100 neural builds + priority sync",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/pricing`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/create-paypal-order", async (req, res) => {
  if (!paypalClient) {
    return res.status(500).json({ error: "PayPal not configured" });
  }

  const { plan } = req.body;
  const isElite = plan === 'elite';
  const amount = isElite ? "49.99" : "19.99";

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: amount,
        },
        description: isElite ? "Empire Elite Build" : "VoiceToWebsite Pro Deployment",
      },
    ],
  });

  try {
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
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
