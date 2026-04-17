"use client";

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

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const WORKFLOW_ACTIONS = [
  { key: "approve", label: "Approve", type: "success",   critical: false },
  { key: "reject",  label: "Reject",  type: "danger",    critical: true  },
  { key: "return",  label: "Return",  type: "warning",   critical: false },
  { key: "recall",  label: "Recall",  type: "secondary", critical: false },
  { key: "void",    label: "Void",    type: "danger",    critical: true  },
  { key: "confirm", label: "Confirm", type: "primary",   critical: false },
];

const STATUS_OPTIONS = [
  { label: "Active",    value: "active"    },
  { label: "Pending",   value: "pending"   },
  { label: "Inactive",  value: "inactive"  },
  { label: "Suspended", value: "suspended" },
];

const DEMO_STATUS_OPTIONS = STATUS_OPTIONS.length > 0
  ? STATUS_OPTIONS
  : [
      { label: "Active", value: "active" },
      { label: "Pending", value: "pending" },
      { label: "Inactive", value: "inactive" },
      { label: "Suspended", value: "suspended" },
    ];

const TABLE_SOURCE_ROWS = [
  { id: 1, employee_code: "EMP-1101", full_name: "Avery Nguyen",   email: "avery.nguyen@psbuniverse.local",   team: "Platform",   role: "admin",   status: "active",    created_at: "2026-03-22" },
  { id: 2, employee_code: "EMP-1102", full_name: "Jordan Patel",   email: "jordan.patel@psbuniverse.local",   team: "Risk",       role: "manager", status: "pending",   created_at: "2026-03-18" },
  { id: 3, employee_code: "EMP-1103", full_name: "Riley Walker",   email: "riley.walker@psbuniverse.local",   team: "Operations", role: "analyst", status: "inactive",  created_at: "2026-03-11" },
  { id: 4, employee_code: "EMP-1104", full_name: "Morgan Torres",  email: "morgan.torres@psbuniverse.local",  team: "Finance",    role: "viewer",  status: "suspended", created_at: "2026-03-06" },
  { id: 5, employee_code: "EMP-1105", full_name: "Taylor Lopez",   email: "taylor.lopez@psbuniverse.local",   team: "Support",    role: "manager", status: "active",    created_at: "2026-02-28" },
  { id: 6, employee_code: "EMP-1106", full_name: "Casey Johnson",  email: "casey.johnson@psbuniverse.local",  team: "Audit",      role: "analyst", status: "pending",   created_at: "2026-02-21" },
];

// ---------------------------------------------------------------------------
// Snippets
// ---------------------------------------------------------------------------

const SNIPPET_IMPORT = `import { Table, Button, Input, Modal, Badge, SearchBar, Dropdown, toastSuccess } from "@/shared/components/ui";`;

const SNIPPET_TABLE_BASIC = `import { Table } from "@/shared/components/ui";

<Table
  data={rows}
  columns={columns}
  state={tableState}
  filterConfig={filterConfig}
  actions={actions}
  loading={loading}
  onChange={handleTableChange}
/>`;

const SNIPPET_TABLE_STATE = `const [tableState, setTableState] = useState({
  filters: {},
  sorting: { key: "created_at", direction: "desc" },
  pagination: { page: 1, pageSize: 10, total: 0 },
  columnVisibility: {},
  columnSizing: {},
});`;

const SNIPPET_TABLE_DATABIND = `const [rows, setRows] = useState([]);

useEffect(() => {
  async function load() {
    const payload = await fetchRowsFromApi(tableState);
    setRows(payload.rows);
    setTableState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, total: payload.total },
    }));
  }
  load();
}, [tableState.filters, tableState.sorting,
    tableState.pagination.page, tableState.pagination.pageSize]);`;

const SNIPPET_TABLE_FILTERS_HARDCODE = `// Hardcoded filter items
const filterConfig = createFilterConfig([
  {
    key: "status",
    label: "Status",
    type: TABLE_FILTER_TYPES.SELECT,
    options: [
      { label: "Active",  value: "active"  },
      { label: "Pending", value: "pending" },
    ],
  },
]);`;

const SNIPPET_TABLE_FILTERS_DATABIND = `// Databind filter items from API
const [statusOptions, setStatusOptions] = useState([]);

useEffect(() => {
  fetch("/api/lookup/status")
    .then((r) => r.json())
    .then((data) => setStatusOptions(data.items));
}, []);

const filterConfig = createFilterConfig([
  {
    key: "status",
    label: "Status",
    type: TABLE_FILTER_TYPES.SELECT,
    options: statusOptions,
  },
]);`;

const SNIPPET_TABLE_COLUMNS = `const columns = [
  { key: "employee_code", label: "Code",   sortable: true, width: 140 },
  { key: "full_name",     label: "Name",   sortable: true, width: 200 },
  {
    key: "status",
    label: "Status",
    sortable: true,
    width: 130,
    render: (row) => <Badge bg="success">{row.status}</Badge>,
  },
];`;

const SNIPPET_TABLE_ACTIONS = `const actions = [
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

const SNIPPET_TABLE_ONCHANGE = `function handleTableChange(event) {
  switch (event.type) {
    case "search":
      setTableState((prev) => ({
        ...prev,
        filters: { ...prev.filters, search: event.value },
        pagination: { ...prev.pagination, page: 1 },
      }));
      break;
    case "filters":
      setTableState((prev) => ({
        ...prev,
        filters: event.filters,
        pagination: { ...prev.pagination, page: 1 },
      }));
      break;
    case "sorting":
      setTableState((prev) => ({
        ...prev,
        sorting: event.sorting,
        pagination: { ...prev.pagination, page: 1 },
      }));
      break;
    case "pagination":
      setTableState((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, ...event.pagination },
      }));
      break;
    case "action":
      event.action.onClick(event.row);
      break;
    case "export":
      callExportApi(event.format);
      break;
    default:
      break;
  }
}`;

const SNIPPET_BUTTON = `import { Button } from "@/shared/components/ui";

<Button variant="primary"   onClick={save}>Save</Button>
<Button variant="secondary" onClick={back}>Back</Button>
<Button variant="danger"    onClick={del}>Delete</Button>
<Button variant="ghost"     onClick={help}>Help</Button>
<Button variant="primary"   loading={saving}>Saving\u2026</Button>
<Button variant="primary"   disabled>Disabled</Button>`;

const SNIPPET_INPUT = `import { Input } from "@/shared/components/ui";

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="name@company.com"
  isInvalid={showError}
/>
<Input value="READ-ONLY-001" disabled />`;

const SNIPPET_SEARCHBAR = `import { SearchBar } from "@/shared/components/ui";

<SearchBar
  value={search}
  debounceMs={350}
  placeholder="Search records"
  onDebouncedChange={(next) => {
    setSearch(next);
    reloadData(next);
  }}
/>`;

const SNIPPET_DROPDOWN_BASIC = `import { Dropdown } from "@/shared/components/ui";

<Dropdown>
  <Dropdown.Toggle variant="secondary" size="sm">
    Actions
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Item onClick={view}>View</Dropdown.Item>
    <Dropdown.Item onClick={edit}>Edit</Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item onClick={remove}>Delete</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>`;

const SNIPPET_DROPDOWN_DATABIND = `const [items, setItems] = useState([]);

useEffect(() => {
  fetch("/api/lookup/teams")
    .then((r) => r.json())
    .then((data) => setItems(data.items));
}, []);

<Dropdown>
  <Dropdown.Toggle variant="secondary" size="sm">
    {selected || "Select Team"}
  </Dropdown.Toggle>
  <Dropdown.Menu>
    {items.map((item) => (
      <Dropdown.Item key={item.value} onClick={() => setSelected(item.label)}>
        {item.label}
      </Dropdown.Item>
    ))}
  </Dropdown.Menu>
</Dropdown>`;

const SNIPPET_DROPDOWN_HARDCODE = `// Hardcoded combo items
const teamItems = [
  { label: "Platform",   value: "platform"   },
  { label: "Operations", value: "operations" },
  { label: "Risk",       value: "risk"       },
];

<Dropdown.Menu>
  {teamItems.map((item) => (
    <Dropdown.Item key={item.value} onClick={() => onSelect(item.value)}>
      {item.label}
    </Dropdown.Item>
  ))}
</Dropdown.Menu>`;

const SNIPPET_INPUT_VALIDATION = `const [email, setEmail] = useState("");
const [showError, setShowError] = useState(false);
const emailHasError = showError && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.trim());

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Email"
  isInvalid={emailHasError}
/>
<Button onClick={() => setShowError(true)}>Validate</Button>`;

const SNIPPET_MODAL = `import { Modal, Button } from "@/shared/components/ui";

<Modal
  show={open}
  onHide={() => setOpen(false)}
  title="Confirm Change"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" loading={saving} onClick={submit}>Save</Button>
    </>
  }
>
  <p>Change this item now?</p>
</Modal>`;

const SNIPPET_SEARCHBAR_WITH_API = `const [search, setSearch] = useState("");
const [results, setResults] = useState([]);

const loadData = async (query) => {
  const payload = await fetch(\`/api/search?q=\${query}\`)
    .then((r) => r.json());
  setResults(payload.items || []);
};

<SearchBar
  value={search}
  debounceMs={350}
  placeholder="Search records…"
  onDebouncedChange={(next) => {
    setSearch(next);
    if (next) loadData(next);
  }}
/>
{results.length > 0 && <List items={results} />}`;

const SNIPPET_MODAL_SAVE_FLOW = `const [open, setOpen] = useState(false);
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  setSaving(true);
  try {
    await saveToApi(data);
    toastSuccess("Saved.", "Success");
    setOpen(false);
  } catch (err) {
    toastError("Save failed.", "Error");
  } finally {
    setSaving(false);
  }
};

<Modal
  show={open}
  onHide={() => setOpen(false)}
  title="Confirm Change"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
    </>
  }
>
  <p>Change this item now?</p>
</Modal>`;

const SNIPPET_BADGE = `import { Badge } from "@/shared/components/ui";

<Badge bg="success">Active</Badge>
<Badge bg="warning" text="dark">Pending</Badge>
<Badge bg="secondary">Inactive</Badge>
<Badge bg="dark">Suspended</Badge>`;

const SNIPPET_TOAST = `import { toastSuccess, toastError, toastWarning, toastInfo } from "@/shared/components/ui";

toastSuccess("Saved successfully.", "Save");
toastError("Something failed.", "Error");
toastWarning("Needs review.", "Warning");
toastInfo("FYI note.", "Info");

// GlobalToastHost is already mounted once in app layout \u2014 do not add it again.`;

const SNIPPET_TOKENS = `/* Design tokens \u2014 from src/styles/variables.css */

/* Spacing */
--psb-space-4  --psb-space-8  --psb-space-12
--psb-space-16 --psb-space-24

/* Radius */
--psb-radius-6  --psb-radius-8  --psb-radius-12

/* Font size */
--psb-font-12  --psb-font-14  --psb-font-16

/* Transitions */
--psb-transition-150  --psb-transition-200`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const s = normalizeText(status);
  if (s === "active")   return { bg: "success",   text: "light" };
  if (s === "pending")  return { bg: "warning",   text: "dark"  };
  if (s === "inactive") return { bg: "secondary", text: "light" };
  return { bg: "dark", text: "light" };
}

async function copyText(text) {
  const v = String(text || "");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(v); return true; } catch { /* fall through */ }
  }
  if (typeof document === "undefined") return false;
  const el = document.createElement("textarea");
  el.value = v;
  el.setAttribute("readonly", "readonly");
  el.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0, el.value.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  return ok;
}

function toButtonVariantByType(type) {
  if (type === "danger") return "danger";
  if (type === "secondary" || type === "warning") return "secondary";
  return "primary";
}

// ---------------------------------------------------------------------------
// Primitive components
// ---------------------------------------------------------------------------

function Snippet({ title, code }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };
  return (
    <div className={styles.snippet}>
      <div className={styles.snippetHeader}>
        <span className={styles.snippetTitle}>{title}</span>
        <button
          type="button"
          onClick={handle}
          className={[styles.copyBtn, copied ? styles.copyBtnDone : ""].filter(Boolean).join(" ")}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={styles.codeBlock}><code>{code}</code></pre>
    </div>
  );
}

function ExampleBlock({ title, when, children, snippet, snippetTitle, rules }) {
  return (
    <div className={styles.exampleBlock}>
      {title ? <p className={styles.exampleTitle}>{title}</p> : null}
      {when  ? <p className={styles.exampleWhen}>{when}</p>   : null}
      <div className={styles.examplePreview}>{children}</div>
      {snippet ? <Snippet title={snippetTitle || "Usage"} code={snippet} /> : null}
      {rules ? (
        <ul className={styles.exampleRules}>
          {rules.map((r) => <li key={r}>{r}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function StepBar({ steps, active, onChange }) {
  return (
    <div className={styles.stepBar} role="tablist">
      {steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={active === s.id}
          className={[styles.stepTab, active === s.id ? styles.stepTabActive : ""].filter(Boolean).join(" ")}
          onClick={() => onChange(s.id)}
        >
          <span className={styles.stepNum}>{i + 1}</span>
          <span className={styles.stepLabel}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function Accordion({ items }) {
  const [openKey, setOpenKey] = useState(items[0]?.key || "");
  return (
    <div className={styles.accordion}>
      {items.map((item) => {
        const isOpen = openKey === item.key;
        return (
          <div key={item.key} className={[styles.accordionItem, isOpen ? styles.accordionItemOpen : ""].filter(Boolean).join(" ")}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => setOpenKey(isOpen ? "" : item.key)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
            </button>
            {isOpen ? <div className={styles.accordionBody}>{item.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function RefPropRow({ prop, required, type, desc }) {
  return (
    <div className={styles.propRow}>
      <div className={styles.propLeft}>
        <span className={styles.propName}>{prop}</span>
        <span className={[styles.propBadge, required ? styles.propBadgeReq : styles.propBadgeOpt].filter(Boolean).join(" ")}>
          {required ? "required" : "optional"}
        </span>
      </div>
      <span className={styles.propType}>{type}</span>
      <span className={styles.propDesc}>{desc}</span>
    </div>
  );
}

function PatternToggle({ modes, active, onChange }) {
  return (
    <div className={styles.patternToggle}>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className={[styles.patternBtn, active === m.id ? styles.patternBtnActive : ""].filter(Boolean).join(" ")}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Start tab
// ---------------------------------------------------------------------------

const QS_STEPS = [
  { id: "setup",    label: "Setup"    },
  { id: "table",    label: "Table"    },
  { id: "actions",  label: "Actions"  },
  { id: "forms",    label: "Forms"    },
  { id: "feedback", label: "Feedback" },
];

function QuickStartTab() {
  const [step, setStep] = useState("setup");
  return (
    <div className={styles.tabContent}>
      <StepBar steps={QS_STEPS} active={step} onChange={setStep} />
      <div className={styles.stepContent}>
        {step === "setup"    && <QsSetup    onNext={() => setStep("table")}    />}
        {step === "table"    && <QsTable    onNext={() => setStep("actions")}  />}
        {step === "actions"  && <QsActions  onNext={() => setStep("forms")}    />}
        {step === "forms"    && <QsForms    onNext={() => setStep("feedback")} />}
        {step === "feedback" && <QsFeedback />}
      </div>
    </div>
  );
}

function QsSetup({ onNext }) {
  return (
    <div className={styles.stepBody}>
      <p className={styles.stepHeading}>Import from the shared UI index</p>
      <p className={styles.stepNote}>All components come from one place. Never import directly from Bootstrap or sub-paths.</p>
      <Snippet title="Import" code={SNIPPET_IMPORT} />
      <div className={styles.stepNext}>
        <Button variant="primary" onClick={onNext}>Next: Table →</Button>
      </div>
    </div>
  );
}

function QsTable({ onNext }) {
  return (
    <div className={styles.stepBody}>
      <p className={styles.stepHeading}>Add a table</p>
      <p className={styles.stepNote}>Three things required: state, columns, and an onChange handler.</p>
      <Snippet title="1. State" code={SNIPPET_TABLE_STATE} />
      <Snippet title="2. Columns" code={SNIPPET_TABLE_COLUMNS} />
      <Snippet title="3. Component" code={SNIPPET_TABLE_BASIC} />
      <div className={styles.stepNext}>
        <Button variant="primary" onClick={onNext}>Next: Actions →</Button>
      </div>
    </div>
  );
}

function QsActions({ onNext }) {
  return (
    <div className={styles.stepBody}>
      <p className={styles.stepHeading}>Add row actions</p>
      <p className={styles.stepNote}>Pass an actions array. Each item needs key, label, type, and onClick.</p>
      <Snippet title="Actions config" code={SNIPPET_TABLE_ACTIONS} />
      <Snippet title="onChange handler" code={SNIPPET_TABLE_ONCHANGE} />
      <div className={styles.stepNext}>
        <Button variant="primary" onClick={onNext}>Next: Forms →</Button>
      </div>
    </div>
  );
}

function QsForms({ onNext }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [showErr, setShowErr] = useState(false);
  const emailErr = showErr && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  return (
    <div className={styles.stepBody}>
      <p className={styles.stepHeading}>Add form inputs</p>
      <p className={styles.stepNote}>Use Input for text fields. Set isInvalid for validation feedback.</p>
      <ExampleBlock snippet={SNIPPET_INPUT} snippetTitle="Input usage">
        <div className={styles.formStack}>
          <Input value={name}  onChange={(e) => setName(e.target.value)}  placeholder="Full name" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" isInvalid={emailErr} />
          <Input value="READ-ONLY-001" disabled />
        </div>
        <div className={styles.actionRow}>
          <Button variant="primary" onClick={() => { setShowErr(true); if (!emailErr && email) toastSuccess("Saved.", "Form Demo"); }}>
            Validate
          </Button>
        </div>
      </ExampleBlock>
      <div className={styles.stepNext}>
        <Button variant="primary" onClick={onNext}>Next: Feedback →</Button>
      </div>
    </div>
  );
}

function QsFeedback() {
  return (
    <div className={styles.stepBody}>
      <p className={styles.stepHeading}>Show feedback</p>
      <p className={styles.stepNote}>Toast for action results. Badge for status labels in tables and lists.</p>
      <ExampleBlock title="Toast" snippet={SNIPPET_TOAST}>
        <div className={styles.actionRow}>
          <Button variant="primary"   onClick={() => toastSuccess("Done.", "Success")}>Success</Button>
          <Button variant="secondary" onClick={() => toastInfo("FYI.", "Info")}>Info</Button>
          <Button variant="secondary" onClick={() => toastWarning("Check this.", "Warning")}>Warning</Button>
          <Button variant="danger"    onClick={() => toastError("Failed.", "Error")}>Error</Button>
        </div>
      </ExampleBlock>
      <ExampleBlock title="Badge" snippet={SNIPPET_BADGE}>
        <div className={styles.badgeRow}>
          <Badge bg="success">Active</Badge>
          <Badge bg="warning" text="dark">Pending</Badge>
          <Badge bg="secondary">Inactive</Badge>
          <Badge bg="dark">Suspended</Badge>
        </div>
      </ExampleBlock>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Playground tab
// ---------------------------------------------------------------------------

function PlaygroundTab() {
  const [tableState, setTableState] = useState({
    filters: {},
    sorting: { key: "created_at", direction: "desc" },
    pagination: { page: 1, pageSize: 5, total: TABLE_SOURCE_ROWS.length },
    columnVisibility: {},
    columnSizing: {},
  });
  const [lastEvent,      setLastEvent]      = useState({ type: "—" });
  const [showTableLog,   setShowTableLog]   = useState(false);
  const [workflowKey,    setWorkflowKey]    = useState("");
  const [tableSearch,    setTableSearch]    = useState("");
  const [inputValue,     setInputValue]     = useState("Jordan Carter");
  const [inputInvalid,   setInputInvalid]   = useState(false);
  const [searchValue,    setSearchValue]    = useState("");
  const [dropdownValue,  setDropdownValue]  = useState(null);
  const [dropdownShow,   setDropdownShow]   = useState(false);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalSaving,    setModalSaving]    = useState(false);
  const [toastCount,     setToastCount]     = useState(0);

  const tableColumns = useMemo(() => [
    { key: "employee_code", label: "Code",    sortable: true, width: 130 },
    { key: "full_name",     label: "Name",    sortable: true, width: 180 },
    { key: "team",          label: "Team",    sortable: true, width: 120 },
    {
      key: "status", label: "Status", sortable: true, width: 120,
      render: (row) => {
        const s = getStatusBadge(row.status);
        return <Badge bg={s.bg} text={s.text}>{row.status}</Badge>;
      },
    },
    { key: "created_at", label: "Created", sortable: true, width: 130 },
  ], []);

  const filterConfig = useMemo(() => createFilterConfig([
    { key: "status",     label: "Status",       type: TABLE_FILTER_TYPES.SELECT,    options: STATUS_OPTIONS },
    { key: "created_at", label: "Created Date", type: TABLE_FILTER_TYPES.DATERANGE },
  ]), []);

  const actions = useMemo(() => [
    {
      key: "preview", label: "Preview", type: "primary", icon: "eye",
      onClick: (row) => toastInfo(`Preview: ${row.employee_code}`, "Row Action"),
    },
    {
      key: "edit", label: "Edit", type: "secondary", icon: "pencil-square",
      visible: (row) => row.status === "active",
      onClick: (row) => toastSuccess(`Edit: ${row.full_name}`, "Row Action"),
    },
    {
      key: "deactivate", label: "Deactivate", type: "danger", icon: "x-octagon",
      visible: (row) => row.status === "active",
      confirm: true,
      confirmMessage: (row) => `Deactivate ${row.full_name}?`,
      onClick: (row) => toastWarning(`Deactivated: ${row.full_name}`, "Row Action"),
    },
  ], []);

  const filteredRows = useMemo(() => {
    const f  = tableState.filters || {};
    const sq = normalizeText(f.search);
    const st = normalizeText(f.status);
    const dr = f.created_at || {};
    const start = parseDateOnly(dr.start);
    const end   = parseDateOnly(dr.end);
    return TABLE_SOURCE_ROWS.filter((row) => {
      if (sq) {
        const hay = [row.employee_code, row.full_name, row.team, row.role, row.status, row.created_at].map(normalizeText).join(" ");
        if (!hay.includes(sq)) return false;
      }
      if (st && normalizeText(row.status) !== st) return false;
      const d = parseDateOnly(row.created_at);
      if (start && d && d < start) return false;
      if (end   && d && d > end)   return false;
      return true;
    });
  }, [tableState.filters]);

  const sortedRows = useMemo(() => {
    const { key: sk, direction: sd } = tableState.sorting || {};
    if (!sk) return filteredRows;
    const dir = sd === "desc" ? -1 : 1;
    return filteredRows.slice().sort((a, b) => {
      if (sk === "created_at") {
        return ((parseDateOnly(a.created_at)?.getTime() || 0) - (parseDateOnly(b.created_at)?.getTime() || 0)) * dir;
      }
      return String(a[sk] || "").localeCompare(String(b[sk] || ""), undefined, { sensitivity: "base", numeric: true }) * dir;
    });
  }, [filteredRows, tableState.sorting]);

  const pageSize  = Math.max(1, Number(tableState.pagination?.pageSize || 5));
  const total     = sortedRows.length;
  const maxPage   = Math.max(1, Math.ceil(total / pageSize));
  const page      = Math.min(Math.max(1, Number(tableState.pagination?.page || 1)), maxPage);
  const tableRows = useMemo(() => sortedRows.slice((page - 1) * pageSize, page * pageSize), [sortedRows, page, pageSize]);
  const tableViewState = useMemo(() => ({
    ...tableState,
    pagination: { ...tableState.pagination, page, pageSize, total },
  }), [tableState, page, pageSize, total]);

  const handleTableChange = useCallback((event) => {
    setLastEvent(event || { type: "—" });
    const t = String(event?.type || "").toLowerCase();
    if (t === "search") {
      const v = String(event.value || "").trim();
      setTableState((prev) => ({
        ...prev,
        filters: v ? { ...prev.filters, search: v } : Object.fromEntries(Object.entries(prev.filters).filter(([k]) => k !== "search")),
        pagination: { ...prev.pagination, page: 1 },
      }));
    } else if (t === "filters") {
      setTableState((prev) => ({ ...prev, filters: event.filters || {}, pagination: { ...prev.pagination, page: 1 } }));
    } else if (t === "sorting") {
      setTableState((prev) => ({ ...prev, sorting: event.sorting || {}, pagination: { ...prev.pagination, page: 1 } }));
    } else if (t === "pagination") {
      setTableState((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          page:     Math.max(1, Number(event.pagination?.page     || 1)),
          pageSize: Math.max(1, Number(event.pagination?.pageSize || pageSize)),
        },
      }));
    } else if (t === "columnvisibility") {
      setTableState((prev) => ({ ...prev, columnVisibility: event.columnVisibility || prev.columnVisibility }));
    } else if (t === "columnresize") {
      setTableState((prev) => ({ ...prev, columnSizing: event.columnSizing || prev.columnSizing }));
    } else if (t === "action") {
      event?.action?.onClick?.(event.row);
    } else if (t === "export") {
      toastInfo(`Export: ${String(event?.format || "csv").toUpperCase()}`, "Export");
    }
  }, [pageSize]);

  const runWorkflow = (action) => {
    if (action.critical && !window.confirm(`Continue with ${action.label}?`)) return;
    setWorkflowKey(action.key);
    window.setTimeout(() => { setWorkflowKey(""); toastSuccess(`${action.label} complete.`, "Workflow"); }, 900);
  };

  const runModalSave = () => {
    setModalSaving(true);
    window.setTimeout(() => { setModalSaving(false); setModalOpen(false); toastSuccess("Saved.", "Modal"); }, 900);
  };

  const playgroundItems = [
    {
      key: "play-workflow",
      title: "Workflow Actions (Buttons)",
      content: (
        <div className={styles.playBody}>
          <p className={styles.playLabel}>Click buttons to trigger actions:</p>
          <div className={styles.toolbarRow}>
            {WORKFLOW_ACTIONS.map((a) => (
              <Button key={a.key} size="sm" variant={toButtonVariantByType(a.type)} loading={workflowKey === a.key} onClick={() => runWorkflow(a)}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "play-input",
      title: "Input Field",
      content: (
        <div className={styles.playBody}>
          <div className={styles.formStack}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter text"
              isInvalid={inputInvalid}
            />
            <Button size="sm" onClick={() => setInputInvalid(!inputInvalid)}>
              {inputInvalid ? "Clear Error" : "Show Error"}
            </Button>
          </div>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Value: <code>{inputValue}</code></p>
        </div>
      ),
    },
    {
      key: "play-searchbar",
      title: "SearchBar (with Debounce)",
      content: (
        <div className={styles.playBody}>
          <SearchBar
            value={searchValue}
            debounceMs={300}
            placeholder="Search with debounce…"
            onDebouncedChange={(v) => {
              setSearchValue(v);
              if (v) toastInfo(`Searching: ${v}`, "Search");
            }}
          />
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Value: <code>{searchValue}</code></p>
        </div>
      ),
    },
    {
      key: "play-dropdown",
      title: "Dropdown (Combo Box)",
      content: (
        <div className={styles.playBody}>
          <p className={styles.playLabel}>Click to open menu:</p>
          <Dropdown show={dropdownShow} onToggle={(show) => setDropdownShow(show)}>
            <Dropdown.Toggle variant="secondary" size="sm">
              {dropdownValue?.label || "Select Status"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {DEMO_STATUS_OPTIONS.map((item) => (
                <Dropdown.Item
                  key={item.value}
                  onClick={() => {
                    setDropdownValue(item);
                    setDropdownShow(false);
                    toastSuccess(`Selected: ${item.label}`, "Selection");
                  }}
                >
                  {item.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Selected: <code>{dropdownValue?.label || "—"}</code></p>
        </div>
      ),
    },
    {
      key: "play-modal",
      title: "Modal Dialog",
      content: (
        <div className={styles.playBody}>
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            show={modalOpen}
            onHide={() => setModalOpen(false)}
            title="Confirm Change"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" loading={modalSaving} onClick={runModalSave}>Save</Button>
              </>
            }
          >
            <p style={{ margin: 0, fontSize: 14 }}>Shared modal with footer actions.</p>
          </Modal>
        </div>
      ),
    },
    {
      key: "play-table",
      title: "Data Table (with Filters & Actions)",
      content: (
        <div className={styles.playBody}>
          <Table
            data={tableRows}
            columns={tableColumns}
            state={tableViewState}
            filterConfig={filterConfig}
            actions={actions}
            loading={false}
            pageSizeOptions={[5, 10, 20]}
            searchPlaceholder="Search code, name, team, role, status"
            onChange={handleTableChange}
          />
          <div className={styles.eventLogWrap} style={{ marginTop: 16 }}>
            <button type="button" className={styles.eventLogToggle} onClick={() => setShowTableLog((v) => !v)}>
              <i className={`bi ${showTableLog ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
              {showTableLog ? "Hide" : "Show"} table events
            </button>
            {showTableLog ? <pre className={styles.eventPre}>{JSON.stringify(lastEvent, null, 2)}</pre> : null}
          </div>
        </div>
      ),
    },
    {
      key: "play-badges",
      title: "Badges (Status Display)",
      content: (
        <div className={styles.playBody}>
          <div className={styles.badgeRow}>
            <Badge bg="success">Active</Badge>
            <Badge bg="warning" text="dark">Pending</Badge>
            <Badge bg="secondary">Inactive</Badge>
            <Badge bg="dark">Suspended</Badge>
          </div>
        </div>
      ),
    },
    {
      key: "play-toast",
      title: "Toast Notifications",
      content: (
        <div className={styles.playBody}>
          <div className={styles.actionRow}>
            <Button size="sm" onClick={() => { setToastCount(c => c + 1); toastSuccess("Success message!", "Success"); }}>Success</Button>
            <Button size="sm" variant="secondary" onClick={() => { setToastCount(c => c + 1); toastInfo("Info message!", "Info"); }}>Info</Button>
            <Button size="sm" variant="secondary" onClick={() => { setToastCount(c => c + 1); toastWarning("Warning message!", "Warning"); }}>Warning</Button>
            <Button size="sm" variant="danger" onClick={() => { setToastCount(c => c + 1); toastError("Error message!", "Error"); }}>Error</Button>
          </div>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Toasts shown: {toastCount}</p>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <Accordion items={playgroundItems} />
      <div className={styles.bonusSection}>
        <p className={styles.bonusSectionLabel}>Bonus Playground</p>
        <p className={styles.bonusSectionSub}>Extended scenarios beyond the basics.</p>
        <Accordion items={[
          { key: "bonus-workflow", title: "Workflow Actions with Modal Confirmation", content: <BonusWorkflowModal /> },
          { key: "bonus-table",    title: "Real-World Table Scenario (Employee Review)", content: <BonusRealWorldTable /> },
          { key: "bonus-form",     title: "Add User Form", content: <BonusAddUserForm /> },
        ]} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bonus Playground components
// ---------------------------------------------------------------------------

const TEAM_OPTIONS = [
  { label: "Platform",   value: "platform"   },
  { label: "Risk",       value: "risk"       },
  { label: "Operations", value: "operations" },
  { label: "Finance",    value: "finance"    },
  { label: "Support",    value: "support"    },
  { label: "Audit",      value: "audit"      },
];

const ROLE_OPTIONS = [
  { label: "Admin",   value: "admin"   },
  { label: "Manager", value: "manager" },
  { label: "Analyst", value: "analyst" },
  { label: "Viewer",  value: "viewer"  },
];

const FORM_TEAM_OPTIONS = TEAM_OPTIONS.length > 0
  ? TEAM_OPTIONS
  : [
      { label: "Platform", value: "platform" },
      { label: "Operations", value: "operations" },
      { label: "Risk", value: "risk" },
    ];

const FORM_ROLE_OPTIONS = ROLE_OPTIONS.length > 0
  ? ROLE_OPTIONS
  : [
      { label: "Admin", value: "admin" },
      { label: "Manager", value: "manager" },
      { label: "Viewer", value: "viewer" },
    ];

const FORM_STATUS_OPTIONS = DEMO_STATUS_OPTIONS.length > 0
  ? DEMO_STATUS_OPTIONS
  : [
      { label: "Active", value: "active" },
      { label: "Pending", value: "pending" },
      { label: "Inactive", value: "inactive" },
    ];

const BONUS_WORKFLOW_ACTIONS = [
  { key: "reject",  label: "Reject",  variant: "danger",    message: "This will reject the selected record and notify the submitter." },
  { key: "return",  label: "Return",  variant: "warning",   message: "This will return the record to the submitter for corrections." },
  { key: "recall",  label: "Recall",  variant: "secondary", message: "This will recall the record and place it back in draft state." },
  { key: "void",    label: "Void",    variant: "danger",    message: "This permanently voids the record. This action cannot be undone." },
];

function BonusWorkflowModal() {
  const [pending,  setPending]  = useState(null); // action being confirmed
  const [loading,  setLoading]  = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setPending(null);
      toastSuccess(`${pending.label} completed successfully.`, pending.label);
    }, 900);
  };

  return (
    <div className={styles.playBody}>
      <p className={styles.playLabel}>
        Critical workflow actions use a modal instead of <code>window.confirm</code>.
        Developers remain free to define what happens on click — this is just a pattern example.
      </p>
      <div className={styles.toolbarRow}>
        {BONUS_WORKFLOW_ACTIONS.map((a) => (
          <Button key={a.key} size="sm" variant={a.variant} onClick={() => setPending(a)}>
            {a.label}
          </Button>
        ))}
      </div>

      <Modal
        show={!!pending}
        onHide={() => setPending(null)}
        title={`Confirm: ${pending?.label || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button variant={pending?.variant || "primary"} loading={loading} onClick={handleConfirm}>
              Yes, {pending?.label}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>{pending?.message}</p>
      </Modal>
    </div>
  );
}

const REVIEW_SOURCE_ROWS = [
  { id: 1, employee_code: "EMP-1101", full_name: "Avery Nguyen",  team: "Platform",   role: "admin",   status: "pending",  submitted_at: "2026-04-10" },
  { id: 2, employee_code: "EMP-1102", full_name: "Jordan Patel",  team: "Risk",       role: "manager", status: "pending",  submitted_at: "2026-04-09" },
  { id: 3, employee_code: "EMP-1103", full_name: "Riley Walker",  team: "Operations", role: "analyst", status: "pending",  submitted_at: "2026-04-08" },
  { id: 4, employee_code: "EMP-1104", full_name: "Morgan Torres", team: "Finance",    role: "viewer",  status: "approved", submitted_at: "2026-04-07" },
  { id: 5, employee_code: "EMP-1105", full_name: "Taylor Lopez",  team: "Support",    role: "manager", status: "rejected", submitted_at: "2026-04-06" },
];

function BonusRealWorldTable() {
  const [rows,       setRows]       = useState(REVIEW_SOURCE_ROWS);
  const [tableState, setTableState] = useState({
    filters: {},
    sorting: { key: "submitted_at", direction: "desc" },
    pagination: { page: 1, pageSize: 5, total: REVIEW_SOURCE_ROWS.length },
    columnVisibility: {},
    columnSizing: {},
  });
  const [confirm, setConfirm]   = useState(null); // { action, row }
  const [saving,  setSaving]    = useState(false);

  const columns = useMemo(() => [
    { key: "employee_code", label: "Code",      sortable: true, width: 120 },
    { key: "full_name",     label: "Name",      sortable: true, width: 180 },
    { key: "team",          label: "Team",      sortable: true, width: 120 },
    { key: "role",          label: "Role",      sortable: true, width: 110 },
    {
      key: "status", label: "Status", sortable: true, width: 120,
      render: (row) => {
        const map = { pending: { bg: "warning", text: "dark" }, approved: { bg: "success" }, rejected: { bg: "danger" } };
        const s = map[row.status] || { bg: "secondary" };
        return <Badge bg={s.bg} text={s.text}>{row.status}</Badge>;
      },
    },
    { key: "submitted_at", label: "Submitted", sortable: true, width: 130 },
  ], []);

  const filterConfig = useMemo(() => createFilterConfig([
    { key: "status", label: "Status", type: TABLE_FILTER_TYPES.SELECT, options: [
      { label: "Pending",  value: "pending"  },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ]},
  ]), []);

  const actions = useMemo(() => [
    {
      key: "approve", label: "Approve", type: "primary", icon: "check-circle",
      visible: (row) => row.status === "pending",
      onClick: (row) => setConfirm({ action: "approve", row }),
    },
    {
      key: "reject", label: "Reject", type: "danger", icon: "x-circle",
      visible: (row) => row.status === "pending",
      onClick: (row) => setConfirm({ action: "reject", row }),
    },
  ], []);

  const handleTableChange = useCallback((event) => {
    const t = String(event?.type || "").toLowerCase();
    if (t === "filters") {
      setTableState((prev) => ({ ...prev, filters: event.filters || {}, pagination: { ...prev.pagination, page: 1 } }));
    } else if (t === "sorting") {
      setTableState((prev) => ({ ...prev, sorting: event.sorting || {} }));
    } else if (t === "pagination") {
      setTableState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: Number(event.pagination?.page || 1), pageSize: Number(event.pagination?.pageSize || 5) } }));
    } else if (t === "action") {
      event?.action?.onClick?.(event.row);
    }
  }, []);

  const filteredRows = useMemo(() => {
    const st = tableState.filters?.status;
    return st ? rows.filter((r) => r.status === st) : rows;
  }, [rows, tableState.filters]);

  const pageSize = Number(tableState.pagination?.pageSize || 5);
  const page     = Number(tableState.pagination?.page || 1);
  const tableViewState = useMemo(() => ({
    ...tableState,
    pagination: { ...tableState.pagination, page, pageSize, total: filteredRows.length },
  }), [tableState, page, pageSize, filteredRows.length]);
  const tableRows = useMemo(() => filteredRows.slice((page - 1) * pageSize, page * pageSize), [filteredRows, page, pageSize]);

  const handleConfirmAction = () => {
    setSaving(true);
    window.setTimeout(() => {
      const newStatus = confirm.action === "approve" ? "approved" : "rejected";
      setRows((prev) => prev.map((r) => r.id === confirm.row.id ? { ...r, status: newStatus } : r));
      setSaving(false);
      setConfirm(null);
      if (confirm.action === "approve") toastSuccess(`${confirm.row.full_name} approved.`, "Review");
      else toastError(`${confirm.row.full_name} rejected.`, "Review");
    }, 800);
  };

  return (
    <div className={styles.playBody}>
      <p className={styles.playLabel}>Employee access requests awaiting review. Approve or reject from row actions.</p>
      <Table
        data={tableRows}
        columns={columns}
        state={tableViewState}
        filterConfig={filterConfig}
        actions={actions}
        loading={false}
        pageSizeOptions={[5, 10]}
        searchPlaceholder="Search employees…"
        onChange={handleTableChange}
      />
      <Modal
        show={!!confirm}
        onHide={() => setConfirm(null)}
        title={confirm?.action === "approve" ? "Approve Access" : "Reject Access"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === "approve" ? "primary" : "danger"}
              loading={saving}
              onClick={handleConfirmAction}
            >
              {confirm?.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          {confirm?.action === "approve"
            ? `Grant system access to ${confirm?.row?.full_name}?`
            : `Reject access request from ${confirm?.row?.full_name}? They will be notified.`}
        </p>
      </Modal>
    </div>
  );
}

const EMPTY_FORM = { full_name: "", email: "", team: null, role: null, status: null };

function BonusAddUserForm() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [saving,  setSaving]  = useState(false);

  const errors = {
    full_name: !form.full_name.trim()                           ? "Name is required." : null,
    email:     !form.email.trim()                               ? "Email is required."
             : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) ? "Enter a valid email." : null,
    team:      !form.team   ? "Team is required."   : null,
    role:      !form.role   ? "Role is required."   : null,
    status:    !form.status ? "Status is required." : null,
  };
  const isValid = Object.values(errors).every((e) => !e);

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));
  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = () => {
    setTouched({ full_name: true, email: true, team: true, role: true, status: true });
    if (!isValid) { toastError("Please fix the errors before submitting.", "Validation"); return; }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setForm(EMPTY_FORM);
      setTouched({});
      toastSuccess(`User "${form.full_name}" added successfully.`, "Add User");
    }, 900);
  };

  return (
    <div className={styles.playBody}>
      <p className={styles.playLabel}>Realistic Add User form built entirely with shared components.</p>
      <div className={styles.addUserGrid}>

        <div className={styles.addUserField}>
          <label className={styles.fieldLabel}>Full Name <span className={styles.fieldRequired}>*</span></label>
          <Input
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            onBlur={() => touch("full_name")}
            placeholder="e.g. Jordan Patel"
            isInvalid={!!(touched.full_name && errors.full_name)}
          />
          {touched.full_name && errors.full_name && <p className={styles.fieldError}>{errors.full_name}</p>}
        </div>

        <div className={styles.addUserField}>
          <label className={styles.fieldLabel}>Email <span className={styles.fieldRequired}>*</span></label>
          <Input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => touch("email")}
            placeholder="e.g. jordan@psbuniverse.local"
            isInvalid={!!(touched.email && errors.email)}
          />
          {touched.email && errors.email && <p className={styles.fieldError}>{errors.email}</p>}
        </div>

        <div className={styles.addUserField}>
          <label className={styles.fieldLabel}>Team <span className={styles.fieldRequired}>*</span></label>
          <Dropdown drop="up">
            <Dropdown.Toggle
              variant={touched.team && errors.team ? "danger" : "secondary"}
              size="sm"
              style={{ width: "100%", textAlign: "left" }}
            >
              {form.team?.label || "Select Team"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: "100%" }}>
              {FORM_TEAM_OPTIONS.map((o) => (
                <Dropdown.Item key={o.value} onClick={() => { set("team", o); touch("team"); }}>
                  {o.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {touched.team && errors.team && <p className={styles.fieldError}>{errors.team}</p>}
        </div>

        <div className={styles.addUserField}>
          <label className={styles.fieldLabel}>Role <span className={styles.fieldRequired}>*</span></label>
          <Dropdown drop="up">
            <Dropdown.Toggle
              variant={touched.role && errors.role ? "danger" : "secondary"}
              size="sm"
              style={{ width: "100%", textAlign: "left" }}
            >
              {form.role?.label || "Select Role"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: "100%" }}>
              {FORM_ROLE_OPTIONS.map((o) => (
                <Dropdown.Item key={o.value} onClick={() => { set("role", o); touch("role"); }}>
                  {o.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {touched.role && errors.role && <p className={styles.fieldError}>{errors.role}</p>}
        </div>

        <div className={styles.addUserField}>
          <label className={styles.fieldLabel}>Status <span className={styles.fieldRequired}>*</span></label>
          <Dropdown drop="up">
            <Dropdown.Toggle
              variant={touched.status && errors.status ? "danger" : "secondary"}
              size="sm"
              style={{ width: "100%", textAlign: "left" }}
            >
              {form.status?.label || "Select Status"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: "100%" }}>
              {FORM_STATUS_OPTIONS.map((o) => (
                <Dropdown.Item key={o.value} onClick={() => { set("status", o); touch("status"); }}>
                  {o.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {touched.status && errors.status && <p className={styles.fieldError}>{errors.status}</p>}
        </div>

      </div>
      <div className={styles.addUserActions}>
        <Button variant="secondary" onClick={() => { setForm(EMPTY_FORM); setTouched({}); }}>Reset</Button>
        <Button variant="primary" loading={saving} onClick={handleSubmit}>Add User</Button>
      </div>
    </div>
  );
}

// Reference tab components
function InputRefContent() {
  const [mode, setMode] = useState("basic");
  return (
    <div className={styles.refBody}>
      <div className={styles.propGrid}>
        <RefPropRow prop="value"      required type="string"   desc="Controlled value." />
        <RefPropRow prop="onChange"   required type="function" desc="(event) => void" />
        <RefPropRow prop="placeholder"         type="string"   desc="Hint text." />
        <RefPropRow prop="isInvalid"            type="boolean"  desc="Red border for validation errors." />
        <RefPropRow prop="disabled"             type="boolean"  desc="Prevents interaction." />
      </div>
      <PatternToggle
        modes={[
          { id: "basic", label: "Basic" },
          { id: "validation", label: "Validation" },
        ]}
        active={mode}
        onChange={setMode}
      />
      {mode === "basic" && <Snippet title="Basic input" code={SNIPPET_INPUT} />}
      {mode === "validation" && <Snippet title="With validation" code={SNIPPET_INPUT_VALIDATION} />}
    </div>
  );
}

function SearchBarRefContent() {
  const [mode, setMode] = useState("basic");
  return (
    <div className={styles.refBody}>
      <div className={styles.propGrid}>
        <RefPropRow prop="value"             required type="string"   desc="Controlled search value." />
        <RefPropRow prop="onDebouncedChange" required type="function" desc="Fired after debounce with the new value." />
        <RefPropRow prop="debounceMs"                 type="number"   desc="Debounce delay in ms. Default 350." />
        <RefPropRow prop="placeholder"                type="string"   desc="Hint text." />
      </div>
      <PatternToggle
        modes={[
          { id: "basic", label: "Basic" },
          { id: "api", label: "With API" },
        ]}
        active={mode}
        onChange={setMode}
      />
      {mode === "basic" && <Snippet title="Basic search" code={SNIPPET_SEARCHBAR} />}
      {mode === "api" && <Snippet title="With API reload" code={SNIPPET_SEARCHBAR_WITH_API} />}
    </div>
  );
}

function ModalRefContent() {
  const [mode, setMode] = useState("basic");
  return (
    <div className={styles.refBody}>
      <div className={styles.propGrid}>
        <RefPropRow prop="show"   required type="boolean"    desc="Controls visibility." />
        <RefPropRow prop="onHide" required type="function"   desc="Called on backdrop/close click." />
        <RefPropRow prop="title"  required type="string"     desc="Header text." />
        <RefPropRow prop="footer"          type="ReactNode"  desc="Footer slot — put Cancel + Save here." />
      </div>
      <PatternToggle
        modes={[
          { id: "basic", label: "Basic" },
          { id: "saveflow", label: "Save Flow" },
        ]}
        active={mode}
        onChange={setMode}
      />
      {mode === "basic" && <Snippet title="Basic modal" code={SNIPPET_MODAL} />}
      {mode === "saveflow" && <Snippet title="With save flow" code={SNIPPET_MODAL_SAVE_FLOW} />}
    </div>
  );
}

function ReferenceTab() {
  const accordionItems = [
    {
      key: "ref-table",
      title: "Table",
      content: (
        <div className={styles.refBody}>
          <div className={styles.propGrid}>
            <RefPropRow prop="data"            required type="Array<object>"  desc="Rows for the current page." />
            <RefPropRow prop="columns"         required type="Array<column>"  desc="key, label, sortable, width, render." />
            <RefPropRow prop="state"           required type="object"         desc="filters, sorting, pagination, columnVisibility, columnSizing." />
            <RefPropRow prop="filterConfig"    required type="Array<filter>"  desc="Built with createFilterConfig + TABLE_FILTER_TYPES." />
            <RefPropRow prop="actions"         required type="Array<action>"  desc="Row actions. Empty array hides ActionColumn." />
            <RefPropRow prop="onChange"        required type="function"       desc="Single event channel for all table interactions." />
            <RefPropRow prop="loading"         required type="boolean"        desc="Shows loading state in the table body." />
            <RefPropRow prop="pageSizeOptions"          type="number[]"       desc="e.g. [10, 20, 50]" />
            <RefPropRow prop="exportFormats"            type="string[]"       desc='["csv"] or ["csv","excel"]' />
            <RefPropRow prop="searchPlaceholder"        type="string"         desc="Search bar hint text." />
          </div>
          <Snippet title="How to databind table" code={SNIPPET_TABLE_DATABIND} />
          <Snippet title="Hardcode filters" code={SNIPPET_TABLE_FILTERS_HARDCODE} />
          <Snippet title="Databind filters" code={SNIPPET_TABLE_FILTERS_DATABIND} />
        </div>
      ),
    },
    {
      key: "ref-button",
      title: "Button",
      content: (
        <div className={styles.refBody}>
          <div className={styles.propGrid}>
            <RefPropRow prop="variant"  required type="string"   desc="primary | secondary | danger | ghost" />
            <RefPropRow prop="onClick"  required type="function" desc="Click handler." />
            <RefPropRow prop="loading"           type="boolean"  desc="Spinner + disables interaction." />
            <RefPropRow prop="disabled"          type="boolean"  desc="Prevents interaction." />
            <RefPropRow prop="size"              type="string"   desc="sm | md (default)" />
          </div>
          <Snippet title="Button usage" code={SNIPPET_BUTTON} />
        </div>
      ),
    },
    {
      key: "ref-input",
      title: "Input",
      content: <InputRefContent />,
    },
    {
      key: "ref-searchbar",
      title: "SearchBar",
      content: <SearchBarRefContent />,
    },
    {
      key: "ref-dropdown",
      title: "Dropdown (combo box)",
      content: (
        <div className={styles.refBody}>
          <Snippet title="Basic usage" code={SNIPPET_DROPDOWN_BASIC} />
          <Snippet title="How to databind combo box" code={SNIPPET_DROPDOWN_DATABIND} />
          <Snippet title="Hardcoded combo items" code={SNIPPET_DROPDOWN_HARDCODE} />
        </div>
      ),
    },
    {
      key: "ref-modal",
      title: "Modal",
      content: <ModalRefContent />,
    },
    {
      key: "ref-badge",
      title: "Badge",
      content: (
        <div className={styles.refBody}>
          <div className={styles.badgeRow}>
            <Badge bg="success">Active</Badge>
            <Badge bg="warning" text="dark">Pending</Badge>
            <Badge bg="secondary">Inactive</Badge>
            <Badge bg="dark">Suspended</Badge>
          </div>
          <Snippet title="Badge usage" code={SNIPPET_BADGE} />
        </div>
      ),
    },
    {
      key: "ref-toast",
      title: "Toast",
      content: (
        <div className={styles.refBody}>
          <div className={styles.actionRow}>
            <Button size="sm" variant="primary"   onClick={() => toastSuccess("Done.", "Success")}>Success</Button>
            <Button size="sm" variant="secondary" onClick={() => toastInfo("FYI.", "Info")}>Info</Button>
            <Button size="sm" variant="secondary" onClick={() => toastWarning("Check.", "Warning")}>Warning</Button>
            <Button size="sm" variant="danger"    onClick={() => toastError("Failed.", "Error")}>Error</Button>
          </div>
          <Snippet title="Toast usage" code={SNIPPET_TOAST} />
        </div>
      ),
    },
    {
      key: "ref-rules",
      title: "Rules",
      content: (
        <div className={styles.refBody}>
          <div className={styles.ruleGrid}>
            <div className={styles.ruleCol}>
              <p className={styles.ruleHeading}>DO</p>
              <ul className={styles.ruleList}>
                <li>Import from <code>@/shared/components/ui</code> only.</li>
                <li>Keep all logic in module/controller files.</li>
                <li>Drive behavior through config and props.</li>
                <li>Event flow: UI → module state → API → re-render.</li>
                <li>Own <code>state</code> in your module, not in shared components.</li>
              </ul>
            </div>
            <div className={styles.ruleCol}>
              <p className={styles.ruleHeading}>DO NOT</p>
              <ul className={styles.ruleList}>
                <li>Override shared styles inside module files.</li>
                <li>Create duplicate custom component versions.</li>
                <li>Place API calls or business rules inside shared UI.</li>
                <li>Use reserved key <code>__psb_action_column__</code>.</li>
                <li>Pass actions without <code>key</code>, <code>label</code>, and <code>onClick</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "ref-tokens",
      title: "Tokens",
      content: (
        <div className={styles.refBody}>
          <Snippet title="Design tokens" code={SNIPPET_TOKENS} />
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.refLayout}>
        <nav className={styles.refNav} aria-label="Reference navigation">
          <div className={styles.refNavGroup}>
            <p className={styles.refNavGroupLabel}>GET STARTED</p>
            <span className={styles.refNavItem}>Quick Start</span>
          </div>
          <div className={styles.refNavGroup}>
            <p className={styles.refNavGroupLabel}>BUILDING</p>
            <span className={styles.refNavItem}>Table</span>
            <span className={styles.refNavItem}>Forms</span>
            <span className={styles.refNavItem}>Actions</span>
            <span className={styles.refNavItem}>Feedback</span>
          </div>
          <div className={styles.refNavGroup}>
            <p className={styles.refNavGroupLabel}>PLAYGROUND</p>
            <span className={styles.refNavItem}>Live Demo</span>
          </div>
          <div className={styles.refNavGroup}>
            <p className={styles.refNavGroupLabel}>REFERENCE</p>
            <span className={styles.refNavItem}>Components</span>
            <span className={styles.refNavItem}>Rules</span>
            <span className={styles.refNavItem}>Tokens</span>
          </div>
        </nav>

        <div className={styles.refDocs}>
          <Accordion items={accordionItems} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const TABS = [
  { id: "quick-start", label: "Quick Start" },
  { id: "playground",  label: "Playground"  },
  { id: "reference",   label: "Reference"   },
];

export default function SharedUiReferencePage() {
  const [activeTab, setActiveTab] = useState("quick-start");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>Shared UI Components</p>
          <h1 className={styles.title}>Developer Guide</h1>
          <p className={styles.subtitle}>Scan, copy, move on.</p>
        </div>
        <nav className={styles.tabBar} role="tablist" aria-label="Page sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={[styles.tab, activeTab === tab.id ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "quick-start" && <QuickStartTab />}
      {activeTab === "playground"  && <PlaygroundTab />}
      {activeTab === "reference"   && <ReferenceTab  />}
    </div>
  );
}
