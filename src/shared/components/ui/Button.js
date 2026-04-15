"use client";

import { Button as BootstrapButton } from "react-bootstrap";

export default function Button({ className = "", variant = "primary", ...props }) {
  const mergedClassName = ["psb-ui-button", className].filter(Boolean).join(" ");

  return <BootstrapButton variant={variant} className={mergedClassName} {...props} />;
}
