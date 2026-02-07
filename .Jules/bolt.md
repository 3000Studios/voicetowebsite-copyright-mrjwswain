## 2024-05-23 - Avoiding Layout Thrashing in Animation Loops
**Learning:** `getComputedStyle` and DOM property reads (like `clientWidth`) force the browser to recalculate styles and layout. Doing this inside a `requestAnimationFrame` loop (60fps) causes significant performance degradation ("layout thrashing").
**Action:** Move style and layout reads outside the animation loop. Use observers (`MutationObserver`, `ResizeObserver`) to detect changes and update cached values. Only use the cached values inside the `draw` loop.
