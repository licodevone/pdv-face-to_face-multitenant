import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional field label rendered above the control. */
  label?: string;
  /** Optional helper text rendered below the control. */
  hint?: string;
}

/** Labelled text input with the PDV blue focus ring. */
export function Input(props: InputProps): JSX.Element;
