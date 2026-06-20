# UI Kit — PDV (Frente de caixa)

An interactive recreation of the PDV Face Delivery **point-of-sale checkout** screen,
composed from this system's component primitives.

`index.html` renders the real product view:

- **Topbar** — brand logo + wordmark, operator menu, dark/light theme toggle (live).
- **Catalog panel** — KPI metric tiles, lucide-iconed category chips (filter), search,
  and a product grid (`ProductCard`) of real product art on white.
- **Checkout panel** (sticky) — cart with zebra rows, customer field, payment
  method + amount, the gradient **total** box, and a **Finalizar venda** action.

**Interactions:** tap a product to add it to the cart, tap a cart row to remove it,
filter by category, search by name, toggle the theme, and finalize the sale (toast +
reset). Stock-out products are blocked with a toast.

It pulls `Button`, `ProductCard`, `CategoryChip`, `MetricTile` and `Input` from
`window.PDVFaceDeliveryDesignSystem_dfcaa0` (via `../../_ds_bundle.js`) and links
`../../styles.css`. Demo data is in `products.js`.

> Source of truth: `licodevone/backup-pdv-face-to_face-multitenant`,
> `frontend/src/app/page.tsx`. Re-read it to extend this kit with the cash-opening
> modal, the manager menu, or product/customer registration.
