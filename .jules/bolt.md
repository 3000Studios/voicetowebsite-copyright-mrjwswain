# Performance Log

## 2025-05-15 - Eliminate N+1 microtask overhead in orchestrator

**Learning:** Processing multiple HTML targets in `functions/orchestrator.js` was using `Promise.all` but discarding its results, leading to redundant and sequential `await loadHtml` calls inside loops. Even with a cache, every `await` adds a microtask to the event loop, which accumulates overhead for large batches of targets.

**Action:** Captured the results of `Promise.all` into an array and utilized them directly within subsequent loops. This optimization was systematically applied across 14 locations in action handlers (e.g., `update_copy`, `update_meta`, `add_page`, `insert_stream`). This ensures that pre-loaded content is used without redundant asynchronous cycles.
