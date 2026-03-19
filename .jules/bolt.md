## 2026-03-19 - Parallelize HTML target processing in orchestrator
**Learning:** Redundant `await` calls in loops after a `Promise.all` "prefetch" are a significant performance bottleneck in the orchestrator, especially when processing many targets (e.g., "all pages" commands).
**Action:** Always capture and use the results of `Promise.all` directly instead of re-awaiting the same resources in subsequent loops. Use `forEach` with index tracking to apply transformations to pre-loaded content.
