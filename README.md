# VoiceToWebsite

> Speak your idea, get a live website. AI-powered voice-to-web platform.

**voicetowebsite.com** — owned and maintained by **Mr. jwswain** / **3000Studios**

## What it does

VoiceToWebsite converts natural language (spoken or typed) into fully structured, deploy-ready websites. The platform handles content generation, SEO optimization, preview rendering, and production deployment through a single pipeline.

### Core capabilities

- **Website Preview Studio** — Generate a sellable homepage from a brief, inspect it in a scrollable preview, then purchase the source bundle
- **AI command routing** — Structured actions dispatched to content generators, media engines, deploy agents, and model routers
- **Content engine** — JSON-driven pages, blog posts, product listings, and pricing managed through the API
- **Automated deployment** — Git-based pipeline to Cloudflare Pages with R2 storage bindings
- **Admin dashboard** — Analytics, content editing, traffic management, deploy control, and AI console

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Framer Motion 12, Zustand 5 |
| Fonts | Inter (variable), Space Grotesk, JetBrains Mono |
| Backend | Express 5, Node.js 22, Socket.IO 4 |
| AI | OpenAI SDK 6, multi-model routing (Ollama, Anthropic, Gemini, Groq, etc.) |
| Payments | Stripe 20, PayPal |
| Hosting | Cloudflare Pages + Workers, R2 object storage |
| Validation | Zod 3 |
| Linting | ESLint 10, Prettier 3 |

## Quick start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development (frontend + API concurrently)
npm run dev
```

- **Frontend**: http://localhost:5173 (Vite HMR, proxies `/api` to the backend)
- **API server**: http://localhost:3000 (Express with `node --watch`)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + API server concurrently |
| `npm run dev:frontend` | Start Vite dev server only |
| `npm run dev:server` | Start Express API server only |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run test` | Run platform verification |
| `npm run pages:deploy` | Deploy to Cloudflare Pages |
| `npm run scheduler` | Start AI task scheduler |
| `npm run traffic` | Run traffic generation cycle |
| `npm run command` | Execute an AI command |

## Project structure

```
/workspace
├── frontend/          # React SPA (pages, components, styles, assets)
│   ├── pages/         # Route-level page components
│   ├── components/    # Reusable UI components + admin panels
│   ├── styles/        # app.css (global styles + design tokens)
│   ├── src/           # App entry, routing, API clients, state
│   └── public/        # Static assets (SVGs, ads.txt, _redirects)
├── server/            # Express API server
│   ├── routes/        # Admin, public, and command route handlers
│   ├── controllers/   # Request handlers
│   ├── services/      # Content, analytics, preview, payment services
│   ├── middleware/     # Validation middleware
│   └── validation/    # Zod schemas
├── ai/                # AI engine
│   ├── router/        # Command + model routing
│   ├── scheduler/     # Autonomous task scheduler
│   ├── generators/    # Content generation
│   ├── planner/       # AI task planning
│   ├── media/         # Media sourcing engine
│   └── deployment/    # Deploy agent
├── api/               # Legacy API modules (interpreter, patch engine)
├── content/           # JSON content (pages, blog, products, system state)
├── scripts/           # Dev, deploy, and automation scripts
├── worker/            # Cloudflare Worker API proxy
├── admin/             # Admin module READMEs
├── archived/          # Archived legacy files (old dashboard, admin HTML)
└── dist/              # Production build output (gitignored)
```

## Environment variables

Copy `.env.example` to `.env`. Required for basic dev:

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `PORT` | API server port (default: 3000) | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `ADMIN_PASSCODE` | Admin login passcode | Yes (for admin) |

Optional variables for extended features: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`, and others — see `.env.example` for the full list.

## AdSense readiness

The site includes all pages required for Google AdSense approval:

- `/privacy` — Comprehensive privacy policy (cookies, advertising, data rights)
- `/terms` — Full terms of service (IP, acceptable use, billing, governing law)
- `/about` — Detailed about page (mission, technology, team)
- `/contact` — Contact form with multiple channels
- `/legal` — Legal overview bridging privacy and terms
- `ads.txt` — Domain verification file in `frontend/public/`

## Deployment

Production builds deploy to **Cloudflare Pages** via the `main` branch:

```bash
npm run build        # Build to dist/
npm run pages:deploy # Deploy via Wrangler
```

The GitHub Actions workflow at `.github/workflows/production.yml` runs lint → test → build → deploy automatically on push to `main`.

## License

**UNLICENSED** — Proprietary. All rights reserved by Mr. jwswain.
