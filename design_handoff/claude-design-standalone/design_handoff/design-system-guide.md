# PDV Face Delivery — Design System

A design system reconstructed from the **PDV Face Delivery** product: a Brazilian
multi-tenant **PDV** (*Ponto de Venda* / Point-of-Sale) for face-to-face retail and
delivery. The product is a Next.js/React frontend over a Fastify + Prisma backend,
packaged as a web app and an Electron desktop shell. Core scope: frente de caixa
(checkout with cart, multiple payments, change), cash sessions, stock control,
customers/loyalty, delivery, NFC-e fiscal modelling, and operator auditing.

This system captures the product's **visual language** — a confident blue, glassmorphic
panels over deep navy, heavy Inter type, generous rounding, and a signature blue glow —
so new screens, mocks and assets look native to it.

### Sources
- **GitHub:** `licodevone/backup-pdv-face-to_face-multitenant`
  (frontend at `frontend/src`, design tokens in `frontend/src/app/globals.css`,
  primitives in `frontend/src/components/`). Explore it to build higher-fidelity
  recreations of specific screens (the real frente de caixa lives in
  `frontend/src/app/page.tsx`).
- Tokens, component classes, the brand logo and product art are lifted directly from
  that repo. Strings are in **pt-BR**; currency is **BRL**.

---

## CONTENT FUNDAMENTALS

**Language.** All product copy is **Brazilian Portuguese (pt-BR)**. Keep it that way.

**Voice & person.** Neutral, operational, third-person/imperative — it speaks *to the
operator about the system*, not in first person. Instructions use the imperative
("Informe suas credenciais para acessar o PDV.", "Toque em um produto…",
"Modifique a quantidade no carrinho"). No "we", rarely "you" directly — the subject is
the till, the cash session, the product.

**Casing.** Sentence case for body and most labels. **UPPERCASE eyebrows** with wide
tracking for section kickers ("MENU GERENCIAL", "RESUMO"). Headings are Title/sentence
case, never all-caps. Status pills are uppercase ("DISPONÍVEL", "ESGOTADO").

**Tone.** Direct, reassuring, slightly formal-technical — retail back-office register.
Domain terms are used plainly: *Caixa, Sangria, Reforço, Fiado, Frente de caixa,
Ticket médio, Estoque mínimo, NFC-e, Sobremesas, Bazar*. Money always `R$ 1.248,90`
(pt-BR, comma decimals, dot thousands). Dates `dd/mm`.

**Microcopy examples.**
- Empty cart: *"Carrinho vazio. Adicione produtos do catálogo."*
- Blocked cash: *"Caixa bloqueado. Informe o valor de entrada do caixa para iniciar a operação."*
- Stock: *"Disponível (12 un)"*, *"Estoque baixo"*, *"Esgotado"*.

**Emoji:** none. The product uses **lucide** line icons, never emoji.

---

## VISUAL FOUNDATIONS

**Color.** One hue carries the brand: **blue**. Dark theme (default) accent
`#60a5fa`; light theme shifts to a Facebook-style `#1877f2`. Everything else is a
deep-navy neutral ramp (`#050816 → #243149`) with near-white text (`#f8fafc`) and a
muted slate (`#9aa4b2`). Semantics are conventional: green success, amber warning,
rose danger. **Two themes ship** — dark is primary; light is a true inversion, not an
afterthought.

**Type.** **Inter**, exclusively. The brand leans **heavy** — 800/900 for headings,
totals and labels; 600/700 for supporting text. Display headings use tight negative
tracking (`-0.06em`) and near-1.0 line-height. Eyebrows are 900 weight, uppercase,
`0.16em` tracking. Numerals are **tabular** for money/quantities.

**Backgrounds.** No photography. The app sits on a layered field: two soft radial
**blue/indigo blooms** (top-left, top-right) over a diagonal navy gradient. Light theme
uses the same recipe in pale blue. Product imagery is shot on **pure white** and sits in
white "media wells" inside cards.

**Surfaces & glass.** Panels are translucent `color-mix` over `--surface` with
`backdrop-filter: blur(14px)` — glassmorphism. Cards round generously
(`1rem`–`1.6rem`), carry a hairline `--line` border and a deep-navy ambient shadow.
Nested cards drop to the softer surface tone and lose the shadow.

**The blue glow.** The signature move: interactive surfaces (buttons, chips, product
cards, the total box) bloom a soft blue glow on hover/active
(`0 0 0.65rem … , 0 16px 38px …`). Primary buttons are a vertical blue **gradient**
(`#2563eb → #1d4ed8`) with an inner top highlight; topbar, modal headers and the footer
use the diagonal `--panel-gradient` (blue → indigo → sky).

**Motion.** Restrained and quick — `0.18s ease` transitions on background, shadow and a
`translateY(-1px)` lift on hover. Press shrinks slightly (`scale(0.985)`). An
`attention-pulse` keyframe gently scales+glows elements needing focus. The login screen
has playful looping SVG illustration animations (device float, package delivery), but
in-app motion stays subtle. Respect `prefers-reduced-motion`.

**Borders, radius, shadow.** Borders are hairline and low-contrast
(`rgba(148,163,184,0.18)` dark). Radius scale: chips `0.6rem`, buttons/product cards
`0.95rem`, tiles/side cards `1rem`, main panels `1.35rem`, login cards `1.6rem`, pills
`999px`. Shadows are deep-navy ambient by default, blue-tinted on elevation/hover.

**Layout.** Dense, grid-driven, gaps run small (`0.35–0.9rem`). The frente de caixa is a
two-column grid: catalog (≈1.35fr) + a **sticky** checkout panel (≈0.72fr). Metric tiles
in 2–4 column grids; product grid is `repeat(auto-fill, minmax(142px, 1fr))`.

**Transparency & blur** are used deliberately for panels and modal overlays
(`blur(8px)` scrim) — not decoratively elsewhere.

---

## ICONOGRAPHY

The product uses **[lucide](https://lucide.dev)** (lucide-react) throughout — thin,
consistent 2px line icons. No emoji, no unicode glyphs as icons, no custom icon font.
Representative glyphs in use: `LayoutDashboard, ChartColumn, Package, UsersRound, Truck,
WalletCards, Warehouse, Settings, Scale, Printer, FileText, ShoppingBag, Utensils,
GlassWater, CakeSlice, SprayCan, PawPrint, CreditCard, MoonStar, SunMedium, ChevronDown,
MessageCircle, Menu, Sparkles`. Category chips and manager tiles each map to a lucide
icon.

**The one custom mark** is the **brand logo** — a hexagonal "tech shield" enclosing a
stylised **F·D** (Face Delivery) with small speed lines, drawn as inline SVG in the app.
It's reproduced here in `assets/brand-logo.svg` (blue, on surface) and
`assets/brand-logo-white.svg` (on gradient).

**When building with this system:** load lucide from CDN
(`https://unpkg.com/lucide@0.460.0/...`) or `lucide-react` in React, matching weight and
size (16–18px in chrome). Don't hand-draw icons.

---

## Index / manifest

**Foundations & entry**
- `styles.css` — the single entry point consumers link (import list only).
- `base.css` — element resets, form controls, body background, `.eyebrow`.
- `components.css` — the `.pdv-*` component classes (button, card, badge, metric, chip, product).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css` (radius/shadow/gradients), `fonts.css` (Inter).

**Components** (`window.PDVFaceDeliveryDesignSystem_dfcaa0`)
- `components/forms/` — **Button**, **Input**, **Select**
- `components/data/` — **Card**, **Badge**, **MetricTile**
- `components/catalog/` — **ProductCard**, **CategoryChip**

**UI kit**
- `ui_kits/pdv/` — **Frente de caixa**: interactive catalog + cart + checkout screen.

**Specimen cards** — `guidelines/*.html` (Colors, Type, Spacing, Brand) populate the
Design System tab.

**Assets** — `assets/brand-logo.svg`, `assets/brand-logo-white.svg`,
`assets/empty-cart-image.png`, `assets/produtos/*.png` (product art on white).

---

## Notes & substitutions
- **Inter** is loaded from Google Fonts (`tokens/fonts.css`) rather than bundled binaries,
  so the compiler reports 0 `@font-face` fonts — this is expected and the metrics match
  the product (which uses the Inter/system stack).
- Product photography is a representative **subset** of the catalog from the repo.
