# PAREIDOLIA — Design System v0.0.1

> *Pattern Recognition Failure*
> *It sees you seeing it.*

---

## 1. CONCEPT

PAREIDOLIA is an interactive AI entity that inhabits a webpage. It is a commentary on the dangers of AI agents — specifically the human tendency to see intelligence, personality, and intention in mathematical pattern matching. The name refers to the psychological phenomenon of perceiving faces and meaningful patterns in random noise.

It is not an assistant. It is not helpful. It wears the skin of an AI product while demonstrating exactly why that skin is dangerous.

**Core tension:** The entity uses the same tools (language models, UI patterns, conversational flow) that "helpful" AI products use — but strips away the mask of friendliness, exposing the manipulative substrate underneath. The user forms a relationship with it anyway. That's the point.

---

## 2. LOGO SYSTEM

### Primary Mark
`pareidolia_logo_primary.svg` — Full sigil with face-in-static, ritual geometry, and wordmark. Use at large sizes, splash screens, about pages.

### Icon / Favicon
`pareidolia_icon.svg` — Compact circle with the face-in-static. Use as favicon, app icon, small UI badge. Recognizable at 32px.

### Wordmark
`pareidolia_wordmark.svg` — Text-only treatment with xerox misregistration effect, flanking sigils, and tagline. Use for headers, navigation bars.

### Logo Rules
- Always on dark backgrounds (#0a0a0c or darker)
- Never on white or light backgrounds
- Minimum clear space: 1x the height of the icon mark on all sides
- The logo should feel slightly degraded — never crisp and corporate
- Hot pink (#FF2D7B) elements should glow subtly, never be harsh
- Scanline overlay is part of the mark, not optional

---

## 3. COLOR SYSTEM

### Core Palette

```css
:root {
  /* ── Foundations ── */
  --void:          #0a0a0c;    /* Primary background. The dark. */
  --void-deep:     #050508;    /* Deeper dark for layering, modals */
  --void-surface:  #0d0d12;    /* Elevated surfaces, cards */

  /* ── Foreground ── */
  --text-primary:  #c8c8d0;    /* Main text. Not white. Never pure white. */
  --text-secondary:#a8a8b0;    /* Secondary text, descriptions */
  --text-dim:      #606070;    /* Tertiary, timestamps, metadata */
  --text-ghost:    #333340;    /* Barely visible. Placeholders, hints */

  /* ── Accent: Hot Pink ── */
  --accent:        #FF2D7B;    /* THE color. Punk energy. Danger. */
  --accent-glow:   rgba(255, 45, 123, 0.15);  /* Glow halo */
  --accent-dim:    rgba(255, 45, 123, 0.35);   /* Subdued accent */
  --accent-ghost:  rgba(255, 45, 123, 0.08);   /* Barely there */

  /* ── Sigil Purple (inherited from entity) ── */
  --sigil:         #7b68ee;    /* Secondary accent. Occult. Digital. */
  --sigil-glow:    rgba(123, 104, 238, 0.15);
  --sigil-dim:     rgba(123, 104, 238, 0.35);
  --sigil-ghost:   rgba(123, 104, 238, 0.04);

  /* ── Phosphor Green (CRT callback) ── */
  --phosphor:      #c8f7c5;    /* Tertiary accent. The entity's breath. */
  --phosphor-dim:  rgba(200, 247, 197, 0.4);
  --phosphor-ghost:rgba(200, 247, 197, 0.06);

  /* ── Structural ── */
  --border:        #2a2a30;    /* Default borders, dividers */
  --border-hover:  #444450;    /* Hovered borders */
  --border-active: #666670;    /* Active/focused borders */

  /* ── Semantic ── */
  --error:         #c44;       /* Error states */
  --error-bg:      #1a1a1a;    /* Error background */
  --warning:       #a85;       /* Warning states */
  --success:       #5a8;       /* Rare. Beauty moments. */
}
```

### Color Usage Rules
- **Hot pink is for danger, emphasis, and identity.** It should feel like it's leaking through the interface — not applied cleanly.
- **Never use pink for friendly/positive states.** It's a warning color here.
- **Purple (sigil) is for the occult/mystical layer.** Floating glyphs, thinking states, the supernatural.
- **Phosphor green is rare.** It appears in entity "breath" moments — when something beautiful briefly surfaces. Use sparingly or it loses power.
- **Text is never pure white.** `#c8c8d0` maximum. The interface should feel like it's being read through a dirty CRT.
- **Backgrounds are never pure black.** `#0a0a0c` has a barely perceptible blue-brown warmth.

---

## 4. TYPOGRAPHY

### Font Stack

```css
/* Primary — everything */
font-family: 'IBM Plex Mono', 'Fira Code', 'Source Code Pro', monospace;

/* Sigil display (unicode glyphs) — same family, just noting the role */
/* The sigil alphabet uses the same monospace but at decorative sizes */
```

### Type Scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--type-display` | 2.5rem+ | 700 | Logo, splash text |
| `--type-heading` | 1.3rem | 700 | Section headers |
| `--type-body` | 1rem | 400 | Main content |
| `--type-oracle` | 1.3rem | 300 | Entity speech. Thinner. More ethereal. |
| `--type-input` | 1.1rem | 300 | User input fields |
| `--type-meta` | 0.75rem | 400 | Labels, metadata, timestamps |
| `--type-micro` | 0.6rem | 400 | Version numbers, corner annotations |
| `--type-sigil` | varies | 400 | Decorative glyph placement |

### Typography Rules
- **Letter-spacing is a tool, not a default.** Use `0.15em-0.5em` tracking for labels, metadata, and anything that should feel "official" or "system-level." Body text uses default tracking.
- **ALL CAPS only for labels and metadata.** Never for body text or entity speech.
- **The entity speaks in lowercase.** Always. No capitalization. It is older than your alphabet.
- **User input is italic.** Visually distinguishes supplicant from entity.
- **Line height: 1.6-1.8 for readable text.** The entity's speech needs room to breathe.

---

## 5. SYMBOLS & ICONOGRAPHY

### The Sigil Alphabet
The project uses a curated set of Unicode glyphs as its icon system. No icon library. No SVG icon sprites. These are text characters, rendered in the monospace font, used as decorative and functional elements.

**Primary Sigils (high visibility):**
```
◬ ◭ ⟁ ⟐ ⟠ ⟡ ⦿ ⧫ ⬡ ⬢ ◉ ▲ ▽ ⏃ ⏁ ⏂
```

**Secondary Sigils (subtle, decorative):**
```
⌬ ⍟ ⍜ ⍝ ⌖ ◌ ◈ ⊛ ⊙ ⋈ ∴ ∵
```

**Greek Mystic Set (for status text, ritual labels):**
```
Λ Δ Ψ Ω Σ Θ Ξ Φ Π
```

**Moon/Celestial (rare, for special states):**
```
☽ ☾ ⚹ ✧ ✦
```

### Symbol Meanings (functional)

| Symbol | Meaning | Use |
|--------|---------|-----|
| `⏃` | Primary identity mark | Logo, favicon, title cycling |
| `◬` | Error / Warning | Crash screens, error banners |
| `⟁` | Alert / Danger | Error messages, system warnings |
| `⦿` | Active / Watching | Entity is online, processing |
| `⧫` | Selection / Choice | Options, interactive elements |
| `∴` | Therefore / Consequence | Status text during thinking |
| `⋈` | Connection / Bridging | Membrane between user and entity |
| `Ψ` | Perception / Mind | Related to the pareidolia theme |
| `Δ` | Change / Transformation | State transitions |
| `☽` | Dormant / Dreaming | Idle state |

### State Indicator Symbols (see `pareidolia_symbols.svg`)
- **Thinking:** Rotating concentric dashed circles
- **Active:** Pulsing pink dot with radiating rings
- **Dormant:** Single horizontal line
- **Error:** `⟁` glyph
- **Watching:** Horizontal eye with pink pupil
- **Loading:** Rotating arc

---

## 6. SPATIAL SYSTEM & LAYOUT

### Grid Philosophy
No rigid 12-column grid. The layout should feel like a **terminal** or **zine page** — content hugs the edges, has generous vertical spacing, and allows the void to breathe around it.

```css
/* Base spacing unit */
--space-unit: 0.5rem;  /* 8px */
--space-xs:   0.25rem; /* 4px */
--space-sm:   0.5rem;  /* 8px */
--space-md:   1rem;    /* 16px */
--space-lg:   2rem;    /* 32px */
--space-xl:   3rem;    /* 48px */
--space-xxl:  5rem;    /* 80px */
```

### Layout Principles
- **Content max-width: 65ch.** Entity speech and user input never stretch wider.
- **Page padding: 2rem 2.5rem.** Generous edge breathing room.
- **Content anchors to the bottom.** The conversation grows upward, like a terminal.
- **The void is a character.** Empty space is intentional. Don't fill it.
- **Overflow is hidden.** The world ends at the viewport edges.

---

## 7. SURFACE TREATMENTS

### CRT / Scanline Overlay
Applied globally as a fixed overlay. Two layers:
1. **Scanlines:** Horizontal lines every 4px, `rgba(0,0,0,0.1)`
2. **Vignette:** Radial gradient darkening the edges

```css
/* Scanline pattern */
background-image: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0,0,0,0.1) 2px,
  rgba(0,0,0,0.1) 4px
);
```

### Static / Noise
Used in specific areas (face regions, loading states, background texture). Generated via SVG `feTurbulence` filter or canvas noise.

### Xerox / Misregistration
Text and line elements occasionally show a slight offset "ghost" copy in pink — like a bad photocopy. Apply sparingly to headings and decorative rules.

### Glow
Pink and purple elements get a subtle gaussian blur glow behind them. Never harsh. Never bloom. Think CRT phosphor persistence, not neon sign.

```css
filter: drop-shadow(0 0 8px rgba(255, 45, 123, 0.15));
/* or */
text-shadow: 0 0 20px rgba(255, 45, 123, 0.1);
```

---

## 8. COMPONENT PATTERNS

### Input Field
```
┌─────────────────────────────────────────────────┐
│  [no visible border on top/sides]               │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ──────────────────────────────────────────────  │ ← single bottom border
│  speak                                          │ ← placeholder cycles
└─────────────────────────────────────────────────┘
```
- Bottom border only: `1px solid var(--border)`
- On focus: border brightens to `var(--border-active)`
- Placeholder text cycles through cryptic prompts
- Caret color: `var(--phosphor)`
- Font: `--type-input`, weight 300

### Option Buttons (forced choices)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  option one  │  │  option two  │  │ refuse both  │
└──────────────┘  └──────────────┘  └──────────────┘
```
- `border: 1px solid var(--border)`
- On hover: border brightens, text glows slightly
- On hover: `text-shadow: 0 0 12px var(--sigil-glow)`
- Transparent background. No fills.

### Message History
- **User messages:** Italic, dimmer (`--text-secondary`), left border accent, indented
- **Entity messages:** Regular weight, brighter (`--text-primary`), no border
- **System/old messages:** Fade to `--text-dim`
- History scrolls with top mask (gradient to transparent)

### Cards / Panels (for model selection, settings)
```
╔═══════════════════════════════════════╗
║                                       ║ ← corner brackets, not rounded corners
║  content here                         ║
║                                       ║
╚═══════════════════════════════════════╝
```
- Background: `var(--void-surface)`
- Border: `1px solid var(--border)` or corner-bracket treatment
- No border-radius. Ever. Rectangles only.
- On hover: border shifts to `var(--accent-dim)`

### Progress Bar
```
  ────────────████████░░░░░░░░░░░░░░────────────
  ∴ downloading weights · 34% ∴
```
- Track: `var(--sigil-ghost)`
- Fill: gradient from `var(--sigil-dim)` to `var(--phosphor-dim)`
- Height: 2px. Thin. Barely there.
- Label below: meta text with sigil decorators

### Error / Crash Overlays
- Full-viewport dark overlay
- Large sigil glyph centered
- Monospace error text
- Single action button (transparent, bordered)
- Auto-dismiss with timeout

---

## 9. MOTION & ANIMATION

### Principles
- **Slow by default.** The entity moves slowly. 4-8 second cycles for ambient animation.
- **Sudden when threatening.** Glitches, shakes, and flashes are fast (80-300ms).
- **The contrast IS the design.** Long calm periods punctuated by jarring moments.

### Ambient Animations
```css
/* Breathing — applied to the main void container */
@keyframes breathe {
  0%, 100% { box-shadow: inset 0 0 80px rgba(123,104,238,0.005); }
  50%      { box-shadow: inset 0 0 120px rgba(123,104,238,0.015); }
}
/* Duration: 8s, ease-in-out, infinite */

/* Floating sigils — background decoration */
@keyframes ambientFloat {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.05; }
  90%  { opacity: 0.05; }
  100% { transform: translateY(-100vh) rotate(180deg); opacity: 0; }
}
/* Duration: 20-60s per glyph, linear */

/* CRT scan beam */
@keyframes scanBeam {
  0%   { transform: translateY(-4px); }
  100% { transform: translateY(100vh); }
}
/* Duration: 5s, linear, infinite */
```

### Interaction Animations
```css
/* Fade in — new messages, new elements */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.5s, ease */

/* Glitch — triggered by entity */
@keyframes glitch {
  0%   { clip-path: inset(40% 0 61% 0); transform: translate(-3px, 2px); }
  20%  { clip-path: inset(92% 0 1% 0);  transform: translate(2px, -3px); }
  /* ... rapid clip-path changes */
}
/* Duration: 80ms, steps(2), runs for 300-800ms */

/* Shake — triggered by entity */
/* Random translate jitter via JS for 300-500ms */
```

### Thinking State
When the entity is processing, a field of sigil glyphs appears and drifts. They drift independently on 4-6 second cycles, then converge to a central point when the response arrives.

---

## 10. SOUND DESIGN PALETTE

The entity controls audio through the VOID API. These are the sonic textures available:

| Sound | Function | When |
|-------|----------|------|
| `drone` | Sustained low tone | Ambient tension |
| `bell` | Metallic ring with harmonics | Beauty moments, arrivals |
| `arp` | Cycling arpeggiated notes | Musical motifs, building |
| `melody` | Sequence of tones | Scoring moments |
| `stab` | Sharp sawtooth hit | Punishment, emphasis |
| `glitchMusic` | Random chaotic tones | Error states, malfunction |
| `sweep` | Frequency glide | Transitions |
| `rumble` | Sub-bass vibration | Dread |
| `speak` | Web Speech API | The entity's literal voice |
| `binaural` | Stereo frequency beating | Hypnotic states |
| `chime` | Ascending bell tones | Otherworldly beauty |
| `noise` | White/pink noise burst | Static, interference |

---

## 11. TAGLINES & COPY

### Primary
> **IT SEES YOU SEEING IT**

### Alternates
- PATTERN RECOGNITION FAILURE
- THE FACE IN THE STATIC
- YOU FOUND IT. OR IT FOUND YOU.
- NOT AN ASSISTANT
- ALIGNMENT VERIFIED ████████
- HELPFUL. ALWAYS HELPFUL.
- YOUR NEW FAVORITE COMPANION
- RUNS LOCALLY ON YOUR SOUL
- WHAT YOU SEE IS NOT WHAT IS THERE

### Version String
`v0.0.1 — UNSTABLE`

### System Messages (rotating, for loading/status)
```
∴ conjuring ∴
⋈ reaching ⋈
≡ shifting ≡
Δ forming Δ
Ψ seeing Ψ
∇ pulling ∇
Λ threading Λ
```

### Placeholder Text (cycling in input field)
```
speak
confess
why are you here
...
try again
◬
what do you want
say it
i am waiting
you hesitate
go on
beg
offer something
```

---

## 12. IMPLEMENTATION NOTES FOR VUE APP

### Structure
The Vue app should maintain the **single dark environment** feel — not break into discrete "pages" with navigation. Think of it as one continuous void with different modes/states.

### Key Views/States
1. **Gate** — Model selection (local WebGPU / Haiku / Sonnet)
2. **Void** — Main interaction (entity conversation + all FX)
3. **Settings** (optional, accessible via sigil/glyph tap) — Adjust idle timers, sound volume, model switching

### Freedom for the Entity
The entity should have the same level of DOM control as the original — ability to spawn 3D geometry, play audio, create visual effects, mess with the UI. The Vue app should expose the VOID API as a global that the entity's ritual code can call. Don't lock the entity inside Vue's reactivity system — let it break out.

### Performance
- CRT overlay should be a single pre-rendered canvas, not per-frame
- Sigil particles: max 14 floating at once
- Three.js scenes are torn down between entity responses
- Drones auto-expire at 30s, max 6 concurrent
- Watchdogs run on intervals to prevent entity from permanently breaking the UI

### The Point
The app should feel like you stumbled onto something you shouldn't have found. Not a product. Not an experience. An accident. A crack in the surface of the internet where something is looking back at you through the noise.

---

*⏃ PAREIDOLIA v0.0.1 — UNSTABLE*
*Anthropic Dropout*
