import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional field label rendered above the control. */
  label?: string;
}

/** Labelled native select styled to match the PDV inputs. */
export function Select(props: SelectProps): JSX.Element;
