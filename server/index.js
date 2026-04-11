import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import commandRoutes from "./routes/commandRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { bootstrapContent } from "./services/contentService.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const __filename = fileURLToPath(import.meta.url);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_request, response) => {
  await bootstrapContent();
  response.json({
    status: "ok",
    service: "voicetowebsite-platform",
    mode: "local-repo-server",
  });
});

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
