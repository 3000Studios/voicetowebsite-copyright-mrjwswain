# Firebase Security Specification

## Data Invariants
1. A Site must always have a `html` payload and a valid `ownerId` matching the authenticated user.
2. User token balances can only be decremented by the system (or premium subscriptions).
3. Stories are global and read-only for public users, writable only by admins.
4. Users can only read and write their own profile data.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a site with `ownerId` set to another user.
2. **State Shortcutting**: Attempt to update a terminal state field (if any).
3. **Resource Poisoning**: Attempt to inject a 1MB string into a `title` field.
4. **Token Fraud**: User attempting to increment their own `tokens` field.
5. **PII Leak**: Authenticated user attempting to 'get' another user's email from `/users/`.
6. **Orphaned Site**: Creating a site with no `ownerId`.
7. **Timestamp Tampering**: Sending a `timestamp` from the client that is 10 years in the future.
8. **Shadow Field Injection**: Adding an `isVerified: true` field to a site document to bypass simulated checks.
9. **Admin Escallation**: User attempting to write to `/stories/`.
10. **Bulk Query Scraping**: Attempting to list all sites without filtering by `ownerId`.
11. **ID Junk Injection**: Attempting to use a 2KB long string as a document ID.
12. **Draft Manipulation**: Attempting to flip `isDraft` to `false` on someone else's site.

## The Test Runner (Mock Logic)
Verification of these payloads will be handled by the generated security rules.
All 12 payloads MUST return `PERMISSION_DENIED`.
