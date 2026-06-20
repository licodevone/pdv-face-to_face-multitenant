import * as React from "react";

export interface MetricTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase label (e.g. "Ticket médio"). */
  label: string;
  /** Primary value, rendered large with tabular numerals. */
  value: string;
  /** Optional supporting note below the value. */
  note?: string;
  /** Background tint. @default "neutral" */
  tone?: "neutral" | "success" | "accent";
}

/** KPI tile used across the dashboard summary grids. */
export function MetricTile(props: MetricTileProps): JSX.Element;
