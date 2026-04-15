"use client";

import { Table as BootstrapTable } from "react-bootstrap";

export default function Table({
  children,
  className = "",
  responsive = true,
  striped = false,
  hover = true,
  ...props
}) {
  const mergedClassName = ["psb-ui-table", className].filter(Boolean).join(" ");

  const table = (
    <BootstrapTable className={mergedClassName} striped={striped} hover={hover} {...props}>
      {children}
    </BootstrapTable>
  );

  if (!responsive) {
    return table;
  }

  return <div className="table-responsive">{table}</div>;
}
