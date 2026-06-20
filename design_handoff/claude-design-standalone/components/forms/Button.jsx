import * as React from "react";

/**
 * Button — PDV Face Delivery primary action control.
 * Gradient-filled (primary), tinted-surface (secondary) or translucent
 * (ghost), with the signature blue glow on hover.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon = null,
  className = "",
  children,
  ...props
}) {
  const classes = [
    "pdv-btn",
    `pdv-btn--${variant}`,
    size !== "md" ? `pdv-btn--${size}` : "",
    block ? "pdv-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
