import { useMemo } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

export function CardModuleDialog({
  dialog, groupDraft, cardDraft, isMutatingAction,
  setGroupDraft, setCardDraft, closeDialog,
  submitAddGroup, submitEditGroup, submitToggleGroup, submitDeactivateGroup,
  submitAddCard, submitEditCard, submitToggleCard, submitDeactivateCard,
}) {
  const kind = dialog?.kind;

  const dialogTitle = useMemo(() => {
    const titles = {
      "add-group": "Add Card Group", "edit-group": "Edit Card Group",
      "toggle-group": `${dialog?.nextIsActive ? "Enable" : "Disable"} Card Group`,
      "deactivate-group": "Deactivate Card Group",
      "add-card": "Add Card", "edit-card": "Edit Card",
      "toggle-card": `${dialog?.nextIsActive ? "Enable" : "Disable"} Card`,
      "deactivate-card": "Deactivate Card",
    };
    return titles[kind] || "";
  }, [kind, dialog?.nextIsActive]);

  if (!kind) return null;
  const isBusy = isMutatingAction;

  const submitMap = {
    "add-group": submitAddGroup, "edit-group": submitEditGroup,
    "toggle-group": submitToggleGroup, "deactivate-group": submitDeactivateGroup,
    "add-card": submitAddCard, "edit-card": submitEditCard,
    "toggle-card": submitToggleCard, "deactivate-card": submitDeactivateCard,
  };

  const fc = {
    "add-group": { label: "Add Group", variant: "primary" },
    "edit-group": { label: "Save", variant: "primary" },
    "add-card": { label: "Add Card", variant: "primary" },
    "edit-card": { label: "Save", variant: "primary" },
    "toggle-group": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "toggle-card": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "deactivate-group": { label: "Deactivate Group", variant: "danger" },
    "deactivate-card": { label: "Deactivate Card", variant: "danger" },
  }[kind] || { label: "OK", variant: "primary" };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={closeDialog} disabled={isBusy}>Cancel</Button>
      <Button type="button" variant={fc.variant} onClick={submitMap[kind]} loading={isBusy}>{fc.label}</Button>
    </>
  );

  const isGroupForm = kind === "add-group" || kind === "edit-group";
  const isCardForm = kind === "add-card" || kind === "edit-card";

  return (
    <Modal show onHide={closeDialog} title={dialogTitle} footer={footer}>
      {isGroupForm ? (
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label mb-1">Group Name</label>
            <Input value={groupDraft.name} onChange={(e) => setGroupDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Enter group name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Description</label>
            <Input as="textarea" rows={3} value={groupDraft.desc} onChange={(e) => setGroupDraft((p) => ({ ...p, desc: e.target.value }))} placeholder="Enter group description" />
          </div>
          <div>
            <label className="form-label mb-1">Icon</label>
            <Input value={groupDraft.icon} onChange={(e) => setGroupDraft((p) => ({ ...p, icon: e.target.value }))} placeholder="e.g. bi-collection" />
          </div>
        </div>
      ) : null}

      {isCardForm ? (
        <div className="d-flex flex-column gap-3">
          {kind === "add-card" ? (
            <div className="small text-muted">Creating card for <strong>{dialog?.target?.group_name || "selected group"}</strong></div>
          ) : null}
          <div>
            <label className="form-label mb-1">Card Name</label>
            <Input value={cardDraft.name} onChange={(e) => setCardDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Enter card name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Description</label>
            <Input as="textarea" rows={3} value={cardDraft.desc} onChange={(e) => setCardDraft((p) => ({ ...p, desc: e.target.value }))} placeholder="Enter card description" />
          </div>
          <div>
            <label className="form-label mb-1">Route Path</label>
            <Input value={cardDraft.route_path} onChange={(e) => setCardDraft((p) => ({ ...p, route_path: e.target.value }))} placeholder="e.g. /my-module" />
          </div>
          <div>
            <label className="form-label mb-1">Icon</label>
            <Input value={cardDraft.icon} onChange={(e) => setCardDraft((p) => ({ ...p, icon: e.target.value }))} placeholder="e.g. bi-grid-3x3-gap" />
          </div>
        </div>
      ) : null}

      {kind === "toggle-group" ? (
        <p className="mb-0">{dialog?.nextIsActive ? "Enable" : "Disable"} card group <strong>{dialog?.target?.group_name || ""}</strong>?</p>
      ) : null}

      {kind === "toggle-card" ? (
        <p className="mb-0">{dialog?.nextIsActive ? "Enable" : "Disable"} card <strong>{dialog?.target?.card_name || ""}</strong>?</p>
      ) : null}

      {kind === "deactivate-group" ? (
        <p className="mb-0 text-danger">Deactivate card group <strong>{dialog?.target?.group_name || ""}</strong> and all associated cards?</p>
      ) : null}

      {kind === "deactivate-card" ? (
        <p className="mb-0 text-danger">Deactivate card <strong>{dialog?.target?.card_name || ""}</strong>?</p>
      ) : null}
    </Modal>
  );
}
