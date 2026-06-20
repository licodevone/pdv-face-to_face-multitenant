---
name: pdv-face-delivery-design
description: Use this skill to generate well-branded interfaces and assets for PDV Face Delivery (a Brazilian multi-tenant point-of-sale / PDV product), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files
(`styles.css` + `tokens/`, `components/`, `ui_kits/pdv/`, `guidelines/`, `assets/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets
out and create static HTML files for the user to view. If working on production code,
copy assets and read the rules here to become an expert in designing with this brand.

Key facts to honor:
- **Language is Brazilian Portuguese (pt-BR)**; currency is **BRL** (`R$ 1.248,90`).
- One brand hue: **blue** (`#60a5fa` dark / `#1877f2` light). Deep-navy neutrals.
  Two themes ship (dark is default) via `html[data-theme="dark|light"]`.
- **Inter**, heavy weights (800/900), tight tracking on headings, uppercase eyebrows.
- Glassmorphic panels, generous rounding, **signature blue glow** on hover.
- Icons are **lucide** line icons — never emoji. The only custom mark is the
  hexagonal F·D logo in `assets/`.
- Link `styles.css`; use `.pdv-*` classes or the React components under
  `window.PDVFaceDeliveryDesignSystem_dfcaa0` (load `_ds_bundle.js`).

If the user invokes this skill without other guidance, ask what they want to build or
design, ask a few questions, and act as an expert designer who outputs HTML artifacts
*or* production code, depending on the need.
