import * as React from "react";

/** Catalog product tile. */
export interface ProductCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Product display name (clamped to 2 lines). */
  name: string;
  /** Price in cents (BRL). Rendered with pt-BR currency formatting. */
  priceInCents: number;
  /** Product image URL. Falls back to an empty white well. */
  imageUrl?: string;
  /** Stock status drives the corner badge. @default "AVAILABLE" */
  stockStatus?: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
  /** Sale unit. @default "UNIT" */
  unit?: "UNIT" | "KG";
}

/** Catalog product tile — white media well, clamped name, price + stock badge. */
export function ProductCard(props: ProductCardProps): JSX.Element;
