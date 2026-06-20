import * as React from "react";

/**
 * CategoryChip — large catalog filter chip with icon, label and count.
 */
export function CategoryChip({ label, count, icon = null, active = false, className = "", ...props }) {
  const classes = ["pdv-chip", active ? "pdv-chip--active" : "", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} {...props}>
      <span className="pdv-chip__label">
        {icon ? <span className="pdv-chip__icon">{icon}</span> : null}
        {label}
      </span>
      {count != null ? <small>{count} itens</small> : null}
    </button>
  );
}
