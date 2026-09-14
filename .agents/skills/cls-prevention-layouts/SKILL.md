---
name: cls-prevention-layouts
description: Cumulative Layout Shift (CLS) prevention, width/height budgeting, invisible ghost element anchors, and fluid layout reservation for dynamic text, streaming responses, and responsive components. Use whenever content changes dimensions dynamically to ensure sibling elements remain completely stationary.
---

# CLS Prevention Layouts & Width/Height Budgeting

## Overview
This skill enforces mathematical space reservation and layout anchoring so that changing content length never causes Cumulative Layout Shift (CLS), visual jank, or jumping sibling elements.

## Core Rules

### 1. Zero Cumulative Layout Shift (CLS = 0)
- When text strings delete and retype dynamically, the vertical and horizontal space required by the largest sentence MUST be permanently reserved.
- NEVER allow changing string lengths to alter the bounding box of parent containers.

### 2. Dual-Layer Ghost Element Pattern (Recommended)
Place the longest phrase (or the entire set of phrases) in an invisible, zero-opacity DOM layer within an intrinsic CSS grid stack, so the parent automatically sizes to the maximum bounds:
```tsx
<div className="grid grid-cols-1 grid-rows-1 items-start">
  {/* Layer 1 (Invisible Ghost): Forces container to maximum height */}
  <span className="invisible select-none pointer-events-none opacity-0 col-start-1 row-start-1" aria-hidden="true">
    Stop guessing your profit. Stop bleeding into paper notebooks.
  </span>
  {/* Layer 2 (Active Typed Text): Renders dynamically inside the reserved bounds */}
  <span className="col-start-1 row-start-1" aria-hidden="true">
    {currentTypedText}
    <span className="typing-cursor">|</span>
  </span>
</div>
```

### 3. Explicit Baseline Minimum Heights
- When ghosting is impractical, compute the exact `min-height` using the fluid clamp formula of the typography:
  `min-height: calc(clamp(...) * line-height * max-lines)`
- Never rely on content flow alone for dynamic headlines.
