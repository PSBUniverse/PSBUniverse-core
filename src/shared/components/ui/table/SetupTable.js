"use client";

import { useCallback, useMemo } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button from "@/shared/components/ui/controls/Button";

function toRowId(row, rowIdKey, index) {
  const value = row?.[rowIdKey];
  return value === undefined || value === null || value === "" ? `row-${index}` : String(value);
}

function renderValue(value) {
  return value === undefined || value === null || value === "" ? "--" : value;
}

function resolveCellStyle(column) {
  return {
    width: column?.width,
    textAlign: column?.align || "left",
    verticalAlign: "middle",
    wordBreak: "break-word",
  };
}

function ActionCell({ row, rowIndex, draggable, dragHandleProps, renderActions }) {
  return (
    <td
      style={{ width: 140, verticalAlign: "middle" }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="d-flex align-items-center gap-1">
        {draggable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2 psb-setup-action-btn psb-setup-action-drag"
            aria-label="Drag row to reorder"
            title="Drag row to reorder"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            {...dragHandleProps}
          >
            <i className="bi bi-grip-vertical" aria-hidden="true" />
          </Button>
        ) : null}
        {typeof renderActions === "function" ? renderActions(row, rowIndex) : null}
      </div>
    </td>
  );
}

function SortableBodyRow({
  row,
  rowIndex,
  rowId,
  columns,
  rowClickable,
  isSelected,
  onRowClick,
  draggable,
  renderActions,
  rowClassName,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rowId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isSelected ? "#eef4ff" : undefined,
    opacity: isDragging ? 0.85 : 1,
    cursor: rowClickable ? "pointer" : "default",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={["psb-setup-row", rowClassName, isSelected ? "psb-setup-row-selected" : ""].filter(Boolean).join(" ")}
      onClick={rowClickable ? () => onRowClick(row) : undefined}
    >
      <ActionCell
        row={row}
        rowIndex={rowIndex}
        draggable={draggable}
        dragHandleProps={{ ...attributes, ...listeners }}
        renderActions={renderActions}
      />
      {columns.map((column) => {
        const rawValue = row?.[column.key];
        const rendered = typeof column.render === "function" ? column.render(row, rawValue, rowIndex) : renderValue(rawValue);

        return (
          <td key={`${rowId}-${column.key}`} style={resolveCellStyle(column)}>
            {rendered}
          </td>
        );
      })}
    </tr>
  );
}

function StaticBodyRow({
  row,
  rowIndex,
  rowId,
  columns,
  rowClickable,
  isSelected,
  onRowClick,
  draggable,
  renderActions,
  rowClassName,
}) {
  return (
    <tr
      style={{
        backgroundColor: isSelected ? "#eef4ff" : undefined,
        cursor: rowClickable ? "pointer" : "default",
      }}
      className={["psb-setup-row", rowClassName, isSelected ? "psb-setup-row-selected" : ""].filter(Boolean).join(" ")}
      onClick={rowClickable ? () => onRowClick(row) : undefined}
    >
      <ActionCell row={row} rowIndex={rowIndex} draggable={draggable} renderActions={renderActions} />
      {columns.map((column) => {
        const rawValue = row?.[column.key];
        const rendered = typeof column.render === "function" ? column.render(row, rawValue, rowIndex) : renderValue(rawValue);

        return (
          <td key={`${rowId}-${column.key}`} style={resolveCellStyle(column)}>
            {rendered}
          </td>
        );
      })}
    </tr>
  );
}

export default function SetupTable({
  columns = [],
  rows = [],
  rowIdKey = "id",
  selectedRowId = null,
  onRowClick,
  renderActions,
  draggable = false,
  onReorder,
  emptyMessage = "No records found.",
  className = "",
}) {
  const normalizedColumns = Array.isArray(columns) ? columns : [];
  const normalizedRows = useMemo(
    () => (Array.isArray(rows) ? rows : []).map((row, index) => ({ row, rowId: toRowId(row, rowIdKey, index), index })),
    [rowIdKey, rows],
  );
  const rowIds = useMemo(() => normalizedRows.map((entry) => entry.rowId), [normalizedRows]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const rowClickable = typeof onRowClick === "function";
  const hasRows = normalizedRows.length > 0;

  const handleDragEnd = useCallback(
    (event) => {
      if (!draggable || typeof onReorder !== "function") {
        return;
      }

      const activeId = String(event?.active?.id || "");
      const overId = String(event?.over?.id || "");

      if (!activeId || !overId || activeId === overId) {
        return;
      }

      const oldIndex = rowIds.indexOf(activeId);
      const newIndex = rowIds.indexOf(overId);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onReorder(arrayMove(rows, oldIndex, newIndex));
    },
    [draggable, onReorder, rowIds, rows],
  );

  const tableBody = !hasRows ? (
    <tbody>
      <tr>
        <td colSpan={normalizedColumns.length + 1} className="text-muted text-center py-3">
          {emptyMessage}
        </td>
      </tr>
    </tbody>
  ) : draggable ? (
    <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
      <tbody>
        {normalizedRows.map(({ row, rowId, index }) => (
          <SortableBodyRow
            key={rowId}
            row={row}
            rowIndex={index}
            rowId={rowId}
            columns={normalizedColumns}
            rowClickable={rowClickable}
            isSelected={String(selectedRowId ?? "") === String(row?.[rowIdKey] ?? "")}
            onRowClick={onRowClick}
            draggable={draggable}
            renderActions={renderActions}
            rowClassName={[
              index % 2 === 1 ? "table-light" : "",
              typeof row?.__batchClassName === "string" ? row.__batchClassName : "",
            ].filter(Boolean).join(" ")}
          />
        ))}
      </tbody>
    </SortableContext>
  ) : (
    <tbody>
      {normalizedRows.map(({ row, rowId, index }) => (
        <StaticBodyRow
          key={rowId}
          row={row}
          rowIndex={index}
          rowId={rowId}
          columns={normalizedColumns}
          rowClickable={rowClickable}
          isSelected={String(selectedRowId ?? "") === String(row?.[rowIdKey] ?? "")}
          onRowClick={onRowClick}
          draggable={false}
          renderActions={renderActions}
          rowClassName={[
            index % 2 === 1 ? "table-light" : "",
            typeof row?.__batchClassName === "string" ? row.__batchClassName : "",
          ].filter(Boolean).join(" ")}
        />
      ))}
    </tbody>
  );

  const tableMarkup = (
    <table className="table table-sm table-hover mb-0" style={{ width: "100%", tableLayout: "fixed" }}>
      <thead className="table-light">
        <tr>
          <th style={{ width: 140, verticalAlign: "middle" }}>Actions</th>
          {normalizedColumns.map((column) => (
            <th key={column.key} style={{ width: column?.width, textAlign: column?.align || "left", verticalAlign: "middle" }}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      {tableBody}
    </table>
  );

  return (
    <div className={className} style={{ border: "1px solid #dee2e6", borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" }}>
      {draggable && hasRows ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {tableMarkup}
        </DndContext>
      ) : tableMarkup}
    </div>
  );
}