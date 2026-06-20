Tappable catalog tile used in the PDV product grid. Composes `Badge` for stock status.

```jsx
<ProductCard
  name="Arroz branco tipo 1 pacote 5kg"
  priceInCents={2790}
  imageUrl="/assets/produtos/sku-arroz-5kg.png"
  stockStatus="AVAILABLE"
  onClick={() => addToCart(product)}
/>
```

Media well is white (product PNGs are shot on white). Price uses pt-BR BRL. `stockStatus`: `AVAILABLE` / `LOW_STOCK` / `OUT_OF_STOCK`. Lay these out in a `repeat(auto-fill, minmax(142px, 1fr))` grid.
