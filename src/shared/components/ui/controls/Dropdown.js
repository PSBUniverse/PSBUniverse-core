"use client";

import { Dropdown as BootstrapDropdown } from "react-bootstrap";

function Dropdown(props) {
  return <BootstrapDropdown {...props} />;
}

Dropdown.Toggle = BootstrapDropdown.Toggle;
Dropdown.Menu = BootstrapDropdown.Menu;
Dropdown.Item = BootstrapDropdown.Item;
Dropdown.Divider = BootstrapDropdown.Divider;

export default Dropdown;