"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
  SearchBar,
  Table,
  TABLE_FILTER_TYPES,
  createFilterConfig,
  toastError,
  toastInfo,
  toastSuccess,
  toastWarning,
} from "@/shared/components/ui";
import styles from "./page.module.css";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "summary", label: "Real Use Case" },
  { id: "category-table", label: "Data Table" },
  { id: "category-controls", label: "Controls" },
  { id: "category-surface", label: "Surface + Overlay" },
  { id: "category-feedback", label: "Feedback" },
  { id: "style-used", label: "Style Used" },
  { id: "rules", label: "Rules" },
];

const WORKFLOW_ACTIONS = [
  { key: "approve", label: "Approve", type: "success", critical: false },
  { key: "reject", label: "Reject", type: "danger", critical: true },
  { key: "return", label: "Return", type: "warning", critical: false },
  { key: "recall", label: "Recall", type: "secondary", critical: false },
  { key: "void", label: "Void", type: "danger", critical: true },
  { key: "confirm", label: "Confirm", type: "primary", critical: false },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const TABLE_SOURCE_ROWS = [
  {
    id: 1,
    employee_code: "EMP-1101",
    full_name: "Avery Nguyen",
    email: "avery.nguyen@psbuniverse.local",
    team: "Platform",
    role: "admin",
    status: "active",
    created_at: "2026-03-22",
  },
  {
    id: 2,
    employee_code: "EMP-1102",
    full_name: "Jordan Patel",
    email: "jordan.patel@psbuniverse.local",
    team: "Risk",
    role: "manager",
    status: "pending",
    created_at: "2026-03-18",
  },
  {
    id: 3,
    employee_code: "EMP-1103",
    full_name: "Riley Walker",
    email: "riley.walker@psbuniverse.local",
    team: "Operations",
    role: "analyst",
    status: "inactive",
    created_at: "2026-03-11",
  },
  {
    id: 4,
    employee_code: "EMP-1104",
    full_name: "Morgan Torres",
    email: "morgan.torres@psbuniverse.local",
    team: "Finance",
    role: "viewer",
    status: "suspended",
    created_at: "2026-03-06",
  },
  {
    id: 5,
    employee_code: "EMP-1105",
    full_name: "Taylor Lopez",
    email: "taylor.lopez@psbuniverse.local",
    team: "Support",
    role: "manager",
    status: "active",
    created_at: "2026-02-28",
  },
  {
    id: 6,
    employee_code: "EMP-1106",
    full_name: "Casey Johnson",
    email: "casey.johnson@psbuniverse.local",
    team: "Audit",
    role: "analyst",
    status: "pending",
    created_at: "2026-02-21",
  },
];

const TABLE_SNIPPET = `import { Table } from "@/shared/components/ui";

<Table
  data={rows}
  columns={columns}
  state={tableState}
  filterConfig={filterConfig}
  actions={actions}
  loading={loading}
  onChange={handleTableChange}
/>`;

const TABLE_EVENT_SNIPPET = `function handleTableChange(event) {
  switch (event.type) {
    case "search":
      // update search in module state
      break;
    case "filters":
      // update filters in module state
      break;
    case "sorting":
      // update sorting in module state
      break;
    case "pagination":
      // update page/pageSize in module state
      break;
    case "columnVisibility":
      // persist visible columns
      break;
    case "columnResize":
      // persist column sizes
      break;
    case "export":
      // call export API route
      break;
    case "action":
      // run row action
      event.action.onClick(event.row);
      break;
    default:
      break;
  }
}`;

const ACTION_COLUMN_SNIPPET = `const actions = [
  {
    key: "preview",
    label: "Preview",
    type: "primary",
    onClick: (row) => openRow(row),
  },
  {
    key: "edit",
    label: "Edit",
    type: "secondary",
    visible: (row) => row.status === "active",
    disabled: (row) => row.role === "admin",
    onClick: (row) => editRow(row),
  },
  {
    key: "deactivate",
    label: "Deactivate",
    type: "danger",
    confirm: true,
    confirmMessage: (row) => \`Deactivate \${row.full_name}?\`,
    onClick: (row) => deactivateRow(row),
  },
];`;

const FILTER_SCHEMA_SNIPPET = `import { createFilterConfig, TABLE_FILTER_TYPES } from "@/shared/components/ui";

const filterConfig = createFilterConfig([
  {
    key: "status",
    label: "Status",
    type: TABLE_FILTER_TYPES.SELECT,
    options: [
      { label: "Active", value: "active" },
      { label: "Pending", value: "pending" },
    ],
  },
  {
    key: "created_at",
    label: "Created Date",
    type: TABLE_FILTER_TYPES.DATERANGE,
  },
]);`;

const BUTTON_SNIPPET = `import { Button } from "@/shared/components/ui";

<Button variant="primary" onClick={saveItem}>Save</Button>
<Button variant="secondary" onClick={goBack}>Back</Button>
<Button variant="danger" onClick={removeItem}>Delete</Button>
<Button variant="ghost" onClick={openHelp}>Help</Button>
<Button variant="primary" loading={isSaving}>Saving</Button>`;

const INPUT_SNIPPET = `import { Input } from "@/shared/components/ui";

<Input
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  placeholder="name@company.com"
  isInvalid={showError}
/>
<Input value={readOnlyCode} disabled />`;

const SEARCHBAR_SNIPPET = `import { SearchBar } from "@/shared/components/ui";

<SearchBar
  value={searchValue}
  debounceMs={350}
  placeholder="Search records"
  onDebouncedChange={(nextValue) => {
    setSearchValue(nextValue);
    reloadData(nextValue);
  }}
/>`;

const DROPDOWN_SNIPPET = `import { Dropdown } from "@/shared/components/ui";

<Dropdown>
  <Dropdown.Toggle variant="secondary" size="sm">
    Row Actions
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Item onClick={handleView}>View</Dropdown.Item>
    <Dropdown.Item onClick={handleEdit}>Edit</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item onClick={handleDelete}>Delete</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>`;

const MODAL_SNIPPET = `import { Modal, Button } from "@/shared/components/ui";

<Modal
  show={open}
  onHide={() => setOpen(false)}
  title="Confirm Change"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" loading={saving} onClick={saveChange}>Save</Button>
    </>
  }
>
  <p>Change this item now?</p>
</Modal>`;

const CARD_SNIPPET = `import { Card } from "@/shared/components/ui";

<Card title="Module Summary" subtitle="Live status and quick actions">
  <p>Card content goes here.</p>
</Card>`;

const BADGE_SNIPPET = `import { Badge } from "@/shared/components/ui";

<Badge bg="success">Active</Badge>
<Badge bg="warning" text="dark">Pending</Badge>
<Badge bg="secondary">Inactive</Badge>`;

const TOAST_SNIPPET = `import { toastSuccess, toastError } from "@/shared/components/ui";

toastSuccess("Saved successfully.", "Save");
toastError("Something failed.", "Error");

// Host is already mounted once in app layout
// <GlobalToastHost />`;

const WORKFLOW_SNIPPET = `const workflowActions = [
  "Approve",
  "Reject",
  "Return",
  "Recall",
  "Void",
  "Confirm",
];

async function runWorkflowAction(action) {
  if (["Reject", "Void"].includes(action)) {
    const ok = window.confirm(\`Continue with \${action}?\`);
    if (!ok) return;
  }

  setLoadingAction(action);
  await executeAction(action);
  setLoadingAction("");
  toastSuccess(\`\${action} complete\`);
}`;

const STYLING_SNIPPET = `Files used on this page:
- src/app/examples/page.module.css (layout styles)
- src/styles/variables.css (shared tokens)
- src/app/globals.css (shared component classes)

Main tokens:
--psb-space-4 / --psb-space-8 / --psb-space-12 / --psb-space-16 / --psb-space-24
--psb-radius-6 / --psb-radius-8 / --psb-radius-12
--psb-font-12 / --psb-font-14 / --psb-font-16
--psb-transition-150 / --psb-transition-200`;

const TABLE_STATE_SNIPPET = `const tableState = {
  filters: {},
  sorting: { key: "created_at", direction: "desc" },
  pagination: { page: 1, pageSize: 20, total: 0 },
  columnVisibility: {},
  columnSizing: {},
};`;

const TABLE_COLUMNS_SNIPPET = `const columns = [
  { key: "employee_code", label: "Code", sortable: true, width: 140 },
  { key: "full_name", label: "Name", sortable: true, width: 200 },
  {
    key: "status",
    label: "Status",
    sortable: true,
    width: 130,
    render: (row) => <Badge bg="success">{row.status}</Badge>,
  },
];`;

const TABLE_FEATURE_ENABLE_SNIPPET = `// Enable filters
const filterConfig = createFilterConfig([
  { key: "status", type: TABLE_FILTER_TYPES.SELECT, options: statusOptions },
]);

// Enable row actions (ActionColumn)
const actions = [{ key: "preview", label: "Preview", type: "primary", onClick: openPreview }];

<Table
  data={rows}
  columns={columns}
  state={tableState}
  filterConfig={filterConfig}
  actions={actions}
  pageSizeOptions={[10, 20, 50]}
  exportFormats={["csv", "excel"]}
  searchPlaceholder="Search employees"
  onChange={handleTableChange}
/>`;

const TABLE_CONTROLLER_SNIPPET = `function handleTableChange(event) {
  if (event.type === "search") {
    setTableState((prev) => ({
      ...prev,
      filters: { ...prev.filters, search: event.value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  }

  if (event.type === "sorting") {
    setTableState((prev) => ({
      ...prev,
      sorting: event.sorting,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }

  if (event.type === "action") {
    event.action.onClick(event.row);
  }
}`;

const INPUT_VALIDATION_SNIPPET = `const emailHasError = showValidation && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

<Input value={email} onChange={(event) => setEmail(event.target.value)} isInvalid={emailHasError} />`;

const SEARCHBAR_SERVER_SNIPPET = `const onSearch = (nextValue) => {
  setTableState((prev) => ({
    ...prev,
    filters: { ...prev.filters, search: nextValue },
    pagination: { ...prev.pagination, page: 1 },
  }));
};

<SearchBar value={searchValue} debounceMs={350} onDebouncedChange={onSearch} />`;

const DROPDOWN_PERMISSIONS_SNIPPET = `<Dropdown.Menu>
  <Dropdown.Item onClick={openView}>View</Dropdown.Item>
  <Dropdown.Item disabled={!canEdit} onClick={openEdit}>Edit</Dropdown.Item>
  <Dropdown.Item disabled={!canDelete} onClick={runDelete}>Delete</Dropdown.Item>
</Dropdown.Menu>`;

const MODAL_CONFIRM_SNIPPET = `<Modal
  show={isOpen}
  onHide={closeModal}
  title="Confirm Save"
  footer={
    <>
      <Button variant="secondary" onClick={closeModal}>Cancel</Button>
      <Button variant="primary" loading={saving} onClick={submitSave}>Save</Button>
    </>
  }
/>`;

const BADGE_ROLE_SNIPPET = `const roleToBadge = {
  admin: { bg: "danger", text: "light" },
  manager: { bg: "primary", text: "light" },
  viewer: { bg: "secondary", text: "light" },
};`;

const TOAST_TIMING_SNIPPET = `toastSuccess("Saved.", "Success");
toastWarning("Needs review.", "Warning");
toastError("Request failed.", "Error");

// Host mounted once at app level
// <GlobalToastHost />`;

const TABLE_PARAMETER_GUIDE = [
  {
    prop: "data",
    required: true,
    type: "Array<object>",
    description: "Rows for the current view. Pass module-owned data only.",
    enable: "Set data after your module fetch/controller runs.",
  },
  {
    prop: "columns",
    required: true,
    type: "Array<column>",
    description: "Column schema with key/label and optional sortable, width, render.",
    enable: "Set sortable/resizable/width per column.",
  },
  {
    prop: "state",
    required: true,
    type: "object",
    description: "Controlled state: filters, sorting, pagination, columnVisibility, columnSizing.",
    enable: "Keep this state in module/controller, not inside shared table.",
  },
  {
    prop: "filterConfig",
    required: true,
    type: "Array<filter>",
    description: "Filter schema made with createFilterConfig and TABLE_FILTER_TYPES.",
    enable: "Add TEXT/SELECT/DATE/DATERANGE filters.",
  },
  {
    prop: "actions",
    required: true,
    type: "Array<action>",
    description: "Row actions for ActionColumn. Empty array means no action column.",
    enable: "Add type, visible, disabled, confirm, confirmMessage.",
  },
  {
    prop: "onChange",
    required: true,
    type: "function",
    description: "Single event channel for search, filters, sorting, pagination, export, and row actions.",
    enable: "Handle event.type in your module controller.",
  },
  {
    prop: "loading",
    required: true,
    type: "boolean",
    description: "Shows loading row state in the table body.",
    enable: "Set true while your module request is in progress.",
  },
  {
    prop: "pageSizeOptions",
    required: false,
    type: "number[]",
    description: "Page-size selector options (merged with current pageSize).",
    enable: "Use values like [10, 20, 50].",
  },
  {
    prop: "exportFormats",
    required: false,
    type: "('csv'|'excel')[]",
    description: "Formats shown in side panel export actions.",
    enable: "Use [\"csv\"] or [\"csv\", \"excel\"].",
  },
  {
    prop: "searchPlaceholder / searchDebounceMs",
    required: false,
    type: "string / number",
    description: "Search input label hint and debounce interval.",
    enable: "Tune search UX without changing logic.",
  },
];

const TABLE_EVENT_GUIDE = [
  { type: "search", detail: "Update filters.search and reset page to 1." },
  { type: "filters", detail: "Replace filters object and reset page to 1." },
  { type: "sorting", detail: "Update sorting and reset page to 1." },
  { type: "pagination", detail: "Update page/pageSize from event.pagination." },
  { type: "columnVisibility", detail: "Persist event.columnVisibility in module state." },
  { type: "columnResize", detail: "Persist event.columnSizing in module state." },
  { type: "export", detail: "Call export API using current table context." },
  { type: "action", detail: "Run row action handler with event.action and event.row." },
];

const TABLE_ALLOWED_ITEMS = [
  "columns[].render as a pure display function",
  "actions[].type only primary, secondary, or danger",
  "actions[].visible and actions[].disabled as functions",
  "state owned by module/controller files",
  "filterConfig built with createFilterConfig",
  "action column hidden by passing actions as an empty array",
];

const TABLE_NOT_ALLOWED_ITEMS = [
  "children rows inside <Table> (controlled mode only)",
  "duplicate or empty column keys",
  "using reserved key __psb_action_column__",
  "actions without key, label, and onClick",
  "unsupported action type values",
  "API calls or business rules inside shared table component",
];

function toButtonVariantByWorkflowType(type) {
  if (type === "danger") return "danger";
  if (type === "secondary" || type === "warning") return "secondary";
  return "primary";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function parseDateOnly(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function getStatusBadge(status) {
  const normalized = normalizeText(status);
  if (normalized === "active") return { bg: "success", text: "light" };
  if (normalized === "pending") return { bg: "warning", text: "dark" };
  if (normalized === "inactive") return { bg: "secondary", text: "light" };
  return { bg: "dark", text: "light" };
}

async function copyTextToClipboard(text) {
  const value = String(text || "");

  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to legacy copy when clipboard API is blocked.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "readonly");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  return copied;
}

function Section({ id, title, description, children }) {
  return (
    <section id={id} className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Snippet({ title, code, small = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(code);
    if (!ok) {
      return;
    }

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1300);
  };

  return (
    <div className={styles.codeWrap}>
      <div className={styles.codeHeader}>
        <p className={styles.codeTitle}>{title}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className={[styles.copyButton, copied ? styles.copyButtonCopied : ""].filter(Boolean).join(" ")}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className={small ? styles.codeBlockSmall : styles.codeBlock}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CategoryTag({ children }) {
  return <span className={styles.categoryTag}>{children}</span>;
}

function StateText({ children }) {
  return <p className={styles.demoState}>{children}</p>;
}

function DemoCard({ title, children }) {
  return (
    <article className={styles.demoCard}>
      <h3 className={styles.demoCardTitle}>{title}</h3>
      {children}
    </article>
  );
}

function RuleCard({ title, items }) {
  return (
    <article className={styles.subCard}>
      <h3 className={styles.subCardTitle}>{title}</h3>
      <ul className={styles.bullets}>
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function FocusAccordion({ items, defaultKey = "" }) {
  const firstKey = items[0]?.key || "";
  const [openKey, setOpenKey] = useState(defaultKey || firstKey);

  return (
    <div className={styles.focusAccordion}>
      {items.map((item) => {
        const isOpen = openKey === item.key;

        return (
          <article key={item.key} className={[styles.focusItem, isOpen ? styles.focusItemOpen : ""].filter(Boolean).join(" ")}>
            <button
              type="button"
              className={styles.focusHeader}
              onClick={() => setOpenKey(item.key)}
              aria-expanded={isOpen}
            >
              <span className={styles.focusHeaderText}>
                <span className={styles.focusTitle}>{item.title}</span>
                {item.subtitle ? <span className={styles.focusSubtitle}>{item.subtitle}</span> : null}
              </span>
              <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
            </button>

            {isOpen ? <div className={styles.focusContent}>{item.content}</div> : null}
          </article>
        );
      })}
    </div>
  );
}

function TableParameterCard({ item }) {
  return (
    <article className={styles.parameterCard}>
      <div className={styles.parameterHeader}>
        <p className={styles.parameterProp}>{item.prop}</p>
        <span
          className={[
            styles.parameterBadge,
            item.required ? styles.parameterBadgeRequired : styles.parameterBadgeOptional,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {item.required ? "Required" : "Optional"}
        </span>
      </div>
      <p className={styles.parameterType}>{item.type}</p>
      <p className={styles.parameterText}>{item.description}</p>
      <p className={styles.parameterHint}>{item.enable}</p>
    </article>
  );
}

function TableEventRow({ item }) {
  return (
    <article className={styles.eventGuideRow}>
      <p className={styles.eventGuideType}>{item.type}</p>
      <p className={styles.eventGuideText}>{item.detail}</p>
    </article>
  );
}

function OverviewSection() {
  return (
    <Section
      id="overview"
      title="Overview"
      description="Use shared components only. Do not create new custom versions in modules."
    >
      <div className={styles.sectionStack}>
        <ul className={styles.bullets}>
          <li>Shared UI gives you one look, one behavior, and fewer bugs.</li>
          <li>Modules own data, rules, and API calls.</li>
          <li>Shared components only render UI and emit events.</li>
        </ul>

        <div className={styles.flowBox}>
          <span className={styles.flowLabel}>Data flow</span>
          <code className={styles.flowCode}>User -&gt; Table Event -&gt; Module -&gt; API -&gt; Update</code>
        </div>
      </div>
    </Section>
  );
}

function SummarySection({
  workflowLoadingKey,
  workflowStateText,
  onRunWorkflowAction,
  inputName,
  onInputNameChange,
  searchValue,
  searchApplied,
  onSearchApply,
}) {
  return (
    <Section
      id="summary"
      title="Summary: Real Use Case"
      description="This is a live module-like setup. You can see shared components working together in one screen."
    >
      <div className={styles.sectionStack}>
        <CategoryTag>Real-time module flow</CategoryTag>

        <div className={styles.summaryGrid}>
          <Card
            className={styles.summaryCard}
            title="Workflow Toolbar"
            subtitle="Toolbar actions are state-driven and can require confirmation"
          >
            <div className={styles.demoToolbar}>
              {WORKFLOW_ACTIONS.map((action) => (
                <Button
                  key={action.key}
                  variant={toButtonVariantByWorkflowType(action.type)}
                  loading={workflowLoadingKey === action.key}
                  onClick={() => onRunWorkflowAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <StateText>{workflowStateText}</StateText>
          </Card>

          <Card
            className={styles.summaryCard}
            title="Search + Form Controls"
            subtitle="Input and SearchBar update module state"
          >
            <div className={styles.demoLine}>
              <Input value={inputName} onChange={(event) => onInputNameChange(event.target.value)} placeholder="Name" />
              <SearchBar
                value={searchValue}
                debounceMs={350}
                placeholder="Global search"
                onDebouncedChange={onSearchApply}
              />
            </div>
            <StateText>Debounced search value: {searchApplied || "(empty)"}</StateText>
          </Card>
        </div>

        <ul className={styles.stackList}>
          <li>Toolbar Actions: Approve/Reject/Return/Recall/Void/Confirm</li>
          <li>Filters + SearchBar</li>
          <li>Table + ActionColumn</li>
          <li>Right-click panel for columns/export/clear sorting</li>
          <li>Toast feedback from GlobalToastHost</li>
        </ul>

        <Snippet title="Workflow pattern" code={WORKFLOW_SNIPPET} />
      </div>
    </Section>
  );
}

function DataTableSection({
  tableRows,
  tableColumns,
  tableViewState,
  tableFilterConfig,
  tableActions,
  lastTableEvent,
  onTableChange,
}) {
  const [tableGuideMode, setTableGuideMode] = useState("quick-start");

  const quickStartItems = [
    {
      key: "table-live",
      title: "Table live demo",
      subtitle: "Search, filters, sorting, pagination, right-click panel, and row actions",
      content: (
        <>
          <div className={styles.tableDemoWrap}>
            <Table
              data={tableRows}
              columns={tableColumns}
              state={tableViewState}
              filterConfig={tableFilterConfig}
              actions={tableActions}
              loading={false}
              pageSizeOptions={[5, 10, 20]}
              searchPlaceholder="Search code, name, team, role, status"
              onChange={onTableChange}
            />
          </div>

          <div className={styles.eventBox}>
            <p className={styles.eventTitle}>Latest Table event (live)</p>
            <pre className={styles.eventPre}>{JSON.stringify(lastTableEvent, null, 2)}</pre>
          </div>

          <Snippet title="Table usage" code={TABLE_SNIPPET} />
        </>
      ),
    },
    {
      key: "table-quick-setup",
      title: "Quick Start setup",
      subtitle: "Minimum required state and handlers to get the table working",
      content: (
        <>
          <Snippet title="Controlled table state" code={TABLE_STATE_SNIPPET} />
          <Snippet title="Minimal controller handler" code={TABLE_CONTROLLER_SNIPPET} />
          <Snippet title="Feature enable checklist" code={TABLE_FEATURE_ENABLE_SNIPPET} />
        </>
      ),
    },
  ];

  const advancedItems = [
    {
      key: "table-params",
      title: "Table parameter contract",
      subtitle: "What to pass, what each prop does, and how to enable behavior",
      content: (
        <>
          <div className={styles.parameterGrid}>
            {TABLE_PARAMETER_GUIDE.map((item) => (
              <TableParameterCard key={item.prop} item={item} />
            ))}
          </div>

          <Snippet title="Controlled table state shape" code={TABLE_STATE_SNIPPET} />
          <Snippet title="Column schema example" code={TABLE_COLUMNS_SNIPPET} />
        </>
      ),
    },
    {
      key: "table-allowed",
      title: "Allowed and not allowed",
      subtitle: "Strict data-table rules for module controllers",
      content: (
        <>
          <div className={styles.ruleColumns}>
            <RuleCard title="Allowed" items={TABLE_ALLOWED_ITEMS} />
            <RuleCard title="Not allowed" items={TABLE_NOT_ALLOWED_ITEMS} />
          </div>

          <Snippet title="Feature enable checklist" code={TABLE_FEATURE_ENABLE_SNIPPET} />
        </>
      ),
    },
    {
      key: "table-events",
      title: "Controller events and feature wiring",
      subtitle: "How to consume onChange and wire actions/filters correctly",
      content: (
        <>
          <div className={styles.eventGuideGrid}>
            {TABLE_EVENT_GUIDE.map((item) => (
              <TableEventRow key={item.type} item={item} />
            ))}
          </div>

          <Snippet title="Controller event handler" code={TABLE_CONTROLLER_SNIPPET} />
          <Snippet title="Full event switch" code={TABLE_EVENT_SNIPPET} />
          <Snippet title="ActionColumn config" code={ACTION_COLUMN_SNIPPET} />
          <Snippet title="FilterSchema config" code={FILTER_SCHEMA_SNIPPET} />
        </>
      ),
    },
  ];

  const focusedItems = tableGuideMode === "quick-start" ? quickStartItems : advancedItems;
  const defaultKey = tableGuideMode === "quick-start" ? "table-live" : "table-params";

  return (
    <Section
      id="category-table"
      title="Data Table"
      description="Focus on one part at a time with Quick Start and Advanced tracks."
    >
      <div className={styles.sectionStack}>
        <CategoryTag>Display only + event-driven</CategoryTag>
        <p className={styles.componentNote}>Pick a track, then open one accordion item at a time.</p>

        <div className={styles.modeTabs} role="tablist" aria-label="Data table guide mode">
          <button
            type="button"
            role="tab"
            aria-selected={tableGuideMode === "quick-start"}
            className={[
              styles.modeTab,
              tableGuideMode === "quick-start" ? styles.modeTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTableGuideMode("quick-start")}
          >
            Quick Start
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tableGuideMode === "advanced"}
            className={[
              styles.modeTab,
              tableGuideMode === "advanced" ? styles.modeTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTableGuideMode("advanced")}
          >
            Advanced
          </button>
        </div>

        <FocusAccordion key={tableGuideMode} items={focusedItems} defaultKey={defaultKey} />
      </div>
    </Section>
  );
}

function ControlsSection({
  buttonLoading,
  buttonStateText,
  onRunButtonDemo,
  onSetButtonStateText,
  inputName,
  inputEmail,
  emailHasError,
  onInputNameChange,
  onInputEmailChange,
  onSaveInputDemo,
  searchValue,
  searchApplied,
  onSearchApply,
  dropdownStateText,
  onSetDropdownStateText,
}) {
  const [controlsGuideMode, setControlsGuideMode] = useState("quick-start");

  const quickStartItems = [
    {
      key: "controls-button",
      title: "Button",
      subtitle: "Variants, loading, and disabled behavior",
      content: (
        <DemoCard title="Button states">
          <div className={styles.actionRow}>
            <Button variant="primary" onClick={onRunButtonDemo} loading={buttonLoading}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => onSetButtonStateText("Secondary clicked")}>
              Back
            </Button>
            <Button variant="danger" onClick={() => onSetButtonStateText("Danger clicked")}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => onSetButtonStateText("Ghost clicked")}>
              Help
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <StateText>{buttonStateText}</StateText>
          <Snippet title="Button usage" code={BUTTON_SNIPPET} small />
        </DemoCard>
      ),
    },
    {
      key: "controls-input",
      title: "Input",
      subtitle: "Controlled value, validation, and disabled state",
      content: (
        <DemoCard title="Input states">
          <div className={styles.controlStack}>
            <Input value={inputName} onChange={(event) => onInputNameChange(event.target.value)} placeholder="Full name" />
            <Input
              value={inputEmail}
              onChange={(event) => onInputEmailChange(event.target.value)}
              placeholder="Email"
              isInvalid={emailHasError}
            />
            <Input value="READ-ONLY-CODE" disabled />
          </div>
          <div className={styles.actionRow}>
            <Button variant="primary" onClick={onSaveInputDemo}>
              Validate + Save
            </Button>
          </div>
          <StateText>
            Name: {inputName} | Email: {inputEmail}
          </StateText>
          <Snippet title="Input usage" code={INPUT_SNIPPET} small />
          <Snippet title="Input validation pattern" code={INPUT_VALIDATION_SNIPPET} small />
        </DemoCard>
      ),
    },
  ];

  const advancedItems = [
    {
      key: "controls-searchbar",
      title: "SearchBar",
      subtitle: "Debounced query handoff to module state",
      content: (
        <DemoCard title="SearchBar event">
          <SearchBar
            value={searchValue}
            debounceMs={350}
            placeholder="Type and wait for debounce"
            onDebouncedChange={onSearchApply}
          />
          <StateText>onDebouncedChange value: {searchApplied || "(empty)"}</StateText>
          <Snippet title="SearchBar usage" code={SEARCHBAR_SNIPPET} small />
          <Snippet title="SearchBar with server query state" code={SEARCHBAR_SERVER_SNIPPET} small />
        </DemoCard>
      ),
    },
    {
      key: "controls-dropdown",
      title: "Dropdown",
      subtitle: "Action menus with permission and state awareness",
      content: (
        <DemoCard title="Dropdown event">
          <Dropdown>
            <Dropdown.Toggle variant="secondary" size="sm">
              Open Menu
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onSetDropdownStateText("View clicked")}>View</Dropdown.Item>
              <Dropdown.Item onClick={() => onSetDropdownStateText("Edit clicked")}>Edit</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => onSetDropdownStateText("Delete clicked")}>Delete</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <StateText>{dropdownStateText}</StateText>
          <Snippet title="Dropdown usage" code={DROPDOWN_SNIPPET} small />
          <Snippet title="Dropdown with permission guards" code={DROPDOWN_PERMISSIONS_SNIPPET} small />
        </DemoCard>
      ),
    },
  ];

  const focusedItems = controlsGuideMode === "quick-start" ? quickStartItems : advancedItems;
  const defaultKey = controlsGuideMode === "quick-start" ? "controls-button" : "controls-searchbar";

  return (
    <Section
      id="category-controls"
      title="Controls"
      description="Use Quick Start for core controls, then Advanced for async/query and menu patterns."
    >
      <div className={styles.sectionStack}>
        <CategoryTag>State + events</CategoryTag>

        <div className={styles.modeTabs} role="tablist" aria-label="Controls guide mode">
          <button
            type="button"
            role="tab"
            aria-selected={controlsGuideMode === "quick-start"}
            className={[
              styles.modeTab,
              controlsGuideMode === "quick-start" ? styles.modeTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setControlsGuideMode("quick-start")}
          >
            Quick Start
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={controlsGuideMode === "advanced"}
            className={[
              styles.modeTab,
              controlsGuideMode === "advanced" ? styles.modeTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setControlsGuideMode("advanced")}
          >
            Advanced
          </button>
        </div>

        <FocusAccordion key={controlsGuideMode} items={focusedItems} defaultKey={defaultKey} />
      </div>
    </Section>
  );
}

function SurfaceSection({ modalOpen, modalSaving, onOpenModal, onCloseModal, onRunModalSave }) {
  const focusedItems = [
    {
      key: "surface-card",
      title: "Card",
      subtitle: "Use shared card containers for module sections",
      content: (
        <DemoCard title="Card live example">
          <Card title="Module Snapshot" subtitle="Simple card with shared spacing and border">
            <p className={styles.componentNote}>Use Card for module sections. Do not make custom panel wrappers.</p>
          </Card>
          <Snippet title="Card usage" code={CARD_SNIPPET} small />
        </DemoCard>
      ),
    },
    {
      key: "surface-modal",
      title: "Modal",
      subtitle: "Open/close flow with save loading state",
      content: (
        <DemoCard title="Modal open/close + loading">
          <div className={styles.actionRow}>
            <Button variant="primary" onClick={onOpenModal}>
              Open Modal
            </Button>
          </div>
          <StateText>Modal state: {modalOpen ? "Open" : "Closed"}</StateText>
          <Snippet title="Modal usage" code={MODAL_SNIPPET} small />
          <Snippet title="Modal confirm footer pattern" code={MODAL_CONFIRM_SNIPPET} small />
        </DemoCard>
      ),
    },
  ];

  return (
    <Section id="category-surface" title="Surface + Overlay" description="Focus each container/overlay component separately.">
      <div className={styles.sectionStack}>
        <CategoryTag>Containers and overlays</CategoryTag>

        <FocusAccordion items={focusedItems} defaultKey="surface-card" />

        <Modal
          show={modalOpen}
          onHide={onCloseModal}
          title="Confirm Change"
          footer={
            <>
              <Button variant="secondary" onClick={onCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" loading={modalSaving} onClick={onRunModalSave}>
                Save
              </Button>
            </>
          }
        >
          <p className={styles.componentNote}>This is a shared modal with centered layout and footer actions on the right.</p>
        </Modal>
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const focusedItems = [
    {
      key: "feedback-badge",
      title: "Badge",
      subtitle: "Compact status labels for list/table cells",
      content: (
        <DemoCard title="Badge states">
          <div className={styles.badgeRow}>
            <Badge bg="success">Active</Badge>
            <Badge bg="warning" text="dark">
              Pending
            </Badge>
            <Badge bg="secondary">Inactive</Badge>
            <Badge bg="dark">Suspended</Badge>
          </div>
          <Snippet title="Badge usage" code={BADGE_SNIPPET} small />
          <Snippet title="Badge mapping pattern" code={BADGE_ROLE_SNIPPET} small />
        </DemoCard>
      ),
    },
    {
      key: "feedback-toast",
      title: "Toast",
      subtitle: "Global notifications with action-result feedback",
      content: (
        <DemoCard title="Toast events">
          <div className={styles.actionRow}>
            <Button variant="primary" onClick={() => toastSuccess("Save done.", "Success")}>
              Success
            </Button>
            <Button variant="secondary" onClick={() => toastInfo("Info update.", "Info")}>
              Info
            </Button>
            <Button variant="secondary" onClick={() => toastWarning("Check this step.", "Warning")}>
              Warning
            </Button>
            <Button variant="danger" onClick={() => toastError("Request failed.", "Error")}>
              Error
            </Button>
          </div>
          <StateText>
            Toast host is already mounted globally in app layout. New toast appears on top and auto-dismisses.
          </StateText>
          <Snippet title="Toast usage" code={TOAST_SNIPPET} small />
          <Snippet title="Toast pattern examples" code={TOAST_TIMING_SNIPPET} small />
        </DemoCard>
      ),
    },
  ];

  return (
    <Section
      id="category-feedback"
      title="Feedback"
      description="Review feedback components one at a time with focused examples."
    >
      <div className={styles.sectionStack}>
        <CategoryTag>Visual status + notifications</CategoryTag>

        <FocusAccordion items={focusedItems} defaultKey="feedback-badge" />
      </div>
    </Section>
  );
}

function StyleUsedSection() {
  return (
    <Section id="style-used" title="Style Used" description="This page uses shared styling rules and tokens.">
      <div className={styles.sectionStack}>
        <ul className={styles.styleList}>
          <li>Page layout styles: src/app/examples/page.module.css</li>
          <li>Shared design tokens: src/styles/variables.css</li>
          <li>Shared component styles: src/app/globals.css</li>
          <li>Bootstrap base + icon font from global imports</li>
        </ul>

        <Snippet title="Token and style reference" code={STYLING_SNIPPET} />
      </div>
    </Section>
  );
}

function RulesSection() {
  const doItems = [
    "Use shared components only.",
    "Keep logic in module/controller files.",
    "Use config-driven behavior.",
    "Follow event flow: UI event -> module state -> API -> UI update.",
  ];

  const doNotItems = [
    "Do not override shared styles in modules.",
    "Do not create duplicate custom components.",
    "Do not place business logic inside shared UI components.",
    "Do not break ActionColumn rendering rules.",
  ];

  return (
    <Section id="rules" title="Rules" description="Keep these rules simple and strict for every module.">
      <div className={styles.ruleColumns}>
        <RuleCard title="DO" items={doItems} />
        <RuleCard title="DO NOT" items={doNotItems} />
      </div>
    </Section>
  );
}

export default function SharedUiReferencePage() {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonStateText, setButtonStateText] = useState("No button action yet.");

  const [inputName, setInputName] = useState("Jordan Carter");
  const [inputEmail, setInputEmail] = useState("jordan.carter@psbuniverse.local");
  const [showInputValidation, setShowInputValidation] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  const [dropdownStateText, setDropdownStateText] = useState("No dropdown action yet.");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const [workflowLoadingKey, setWorkflowLoadingKey] = useState("");
  const [workflowStateText, setWorkflowStateText] = useState("No workflow action yet.");

  const [tableState, setTableState] = useState({
    filters: {},
    sorting: { key: "created_at", direction: "desc" },
    pagination: { page: 1, pageSize: 5, total: TABLE_SOURCE_ROWS.length },
    columnVisibility: {},
    columnSizing: {},
  });

  const [lastTableEvent, setLastTableEvent] = useState({ type: "none" });

  const tableColumns = useMemo(
    () => [
      {
        key: "employee_code",
        label: "Code",
        sortable: true,
        width: 140,
      },
      {
        key: "full_name",
        label: "Name",
        sortable: true,
        width: 190,
      },
      {
        key: "team",
        label: "Team",
        sortable: true,
        width: 130,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        width: 130,
        render: (row) => {
          const style = getStatusBadge(row.status);
          return (
            <Badge bg={style.bg} text={style.text}>
              {row.status}
            </Badge>
          );
        },
      },
      {
        key: "created_at",
        label: "Created",
        sortable: true,
        width: 150,
      },
    ],
    [],
  );

  const tableFilterConfig = useMemo(
    () =>
      createFilterConfig([
        {
          key: "status",
          label: "Status",
          type: TABLE_FILTER_TYPES.SELECT,
          options: STATUS_OPTIONS,
        },
        {
          key: "created_at",
          label: "Created Date",
          type: TABLE_FILTER_TYPES.DATERANGE,
        },
      ]),
    [],
  );

  const tableActions = useMemo(
    () => [
      {
        key: "preview",
        label: "Preview",
        type: "primary",
        icon: "eye",
        onClick: (row) => {
          toastInfo(`Preview opened for ${row.employee_code}.`, "Row Action");
        },
      },
      {
        key: "edit",
        label: "Edit",
        type: "secondary",
        icon: "pencil-square",
        visible: (row) => row.status === "active",
        onClick: (row) => {
          toastSuccess(`Edit opened for ${row.full_name}.`, "Row Action");
        },
      },
      {
        key: "deactivate",
        label: "Deactivate",
        type: "danger",
        icon: "x-octagon",
        visible: (row) => row.status === "active",
        confirm: true,
        confirmMessage: (row) => `Deactivate ${row.full_name}?`,
        onClick: (row) => {
          toastWarning(`Deactivation requested for ${row.full_name}.`, "Row Action");
        },
      },
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    const filters = tableState.filters && typeof tableState.filters === "object" ? tableState.filters : {};

    const search = normalizeText(filters.search);
    const status = normalizeText(filters.status);
    const dateRange = filters.created_at && typeof filters.created_at === "object" ? filters.created_at : {};

    const startDate = parseDateOnly(dateRange.start);
    const endDate = parseDateOnly(dateRange.end);

    return TABLE_SOURCE_ROWS.filter((row) => {
      if (search) {
        const haystack = [
          row.employee_code,
          row.full_name,
          row.email,
          row.team,
          row.role,
          row.status,
          row.created_at,
        ]
          .map((entry) => normalizeText(entry))
          .join(" ");

        if (!haystack.includes(search)) {
          return false;
        }
      }

      if (status && normalizeText(row.status) !== status) {
        return false;
      }

      const rowDate = parseDateOnly(row.created_at);
      if (startDate && rowDate && rowDate.getTime() < startDate.getTime()) {
        return false;
      }
      if (endDate && rowDate && rowDate.getTime() > endDate.getTime()) {
        return false;
      }

      return true;
    });
  }, [tableState.filters]);

  const sortedRows = useMemo(() => {
    const sorting = tableState.sorting && typeof tableState.sorting === "object" ? tableState.sorting : {};
    const sortKey = String(sorting.key || "").trim();

    if (!sortKey) {
      return filteredRows;
    }

    const direction = String(sorting.direction || "asc").toLowerCase() === "desc" ? -1 : 1;

    return filteredRows.slice().sort((left, right) => {
      if (sortKey === "created_at") {
        const leftTime = parseDateOnly(left.created_at)?.getTime() || 0;
        const rightTime = parseDateOnly(right.created_at)?.getTime() || 0;
        return (leftTime - rightTime) * direction;
      }

      const leftValue = String(left[sortKey] || "");
      const rightValue = String(right[sortKey] || "");

      return leftValue.localeCompare(rightValue, undefined, { sensitivity: "base", numeric: true }) * direction;
    });
  }, [filteredRows, tableState.sorting]);

  const tablePageSize = Math.max(1, Number(tableState.pagination?.pageSize || 5));
  const tableTotal = sortedRows.length;
  const tableMaxPage = Math.max(1, Math.ceil(tableTotal / tablePageSize));
  const tablePage = Math.min(Math.max(1, Number(tableState.pagination?.page || 1)), tableMaxPage);

  const tableRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return sortedRows.slice(start, start + tablePageSize);
  }, [sortedRows, tablePage, tablePageSize]);

  const tableViewState = useMemo(
    () => ({
      ...tableState,
      pagination: {
        ...tableState.pagination,
        page: tablePage,
        pageSize: tablePageSize,
        total: tableTotal,
      },
    }),
    [tableState, tablePage, tablePageSize, tableTotal],
  );

  const handleTableChange = useCallback((event) => {
    setLastTableEvent(event || { type: "none" });

    const eventType = String(event?.type || "").toLowerCase();

    if (eventType === "search") {
      const nextValue = String(event.value || "").trim();

      setTableState((previous) => {
        const nextFilters = {
          ...previous.filters,
        };

        if (nextValue) {
          nextFilters.search = nextValue;
        } else {
          delete nextFilters.search;
        }

        return {
          ...previous,
          filters: nextFilters,
          pagination: {
            ...previous.pagination,
            page: 1,
          },
        };
      });

      return;
    }

    if (eventType === "filters") {
      setTableState((previous) => ({
        ...previous,
        filters: event.filters && typeof event.filters === "object" ? event.filters : {},
        pagination: {
          ...previous.pagination,
          page: 1,
        },
      }));

      return;
    }

    if (eventType === "sorting") {
      setTableState((previous) => ({
        ...previous,
        sorting: event.sorting && typeof event.sorting === "object" ? event.sorting : { key: "", direction: "" },
        pagination: {
          ...previous.pagination,
          page: 1,
        },
      }));

      return;
    }

    if (eventType === "pagination") {
      setTableState((previous) => ({
        ...previous,
        pagination: {
          ...previous.pagination,
          page: Math.max(1, Number(event.pagination?.page || 1)),
          pageSize: Math.max(1, Number(event.pagination?.pageSize || previous.pagination?.pageSize || 5)),
        },
      }));

      return;
    }

    if (eventType === "columnvisibility") {
      setTableState((previous) => ({
        ...previous,
        columnVisibility:
          event.columnVisibility && typeof event.columnVisibility === "object"
            ? event.columnVisibility
            : previous.columnVisibility,
      }));

      return;
    }

    if (eventType === "columnresize") {
      setTableState((previous) => ({
        ...previous,
        columnSizing:
          event.columnSizing && typeof event.columnSizing === "object"
            ? event.columnSizing
            : previous.columnSizing,
      }));

      return;
    }

    if (eventType === "action") {
      if (typeof event?.action?.onClick === "function") {
        event.action.onClick(event.row);
      }
      return;
    }

    if (eventType === "export") {
      const format = String(event?.format || "csv").toUpperCase();
      toastInfo(`Export started (${format}).`, "Export");
    }
  }, []);

  const runButtonDemo = () => {
    setButtonLoading(true);
    setButtonStateText("Saving...");

    window.setTimeout(() => {
      setButtonLoading(false);
      setButtonStateText("Saved. You can copy this flow.");
      toastSuccess("Button action finished.", "Button Demo");
    }, 900);
  };

  const runWorkflowAction = (action) => {
    if (action.critical) {
      const ok = window.confirm(`Continue with ${action.label}?`);
      if (!ok) {
        return;
      }
    }

    setWorkflowLoadingKey(action.key);
    setWorkflowStateText(`Running ${action.label}...`);

    window.setTimeout(() => {
      setWorkflowLoadingKey("");
      setWorkflowStateText(`${action.label} done.`);
      toastSuccess(`${action.label} complete.`, "Workflow");
    }, 1000);
  };

  const saveInputDemo = () => {
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(inputEmail || "").trim());
    setShowInputValidation(true);

    if (!validEmail) {
      toastError("Please enter a valid email.", "Input Demo");
      return;
    }

    toastSuccess(`Saved profile for ${inputName}.`, "Input Demo");
  };

  const runModalSave = () => {
    setModalSaving(true);

    window.setTimeout(() => {
      setModalSaving(false);
      setModalOpen(false);
      toastSuccess("Modal changes saved.", "Modal Demo");
    }, 900);
  };

  const emailHasError =
    showInputValidation && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(inputEmail || "").trim());

  const handleSharedSearchChange = useCallback((nextValue) => {
    setSearchValue(nextValue);
    setSearchApplied(nextValue);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Official Developer Guide</p>
        <h1 className={styles.title}>Shared UI Components</h1>
        <p className={styles.subtitle}>
          This page shows all shared components with simple examples. Copy and paste these patterns so every
          module looks and works the same.
        </p>
        <div className={styles.heroLinks}>
          <span className={styles.sourceTag}>Single source of truth</span>
          <Link href="/examples/data-table" className={styles.heroLink}>
            Open full Data Table companion page
          </Link>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav} aria-label="Examples navigation">
            <p className={styles.navTitle}>Quick Navigation</p>
            <ul className={styles.navList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.id} className={styles.navItem}>
                  <a href={`#${item.id}`} className={styles.navLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>
          <OverviewSection />
          <SummarySection
            workflowLoadingKey={workflowLoadingKey}
            workflowStateText={workflowStateText}
            onRunWorkflowAction={runWorkflowAction}
            inputName={inputName}
            onInputNameChange={setInputName}
            searchValue={searchValue}
            searchApplied={searchApplied}
            onSearchApply={handleSharedSearchChange}
          />
          <DataTableSection
            tableRows={tableRows}
            tableColumns={tableColumns}
            tableViewState={tableViewState}
            tableFilterConfig={tableFilterConfig}
            tableActions={tableActions}
            lastTableEvent={lastTableEvent}
            onTableChange={handleTableChange}
          />
          <ControlsSection
            buttonLoading={buttonLoading}
            buttonStateText={buttonStateText}
            onRunButtonDemo={runButtonDemo}
            onSetButtonStateText={setButtonStateText}
            inputName={inputName}
            inputEmail={inputEmail}
            emailHasError={emailHasError}
            onInputNameChange={setInputName}
            onInputEmailChange={setInputEmail}
            onSaveInputDemo={saveInputDemo}
            searchValue={searchValue}
            searchApplied={searchApplied}
            onSearchApply={handleSharedSearchChange}
            dropdownStateText={dropdownStateText}
            onSetDropdownStateText={setDropdownStateText}
          />
          <SurfaceSection
            modalOpen={modalOpen}
            modalSaving={modalSaving}
            onOpenModal={() => setModalOpen(true)}
            onCloseModal={() => setModalOpen(false)}
            onRunModalSave={runModalSave}
          />
          <FeedbackSection />
          <StyleUsedSection />
          <RulesSection />
        </main>
      </div>
    </div>
  );
}
