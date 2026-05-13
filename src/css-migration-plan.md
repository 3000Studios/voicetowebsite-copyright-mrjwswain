/\*\*

- CSS Architecture Realignment Implementation Plan
-
- Migration from monolithic design-system.css + layout-system.css
- to performance-budgeted, revenue-optimized, WAF-safe modular architecture \*/

// ============================================================================ // MIGRATION PHASE
1: CRITICAL CSS EXTRACTION //
============================================================================

## Phase 1.1: Critical Path Analysis

- Run Lighthouse performance audit on current site
- Identify above-the-fold critical CSS
- Extract critical styles to new `critical.css` (< 25KB gzipped)

## Phase 1.2: Critical CSS Structure

```css
/* critical.css - Inline in <head> */
:root {
  /* Essential color tokens only */
  --color-primary: #00f2ff;
  --color-text: #f8fbff;
  --color-bg: #020408;
}

/* Critical layout only */
.vt-page {
  min-height: 100vh;
  background: var(--color-bg);
}
.vt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Critical navigation */
.vt-nav {
  position: fixed;
  top: 0;
  z-index: 100;
}
.vt-nav-link {
  color: var(--color-text);
  text-decoration: none;
}

/* Critical revenue components */
.vt-cta {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: #000;
  border-radius: 2rem;
}
```

## Phase 1.3: Implementation Steps

1. Create `src/critical.css` with extracted styles
2. Update build pipeline to inline critical CSS
3. Add critical CSS budget validation (< 25KB gzipped)
4. Test performance improvement

// ============================================================================ // MIGRATION PHASE
2: MODULAR COMPONENT SYSTEM //
============================================================================

## Phase 2.1: Component Chunk Strategy

Split current 892 lines into focused modules:

- `components/navigation.css` (~15KB) - Navigation and header
- `components/revenue.css` (~20KB) - CTA, pricing, checkout
- `components/admin.css` (~20KB) - Admin dashboard
- `components/store.css` (~15KB) - Product grid and cards
- `components/live.css` (~15KB) - Streaming interface
- `components/forms.css` (~10KB) - Input and form styling

## Phase 2.2: Dynamic Loading Strategy

```javascript
// Route-based CSS loading
const cssModules = {
  "/admin": () => import("./components/admin.css"),
  "/store": () => import("./components/store.css"),
  "/livestream": () => import("./components/live.css"),
  "/pricing": () => import("./components/revenue.css"),
};

// Load CSS based on current route
function loadRouteCSS(route) {
  if (cssModules[route]) {
    cssModules[route]();
  }
}
```

## Phase 2.3: Implementation Steps

1. Create component-specific CSS files
2. Implement dynamic CSS loading in main.js
3. Add code-splitting configuration to Vite
4. Test chunk loading performance

// ============================================================================ // MIGRATION PHASE
3: CANARY BRANCH SEPARATION //
============================================================================

## Phase 3.1: Feature Flag System

```css
/* Canary-controlled variants */
:root {
  --canary-revenue-layout: var(--env-canary-revenue-layout, "control");
  --canary-cta-variants: var(--env-canary-cta-variants, "control");
}

/* Apply variants based on environment */
.canary-revenue-layout-high-density .vt-cta {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.canary-revenue-layout-minimal .vt-cta {
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
}
```

## Phase 3.2: Environment Variable Integration

```javascript
// wrangler.toml
[env.production.vars];
CANARY_REVENUE_LAYOUT = "high-density";
CANARY_CTA_VARIANTS = "gradient"[env.staging.vars];
CANARY_REVENUE_LAYOUT = "control";
CANARY_CTA_VARIANTS = "control";
```

## Phase 3.3: Implementation Steps

1. Add canary CSS classes to revenue components
2. Configure environment variables in wrangler.toml
3. Update build pipeline to inject env vars as CSS custom properties
4. Set up A/B testing analytics

// ============================================================================ // MIGRATION PHASE
4: REVENUE OPTIMIZATION //
============================================================================

## Phase 4.1: Conversion-Focused Layout Variants

```css
/* Revenue layout variants */
.revenue-layout-cta-dominant .vt-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.revenue-layout-donation-heavy .vt-donation-section {
  order: -1;
  margin-bottom: 3rem;
}

.revenue-layout-sponsor-focus .vt-sponsor-banner {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
}
```

## Phase 4.2: CTA Optimization System

```css
/* CTA density controls */
.revenue-density-standard .vt-ad-slot {
  max-width: 300px;
}
.revenue-density-high .vt-ad-slot {
  max-width: 400px;
}

/* Conversion funnel optimization */
.vt-checkout-steps {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.vt-checkout-step {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.vt-checkout-step.active {
  background: #00f2ff;
  color: #000;
}
```

## Phase 4.3: Implementation Steps

1. Create revenue layout variant classes
2. Implement CTA density controls
3. Add conversion funnel optimization
4. Set up revenue analytics tracking

// ============================================================================ // MIGRATION PHASE
5: WAF-COMPATIBLE MINIMAL PAYLOAD //
============================================================================

## Phase 5.1: Safe Selector Patterns

```css
/* WAF-safe selectors only */
.vt-button {
  /* Safe */
}
.vt-modal {
  /* Safe */
}
.vt-nav-link {
  /* Safe */
}

/* Avoid these patterns */
.vt-button:nth-child(2n) {
  /* Unsafe - complex pseudo-selector */
}
.vt-button:not(.disabled) {
  /* Unsafe - :not() selector */
}
.vt-button[data-attribute="value"][data-other="value"] {
  /* Unsafe - complex attributes */
}
```

## Phase 5.2: Payload Optimization

```css
/* Minimal, efficient styles */
.vt-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
}

/* Instead of nested, complex selectors */
.vt-card .vt-card-title .vt-card-title-text {
  /* Bad */
}
.vt-card-title-text {
  /* Good */
}
```

## Phase 5.3: Implementation Steps

1. Audit current selectors for WAF compatibility
2. Refactor complex selectors to simple patterns
3. Implement CSS purging for unused styles
4. Add WAF compatibility validation to build pipeline

// ============================================================================ // MIGRATION PHASE
6: PERFORMANCE MONITORING //
============================================================================

## Phase 6.1: Budget Tracking System

```javascript
// CSS Budget Monitor
class CSSBudgetMonitor {
  constructor() {
    this.criticalBudget = 25 * 1024; // 25KB gzipped
    this.totalBudget = 150 * 1024; // 150KB total
  }

  trackCriticalCSS(size) {
    if (size > this.criticalBudget) {
      console.warn("Critical CSS budget exceeded:", size);
      this.showBudgetWarning("critical", size);
    }
  }

  trackTotalCSS(size) {
    if (size > this.totalBudget) {
      console.error("Total CSS budget exceeded:", size);
      this.showBudgetWarning("total", size);
    }
  }

  showBudgetWarning(type, size) {
    const indicator = document.createElement("div");
    indicator.className = "vt-budget-warning";
    indicator.textContent = `${type} CSS budget exceeded: ${Math.round(size / 1024)}KB`;
    document.body.appendChild(indicator);
  }
}
```

## Phase 6.2: Performance Metrics

```css
/* Visual budget indicators */
.vt-budget-tracker {
  position: fixed;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #00f2ff;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.8rem;
  z-index: 10000;
}

.vt-budget-warning {
  color: #f59e0b;
}
.vt-budget-error {
  color: #ef4444;
}
```

## Phase 6.3: Implementation Steps

1. Implement CSS budget monitoring in build pipeline
2. Add visual budget indicators during development
3. Set up performance regression alerts
4. Create automated budget enforcement

// ============================================================================ // MIGRATION
TIMELINE // ============================================================================

## Week 1: Critical CSS Extraction

- Day 1-2: Audit current CSS and identify critical path
- Day 3-4: Extract and optimize critical CSS
- Day 5: Implement critical CSS inlining and budget validation

## Week 2: Modular Component System

- Day 1-3: Split CSS into component modules
- Day 4-5: Implement dynamic loading and code splitting

## Week 3: Canary Branch & Revenue Optimization

- Day 1-2: Implement feature flag system
- Day 3-4: Create revenue layout variants
- Day 5: Set up A/B testing and analytics

## Week 4: WAF Compatibility & Performance Monitoring

- Day 1-2: Refactor selectors for WAF compatibility
- Day 3-4: Implement performance monitoring
- Day 5: Final testing and deployment

// ============================================================================ // SUCCESS METRICS
// ============================================================================

## Performance Targets

- Critical CSS: < 25KB gzipped, < 100ms load time on 3G
- Total CSS: < 150KB, < 500ms load time per chunk
- Lighthouse score: 95+ performance
- Conversion rate: 5%+ improvement with revenue variants

## Quality Targets

- WAF compatibility: 100% safe selectors
- Code coverage: 90%+ CSS usage
- Bundle size: 30% reduction from current 892 lines
- Build time: < 2 minutes for full CSS pipeline

## Revenue Targets

- CTA conversion: 10%+ improvement with optimized variants
- Ad revenue: 15%+ improvement with density optimization
- Checkout flow: 20% reduction in abandonment rate
- Overall revenue: 25%+ improvement with combined optimizations

// ============================================================================ // RISK MITIGATION
// ============================================================================

## Technical Risks

- **CSS Regression**: Implement comprehensive testing suite
- **Performance Regression**: Automated budget enforcement
- **Feature Flag Issues**: Staged rollout with rollback capability

## Business Risks

- **Revenue Impact**: A/B test all changes before full rollout
- **User Experience**: Monitor Core Web Vitals during migration
- **SEO Impact**: Ensure critical CSS maintains above-the-fold rendering

## Mitigation Strategies

- Gradual rollout with canary deployments
- Real-time monitoring and alerting
- Automated rollback triggers
- Comprehensive testing at each phase
