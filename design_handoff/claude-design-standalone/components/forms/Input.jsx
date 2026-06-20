import * as React from "react";

/**
 * Input — labelled text field. Rounded, faintly translucent fill, blue focus ring.
 */
export function Input({ label, hint, className = "", id, ...props }) {
  const inputId = id || (label ? `inp-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const field = (
    <input id={inputId} className={["pdv-input", className].filter(Boolean).join(" ")} {...props} />
  );
  if (!label) return field;
  return (
    <label className="pdv-field" htmlFor={inputId}>
      <span>{label}</span>
      {field}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
