# Design System: RetailFlow / SHOP-ERP

## 1. Visual Theme & Atmosphere
RetailFlow is a high-density, mission-critical ERP engineered for Indian retail and wholesale trade. The interface balances **Cockpit Density (7/10)** for high-speed POS, billing, and tax audits with **Offset Asymmetric rhythm (6/10)** and **Fluid Spring-Physics motion (6/10)**.

The atmosphere is clinical, tactile, and restrained — inspired by high-precision Swiss financial instrumentation. It avoids generic SaaS cheerfulness, childish emojis, and blinding neo-brutalism. Every screen is designed for continuous 10-hour cashier or accountant usage without visual fatigue.

---

## 2. Color Palette & Roles
- **Canvas Neutral** (`#F8FAFC`, Dark: `#0B0F17`) — Primary background foundation; calm, anti-glare.
- **Surface Pure** (`#FFFFFF`, Dark: `#131926`) — Active card and modal containers.
- **Surface Muted** (`#F1F5F9`, Dark: `#1E2638`) — Secondary card backgrounds, table header bars, and drawer tracks.
- **Charcoal Ink** (`#0F172A`, Dark: `#F1F5F9`) — High-contrast primary typography and numerical metrics.
- **Muted Steel** (`#64748B`, Dark: `#94A3B8`) — Secondary typography, column captions, and metadata.
- **Whisper Border** (`#E2E8F0`, Dark: `#273248`) — 1px architectural dividers and input perimeters.
- **Singular Functional Accent — Cobalt Sapphire** (`#2563EB`, Dark: `#3B82F6`) — Sole accent color used for primary actions, focus indicators, and active view highlights. Saturation calibrated to 78%.
- **Status Accents (Strictly Functional)**:
  - *Emerald Green* (`#059669`, Dark: `#10B981`) — Paid invoices, positive cash flows, active ledger states.
  - *Crimson Alert* (`#DC2626`, Dark: `#EF4444`) — Overdue payments, negative stock alerts, void transactions.
  - *Amber Warning* (`#D97706`, Dark: `#F59E0B`) — Partial settlements, low-stock warnings, reconciliation flags.

> [!IMPORTANT]
> The generic "AI Purple/Neon Cyan" aesthetic is strictly banned. No purple button glows, no neon gradients, and no pure pitch black (`#000000`).

---

## 3. Typography Rules
- **Display & Section Headers:** `Plus Jakarta Sans` / `Geist` — Track-tight (`letter-spacing: -0.025em`), weight-driven hierarchy (`font-weight: 700` and `800`). Never shouting; sizes capped at `1.75rem` inside the dashboard shell.
- **Body & Controls:** `Plus Jakarta Sans` — Clean legibility, max 65 characters per line in readouts, relaxed leading (`line-height: 1.5`).
- **Data & Numerical Metrics:** `JetBrains Mono` — **Mandatory** across all financial figures (₹ amounts, GST rates, HSN/SAC codes, invoice numbers, stock quantities, and timestamps). Eliminates tabular jitter and aligns decimals perfectly.
- **Banned Fonts:** `Inter` is banned for generic slop. Generic serif fonts (`Times New Roman`, `Georgia`, `Palatino`) are strictly banned across all software dashboards.

---

## 4. Component Stylings
- **Buttons (`.btn`):**
  - Tactile push feedback: `active: transform translateY(1px) scale(0.99)`.
  - Primary button: Solid Cobalt Sapphire (`#2563EB`) with crisp 8px radius. Zero outer glow.
  - Secondary/Ghost: 1.5px Whisper Border with transparent background; subtle hover tint.
- **Cards (`.card`):**
  - Crisp 12px border radius (`--r: 12px`).
  - 1px hairline perimeter border (`--bor`).
  - Diffused whisper elevation (`box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`).
  - High-density override: For ledger and transaction logs, replace floating cards with border-top dividers to maximize vertical screen real estate.
- **Inputs & Selects (`.input`, `.select`):**
  - Label strictly positioned above the field in uppercase 11px semi-bold (`letter-spacing: 0.05em`).
  - Subtle 1.5px border. On focus: crisp 3px outer ring in 15% opacity Cobalt Sapphire.
  - Zero floating labels.
- **Loaders:**
  - Skeletal shimmer loaders matching exact table and stat card dimensions (`background: linear-gradient(90deg, ...)`).
  - Generic circular spinners are strictly banned.
- **Empty States:**
  - Composed, architectural vector/SVG states with actionable primary buttons — not just generic "No data" strings.

---

## 5. Layout Principles
- **Grid-First Cockpit Architecture:** CSS Grid over fragile flex calculations.
- **Contained Shell:** Max-width containment at `1280px` centered with fluid internal gutter padding.
- **Viewport Height Safety:** Full-height sections must utilize `min-h-[100dvh]` rather than `100vh` to eliminate mobile Safari browser bar jumps.
- **Responsive Collapse (< 768px):** Multi-column invoice and inventory builders collapse into modular card flows. Horizontal scrolling is forbidden on full-page layouts (only localized to table wrappers).
- **Minimum Tap Target:** 44px on mobile viewports for all buttons, inputs, and tab switches.

---

## 6. Motion & Interaction
- **Spring Physics:** `stiffness: 120, damping: 18` for dialog modals and drawer transitions.
- **Perpetual Micro-Interactions:** Sync indicators pulse subtly on sync state (`ok`, `syncing`, `err`).
- **Hardware Acceleration:** All animations strictly confined to `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.

---

## 7. Anti-Patterns (Banned AI Clichés)
1. **No Emojis anywhere in the UI:** Replace all navigation and button emojis (`🧾`, `💼`, `📊`, `📦`, `📒`, `✈️`, `🚪`, `🔍`, `⚡`) with crisp SVG icons.
2. **No Neon / AI Purple Glows:** Zero glowing gradients.
3. **No Pure Black (`#000000`):** Use calibrated Charcoal Ink (`#0F172A`).
4. **No 3-Equal Cards Rows:** Use asymmetric data layouts (e.g. 2:1 ratio for Primary Metric vs Trend).
5. **No AI Copywriting Clichés:** Ban words like *"Seamless"*, *"Unleash"*, *"Supercharge"*, *"Next-Gen"*. Use straightforward accounting terms (*"Create Invoice"*, *"Post Journal"*, *"Reconcile"*).
6. **No Inter font:** Use distinct, geometric Plus Jakarta Sans and JetBrains Mono.
