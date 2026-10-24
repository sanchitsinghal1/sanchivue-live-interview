# Sanchivue Brand Guide

## Brand

- **Product name:** Sanchivue
- **Creator:** Sanchit Singhal
- **Tagline:** "Live technical interviews with an AI co-pilot in the room."
- **Positioning:** A premium, developer-grade platform for running live technical interviews, collaborative coding, and AI-assisted assessment — not an autonomous hiring engine.

## Logo assets

| File | Purpose |
|---|---|
| `frontend/src/assets/branding/sanchivue-mark.svg` | Standalone symbol (32×32, scalable). Used as favicon, app icon, sidebar logo, loading mark. |
| `frontend/src/assets/branding/sanchivue-logo.svg` | Horizontal logo = mark + "Sanchivue" wordmark. Used in navbar, auth pages, landing hero, footer. |
| `frontend/public/favicon.svg` | Browser tab favicon (the mark). |

## Symbol meaning

The Sanchivue mark is an abstract **"S" monogram** drawn as a single bold stroke with an indigo→emerald gradient. Two accent **nodes** sit where the curve bends — representing the **interviewer and the candidate**, two minds collaborating on one problem. The interlock conveys collaboration + precision; the gradient ties to the brand palette.

The rounded-square container ensures the mark reads cleanly on **both dark and light backgrounds** (the dark tile always makes the gradient pop).

The symbol is designed to remain recognizable at 16×16 px (favicon) and to render crisply at any size.

## Color palette

| Token | Hex | Usage |
|---|---|---|
| Background (dark) | `#0B0E1A` (oklch 0.16 0.02 264) | App background, IDE surface |
| Card / elevated | `#151826` (oklch 0.19 0.025 264) | Cards, modals, panels |
| Editor chrome | `#0E1019` (oklch 0.15 0.02 264) | Monaco editor background |
| Primary (indigo) | `#6366F1` | Primary buttons, accents, links |
| Accent (emerald) | `#10B981` | Success, live indicators, "Run" |
| Amber | `#F59E0B` | Warnings, medium severity |
| Rose | `#F43F5E` | Destructive, errors, high severity |
| Slate foreground | `#E2E8F0` | Body text on dark |
| Muted | `#94A3B8` | Secondary text |

**Rule:** Indigo + emerald are the primary accents. Blue is **not** used as a primary brand color.

## Typography

- **Sans (UI):** Geist Sans / Inter — clean geometric sans for all UI text.
- **Mono (code):** Geist Mono / JetBrains Mono — for the Monaco editor, room codes, code snippets, and console output.
- **Wordmark:** uses the geometric sans in semibold, lowercase except the capital "S".

## Logo usage rules

- Minimum clear space = the height of the mark on all sides.
- Minimum mark size = 16×16 px (favicon).
- Never recolor the mark except for monochrome contexts (single-color white on dark, single-color slate-900 on light).
- Never stretch, rotate, or add drop shadows to the mark.
- On dark backgrounds use the gradient version; on light backgrounds the monochrome slate-900 version is preferred.

## Voice & tone

- Clear, confident, technical — never gimmicky.
- Describe AI as **assistance**, never as a hiring authority.
- Never invent customers, testimonials, usage stats, security certifications, or performance claims.
- Credit **"Built by Sanchit Singhal"** in the footer and About page; keep it tasteful, not repetitive.

## Application

- **Navbar:** mark + wordmark on dark background (gradient mark).
- **Auth pages:** large wordmark above the form.
- **Landing hero:** mark animates in, wordmark typesets the headline.
- **Dashboard sidebar:** compact mark only.
- **Favicon:** the mark.
- **Footer:** wordmark + "Built by Sanchit Singhal".
- **Loading states:** the mark pulses with the brand gradient.
