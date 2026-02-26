# Skill: Targeted Testing Strategy

## Use when

- Implementing focused bugfixes or route/auth changes.
- You need high-signal test coverage without running entire repo suites.

## Approach

1. Identify exactly which behavior changed.
2. Run the smallest relevant test suites first.
3. Add or update tests only where behavior changed.
4. Use manual browser validation for UI/auth flows.

## Typical command patterns

- Worker route/auth tests:
  - `npm run test -- tests/adminSecurityAndUiRoutes.test.js`
- React app behavior tests:
  - `npm run test -- src/App.a11y.test.tsx src/App.perf.test.tsx`
- Type safety for TS changes:
  - `npm run type-check`

## Exit criteria

- Tests executed map directly to modified behavior.
- Results demonstrate changed code paths are exercised.
