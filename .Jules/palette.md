## 2024-05-23 - Focus Indicators for Custom Cursors

**Learning:** When using `cursor-none` to implement a custom cursor (like a robot hand), standard
keyboard users completely lose their visual position reference since the custom cursor typically
only tracks mouse position. **Action:** Always enforce strong, high-contrast `focus-visible` styles
on interactive elements in `cursor-none` environments to provide a "virtual cursor" for keyboard
navigation.

## 2024-05-24 - Nested Interactive Areas

**Learning:** Placing interactive text overlays directly inside interactive cards (e.g., a video
background that acts as a link) creates nested focusable areas, confusing screen readers and
keyboard navigation. **Action:** Decouple these into sibling elements within a parent container. Use
absolute positioning to visually layer them while keeping the DOM structure flat and sequentially
navigable.

**Learning:** Highly animated "blob" entry points (like the "Ignite Interface") are often
implemented as `div`s for visual freedom, completely locking out keyboard users from entering the
application. **Action:** Always verify that the "start" or "enter" interaction of an immersive site
is keyboard accessible first, as it's the gatekeeper to the entire experience. Retrofitting
`role="button"` and `tabIndex` is safer than changing to `<button>` to preserve complex existing
styles/animations.

## 2025-02-19 - Custom Modals Missing Accessibility

**Learning:** The custom `Checkout` modal was implemented as a simple `div` with a `fixed` position,
completely missing `role="dialog"`, `aria-modal`, and focus management. **Action:** Any new custom
modal or overlay must immediately be assigned `role="dialog"` and `aria-modal="true"`, and key
inputs inside must be explicitly labeled.

## 2026-02-12 - "Instant" Actions Require Immediate Feedback

**Learning:** When a feature is labeled "Instant" (e.g., "Run instant demo"), users expect immediate
responsiveness. A delay without feedback breaks the promise of the label and leads to frustration or
re-clicks. **Action:** Ensure that any action labeled "Instant" provides immediate visual feedback
(like a loading state or button text change) on click, bridging the gap between the user's
expectation of speed and the actual processing time.
