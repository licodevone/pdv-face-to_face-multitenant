import * as React from "react";

/**
 * Badge — tinted, fully-rounded status pill with an optional leading dot.
 */
export function Badge({ tone = "neutral", dot = false, className = "", children, ...props }) {
  const classes = ["pdv-badge", `pdv-badge--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes} {...props}>
      {dot ? <span className="pdv-badge__dot" /> : null}
      {children}
    </span>
  );
}
