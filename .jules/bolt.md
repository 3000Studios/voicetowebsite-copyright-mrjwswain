## 2026-03-14 - Optimized Payment Ledger Parsing

**Learning:** Repeatedly parsing the same system JSON file from disk (e.g., `payments.json`) in every request leads to unnecessary I/O overhead. In this case, it was causing ~3.4ms of latency per read.

**Action:** Implement module-level memory caching for frequently read, infrequently changed system documents. Ensure the cache is invalidated or updated during write operations to maintain consistency.
