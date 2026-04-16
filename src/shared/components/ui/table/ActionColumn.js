"use client";

import { useMemo } from "react";
import Button from "@/shared/components/ui/controls/Button";
import Dropdown from "@/shared/components/ui/controls/Dropdown";

const ACTION_TYPE_ORDER = Object.freeze({
  primary: 1,
  secondary: 2,
  danger: 3,
});

function normalizeActionType(value) {
  const raw = String(value || "secondary").trim().toLowerCase();

  if (raw === "primary") return "primary";
  if (raw === "danger") return "danger";
  return "secondary";
}

function resolveButtonVariant(type) {
  if (type === "primary") return "primary";
  if (type === "danger") return "danger";
  return "secondary";
}

function resolveIconClassName(icon) {
  const raw = String(icon || "").trim();
  if (!raw) return "";

  if (raw.includes(" ")) {
    return raw;
  }

  if (raw.startsWith("bi-")) {
    return `bi ${raw}`;
  }

  if (raw.startsWith("bi")) {
    return raw;
  }

  return `bi bi-${raw}`;
}

function resolveVisibleActions(actions, row) {
  return actions
    .filter((action) => {
      if (!action || typeof action !== "object") {
        return false;
      }

      if (typeof action.visible !== "function") {
        return true;
      }

      try {
        return action.visible(row) !== false;
      } catch {
        return false;
      }
    })
    .map((action) => ({
      ...action,
      type: normalizeActionType(action.type),
    }))
    .sort((left, right) => {
      const leftOrder = ACTION_TYPE_ORDER[left.type] || ACTION_TYPE_ORDER.secondary;
      const rightOrder = ACTION_TYPE_ORDER[right.type] || ACTION_TYPE_ORDER.secondary;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return String(left.label || "").localeCompare(String(right.label || ""));
    });
}

function isDisabled(action, row) {
  if (typeof action.disabled === "function") {
    try {
      return action.disabled(row) === true;
    } catch {
      return true;
    }
  }

  return action.disabled === true;
}

function passConfirmation(action, row) {
  const actionType = normalizeActionType(action.type);
  const requiresConfirmation = actionType === "danger" || action.confirm === true;

  if (!requiresConfirmation) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const label = String(action.label || "this action").trim();
  const fallbackMessage = `Confirm ${label}?`;
  const customMessage =
    typeof action.confirmMessage === "function"
      ? action.confirmMessage(row, action)
      : action.confirmMessage;

  const message = String(customMessage || fallbackMessage).trim() || fallbackMessage;
  return window.confirm(message);
}

export default function ActionColumn({ row, actions = [], onAction }) {
  const visibleActions = useMemo(
    () => resolveVisibleActions(Array.isArray(actions) ? actions : [], row),
    [actions, row],
  );

  const emitAction = (action) => {
    if (!action || isDisabled(action, row)) {
      return;
    }

    if (!passConfirmation(action, row)) {
      return;
    }

    if (typeof onAction === "function") {
      onAction({ action, row });
    }
  };

  if (visibleActions.length === 0) {
    return <span className="table-actions-empty">-</span>;
  }

  if (visibleActions.length === 1) {
    const action = visibleActions[0];
    const iconClassName = resolveIconClassName(action.icon);

    return (
      <div className="table-actions">
        <Button
          size="sm"
          variant={resolveButtonVariant(action.type)}
          disabled={isDisabled(action, row)}
          onClick={() => emitAction(action)}
        >
          {iconClassName ? <i className={`${iconClassName} me-1`} aria-hidden="true" /> : null}
          {action.label}
        </Button>
      </div>
    );
  }

  const nonDangerActions = visibleActions.filter((action) => action.type !== "danger");
  const dangerActions = visibleActions.filter((action) => action.type === "danger");

  return (
    <div className="table-actions">
      <Dropdown align="end">
        <Dropdown.Toggle variant="secondary" size="sm" className="table-actions-toggle" aria-label="Open actions">
          <i className="bi bi-three-dots-vertical" aria-hidden="true" />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {nonDangerActions.map((action) => {
            const iconClassName = resolveIconClassName(action.icon);

            return (
              <Dropdown.Item
                key={String(action.key || action.label)}
                disabled={isDisabled(action, row)}
                onClick={() => emitAction(action)}
              >
                {iconClassName ? <i className={`${iconClassName} me-2`} aria-hidden="true" /> : null}
                {action.label}
              </Dropdown.Item>
            );
          })}

          {nonDangerActions.length > 0 && dangerActions.length > 0 ? <Dropdown.Divider /> : null}

          {dangerActions.map((action) => {
            const iconClassName = resolveIconClassName(action.icon);

            return (
              <Dropdown.Item
                key={String(action.key || action.label)}
                className="table-actions-danger-item"
                disabled={isDisabled(action, row)}
                onClick={() => emitAction(action)}
              >
                {iconClassName ? <i className={`${iconClassName} me-2`} aria-hidden="true" /> : null}
                {action.label}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
