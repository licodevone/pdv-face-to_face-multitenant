import * as React from "react";
import { Badge } from "../data/Badge.jsx";

const moneyBRL = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);

const STATUS = {
  AVAILABLE: { tone: "success", label: "Disponível" },
  LOW_STOCK: { tone: "warn", label: "Estoque baixo" },
  OUT_OF_STOCK: { tone: "danger", label: "Esgotado" },
};

/**
 * ProductCard — catalog tile. White media well, clamped name, price + stock badge.
 */
export function ProductCard({
  name,
  priceInCents,
  imageUrl,
  stockStatus = "AVAILABLE",
  unit = "UNIT",
  onClick,
  className = "",
  ...props
}) {
  const status = STATUS[stockStatus] || STATUS.AVAILABLE;
  return (
    <button
      type="button"
      className={["pdv-product", className].filter(Boolean).join(" ")}
      onClick={onClick}
      {...props}
    >
      <div className="pdv-product__media">
        {imageUrl ? <img src={imageUrl} alt={name} /> : null}
      </div>
      <div className="pdv-product__name">{name}</div>
      <div className="pdv-product__foot">
        <span className="pdv-product__price">{moneyBRL(priceInCents)}</span>
        <Badge tone={status.tone} dot>
          {unit === "KG" ? "Kg" : status.label}
        </Badge>
      </div>
    </button>
  );
}
