## 2024-05-23 - Focus Indicators for Custom Cursors
**Learning:** When using `cursor-none` to implement a custom cursor (like a robot hand), standard keyboard users completely lose their visual position reference since the custom cursor typically only tracks mouse position.
**Action:** Always enforce strong, high-contrast `focus-visible` styles on interactive elements in `cursor-none` environments to provide a "virtual cursor" for keyboard navigation.

## 2024-05-24 - Nested Interactive Areas
**Learning:** Placing interactive text overlays directly inside interactive cards (e.g., a video background that acts as a link) creates nested focusable areas, confusing screen readers and keyboard navigation.
**Action:** Decouple these into sibling elements within a parent container. Use absolute positioning to visually layer them while keeping the DOM structure flat and sequentially navigable.
