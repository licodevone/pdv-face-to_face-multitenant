import * as React from "react";

/** Button props. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "ghost";
  /** Control height/padding. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Stretch to full container width. */
  block?: boolean;
  /** Optional leading icon node (e.g. a lucide-react icon). */
  icon?: React.ReactNode;
}

/**
 * Primary action control for the PDV. Gradient primary, tinted secondary,
 * translucent ghost — all with the blue hover glow.
 */
export function Button(props: ButtonProps): JSX.Element;
