---
name: a11y-live-regions
description: Accessible dynamic content management, ARIA live regions, polite screen-reader announcements, and kinetic text accessibility. Use when building rapidly updating interfaces, typewriter animations, streaming token feeds, and live notifications to prevent screen-reader spam.
---

# Accessible Dynamic Content Management (A11y Live Regions)

## Overview
Rapidly changing, character-by-character animations cause severe accessibility breakdowns if screen readers attempt to announce every keystroke. This skill ensures dynamic kinetic text is completely accessible, semantic, and comfortable for assistive technologies.

## Core Rules

### 1. Hide Fragmented Keyframe Elements from Assistive Tech
- Apply `aria-hidden="true"` to animated spans that type or delete characters incrementally.
- Screen readers should never hear `S... St... Sto... Stop...`.

### 2. Provide Uninterrupted Static Text Alternatives
- Provide an overarching container with `role="text"`, an explicit `aria-label`, or a visually hidden live region (`sr-only`) containing the complete, finalized sentence:
```tsx
<div role="text" aria-label="Stop guessing your profit. Stop bleeding into paper notebooks.">
  <span className="sr-only">Stop guessing your profit. Stop bleeding into paper notebooks.</span>
  <span aria-hidden="true">{displayedText}<span className="typing-cursor">|</span></span>
</div>
```

### 3. ARIA Live Region Etiquette
- When announcing phrase transitions, use `aria-live="polite"` with `aria-atomic="true"`.
- NEVER use `aria-live="assertive"` for marketing headlines or ambient typing loops, which interrupts active user navigation.
