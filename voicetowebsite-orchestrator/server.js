const express = require("express");
const { execSync } = require("child_process");

const app = express();
app.use(express.json());

const REPO_PATH = "C:/WorkSpaces/voicetowebsite-copyright-mrjwswain";
const AUTH_TOKEN = process.env.ORCH_TOKEN;

function run(cmd) {
  return execSync(cmd, {
    cwd: REPO_PATH,
    encoding: "utf-8",
    stdio: "pipe",
  });
}

app.post("/execute", (req, res) => {
  const token = req.headers["x-orch-token"];
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { intent, action } = req.body;

  try {
    let output;

    if (action === "verify") {
      output = run("npm run verify");
    } else if (action === "deploy") {
      output = run("npm run deploy");
    } else if (action === "auto-ship") {
      output = run("npm run auto:ship");
    } else {
      throw new Error("Unknown action: " + action);
    }

    res.json({ success: true, intent, action, output });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

app.listen(3333, () => {
  console.log("✅ Orchestrator running on http://localhost:3333");
});
