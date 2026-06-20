import * as React from "react";

/**
 * MetricTile — KPI tile: uppercase label, big tabular value, optional note.
 */
export function MetricTile({ label, value, note, tone = "neutral", className = "", ...props }) {
  const classes = [
    "pdv-metric",
    tone !== "neutral" ? `pdv-metric--${tone}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...props}>
      <small>{label}</small>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </div>
  );
}
