import { motion } from "motion/react";
import { CheckCircle2, ClipboardCheck, DollarSign, Gauge, GitBranch, Search, ShieldCheck, Target } from "lucide-react";

const variables = [
  "Project name, live domain, repository, branch, owner, and business objective",
  "Stack, package manager, hosting provider, CI/CD path, storage, auth, and runtime services",
  "Target audience, primary conversion action, brand voice, offer, pricing, and trust assets",
  "Monetization model: ads, affiliate, lead generation, subscription, digital product, sponsorship, or hybrid",
  "Analytics, attribution, privacy, consent, support, monitoring, and rollback requirements",
];

const promptSections = [
  {
    icon: Target,
    title: "Discovery",
    copy: "Detect the stack, map routes, services, secrets, data flows, user journeys, revenue paths, and unfinished work before changing code.",
  },
  {
    icon: ClipboardCheck,
    title: "Evidence Gates",
    copy: "Keep a pass/fail checklist with command output, screenshots, URLs, logs, deployed artifacts, and unresolved risks for every claim.",
  },
  {
    icon: Search,
    title: "Traffic Engine",
    copy: "Verify metadata, crawlable links, canonical URLs, robots rules, XML sitemaps, schema, internal links, image alt text, and content clusters.",
  },
  {
    icon: DollarSign,
    title: "Revenue System",
    copy: "Choose the strongest monetization path, wire conversion tracking, validate checkout or lead flows, and keep required policy pages aligned.",
  },
  {
    icon: Gauge,
    title: "Performance",
    copy: "Set budgets, optimize assets, validate Core Web Vitals signals, caching, lazy loading, health checks, and post-deploy smoke tests.",
  },
  {
    icon: ShieldCheck,
    title: "Trust Layer",
    copy: "Check security headers, secret handling, auth/session behavior, input validation, abuse controls, privacy notices, and consent needs.",
  },
  {
    icon: GitBranch,
    title: "Release Control",
    copy: "Use main as production, commit verified changes, push, deploy, tag or note release evidence, and confirm the live custom domain.",
  },
];

const verificationMatrix = [
  ["Stack and environment", "Package manager, build scripts, runtime, env vars, deployment target, branch, and domains documented from real files or provider state."],
  ["Quality gates", "Install, lint/typecheck, build, unit/integration/E2E where available, dependency audit, and secret scan pass or have documented exceptions."],
  ["UX and conversion", "Primary CTA, mobile flows, forms, error states, trust signals, accessibility labels, keyboard use, and responsive screenshots verified."],
  ["SEO and content", "Titles, descriptions, headings, canonical URLs, robots.txt, sitemap, schema, image alt text, internal links, and index pages verified."],
  ["Monetization", "Revenue pages, checkout or lead capture, ads.txt when needed, affiliate disclosure, event tracking, and compliance pages tested together."],
  ["Security and privacy", "Headers, auth rules, server validation, secret storage, cookie/consent behavior, privacy policy, terms, and abuse controls reviewed."],
  ["Observability", "Analytics events, conversion goals, logs, health endpoint, error reporting, uptime check, and alert ownership verified or explicitly scoped."],
  ["Deployment", "Production build deployed from main, custom domain checked, critical routes smoke-tested, rollback path identified, release evidence captured."],
];

const masterPrompt = `You are the production wrap-up agent for this project. Take the project from its current unknown or partially finished state to a verified, live, scalable, monetization-ready production system.

Inputs:
- Project: {{PROJECT_NAME}}
- Live domain: {{LIVE_DOMAIN}}
- Repository: {{REPOSITORY}}
- Production branch: main
- Target audience: {{TARGET_AUDIENCE}}
- Primary conversion: {{PRIMARY_CONVERSION}}
- Monetization model: {{MONETIZATION_MODEL}}
- Analytics stack: {{ANALYTICS_STACK}}
- Hosting/deployment target: {{DEPLOYMENT_TARGET}}

Operating rules:
1. Start by pulling latest main, confirming the workspace path, reading repository docs, detecting the stack, and inventorying routes, services, secrets, data flows, and public-facing unfinished states.
2. Maintain a live checklist with Verified, Failed, Blocked, and Not Applicable states. Do not mark anything complete without proof.
3. Fix production blockers directly. Ask the user only when a missing private secret, account permission, legal approval, or payment decision cannot be inferred safely.
4. No dummy data, broken routes, fake metrics, placeholder assets, or claims that cannot be verified on the live site.
5. Use free-to-use tools and infrastructure where possible, and document any paid dependency before using it.
6. Keep main as the production branch. Commit, push, deploy, and verify the live custom domain after successful changes.

Execution sequence:
1. Discovery: identify stack, package manager, hosting provider, CI/CD path, env vars, content sources, database/storage, auth, payments, analytics, DNS, and all public routes.
2. Codebase remediation: remove or hide unfinished public features, fix broken links and forms, validate server endpoints, protect secrets, and align UI with the brand and business goal.
3. Quality gates: run install, typecheck/lint, build, tests that exist, smoke tests, dependency/security checks, and route checks. Capture command results.
4. UX and conversion: validate mobile and desktop layouts, primary CTA flow, pricing or lead flow, trust signals, form friction, error states, accessibility basics, and readable content hierarchy.
5. SEO and acquisition: verify title tags, meta descriptions, canonical URLs, robots.txt, sitemap.xml, crawlable internal links, structured data where relevant, image alt text, chronological content indexes, and content cluster opportunities.
6. Monetization: choose and validate the correct revenue path. Confirm ad readiness, affiliate disclosure, lead capture consent, checkout/payment links, email capture, pricing clarity, conversion events, and policy pages.
7. Performance and resilience: optimize assets, lazy loading, cache headers, code splitting where practical, health checks, logging, error visibility, uptime checks, rollback path, and post-deploy smoke tests.
8. Security and privacy: verify headers, auth/session behavior, server-side validation, webhook verification, secret storage, dependency risks, data collection disclosures, cookie/consent requirements, and abuse controls.
9. Deploy: commit changes to main, push, deploy to production, verify the custom domain rather than a preview domain, test critical routes, and confirm analytics or logs show the release.
10. Completion bundle: report the live URL, commit hash, deployment identifier, verified routes, test commands, remaining risks, rollback path, and next growth actions.

Definition of done:
The work is done only when the production custom domain reflects the latest main branch, critical user and revenue flows work, quality gates pass or have explicit justified exceptions, SEO and monetization foundations are verified, and evidence exists for each completion claim.`;

const tightPrompt = `Wrap this project to production. Pull latest main, detect the stack, inventory routes/services/env vars, fix blockers, remove placeholders, run quality gates, verify UX, SEO, monetization, performance, security, analytics, and deployment. Commit to main, push, deploy to the live custom domain, smoke-test critical routes, and return evidence: commit, deployment URL, live domain checks, test output, verified revenue/lead flow, rollback path, and unresolved risks. Do not claim done without proof.`;

export const UniversalDeploymentPrompt = () => (
  <div className="pt-36 pb-24 px-6 lg:px-12 min-h-screen">
    <section className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-brand-cyan">
            Production Governance
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic leading-none tracking-tight">
            Universal deployment-ready wrap-up prompt.
          </h1>
          <p className="max-w-3xl text-lg md:text-xl text-white/55 leading-relaxed">
            A stack-agnostic operating prompt that forces real launch evidence, growth readiness, revenue instrumentation, release control, and live production verification.
          </p>
        </motion.div>

        <div className="glass-premium rounded-[2rem] p-8 border-brand-purple/20">
          <h2 className="text-xl font-black italic mb-5">Completion Standard</h2>
          <p className="text-sm leading-relaxed text-white/55">
            Done means the latest main branch is live on the custom production domain, critical routes and revenue flows are tested, SEO and monetization foundations are verified, and every claim has evidence.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {["No placeholders", "Live domain", "Proof required", "Revenue ready"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-white/70">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {promptSections.map((section) => (
          <article key={section.title} className="glass rounded-2xl p-6 hover:border-brand-cyan/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.12)] transition-all">
            <section.icon className="h-7 w-7 text-brand-cyan mb-5" />
            <h3 className="font-black italic mb-3">{section.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{section.copy}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="glass rounded-[2rem] p-7">
          <h2 className="text-2xl font-black italic mb-6">Variable Block</h2>
          <div className="space-y-4">
            {variables.map((item) => (
              <div key={item} className="flex gap-3 text-sm text-white/55 leading-relaxed">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-purple shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-[2rem] p-7">
          <h2 className="text-2xl font-black italic mb-6">Tight Execution Variant</h2>
          <p className="rounded-2xl bg-black/45 border border-white/10 p-5 font-mono text-xs leading-relaxed text-white/65 whitespace-pre-wrap">
            {tightPrompt}
          </p>
        </section>
      </div>

      <section className="mt-16 glass-premium rounded-[2rem] p-7 md:p-10">
        <h2 className="text-3xl font-black italic mb-8">Verification Matrix</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {verificationMatrix.map(([gate, proof]) => (
            <div key={gate} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <h3 className="font-black text-brand-cyan mb-2">{gate}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{proof}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 glass rounded-[2rem] p-7 md:p-10">
        <h2 className="text-3xl font-black italic mb-6">Master Prompt</h2>
        <pre className="max-h-[720px] overflow-auto rounded-2xl border border-white/10 bg-black/55 p-6 font-mono text-xs leading-relaxed text-white/70 whitespace-pre-wrap">
          {masterPrompt}
        </pre>
      </section>
    </section>
  </div>
);
