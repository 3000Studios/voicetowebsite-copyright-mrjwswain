## 2024-05-23 - Focus Indicators for Custom Cursors
**Learning:** When using `cursor-none` to implement a custom cursor (like a robot hand), standard keyboard users completely lose their visual position reference since the custom cursor typically only tracks mouse position.
**Action:** Always enforce strong, high-contrast `focus-visible` styles on interactive elements in `cursor-none` environments to provide a "virtual cursor" for keyboard navigation.
