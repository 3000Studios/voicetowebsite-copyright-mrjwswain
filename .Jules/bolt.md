## 2024-02-12 - IntersectionObserver in Testing

**Learning:** JSDOM does not implement `IntersectionObserver`. When using it in components (like `LazyVideo`), you must mock it in `src/test/setup.ts` or individual tests.
**Action:** Ensure `vi.stubGlobal("IntersectionObserver", MockClass)` is used, where `MockClass` implements the `IntersectionObserver` interface including `root`, `rootMargin`, and `thresholds` properties, and methods like `observe`, `disconnect`, `unobserve`, `takeRecords`. Using `vi.fn()` directly as the constructor without a class wrapper can cause type errors or runtime issues when `new` keyword is used.
