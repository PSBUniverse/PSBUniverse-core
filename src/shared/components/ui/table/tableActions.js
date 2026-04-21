import { useCallback } from "react";
import {
  resolveBatchTypeFromAction,
  resolveNextBatchState,
} from "@/shared/components/ui/table/tableUtils";

export function useTableActions({
  batchMode = false,
  onBatchChange,
  onRowAction,
  batchApi,
}) {
  const handleAction = useCallback(
    ({ action, row, rowIndex }) => {
      if (!action) {
        return;
      }

      if (batchMode) {
        const batchType = resolveBatchTypeFromAction(action);
        const nextBatchState = resolveNextBatchState(row?.__batchState, batchType);
        const nextRow = {
          ...(row || {}),
          __batchState: nextBatchState,
        };

        if (batchApi && typeof batchApi.stageRowChange === "function") {
          batchApi.stageRowChange({
            type: batchType,
            row: nextRow,
            previousRow: row,
            action,
            batchState: nextBatchState,
            rowIndex,
            source: "Table",
          });
          return;
        }

        if (typeof onBatchChange === "function") {
          onBatchChange({
            type: batchType,
            row: nextRow,
            previousRow: row,
            action,
            batchState: nextBatchState,
            rowIndex,
            source: "Table",
          });
        }

        return;
      }

      if (typeof onRowAction === "function") {
        onRowAction({ action, row, rowIndex });
        return;
      }

      if (typeof action.onClick === "function") {
        action.onClick(row, rowIndex);
      }
    },
    [batchApi, batchMode, onBatchChange, onRowAction],
  );

  return {
    handleAction,
  };
}
