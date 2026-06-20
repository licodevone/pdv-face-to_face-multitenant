Gradient-filled action button used across the PDV for primary and secondary actions.

```jsx
<Button variant="primary" onClick={save}>Finalizar venda</Button>
<Button variant="secondary">Voltar</Button>
<Button variant="ghost" size="sm">Limpar</Button>
<Button variant="primary" block icon={<CreditCard size={16} />}>Pagar</Button>
```

Variants: `primary` (blue gradient + glow), `secondary` (tinted surface), `ghost` (translucent blue). Sizes: `sm` / `md` / `lg`. Use `block` for full-width and `icon` for a leading lucide-react glyph. Labels are Portuguese, Title case, heavy weight.
