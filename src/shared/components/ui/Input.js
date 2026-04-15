"use client";

import Form from "react-bootstrap/Form";

export default function Input({ className = "", ...props }) {
  const mergedClassName = ["psb-ui-input", className].filter(Boolean).join(" ");

  return <Form.Control className={mergedClassName} {...props} />;
}
