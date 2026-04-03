
## 2025-04-03 - [Fix timing attack vulnerability in ownerKey comparison]
**Vulnerability:** The application compared sensitive authentication secrets (`OWNER_KEY`) against user input using standard string equality operators (`===`). This exposed the endpoints to timing attacks, where an attacker could theoretically guess the key by measuring the response time of the string comparison.
**Learning:** Standard string comparison operators (`===`) fail fast when a character mismatch occurs. They must not be used for comparing secrets, signatures, or tokens.
**Prevention:** Always use constant-time comparison utilities (like the strict type-checked `timingSafeEqual` exported from `functions/adminAuth.js`) for secure string comparisons across the repository.
