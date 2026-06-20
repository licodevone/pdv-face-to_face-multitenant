import * as React from "react";

export interface CategoryChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Category label (e.g. "Bebidas"). */
  label: string;
  /** Optional item count shown below the label. */
  count?: number;
  /** Optional leading icon (lucide-react glyph). */
  icon?: React.ReactNode;
  /** Active/selected state — switches to the blue gradient. */
  active?: boolean;
}

/** Large category filter chip used in the catalog toolbar. */
export function CategoryChip(props: CategoryChipProps): JSX.Element;
