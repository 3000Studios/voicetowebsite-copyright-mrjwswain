# Skill: React UI and Shared Navigation

## Use when

- Editing `src/` React components.
- Changing top-level app navigation/menu UX.
- Aligning React nav with static shell nav.

## Rules

- Shared nav entries belong in `src/constants/navigation.ts`.
- Keep menu keyboard behavior and Escape/outside-click handling intact.
- If nav list grows, ensure container has usable scrolling and max height.

## Suggested checks

- `npm run test -- src/App.a11y.test.tsx src/App.perf.test.tsx`
- `npm run type-check`
- Manual UI check for menu visibility and click-through routes.

## Exit criteria

- Menu remains accessible and functional on typical viewport sizes.
- React and static nav surfaces do not diverge on core public/admin entry links.
