import jwt from "jsonwebtoken";

const JSON_HEADERS = { "Content-Type": "application/json" };

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const readBody = async (request) => {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const handleLogin = async (request, env) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const body = await readBody(request);
  if (!body) {
    return json(400, { error: "Invalid JSON" });
  }

  const { email, password } = body;
  if (!email || !password) {
    return json(400, { error: "Email and password are required" });
  }

  const store = env.USERS;
  if (!store) {
    return json(500, { error: "USERS KV namespace not configured" });
  }

  const userRecord = await store.get(email);
  if (!userRecord) {
    return json(401, { error: "Invalid credentials" });
  }

  const user = JSON.parse(userRecord);
  const hashedPassword = await hashPassword(password);
  if (hashedPassword !== user.hashedPassword) {
    return json(401, { error: "Invalid credentials" });
  }

  const secret = env.JWT_SECRET;
  if (!secret) {
    return json(500, { error: "JWT secret not configured" });
  }

  const token = jwt.sign({ email: user.email }, secret, { expiresIn: "1d" });
  return json(200, { success: true, token });
};

export default {
  async fetch(request, env, ctx) {
    return handleLogin(request, env, ctx);
  },
};
