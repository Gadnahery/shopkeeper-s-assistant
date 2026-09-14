---
name: terminal-typing-effects
description: Stateful text-animation orchestration, sequential timeline control, character array splitting, dynamic typing, and backspacing effects without layout thrashing. Use when building typewriter effects, kinetic typography, code replay simulations, or animated rotating headlines.
---

# Terminal Typing Effects & Sequential Text Animation

## Overview
This skill governs the stateful orchestration of real-time typing, pausing, and backspacing text animations. It prevents "vibecoded" ad-hoc interval loops that cause desynchronization, memory leaks, and layout jitter.

## Core Rules

### 1. Sequential Character Timelines
- Break dynamic text into character arrays (`string.split("")` or unicode-aware Array.from(string)).
- Model typing as a deterministic state machine:
  - `TYPING`: Incrementing character pointer with natural variance (30ms - 80ms).
  - `PAUSED`: Resting at full sentence length for readability (2000ms - 3500ms).
  - `DELETING`: Accelerated backspacing (15ms - 40ms).
  - `SWITCHING`: Advancing phrase index cleanly with zero race conditions.
- Clean up all timers / `requestAnimationFrame` IDs on unmount or phrase change.

### 2. Cursor Hardware Acceleration
- NEVER animate cursor visibility via JavaScript state or intervals.
- ALWAYS use hardware-accelerated CSS keyframes:
```css
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.typing-cursor {
  display: inline-block;
  animation: cursor-blink 1s ease-in-out infinite;
  will-change: opacity;
}
```

### 3. Integration with Layout Stability
- Always pair with `cls-prevention-layouts`: reserve container space for the longest expected phrase so sibling elements remain perfectly stationary.
