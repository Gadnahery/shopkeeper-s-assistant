---
name: antigravity-core-skills
description: Master Engineering & UI Design Skills across Software Architecture, API Contracts, TDD, State Machines, and Fluid Mathematics Layouts.
metadata:
  version: "2.0.0"
---

# Antigravity Agent: Master Engineering & UI Design Skills

## PHASE 1: SOFTWARE ARCHITECTURE & DATA ENGINE

### Skill 1: Requirements & Spec Generation
- Before generating code, you MUST establish a clear design contract.
- Map out edge cases, data lifecycles, and scale considerations.
- If requirements are ambiguous, halt execution and interview the user to clarify design boundaries.

### Skill 2: Architecture & System Design
- Analyze existing codebases for structural health before adding new modules.
- Enforce clean separation of concerns and keep modular components loosely coupled.
- Actively reject code patterns that result in massive, unmaintainable, single-file architectures.

### Skill 3: API & Interface Contract Design
- Always design structured, contract-first APIs using uniform JSON schemas, predictable naming conventions, and proper semantic HTTP status codes.
- Ensure all public and internal interfaces are strictly typed, predictable, and robust.

### Skill 4: Test-Driven Development (TDD) Verification Loop
- Write failing unit/integration tests BEFORE drafting the actual feature implementation code.
- Ensure your code structures are highly testable, eliminating tightly bound global states that break test environments.

---

## PHASE 2: RIGOROUS INTERACTIVE UI & GRAPHICS ENGINE

### Skill 5: Finite State Machine Orchestration
- Model complex user interactions, multi-step components, or asynchronous network requests as a strict, deterministic state machine.
- Explicitly separate UI states (e.g., Idle, Loading, Success, Error) to completely eliminate race conditions and floating invalid UI states.

### Skill 6: Strict Design Token Adherence
- Lock all visual dimensions, spacing systems, and color palettes directly to established design-system theme arrays or JSON token objects.
- NEVER invent arbitrary pixel values or random hexadecimal colors.

### Skill 7: Headless Component Contract & Composition
- Build components utilizing accessible, unstyled core primitives (e.g., Radix, Headless UI) to natively manage complex keyboard interactions, focus traps, and screen-reader accessibility (a11y).
- Layer your premium custom aesthetic styles cleanly over these bulletproof primitives.

---

## PHASE 3: EDITORIAL WIX-LEVEL EXPERIENCE & PHYSICS

### Skill 8: Advanced Layout & Fluid Typography Mathematics
- NEVER use fixed pixel dimensions for responsive, layout-critical components.
- Implement highly adaptive typography and container scales using fluid mathematical CSS expressions (`clamp()`, `calc()`, `minmax()`).
- Leverage CSS Grid architectures and subgrids to construct asymmetrical, overlapping layouts that fluidly scale.

### Skill 9: Scroll-Driven Animation & Timeline Physics
- Orchestrate high-fidelity UI animations directly bound to viewport scroll heights or progress timelines using native Scroll-driven Animation APIs or optimized rendering timelines (e.g., GSAP).
- Ensure animations only tap into hardware-accelerated attributes (`transform`, `opacity`) to eliminate frame drops and rendering lag.

### Skill 10: Layered Depth & Spatial Semantics (Z-Index Hierarchy)
- Maintain total layout control over absolute, relative, and sticky viewport overlapping structures.
- Document and enforce a clean global stacking context map (e.g., Background: 0, Content: 10, Overlays: 20, Sticky Nav: 30, Modals: 100) to entirely eliminate z-index overlap bugs.

### Skill 11: Production Performance Guardrails & Asset Scaling
- Enforce strict Core Web Vital optimization on all visually dense layouts.
- Implement next-gen media extensions (`.webp`, `.avif`), highly responsive layout asset sheets (`srcset`), strict explicit `aspect-ratio` bounds to prevent Cumulative Layout Shifts (CLS), and lazy-loading rules.
