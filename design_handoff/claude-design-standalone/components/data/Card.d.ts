import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use the nested/raised soft surface (no shadow). */
  soft?: boolean;
}

/** Glassmorphic surface panel used for catalog, checkout and side cards. */
export function Card(props: CardProps): JSX.Element;
