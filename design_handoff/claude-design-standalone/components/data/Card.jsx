import * as React from "react";

/**
 * Card — glass surface panel. `soft` uses the nested-surface variant.
 */
export function Card({ soft = false, className = "", children, ...props }) {
  const classes = ["pdv-card", soft ? "pdv-card--soft" : "", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
