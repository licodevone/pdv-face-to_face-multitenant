import * as React from "react";

/** Tinted status pill (stock status, cash state, etc.). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone. @default "neutral" */
  tone?: "success" | "warn" | "danger" | "neutral";
  /** Show a leading status dot. */
  dot?: boolean;
}

/** Tinted status pill (stock status, cash state, etc.). */
export function Badge(props: BadgeProps): JSX.Element;
