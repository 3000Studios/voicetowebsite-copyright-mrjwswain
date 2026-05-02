import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
}) : null;

async function generatePayPalAccessToken() {
  const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET).toString("base64");
  const base = process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const data = await response.json();
  return data.access_token;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", brand: "VoiceToWebsite.com" });
  });

  app.get("/api/media", async (req, res) => {
    try {
      const query = req.query.q as string || "technology";
      const media = {
         query,
         imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200", 
         gallery: [
           "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"
         ],
         videoUrl: "",
         sources: ["unsplash"]
      };

      if (process.env.UNSPLASH_API_KEY) {
         try {
            const uRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${process.env.UNSPLASH_API_KEY}&per_page=3`);
            const uData = await uRes.json();
            if (uData.results && uData.results.length > 0) {
               media.imageUrl = uData.results[0].urls.regular;
               media.gallery = uData.results.map((r: any) => r.urls.regular);
               media.sources.push("unsplash");
            }
         } catch (e) {
            console.error("Unsplash error", e);
         }
      }

      if (process.env.PEXELS_API_KEY) {
         try {
             const pRes = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1`, {
                 headers: { Authorization: process.env.PEXELS_API_KEY }
             });
             const pData = await pRes.json();
             if (pData.videos && pData.videos.length > 0 && pData.videos[0].video_files.length > 0) {
                 const hdVideo = pData.videos[0].video_files.find((v: any) => v.quality === "hd") || pData.videos[0].video_files[0];
                 if (hdVideo) {
                    media.videoUrl = hdVideo.link;
                    media.sources.push("pexels");
                 }
             }
         } catch (e) {
             console.error("Pexels error", e);
         }
      }

      res.json(media);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Media fetch failed" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!stripe) {
         return res.status(500).json({ error: "Stripe is not configured." });
      }

      const { planId, returnUrl } = req.body;
      
      let priceId = "";
      if (planId === "starter") priceId = process.env.STRIPE_PRICE_STARTER_MONTH || "";
      else if (planId === "pro") priceId = process.env.STRIPE_PRICE_PRO_MONTH || "";
      else if (planId === "ultimate") priceId = process.env.STRIPE_PRICE_ULTIMATE_MONTH || "";
      else if (planId === "commands") priceId = process.env.STRIPE_PRICE_COMMANDS || "";

      if (!priceId) {
         const dummyPrices: Record<string, number> = {
            starter: 999,
            pro: 1999,
            ultimate: 4999,
            commands: 299
         };
         
         const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
               {
                  price_data: {
                     currency: "usd",
                     product_data: { name: `${planId.toUpperCase()} Plan` },
                     unit_amount: dummyPrices[planId] || 999,
                     recurring: planId !== "commands" ? { interval: "month" } : undefined
                  },
                  quantity: 1,
               },
            ],
            mode: planId === "commands" ? "payment" : "subscription",
            success_url: `${returnUrl || process.env.APP_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl || process.env.APP_URL || "http://localhost:3000"}/pricing`,
         });
         
         return res.json({ url: session.url });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: planId === "commands" ? "payment" : "subscription",
        success_url: `${returnUrl || process.env.APP_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || process.env.APP_URL || "http://localhost:3000"}/pricing`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-paypal-order", async (req, res) => {
     try {
       const { planId } = req.body;
       const dummyPrices: Record<string, string> = {
          starter: "9.99",
          pro: "19.99",
          ultimate: "49.99",
          commands: "2.99"
       };
       const amount = dummyPrices[planId] || "9.99";

       if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
          return res.status(500).json({ error: "PayPal is not configured." });
       }

       const accessToken = await generatePayPalAccessToken();
       const base = process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
       
       const response = await fetch(`${base}/v2/checkout/orders`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${accessToken}`,
         },
         body: JSON.stringify({
           intent: "CAPTURE",
           purchase_units: [
             {
               amount: { currency_code: "USD", value: amount },
             },
           ],
           application_context: {
              return_url: `${process.env.APP_URL || "http://localhost:3000"}/success`,
              cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/pricing`
           }
         }),
       });

       const data = await response.json();
       if (data.links) {
          const approveLink = data.links.find((link: any) => link.rel === "approve");
          return res.json({ url: approveLink?.href });
       }
       res.status(500).json({ error: "Could not create PayPal order" });
     } catch (err: any) {
       console.error(err);
       res.status(500).json({ error: err.message });
     }
  });

  // Placeholder for Adsense support
  app.get("/ads.txt", (req, res) => {
    res.send("google.com, pub-replace-me, DIRECT, f08c47fec0942fa0");
  });

  app.get("/sitemap.xml", (req, res) => {
    res.header("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://voicetowebsite.com/</loc></url>
  <url><loc>https://voicetowebsite.com/pricing</loc></url>
  <url><loc>https://voicetowebsite.com/examples</loc></url>
</urlset>`);
  });

  app.get("/robots.txt", (req, res) => {
    res.header("Content-Type", "text/plain");
    res.send("User-agent: *\nAllow: /\nSitemap: https://voicetowebsite.com/sitemap.xml");
  });

  // Vite middleware for development
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
