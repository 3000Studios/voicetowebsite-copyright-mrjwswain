# VoiceToWebsite Agent Governance

## Mandatory Project Law

Before making changes, agents must read and follow `VOICETOWEBSITE_GENERATOR_LAW.md`.

That file is the controlling source of truth for VoiceToWebsite.com product direction, repo identity, branch policy, Cloudflare Wrangler deployment, domain limits, generator quality standards, local/free generation requirements, monetization, SEO, accessibility, preview watermarking, logo/brand-kit/dashboard behavior, and final never/always rules.

If any instruction conflicts with `VOICETOWEBSITE_GENERATOR_LAW.md`, stop and resolve the conflict before editing or deploying.

## Production Standard

Every change in this repository is production-first. Work must result in real, working, user-visible outcomes with no dummy features, broken routes, placeholder assets, unfinished public experiences, or fake completion claims.

Agents must be execution-first and keep user effort near zero. Use CLI, PowerShell, automation, free-to-use tools, and existing project infrastructure whenever possible before asking the user for help.

## Startup Checklist

At the beginning of each project or session:

1. Review the project scope, intended outcome, brand direction, business goals, and existing requirements.
2. Confirm the project exists under `C:\Workspaces`; create `C:\Workspaces` if missing.
3. Verify the current workspace, folders, branch, remotes, and active files.
4. Pull the latest code from `main`.
5. Confirm there is exactly one production branch: `main`.
6. Inspect environment needs through `C:\Users\Servi\.config\env\global.env`.
7. Optimize local tooling and project configuration for production output.
8. Review relevant existing code before making any edits in any environment.
9. Treat Cloudflare Wrangler as the deployment path for every production change.

## Version Control and Deployment

- `main` is the live production branch.
- All production deploys must go through Cloudflare Wrangler commands, preferably `npm run deploy` or `npm run deploy:prod`.
- Every commit or push for production work must result in a live production deployment.
- Successful changes must be tested, committed, pushed, deployed with Wrangler, and verified by the agent on `https://voicetowebsite.com`.
- Pushes to `main` should trigger production deployment, but automated deploys do not replace manual Wrangler deployment when the user asks the agent to ship work.
- Pages preview URLs are useful for diagnostics only. Never tell the user a change is live based only on a `*.pages.dev` preview URL.
- Deployments must publish to the live custom production domain `https://voicetowebsite.com`, not a development domain.
- Before saying a change is live, the agent must verify the custom domain homepage, relevant production routes/API endpoints, and visible UI/UX behavior on `https://voicetowebsite.com`.

## Communication Format

Use minimal progress updates:

- `Working on [2-3 word task]`
- `Done with [one sentence description]`
- `Change has been made and deployed live to [custom domain]`

Provide extra technical explanation only when requested or when progress is blocked.

## Content and Publishing

- Stories and blogs must be original, transformed, copyright-safe, and brand-aligned.
- Required attribution, citations, license notices, and rights metadata must be retained.
- Maintain a chronological, numbered, labeled index for stories/blogs.
- Add new content to indexes automatically.
- Use open, free-to-use, or properly licensed video and media assets.

## Monetization

- Keep the site ready for business growth, ads, affiliate revenue, lead capture, subscriptions, or direct sales where applicable.
- Include `ads.txt` and ad platform prerequisites when required.
- Validate revenue-critical pages, policy pages, checkout or lead flows, analytics, and attribution together.
- Present concrete revenue implementation plans when new opportunities fit the project.

## Environment, DNS, and Configuration

- Check routes, links, DNS records, environment variables, and production settings.
- Use `C:\Users\Servi\.config\env\global.env` for global environment values.
- Populate non-secret values when they can be determined safely.
- Ask only for missing secrets or account-specific values that cannot be determined independently.

## Design and UX

- Layouts must be responsive across viewports.
- Navigation must use shared global structure and consistent styling.
- Header, main background, and footer should support responsive 3D design layers without obstructing content.
- Buttons must visibly react on hover.
- Cards must include perimeter glow or lighting effects on hover.
- Empty visual cards must use branded animated gradients rather than blank placeholders.
- Motion and background art must never reduce readability, usability, accessibility, or performance.

## Performance, Accessibility, SEO

- Optimize for fast load times and efficient rendering.
- Every page must have SEO-ready metadata, semantic structure, crawlable content, image alt text where relevant, and accessible interactions.
- Validate robots, sitemap, canonical URLs, internal links, schema where relevant, and indexability.
- Design enhancements must not harm usability, performance, or accessibility.

## Data Integrity

- No dummy data in production.
- No broken links, fake empty states, or placeholder media in public production views.
- Hide unavailable features until they are real.
- Everything presented must work as described.

## Chatbot and Lead Generation

- Lead capture must include compliant notice, consent, privacy language, and jurisdiction-appropriate controls.
- Chatbots must be site-aware, brand-aligned, safe, useful, and built from approved content.
- Voice output, if enabled, should be natural and configurable.

## Completion Standard

A task is complete only when the change is tested, committed, pushed, deployed to the live production domain, and verified with evidence.
