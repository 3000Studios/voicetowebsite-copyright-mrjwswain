## 2024-05-23 - Focus Indicators for Custom Cursors
**Learning:** When using `cursor-none` to implement a custom cursor (like a robot hand), standard keyboard users completely lose their visual position reference since the custom cursor typically only tracks mouse position.
**Action:** Always enforce strong, high-contrast `focus-visible` styles on interactive elements in `cursor-none` environments to provide a "virtual cursor" for keyboard navigation.

## 2025-02-18 - Stylized Entry Points
**Learning:** Highly animated "blob" entry points (like the "Ignite Interface") are often implemented as `div`s for visual freedom, completely locking out keyboard users from entering the application.
**Action:** Always verify that the "start" or "enter" interaction of an immersive site is keyboard accessible first, as it's the gatekeeper to the entire experience. Retrofitting `role="button"` and `tabIndex` is safer than changing to `<button>` to preserve complex existing styles/animations.
