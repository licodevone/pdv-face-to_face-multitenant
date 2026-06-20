import * as React from "react";

/**
 * Select — labelled native select with the PDV blue focus ring.
 */
export function Select({ label, children, className = "", id, ...props }) {
  const selectId = id || (label ? `sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const field = (
    <select id={selectId} className={["pdv-select", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </select>
  );
  if (!label) return field;
  return (
    <label className="pdv-field" htmlFor={selectId}>
      <span>{label}</span>
      {field}
    </label>
  );
}
