## 2024-02-12 - IntersectionObserver in Testing

**Learning:** JSDOM does not implement `IntersectionObserver`. When using it in components (like
`LazyVideo`), you must mock it in `src/test/setup.ts` or individual tests. **Action:** Ensure
`vi.stubGlobal("IntersectionObserver", MockClass)` is used, where `MockClass` implements the
`IntersectionObserver` interface including `root`, `rootMargin`, and `thresholds` properties, and
methods like `observe`, `disconnect`, `unobserve`, `takeRecords`. Using `vi.fn()` directly as the
constructor without a class wrapper can cause type errors or runtime issues when `new` keyword is
used.

## 2025-02-19 - Missing Tailwind Configuration

**Learning:** The project uses Tailwind utility classes (e.g., `w-48`, `h-48`) in `App.tsx` but
lacks `tailwindcss` dependency and configuration. This results in broken layout (elements defaulting
to browser defaults) in dev/build environments. **Action:** When working on UI in this repo, verify
if utility classes are actually applying styles. For performance tasks, focus on logical structure
and React render cycles rather than visual fidelity if the style system is broken.
