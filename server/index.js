import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adminSessionRoutes from "./routes/adminSessionRoutes.js";
import commandRoutes from "./routes/commandRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { postStripeWebhook } from "./controllers/publicController.js";
import { bootstrapContent } from "./services/contentService.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const __filename = fileURLToPath(import.meta.url);

app.disable('x-powered-by')
app.set('trust proxy', true)
app.use(
  cors({
    origin: true,
    credentials: true
  }),
)
app.use((request, response, next) => {
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (request.path.startsWith('/api/')) {
    response.setHeader('Cache-Control', 'no-store')
  }
  next()
})
app.post('/api/public/stripe/webhook', express.raw({ type: 'application/json' }), postStripeWebhook)
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_request, response) => {
  await bootstrapContent();
  response.json({
    status: "ok",
    service: "voicetowebsite-platform",
    mode: "local-repo-server",
  });
});

app.use("/api/admin", adminSessionRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", commandRoutes);

app.use((error, _request, response, _next) => {
  void _next;
  response.status(400).json({
    error: error.name || "RequestError",
    message: error.message || "Request failed.",
  });
});

export { app };

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  bootstrapContent()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `voicetowebsite server listening on http://localhost:${PORT}`,
        );
      });
    })
    .catch((error) => {
      console.error("Failed to bootstrap content.", error);
      process.exitCode = 1;
    });
}
