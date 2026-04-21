import { useCallback, useEffect, useMemo, useRef, useState } from "react";
/* eslint-disable react-hooks/set-state-in-effect */
import {
  BATCH_STATE_CREATED,
  BATCH_STATE_DELETED,
  BATCH_STATE_NONE,
  normalizeBatchState,
  stripBatchState,
  toRowId,
  withNormalizedBatchState,
} from "@/shared/components/ui/table/tableUtils";

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => withNormalizedBatchState(row));
}

function stripRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => stripBatchState(row));
}

function stripBatchMetadata(row) {
  if (!row || typeof row !== "object") {
    return row;
  }

  const {
    __batchState,
    ...rest
  } = row;

  return rest;
}

function buildSavePayload(rows, rowIdKey) {
  const created = [];
  const updated = [];
  const deleted = [];

  (Array.isArray(rows) ? rows : []).forEach((row, index) => {
    const batchState = normalizeBatchState(row?.__batchState);

    if (batchState === BATCH_STATE_NONE) {
      return;
    }

    const rowId = toRowId(row, rowIdKey, index);

    if (batchState === BATCH_STATE_CREATED) {
      created.push({
        tempId: rowId,
        data: stripBatchMetadata(row),
      });
      return;
    }

    if (batchState === BATCH_STATE_DELETED) {
      deleted.push({
        id: rowId,
      });
      return;
    }

    updated.push({
      id: rowId,
      data: stripBatchMetadata(row),
    });
  });

  return {
    created,
    updated,
    deleted,
  };
}

function hasPendingBatchChanges(rows) {
  return (Array.isArray(rows) ? rows : []).some((row) => normalizeBatchState(row?.__batchState) !== BATCH_STATE_NONE);
}

export function useTableBatchEdit({
  data,
  rowIdKey = "id",
  batchMode = false,
  onBatchChange,
  onBatchSave,
}) {
  const normalizedIncomingData = useMemo(() => normalizeRows(data), [data]);
  const externalBatchMode = batchMode === true && typeof onBatchChange === "function";

  const originalDataRef = useRef(stripRows(normalizedIncomingData));
  const [internalRows, setInternalRows] = useState(normalizedIncomingData);
  const [dirtyInternalRows, setDirtyInternalRows] = useState(false);

  useEffect(() => {
    if (!batchMode) {
      originalDataRef.current = stripRows(normalizedIncomingData);
      setInternalRows(normalizedIncomingData);
      setDirtyInternalRows(false);
      return;
    }

    if (externalBatchMode || !dirtyInternalRows) {
      originalDataRef.current = stripRows(normalizedIncomingData);
      setInternalRows(normalizedIncomingData);
      setDirtyInternalRows(false);
    }
  }, [batchMode, dirtyInternalRows, externalBatchMode, normalizedIncomingData]);

  const rows = batchMode && !externalBatchMode ? internalRows : normalizedIncomingData;

  const stageRowChange = useCallback(
    (payload) => {
      if (!batchMode) {
        return;
      }

      const nextRowId = toRowId(payload?.row, rowIdKey, payload?.rowIndex || 0);

      if (externalBatchMode) {
        onBatchChange?.(payload);
        return;
      }

      setInternalRows((previousRows) =>
        previousRows.map((row, index) => {
          const currentRowId = toRowId(row, rowIdKey, index);
          return currentRowId === nextRowId ? withNormalizedBatchState(payload?.row) : row;
        }),
      );
      setDirtyInternalRows(true);
    },
    [batchMode, externalBatchMode, onBatchChange, rowIdKey],
  );

  const applyReorder = useCallback(
    (nextRows, meta = {}) => {
      if (!batchMode) {
        return;
      }

      if (externalBatchMode) {
        onBatchChange?.({
          type: "reorder",
          rows: nextRows,
          source: meta.source || "Table",
        });
        return;
      }

      setInternalRows(normalizeRows(nextRows));
      setDirtyInternalRows(true);
    },
    [batchMode, externalBatchMode, onBatchChange],
  );

  const cancelBatch = useCallback(() => {
    const restoredRows = stripRows(originalDataRef.current);

    if (!batchMode) {
      return restoredRows;
    }

    if (externalBatchMode) {
      onBatchChange?.({
        type: "cancel",
        rows: restoredRows,
        source: "Table",
      });
      return restoredRows;
    }

    setInternalRows(restoredRows);
    setDirtyInternalRows(false);
    return restoredRows;
  }, [batchMode, externalBatchMode, onBatchChange]);

  const saveBatch = useCallback(async () => {
    if (!batchMode || typeof onBatchSave !== "function") {
      return null;
    }

    const payload = buildSavePayload(rows, rowIdKey);
    await onBatchSave(payload);

    const committedRows = stripRows(rows);
    originalDataRef.current = committedRows;

    if (!externalBatchMode) {
      setInternalRows(committedRows);
      setDirtyInternalRows(false);
    }

    return payload;
  }, [batchMode, externalBatchMode, onBatchSave, rowIdKey, rows]);

  const pendingPayload = useMemo(() => buildSavePayload(rows, rowIdKey), [rowIdKey, rows]);
  const hasPendingChanges = useMemo(() => hasPendingBatchChanges(rows), [rows]);

  return {
    rows,
    externalBatchMode,
    hasPendingChanges,
    pendingPayload,
    stageRowChange,
    applyReorder,
    saveBatch,
    cancelBatch,
  };
}
