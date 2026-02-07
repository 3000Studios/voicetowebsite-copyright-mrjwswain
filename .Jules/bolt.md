## 2025-02-19 - Missing Tailwind Configuration
**Learning:** The project uses Tailwind utility classes (e.g., `w-48`, `h-48`) in `App.tsx` but lacks `tailwindcss` dependency and configuration. This results in broken layout (elements defaulting to browser defaults) in dev/build environments.
**Action:** When working on UI in this repo, verify if utility classes are actually applying styles. For performance tasks, focus on logical structure and React render cycles rather than visual fidelity if the style system is broken.
