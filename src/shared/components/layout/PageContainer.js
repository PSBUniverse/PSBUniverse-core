"use client";

import { Container } from "react-bootstrap";

export default function PageContainer({
  children,
  className = "",
  maxWidth = 1200,
  fluid = false,
  ...rest
}) {
  const mergedClassName = ["psb-page-container", className].filter(Boolean).join(" ");

  return (
    <Container
      fluid={fluid}
      className={mergedClassName}
      style={{ maxWidth: fluid ? undefined : maxWidth, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Container>
  );
}
