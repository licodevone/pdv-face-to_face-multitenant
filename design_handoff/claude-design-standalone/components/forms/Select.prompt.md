Native select styled to match the PDV inputs (rounded, translucent fill, blue focus ring).

```jsx
<Select label="Forma de pagamento" value={method} onChange={onChange}>
  <option value="CASH">Dinheiro</option>
  <option value="PIX">Pix</option>
  <option value="CARD">Cartão TEF</option>
</Select>
```
