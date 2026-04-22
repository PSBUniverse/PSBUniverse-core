"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, Input, Modal, TableZ, toastError, toastSuccess } from "@/shared/components/ui";
import {
  getCardGroupDescription,
  getCardGroupDisplayName,
  getCardGroupDisplayOrder,
  getCardGroupIcon,
  isCardGroupActive,
} from "@/modules/card-module-setup/model/cardGroup.model.js";
import {
  getCardDescription,
  getCardDisplayName,
  getCardDisplayOrder,
  getCardIcon,
  getCardRoutePath,
  isCardActive,
} from "@/modules/card-module-setup/model/card.model.js";

function parseId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value).trim();
  const asNumber = Number(text);
  return Number.isFinite(asNumber) ? asNumber : text;
}

function isSameId(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function buildOrderSignature(rows, idKey) {
  return (Array.isArray(rows) ? rows : []).map((row) => String(row?.[idKey] || "")).join("|");
}

function mapGroupRow(group, index) {
  const order = getCardGroupDisplayOrder(group, index + 1);
  return {
    ...group,
    id: group?.group_id ?? `grp-${index}`,
    group_name: getCardGroupDisplayName(group),
    group_desc: getCardGroupDescription(group),
    group_icon: getCardGroupIcon(group),
    display_order: order,
    __originalOrder: order,
    is_active_bool: isCardGroupActive(group),
  };
}

function mapCardRow(card, index) {
  const order = getCardDisplayOrder(card, index + 1);
  return {
    ...card,
    id: card?.card_id ?? `card-${index}`,
    card_name: getCardDisplayName(card),
    card_desc: getCardDescription(card),
    route_path: getCardRoutePath(card),
    card_icon: getCardIcon(card),
    display_order: order,
    __originalOrder: order,
    is_active_bool: isCardActive(card),
  };
}

function resolveErrorMessage(payload, fallbackMessage) {
  if (payload && typeof payload === "object" && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
}

const EMPTY_DIALOG = {
  kind: null,
  target: null,
  nextIsActive: null,
};

const TEMP_GROUP_PREFIX = "tmp-grp-";
const TEMP_CARD_PREFIX = "tmp-card-";

function createEmptyBatchState() {
  return {
    groupCreates: [],
    groupUpdates: {},
    groupDeactivations: [],
    cardCreates: [],
    cardUpdates: {},
    cardDeactivations: [],
  };
}

function createTempId(prefix) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTempGroupId(value) {
  return String(value ?? "").startsWith(TEMP_GROUP_PREFIX);
}

function isTempCardId(value) {
  return String(value ?? "").startsWith(TEMP_CARD_PREFIX);
}

function removeObjectKey(objectValue, keyToRemove) {
  const normalizedKey = String(keyToRemove ?? "");
  const nextObject = {};

  Object.entries(objectValue || {}).forEach(([key, value]) => {
    if (key !== normalizedKey) {
      nextObject[key] = value;
    }
  });

  return nextObject;
}

function mergeUpdatePatch(previousPatch, nextPatch) {
  const mergedPatch = {
    ...(previousPatch || {}),
  };

  Object.entries(nextPatch || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      mergedPatch[key] = value;
    }
  });

  return mergedPatch;
}

function appendUniqueId(idList, value) {
  const normalizedValue = String(value ?? "");

  if (!normalizedValue) {
    return Array.isArray(idList) ? [...idList] : [];
  }

  const existing = Array.isArray(idList) ? idList : [];
  if (existing.some((entry) => isSameId(entry, normalizedValue))) {
    return [...existing];
  }

  return [...existing, normalizedValue];
}

function StatusBadge({ isActive }) {
  return (
    <Badge bg={isActive ? "success" : "primary"} text="light">
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function CardModuleSetupClient({
  applications = [],
  cardGroups = [],
  cards = [],
  initialSelectedAppId = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeApplications = useMemo(
    () => (Array.isArray(applications) ? applications : []),
    [applications],
  );

  const seedCardGroups = useMemo(
    () =>
      (Array.isArray(cardGroups) ? cardGroups : [])
        .map((group, index) => mapGroupRow(group, index))
        .sort((left, right) => {
          const orderDiff = Number(left.display_order || 0) - Number(right.display_order || 0);
          if (orderDiff !== 0) return orderDiff;
          return compareText(left.group_name, right.group_name);
        }),
    [cardGroups],
  );

  const seedCards = useMemo(
    () =>
      (Array.isArray(cards) ? cards : [])
        .map((card, index) => mapCardRow(card, index))
        .sort((left, right) => {
          const orderDiff = Number(left.display_order || 0) - Number(right.display_order || 0);
          if (orderDiff !== 0) return orderDiff;
          return compareText(left.card_name, right.card_name);
        }),
    [cards],
  );

  const initialAppId = useMemo(() => {
    if (initialSelectedAppId !== null && initialSelectedAppId !== undefined && initialSelectedAppId !== "") {
      return initialSelectedAppId;
    }
    return safeApplications[0]?.app_id ?? null;
  }, [initialSelectedAppId, safeApplications]);

  const [orderedGroups, setOrderedGroups] = useState(seedCardGroups);
  const [allCards, setAllCards] = useState(seedCards);
  const [persistedGroupOrderSignature, setPersistedGroupOrderSignature] = useState(() => {
    const initialGroups = seedCardGroups.filter(
      (group) => isSameId(group?.app_id, initialAppId),
    );
    return buildOrderSignature(initialGroups, "group_id");
  });
  const [persistedCardOrderSignatures, setPersistedCardOrderSignatures] = useState(() => {
    const initialGroups = seedCardGroups.filter(
      (group) => isSameId(group?.app_id, initialAppId),
    );
    const sigMap = {};
    for (const group of initialGroups) {
      const gid = String(group?.group_id ?? "");
      const cards = seedCards
        .filter((card) => isSameId(card?.group_id, group?.group_id))
        .sort((a, b) => {
          const od = Number(a.display_order || 0) - Number(b.display_order || 0);
          if (od !== 0) return od;
          return compareText(a.card_name, b.card_name);
        });
      sigMap[gid] = buildOrderSignature(cards, "card_id");
    }
    return sigMap;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isMutatingAction, setIsMutatingAction] = useState(false);
  const [pendingBatch, setPendingBatch] = useState(createEmptyBatchState());
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [groupDraft, setGroupDraft] = useState({ name: "", desc: "", icon: "" });
  const [cardDraft, setCardDraft] = useState({ name: "", desc: "", route_path: "", icon: "" });

  useEffect(() => {
    setOrderedGroups(seedCardGroups);
    setAllCards(seedCards);
    const resetGroups = seedCardGroups.filter(
      (group) => isSameId(group?.app_id, initialAppId),
    );
    setPersistedGroupOrderSignature(buildOrderSignature(resetGroups, "group_id"));
    const resetSigMap = {};
    for (const group of resetGroups) {
      const gid = String(group?.group_id ?? "");
      const cards = seedCards
        .filter((card) => isSameId(card?.group_id, group?.group_id))
        .sort((a, b) => {
          const od = Number(a.display_order || 0) - Number(b.display_order || 0);
          if (od !== 0) return od;
          return compareText(a.card_name, b.card_name);
        });
      resetSigMap[gid] = buildOrderSignature(cards, "card_id");
    }
    setPersistedCardOrderSignatures(resetSigMap);
    setIsSaving(false);
    setIsMutatingAction(false);
    setPendingBatch(createEmptyBatchState());
    setDialog(EMPTY_DIALOG);
    setGroupDraft({ name: "", desc: "", icon: "" });
    setCardDraft({ name: "", desc: "", route_path: "", icon: "" });
  }, [seedCardGroups, seedCards, initialAppId]);

  const selectedAppId = useMemo(() => {
    const appFromQuery = parseId(searchParams?.get("app"));

    if (appFromQuery !== null) {
      return appFromQuery;
    }

    if (initialSelectedAppId !== null && initialSelectedAppId !== undefined && initialSelectedAppId !== "") {
      return initialSelectedAppId;
    }

    return safeApplications[0]?.app_id ?? null;
  }, [initialSelectedAppId, safeApplications, searchParams]);

  const selectedApp = useMemo(
    () =>
      safeApplications.find((app) => isSameId(app?.app_id, selectedAppId))
      ?? safeApplications[0]
      ?? null,
    [safeApplications, selectedAppId],
  );

  const appGroups = useMemo(
    () => orderedGroups.filter((group) => isSameId(group?.app_id, selectedApp?.app_id)),
    [orderedGroups, selectedApp?.app_id],
  );

  const currentGroupOrderSignature = useMemo(
    () => buildOrderSignature(appGroups, "group_id"),
    [appGroups],
  );

  const hasGroupOrderChanges = persistedGroupOrderSignature !== currentGroupOrderSignature;

  const selectedGroupId = useMemo(() => {
    const groupFromQuery = parseId(searchParams?.get("group"));

    if (groupFromQuery !== null) {
      const found = appGroups.find((group) => isSameId(group?.group_id, groupFromQuery));
      if (found) return groupFromQuery;
    }

    return appGroups[0]?.group_id ?? null;
  }, [appGroups, searchParams]);

  const selectedGroup = useMemo(
    () =>
      appGroups.find((group) => isSameId(group?.group_id, selectedGroupId))
      ?? appGroups[0]
      ?? null,
    [appGroups, selectedGroupId],
  );

  const selectedGroupCards = useMemo(
    () =>
      allCards
        .filter((card) => isSameId(card?.group_id, selectedGroup?.group_id))
        .sort((left, right) => {
          const orderDiff = Number(left.display_order || 0) - Number(right.display_order || 0);
          if (orderDiff !== 0) return orderDiff;
          return compareText(left.card_name, right.card_name);
        }),
    [allCards, selectedGroup?.group_id],
  );

  const currentCardOrderSignature = useMemo(
    () => buildOrderSignature(selectedGroupCards, "card_id"),
    [selectedGroupCards],
  );

  const hasCardOrderChanges = useMemo(() => {
    for (const group of appGroups) {
      const gid = String(group?.group_id ?? "");
      const groupCards = allCards
        .filter((card) => isSameId(card?.group_id, group?.group_id))
        .sort((a, b) => {
          const od = Number(a.display_order || 0) - Number(b.display_order || 0);
          if (od !== 0) return od;
          return compareText(a.card_name, b.card_name);
        });
      const current = buildOrderSignature(groupCards, "card_id");
      const persisted = persistedCardOrderSignatures[gid] ?? "";
      if (current !== persisted) return true;
    }
    return false;
  }, [allCards, appGroups, persistedCardOrderSignatures]);

  const pendingSummary = useMemo(() => {
    const groupAdded = pendingBatch.groupCreates.length;
    const groupEdited = Object.keys(pendingBatch.groupUpdates || {}).length;
    const groupDeactivated = pendingBatch.groupDeactivations.length;
    const cardAdded = pendingBatch.cardCreates.length;
    const cardEdited = Object.keys(pendingBatch.cardUpdates || {}).length;
    const cardDeactivated = pendingBatch.cardDeactivations.length;
    const rowOrderChanged = (hasGroupOrderChanges ? 1 : 0) + (hasCardOrderChanges ? 1 : 0);

    return {
      groupAdded,
      groupEdited,
      groupDeactivated,
      cardAdded,
      cardEdited,
      cardDeactivated,
      rowOrderChanged,
      total:
        groupAdded
        + groupEdited
        + groupDeactivated
        + cardAdded
        + cardEdited
        + cardDeactivated
        + rowOrderChanged,
    };
  }, [hasCardOrderChanges, hasGroupOrderChanges, pendingBatch]);

  const hasPendingChanges = pendingSummary.total > 0;

  const pendingDeactivatedGroupIds = useMemo(
    () => new Set((pendingBatch.groupDeactivations || []).map((id) => String(id ?? ""))),
    [pendingBatch.groupDeactivations],
  );

  const pendingDeactivatedCardIds = useMemo(
    () => new Set((pendingBatch.cardDeactivations || []).map((id) => String(id ?? ""))),
    [pendingBatch.cardDeactivations],
  );

  const isSelectedGroupPendingDeactivation = useMemo(
    () => pendingDeactivatedGroupIds.has(String(selectedGroup?.group_id ?? "")),
    [pendingDeactivatedGroupIds, selectedGroup?.group_id],
  );

  const decoratedGroups = useMemo(() => {
    const createdIds = new Set((pendingBatch.groupCreates || []).map((entry) => String(entry?.tempId ?? "")));
    const updatedIds = new Set(Object.keys(pendingBatch.groupUpdates || {}));
    const deactivatedIds = new Set((pendingBatch.groupDeactivations || []).map((entry) => String(entry ?? "")));

    return appGroups.map((row) => {
      const id = String(row?.group_id ?? "");
      const orderChanged =
        row.__originalOrder !== undefined
        && row.__originalOrder !== null
        && Number(row.display_order) !== Number(row.__originalOrder);

      if (deactivatedIds.has(id)) {
        return { ...row, __batchState: "deleted", __previousOrder: orderChanged ? row.__originalOrder : null };
      }

      if (createdIds.has(id)) {
        return { ...row, __batchState: "created", __previousOrder: null };
      }

      if (updatedIds.has(id)) {
        return { ...row, __batchState: "updated", __previousOrder: orderChanged ? row.__originalOrder : null };
      }

      if (orderChanged) {
        return { ...row, __batchState: "reordered", __previousOrder: row.__originalOrder };
      }

      return { ...row, __batchState: "none", __previousOrder: null };
    });
  }, [appGroups, pendingBatch.groupCreates, pendingBatch.groupDeactivations, pendingBatch.groupUpdates]);

  const decoratedSelectedGroupCards = useMemo(() => {
    const createdIds = new Set((pendingBatch.cardCreates || []).map((entry) => String(entry?.tempId ?? "")));
    const updatedIds = new Set(Object.keys(pendingBatch.cardUpdates || {}));
    const deactivatedIds = new Set((pendingBatch.cardDeactivations || []).map((entry) => String(entry ?? "")));

    return selectedGroupCards.map((row) => {
      const id = String(row?.card_id ?? "");
      const orderChanged =
        row.__originalOrder !== undefined
        && row.__originalOrder !== null
        && Number(row.display_order) !== Number(row.__originalOrder);

      if (deactivatedIds.has(id)) {
        return { ...row, __batchState: "deleted", __previousOrder: orderChanged ? row.__originalOrder : null };
      }

      if (createdIds.has(id)) {
        return { ...row, __batchState: "created", __previousOrder: null };
      }

      if (updatedIds.has(id)) {
        return { ...row, __batchState: "updated", __previousOrder: orderChanged ? row.__originalOrder : null };
      }

      if (orderChanged) {
        return { ...row, __batchState: "reordered", __previousOrder: row.__originalOrder };
      }

      return { ...row, __batchState: "none", __previousOrder: null };
    });
  }, [pendingBatch.cardCreates, pendingBatch.cardDeactivations, pendingBatch.cardUpdates, selectedGroupCards]);

  const updateQueryParams = useCallback(
    (updates) => {
      const nextParams = new URLSearchParams(searchParams?.toString() || "");

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleApplicationChange = useCallback(
    (event) => {
      const appId = parseId(event.target.value);
      const nextAppGroups = orderedGroups.filter(
        (group) => isSameId(group?.app_id, appId),
      );
      setPersistedGroupOrderSignature(buildOrderSignature(nextAppGroups, "group_id"));
      const sigMap = {};
      for (const group of nextAppGroups) {
        const gid = String(group?.group_id ?? "");
        const cards = allCards
          .filter((card) => isSameId(card?.group_id, group?.group_id))
          .sort((a, b) => {
            const od = Number(a.display_order || 0) - Number(b.display_order || 0);
            if (od !== 0) return od;
            return compareText(a.card_name, b.card_name);
          });
        sigMap[gid] = buildOrderSignature(cards, "card_id");
      }
      setPersistedCardOrderSignatures(sigMap);
      updateQueryParams({ app: appId, group: null });
    },
    [allCards, orderedGroups, updateQueryParams],
  );

  const handleGroupRowClick = useCallback(
    (row) => {
      updateQueryParams({ group: row?.group_id });
    },
    [updateQueryParams],
  );

  const requestJson = useCallback(async (url, options, fallbackMessage) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.ok === false) {
      throw new Error(resolveErrorMessage(payload, fallbackMessage));
    }

    return payload;
  }, []);

  const handleGroupReorder = useCallback((nextRows) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    const normalizedRows = (Array.isArray(nextRows) ? nextRows : []).map((row, index) => ({
      ...row,
      display_order: index + 1,
    }));

    setOrderedGroups((previous) => {
      const otherAppGroups = previous.filter(
        (group) => !isSameId(group?.app_id, selectedApp?.app_id),
      );
      return [...otherAppGroups, ...normalizedRows];
    });
  }, [isMutatingAction, isSaving, selectedApp?.app_id]);

  const handleCardReorder = useCallback((nextRows) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    const normalizedRows = (Array.isArray(nextRows) ? nextRows : []).map((row, index) => ({
      ...row,
      display_order: index + 1,
    }));

    setAllCards((previous) => {
      const otherGroupCards = previous.filter(
        (card) => !isSameId(card?.group_id, selectedGroup?.group_id),
      );
      return [...otherGroupCards, ...normalizedRows];
    });
  }, [isMutatingAction, isSaving, selectedGroup?.group_id]);

  const handleCancelBatch = useCallback(() => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setOrderedGroups(seedCardGroups);
    setAllCards(seedCards);
    setPendingBatch(createEmptyBatchState());
    const cancelGroups = seedCardGroups.filter(
      (group) => isSameId(group?.app_id, selectedApp?.app_id),
    );
    setPersistedGroupOrderSignature(buildOrderSignature(cancelGroups, "group_id"));
    const cancelSigMap = {};
    for (const group of cancelGroups) {
      const gid = String(group?.group_id ?? "");
      const cards = seedCards
        .filter((card) => isSameId(card?.group_id, group?.group_id))
        .sort((a, b) => {
          const od = Number(a.display_order || 0) - Number(b.display_order || 0);
          if (od !== 0) return od;
          return compareText(a.card_name, b.card_name);
        });
      cancelSigMap[gid] = buildOrderSignature(cards, "card_id");
    }
    setPersistedCardOrderSignatures(cancelSigMap);
    setDialog(EMPTY_DIALOG);
    setGroupDraft({ name: "", desc: "", icon: "" });
    setCardDraft({ name: "", desc: "", route_path: "", icon: "" });
    const appFiltered = seedCardGroups.filter(
      (group) => isSameId(group?.app_id, selectedApp?.app_id),
    );
    updateQueryParams({ group: appFiltered[0]?.group_id ?? null });
  }, [
    isMutatingAction,
    isSaving,
    seedCardGroups,
    seedCards,
    selectedApp?.app_id,
    updateQueryParams,
  ]);

  const handleSaveBatch = useCallback(async () => {
    if (!hasPendingChanges || isSaving || isMutatingAction) {
      return;
    }

    setIsSaving(true);
    setIsMutatingAction(true);

    try {
      const groupIdMap = new Map();
      const deactivatedGroupSet = new Set(
        (pendingBatch.groupDeactivations || []).map((id) => String(id ?? "")),
      );
      const deactivatedCardSet = new Set(
        (pendingBatch.cardDeactivations || []).map((id) => String(id ?? "")),
      );

      for (const createEntry of pendingBatch.groupCreates || []) {
        const payload = await requestJson(
          "/api/card-module-setup/card-groups",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createEntry.payload),
          },
          "Failed to create card group.",
        );

        const createdId = payload?.cardGroup?.group_id;

        if (createdId === undefined || createdId === null || createdId === "") {
          throw new Error("Created card group response is invalid.");
        }

        groupIdMap.set(String(createEntry.tempId), createdId);
      }

      for (const [groupId, updates] of Object.entries(pendingBatch.groupUpdates || {})) {
        if (deactivatedGroupSet.has(String(groupId))) {
          continue;
        }

        const updateKeys = Object.keys(updates || {});
        if (updateKeys.length === 0) {
          continue;
        }

        const resolvedGroupId = groupIdMap.get(String(groupId)) ?? groupId;

        await requestJson(
          `/api/card-module-setup/card-groups/${encodeURIComponent(String(resolvedGroupId))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
          "Failed to update card group.",
        );
      }

      for (const createEntry of pendingBatch.cardCreates || []) {
        const draftGroupId = createEntry?.payload?.group_id;
        const resolvedGroupId = groupIdMap.get(String(draftGroupId ?? "")) ?? draftGroupId;

        if (resolvedGroupId === undefined || resolvedGroupId === null || resolvedGroupId === "") {
          continue;
        }

        if (deactivatedGroupSet.has(String(resolvedGroupId))) {
          continue;
        }

        await requestJson(
          "/api/card-module-setup/cards",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...createEntry.payload,
              group_id: resolvedGroupId,
            }),
          },
          "Failed to create card.",
        );
      }

      for (const [cardId, updates] of Object.entries(pendingBatch.cardUpdates || {})) {
        if (deactivatedCardSet.has(String(cardId))) {
          continue;
        }

        const updateKeys = Object.keys(updates || {});
        if (updateKeys.length === 0) {
          continue;
        }

        await requestJson(
          `/api/card-module-setup/cards/${encodeURIComponent(String(cardId))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
          "Failed to update card.",
        );
      }

      for (const cardId of pendingBatch.cardDeactivations || []) {
        if (isTempCardId(cardId)) {
          continue;
        }

        await requestJson(
          `/api/card-module-setup/cards/${encodeURIComponent(String(cardId))}`,
          { method: "DELETE" },
          "Failed to deactivate card.",
        );
      }

      for (const groupId of pendingBatch.groupDeactivations || []) {
        if (isTempGroupId(groupId)) {
          continue;
        }

        await requestJson(
          `/api/card-module-setup/card-groups/${encodeURIComponent(String(groupId))}`,
          { method: "DELETE" },
          "Failed to deactivate card group.",
        );
      }

      const orderedPersistedGroupIds = appGroups
        .map((group) => group?.group_id)
        .map((groupId) => groupIdMap.get(String(groupId ?? "")) ?? groupId)
        .filter((groupId) => groupId !== undefined && groupId !== null && groupId !== "")
        .filter((groupId) => !deactivatedGroupSet.has(String(groupId)))
        .filter((groupId) => !isTempGroupId(groupId));

      if (orderedPersistedGroupIds.length > 0) {
        await requestJson(
          "/api/card-module-setup/card-groups-order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupIds: orderedPersistedGroupIds }),
          },
          "Failed to save card group order.",
        );
      }

      for (const group of appGroups) {
        const gid = String(group?.group_id ?? "");
        const resolvedGid = groupIdMap.get(gid) ?? group?.group_id;
        if (deactivatedGroupSet.has(String(resolvedGid))) continue;

        const groupCards = allCards
          .filter((card) => isSameId(card?.group_id, group?.group_id))
          .sort((a, b) => {
            const od = Number(a.display_order || 0) - Number(b.display_order || 0);
            if (od !== 0) return od;
            return compareText(a.card_name, b.card_name);
          });
        const currentSig = buildOrderSignature(groupCards, "card_id");
        const persistedSig = persistedCardOrderSignatures[gid] ?? "";
        if (currentSig === persistedSig) continue;

        const orderedPersistedCardIds = groupCards
          .map((card) => card?.card_id)
          .filter((cardId) => cardId !== undefined && cardId !== null && cardId !== "")
          .filter((cardId) => !deactivatedCardSet.has(String(cardId)))
          .filter((cardId) => !isTempCardId(cardId));

        if (orderedPersistedCardIds.length > 0) {
          await requestJson(
            "/api/card-module-setup/cards-order",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cardIds: orderedPersistedCardIds }),
            },
            "Failed to save card order.",
          );
        }
      }

      setPersistedGroupOrderSignature(currentGroupOrderSignature);
      const nextCardSigMap = {};
      for (const group of appGroups) {
        const gid = String(group?.group_id ?? "");
        const groupCards = allCards
          .filter((card) => isSameId(card?.group_id, group?.group_id))
          .sort((a, b) => {
            const od = Number(a.display_order || 0) - Number(b.display_order || 0);
            if (od !== 0) return od;
            return compareText(a.card_name, b.card_name);
          });
        nextCardSigMap[gid] = buildOrderSignature(groupCards, "card_id");
      }
      setPersistedCardOrderSignatures(nextCardSigMap);
      setPendingBatch(createEmptyBatchState());

      const selectedKey = String(selectedGroup?.group_id ?? "");
      const selectedResolved = groupIdMap.get(selectedKey) ?? selectedGroup?.group_id ?? null;
      const nextSelectedGroupId =
        selectedResolved && !deactivatedGroupSet.has(String(selectedResolved))
          ? selectedResolved
          : (orderedPersistedGroupIds[0] ?? null);

      updateQueryParams({ group: nextSelectedGroupId });
      router.refresh();
      toastSuccess(`Saved ${pendingSummary.total} batched change(s).`, "Save Batch");
    } catch (error) {
      toastError(error?.message || "Failed to save batched changes.");
    } finally {
      setIsMutatingAction(false);
      setIsSaving(false);
    }
  }, [
    allCards,
    appGroups,
    currentGroupOrderSignature,
    hasPendingChanges,
    isMutatingAction,
    isSaving,
    pendingBatch,
    pendingSummary.total,
    persistedCardOrderSignatures,
    requestJson,
    router,
    selectedGroup?.group_id,
    updateQueryParams,
  ]);

  const closeDialog = useCallback(() => {
    if (isMutatingAction) {
      return;
    }

    setDialog(EMPTY_DIALOG);
  }, [isMutatingAction]);

  const openAddGroupDialog = useCallback(() => {
    if (isSaving || isMutatingAction) {
      return;
    }

    if (!selectedApp?.app_id) {
      toastError("Select an application first.");
      return;
    }

    setGroupDraft({ name: "", desc: "", icon: "" });

    setDialog({
      kind: "add-group",
      target: { app_id: selectedApp.app_id },
      nextIsActive: true,
    });
  }, [isMutatingAction, isSaving, selectedApp?.app_id]);

  const openEditGroupDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setGroupDraft({
      name: String(row?.group_name || ""),
      desc: String(row?.group_desc || ""),
      icon: String(row?.group_icon || row?.icon || ""),
    });

    setDialog({
      kind: "edit-group",
      target: row,
      nextIsActive: null,
    });
  }, [isMutatingAction, isSaving]);

  const openToggleGroupDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setDialog({
      kind: "toggle-group",
      target: row,
      nextIsActive: !Boolean(row?.is_active_bool),
    });
  }, [isMutatingAction, isSaving]);

  const openDeactivateGroupDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setDialog({
      kind: "deactivate-group",
      target: row,
      nextIsActive: null,
    });
  }, [isMutatingAction, isSaving]);

  const openAddCardDialog = useCallback(() => {
    if (isSaving || isMutatingAction) {
      return;
    }

    if (!selectedGroup?.group_id) {
      toastError("Select a card group before adding a card.");
      return;
    }

    if (isSelectedGroupPendingDeactivation) {
      toastError("Selected group is staged for deactivation. Save or cancel batch before adding a card.");
      return;
    }

    setCardDraft({ name: "", desc: "", route_path: "", icon: "" });

    setDialog({
      kind: "add-card",
      target: {
        group_id: selectedGroup.group_id,
        group_name: selectedGroup.group_name,
        app_id: selectedApp?.app_id,
      },
      nextIsActive: true,
    });
  }, [
    isMutatingAction,
    isSaving,
    isSelectedGroupPendingDeactivation,
    selectedApp?.app_id,
    selectedGroup?.group_id,
    selectedGroup?.group_name,
  ]);

  const openEditCardDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setCardDraft({
      name: String(row?.card_name || ""),
      desc: String(row?.card_desc || ""),
      route_path: String(row?.route_path || ""),
      icon: String(row?.card_icon || row?.icon || ""),
    });

    setDialog({
      kind: "edit-card",
      target: row,
      nextIsActive: null,
    });
  }, [isMutatingAction, isSaving]);

  const openToggleCardDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setDialog({
      kind: "toggle-card",
      target: row,
      nextIsActive: !Boolean(row?.is_active_bool),
    });
  }, [isMutatingAction, isSaving]);

  const openDeactivateCardDialog = useCallback((row) => {
    if (isSaving || isMutatingAction) {
      return;
    }

    setDialog({
      kind: "deactivate-card",
      target: row,
      nextIsActive: null,
    });
  }, [isMutatingAction, isSaving]);

  const submitAddGroup = useCallback(() => {
    const groupName = String(groupDraft.name || "").trim();

    if (!groupName) {
      toastError("Group name is required.");
      return;
    }

    const groupDesc = String(groupDraft.desc || "").trim();
    const groupIcon = String(groupDraft.icon || "").trim() || "bi-collection";
    const tempGroupId = createTempId(TEMP_GROUP_PREFIX);

    setOrderedGroups((previous) => [
      ...previous,
      mapGroupRow(
        {
          group_id: tempGroupId,
          app_id: selectedApp?.app_id,
          group_name: groupName,
          group_desc: groupDesc,
          icon: groupIcon,
          is_active: true,
          display_order: appGroups.length + 1,
        },
        previous.length,
      ),
    ]);

    setPendingBatch((previous) => ({
      ...previous,
      groupCreates: [
        ...previous.groupCreates,
        {
          tempId: tempGroupId,
          payload: {
            app_id: selectedApp?.app_id,
            group_name: groupName,
            group_desc: groupDesc,
            icon: groupIcon,
            is_active: true,
          },
        },
      ],
    }));

    updateQueryParams({ group: tempGroupId });
    setDialog(EMPTY_DIALOG);
    setGroupDraft({ name: "", desc: "", icon: "" });
    toastSuccess("Card group staged for Save Batch.", "Batching");
  }, [appGroups.length, groupDraft.desc, groupDraft.icon, groupDraft.name, selectedApp?.app_id, updateQueryParams]);

  const submitEditGroup = useCallback(() => {
    const row = dialog?.target;

    if (!row?.group_id) {
      toastError("Invalid card group.");
      return;
    }

    const groupName = String(groupDraft.name || "").trim();
    if (!groupName) {
      toastError("Group name is required.");
      return;
    }

    const groupDesc = String(groupDraft.desc || "").trim();
    const groupIcon = String(groupDraft.icon || "").trim() || "bi-collection";
    const groupId = row.group_id;

    setOrderedGroups((previous) =>
      previous.map((group, index) => {
        if (!isSameId(group?.group_id, groupId)) {
          return group;
        }

        return mapGroupRow(
          {
            ...group,
            group_name: groupName,
            group_desc: groupDesc,
            icon: groupIcon,
          },
          index,
        );
      }),
    );

    setPendingBatch((previous) => {
      if (isTempGroupId(groupId)) {
        return {
          ...previous,
          groupCreates: previous.groupCreates.map((entry) => {
            if (!isSameId(entry?.tempId, groupId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                group_name: groupName,
                group_desc: groupDesc,
                icon: groupIcon,
              },
            };
          }),
          groupUpdates: removeObjectKey(previous.groupUpdates, groupId),
        };
      }

      return {
        ...previous,
        groupUpdates: {
          ...previous.groupUpdates,
          [String(groupId)]: mergeUpdatePatch(previous.groupUpdates?.[String(groupId)], {
            group_name: groupName,
            group_desc: groupDesc,
            icon: groupIcon,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess("Card group update staged for Save Batch.", "Batching");
  }, [dialog, groupDraft.desc, groupDraft.icon, groupDraft.name]);

  const submitToggleGroup = useCallback(() => {
    const row = dialog?.target;
    const nextIsActive = Boolean(dialog?.nextIsActive);

    if (!row?.group_id) {
      toastError("Invalid card group.");
      return;
    }

    const groupId = row.group_id;

    setOrderedGroups((previous) =>
      previous.map((group, index) => {
        if (!isSameId(group?.group_id, groupId)) {
          return group;
        }

        return mapGroupRow(
          {
            ...group,
            is_active: nextIsActive,
          },
          index,
        );
      }),
    );

    setPendingBatch((previous) => {
      if (isTempGroupId(groupId)) {
        return {
          ...previous,
          groupCreates: previous.groupCreates.map((entry) => {
            if (!isSameId(entry?.tempId, groupId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                is_active: nextIsActive,
              },
            };
          }),
          groupUpdates: removeObjectKey(previous.groupUpdates, groupId),
        };
      }

      return {
        ...previous,
        groupUpdates: {
          ...previous.groupUpdates,
          [String(groupId)]: mergeUpdatePatch(previous.groupUpdates?.[String(groupId)], {
            is_active: nextIsActive,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess(`Card group ${nextIsActive ? "enable" : "disable"} staged for Save Batch.`, "Batching");
  }, [dialog]);

  const submitDeactivateGroup = useCallback(() => {
    const row = dialog?.target;

    if (!row?.group_id) {
      toastError("Invalid card group.");
      return;
    }

    const groupId = row.group_id;
    const linkedCardIds = allCards
      .filter((card) => isSameId(card?.group_id, groupId))
      .map((card) => String(card?.card_id ?? ""));

    if (isTempGroupId(groupId)) {
      const nextGroups = orderedGroups
        .filter((group) => !isSameId(group?.group_id, groupId))
        .map((group, index) => ({
          ...group,
          display_order: index + 1,
        }));

      setOrderedGroups(nextGroups);
      setAllCards((previous) => previous.filter((card) => !isSameId(card?.group_id, groupId)));

      setPendingBatch((previous) => ({
        ...previous,
        groupCreates: previous.groupCreates.filter((entry) => !isSameId(entry?.tempId, groupId)),
        groupUpdates: removeObjectKey(previous.groupUpdates, groupId),
        groupDeactivations: (previous.groupDeactivations || []).filter(
          (deactivatedId) => !isSameId(deactivatedId, groupId),
        ),
        cardCreates: previous.cardCreates.filter((entry) => !isSameId(entry?.payload?.group_id, groupId)),
        cardUpdates: linkedCardIds.reduce(
          (mapValue, cardId) => removeObjectKey(mapValue, cardId),
          previous.cardUpdates,
        ),
        cardDeactivations: (previous.cardDeactivations || []).filter(
          (cardId) => !linkedCardIds.some((linkedCardId) => isSameId(linkedCardId, cardId)),
        ),
      }));

      if (isSameId(selectedGroup?.group_id, groupId)) {
        const remaining = nextGroups.filter((g) => isSameId(g?.app_id, selectedApp?.app_id));
        updateQueryParams({ group: remaining[0]?.group_id ?? null });
      }

      setDialog(EMPTY_DIALOG);
      toastSuccess("Card group deactivation staged for Save Batch.", "Batching");
      return;
    }

    setPendingBatch((previous) => {
      const nextCardDeactivations = linkedCardIds.reduce(
        (ids, cardId) => appendUniqueId(ids, cardId),
        previous.cardDeactivations || [],
      );

      return {
        ...previous,
        groupUpdates: removeObjectKey(previous.groupUpdates, groupId),
        groupDeactivations: appendUniqueId(previous.groupDeactivations, groupId),
        cardCreates: previous.cardCreates.filter((entry) => !isSameId(entry?.payload?.group_id, groupId)),
        cardUpdates: linkedCardIds.reduce(
          (mapValue, cardId) => removeObjectKey(mapValue, cardId),
          previous.cardUpdates,
        ),
        cardDeactivations: nextCardDeactivations,
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess("Card group deactivation staged for Save Batch.", "Batching");
  }, [allCards, dialog, orderedGroups, selectedApp?.app_id, selectedGroup?.group_id, updateQueryParams]);

  const submitAddCard = useCallback(() => {
    const target = dialog?.target;

    if (!target?.group_id) {
      toastError("Select a card group before adding a card.");
      return;
    }

    const cardName = String(cardDraft.name || "").trim();
    if (!cardName) {
      toastError("Card name is required.");
      return;
    }

    const cardDesc = String(cardDraft.desc || "").trim();
    const routePath = String(cardDraft.route_path || "").trim() || "#";
    const cardIcon = String(cardDraft.icon || "").trim() || "bi-grid-3x3-gap";
    const tempCardId = createTempId(TEMP_CARD_PREFIX);

    setAllCards((previous) => [
      ...previous,
      mapCardRow(
        {
          card_id: tempCardId,
          group_id: target.group_id,
          app_id: target.app_id,
          card_name: cardName,
          card_desc: cardDesc,
          route_path: routePath,
          icon: cardIcon,
          is_active: true,
          display_order: selectedGroupCards.length + 1,
        },
        previous.length,
      ),
    ]);

    setPendingBatch((previous) => ({
      ...previous,
      cardCreates: [
        ...previous.cardCreates,
        {
          tempId: tempCardId,
          payload: {
            group_id: target.group_id,
            app_id: target.app_id,
            card_name: cardName,
            card_desc: cardDesc,
            route_path: routePath,
            icon: cardIcon,
            is_active: true,
          },
        },
      ],
    }));

    setDialog(EMPTY_DIALOG);
    setCardDraft({ name: "", desc: "", route_path: "", icon: "" });
    toastSuccess("Card staged for Save Batch.", "Batching");
  }, [cardDraft.desc, cardDraft.icon, cardDraft.name, cardDraft.route_path, dialog, selectedGroupCards.length]);

  const submitEditCard = useCallback(() => {
    const row = dialog?.target;

    if (!row?.card_id) {
      toastError("Invalid card.");
      return;
    }

    const cardName = String(cardDraft.name || "").trim();
    if (!cardName) {
      toastError("Card name is required.");
      return;
    }

    const cardDesc = String(cardDraft.desc || "").trim();
    const routePath = String(cardDraft.route_path || "").trim() || "#";
    const cardIcon = String(cardDraft.icon || "").trim() || "bi-grid-3x3-gap";
    const cardId = row.card_id;

    setAllCards((previous) =>
      previous.map((card, index) => {
        if (!isSameId(card?.card_id, cardId)) {
          return card;
        }

        return mapCardRow(
          {
            ...card,
            card_name: cardName,
            card_desc: cardDesc,
            route_path: routePath,
            icon: cardIcon,
          },
          index,
        );
      }),
    );

    setPendingBatch((previous) => {
      if (isTempCardId(cardId)) {
        return {
          ...previous,
          cardCreates: previous.cardCreates.map((entry) => {
            if (!isSameId(entry?.tempId, cardId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                card_name: cardName,
                card_desc: cardDesc,
                route_path: routePath,
                icon: cardIcon,
              },
            };
          }),
          cardUpdates: removeObjectKey(previous.cardUpdates, cardId),
        };
      }

      return {
        ...previous,
        cardUpdates: {
          ...previous.cardUpdates,
          [String(cardId)]: mergeUpdatePatch(previous.cardUpdates?.[String(cardId)], {
            card_name: cardName,
            card_desc: cardDesc,
            route_path: routePath,
            icon: cardIcon,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess("Card update staged for Save Batch.", "Batching");
  }, [cardDraft.desc, cardDraft.icon, cardDraft.name, cardDraft.route_path, dialog]);

  const submitToggleCard = useCallback(() => {
    const row = dialog?.target;
    const nextIsActive = Boolean(dialog?.nextIsActive);

    if (!row?.card_id) {
      toastError("Invalid card.");
      return;
    }

    const cardId = row.card_id;

    setAllCards((previous) =>
      previous.map((card, index) => {
        if (!isSameId(card?.card_id, cardId)) {
          return card;
        }

        return mapCardRow(
          {
            ...card,
            is_active: nextIsActive,
          },
          index,
        );
      }),
    );

    setPendingBatch((previous) => {
      if (isTempCardId(cardId)) {
        return {
          ...previous,
          cardCreates: previous.cardCreates.map((entry) => {
            if (!isSameId(entry?.tempId, cardId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                is_active: nextIsActive,
              },
            };
          }),
          cardUpdates: removeObjectKey(previous.cardUpdates, cardId),
        };
      }

      return {
        ...previous,
        cardUpdates: {
          ...previous.cardUpdates,
          [String(cardId)]: mergeUpdatePatch(previous.cardUpdates?.[String(cardId)], {
            is_active: nextIsActive,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess(`Card ${nextIsActive ? "enable" : "disable"} staged for Save Batch.`, "Batching");
  }, [dialog]);

  const submitDeactivateCard = useCallback(() => {
    const row = dialog?.target;

    if (!row?.card_id) {
      toastError("Invalid card.");
      return;
    }

    const cardId = row.card_id;

    if (isTempCardId(cardId)) {
      setAllCards((items) => items.filter((card) => !isSameId(card?.card_id, cardId)));
    }

    setPendingBatch((previous) => {
      if (isTempCardId(cardId)) {
        return {
          ...previous,
          cardCreates: previous.cardCreates.filter((entry) => !isSameId(entry?.tempId, cardId)),
          cardUpdates: removeObjectKey(previous.cardUpdates, cardId),
          cardDeactivations: (previous.cardDeactivations || []).filter(
            (deactivatedId) => !isSameId(deactivatedId, cardId),
          ),
        };
      }

      return {
        ...previous,
        cardUpdates: removeObjectKey(previous.cardUpdates, cardId),
        cardDeactivations: appendUniqueId(previous.cardDeactivations, cardId),
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess("Card deactivation staged for Save Batch.", "Batching");
  }, [dialog]);

  const groupColumns = useMemo(
    () => [
      {
        key: "display_order",
        label: "Order",
        width: "10%",
        sortable: true,
        align: "center",
        render: (row) => {
          const prev = row?.__previousOrder;
          const hasOrderChange = prev !== null && prev !== undefined;
          return (
            <span>
              {row?.display_order ?? "--"}
              {hasOrderChange ? (
                <>
                  {" "}
                  <span className="psb-batch-marker psb-batch-marker-edited">
                    was {prev}
                  </span>
                </>
              ) : null}
            </span>
          );
        },
      },
      {
        key: "group_name",
        label: "Group Name",
        width: "35%",
        sortable: true,
        render: (row) => {
          const batchState = String(row?.__batchState || "");
          const markerText =
            batchState === "deleted"
              ? "Deactivated"
              : batchState === "created"
                ? "New"
                : batchState === "updated"
                  ? "Edited"
                  : batchState === "reordered"
                    ? "Reordered"
                    : "";
          const markerClass =
            batchState === "deleted"
              ? "psb-batch-marker psb-batch-marker-deleted"
              : batchState === "created"
                ? "psb-batch-marker psb-batch-marker-new"
                : batchState === "updated"
                  ? "psb-batch-marker psb-batch-marker-edited"
                  : batchState === "reordered"
                    ? "psb-batch-marker psb-batch-marker-reordered"
                    : "";
          const textClassName = [
            isSameId(row?.group_id, selectedGroup?.group_id) ? "fw-semibold text-primary" : "",
            batchState === "deleted" ? "text-decoration-line-through" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <span className={textClassName}>
              {row?.group_name || "--"}
              {markerText ? <span className={markerClass}>{markerText}</span> : null}
            </span>
          );
        },
      },
      {
        key: "group_desc",
        label: "Description",
        width: "28%",
        sortable: true,
      },
      {
        key: "group_icon",
        label: "Icon",
        width: "12%",
        sortable: false,
        align: "center",
        defaultVisible: false,
        render: (row) => (
          <i className={`bi ${row?.group_icon || row?.icon || "bi-collection"}`} aria-hidden="true" />
        ),
      },
      {
        key: "is_active_bool",
        label: "Active",
        width: "10%",
        sortable: true,
        align: "center",
        render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
      },
    ],
    [selectedGroup?.group_id],
  );

  const cardColumns = useMemo(
    () => [
      {
        key: "display_order",
        label: "Order",
        width: "8%",
        sortable: true,
        align: "center",
        render: (row) => {
          const prev = row?.__previousOrder;
          const hasOrderChange = prev !== null && prev !== undefined;
          return (
            <span>
              {row?.display_order ?? "--"}
              {hasOrderChange ? (
                <>
                  {" "}
                  <span className="psb-batch-marker psb-batch-marker-edited">
                    was {prev}
                  </span>
                </>
              ) : null}
            </span>
          );
        },
      },
      {
        key: "card_name",
        label: "Card Name",
        width: "25%",
        sortable: true,
        render: (row) => {
          const batchState = String(row?.__batchState || "");
          const markerText =
            batchState === "deleted"
              ? "Deactivated"
              : batchState === "created"
                ? "New"
                : batchState === "updated"
                  ? "Edited"
                  : batchState === "reordered"
                    ? "Reordered"
                    : "";
          const markerClass =
            batchState === "deleted"
              ? "psb-batch-marker psb-batch-marker-deleted"
              : batchState === "created"
                ? "psb-batch-marker psb-batch-marker-new"
                : batchState === "updated"
                  ? "psb-batch-marker psb-batch-marker-edited"
                  : batchState === "reordered"
                    ? "psb-batch-marker psb-batch-marker-reordered"
                    : "";

          return (
            <span className={batchState === "deleted" ? "text-decoration-line-through" : ""}>
              {row?.card_name || "--"}
              {markerText ? <span className={markerClass}>{markerText}</span> : null}
            </span>
          );
        },
      },
      {
        key: "card_desc",
        label: "Description",
        width: "20%",
        sortable: true,
        defaultVisible: false,
      },
      {
        key: "route_path",
        label: "Route",
        width: "25%",
        sortable: true,
        render: (row) => (
          <code className="small">{row?.route_path || "#"}</code>
        ),
      },
      {
        key: "card_icon",
        label: "Icon",
        width: "10%",
        sortable: false,
        align: "center",
        defaultVisible: false,
        render: (row) => (
          <i className={`bi ${row?.card_icon || row?.icon || "bi-grid-3x3-gap"}`} aria-hidden="true" />
        ),
      },
      {
        key: "is_active_bool",
        label: "Active",
        width: "12%",
        sortable: true,
        align: "center",
        render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
      },
    ],
    [],
  );

  const groupActions = useMemo(
    () => [
      {
        key: "edit-group",
        label: "Edit",
        type: "secondary",
        icon: "pencil-square",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedGroupIds.has(String(row?.group_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openEditGroupDialog(row),
      },
      {
        key: "disable-group",
        label: "Disable",
        type: "secondary",
        icon: "slash-circle",
        visible: (row) => Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedGroupIds.has(String(row?.group_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openToggleGroupDialog(row),
      },
      {
        key: "enable-group",
        label: "Enable",
        type: "secondary",
        icon: "check-circle",
        visible: (row) => !Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedGroupIds.has(String(row?.group_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openToggleGroupDialog(row),
      },
      {
        key: "deactivate-group",
        label: "Deactivate",
        type: "danger",
        icon: "trash",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedGroupIds.has(String(row?.group_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openDeactivateGroupDialog(row),
      },
    ],
    [
      isMutatingAction,
      isSaving,
      openDeactivateGroupDialog,
      openEditGroupDialog,
      openToggleGroupDialog,
      pendingDeactivatedGroupIds,
    ],
  );

  const cardActions = useMemo(
    () => [
      {
        key: "edit-card",
        label: "Edit",
        type: "secondary",
        icon: "pencil-square",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedCardIds.has(String(row?.card_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openEditCardDialog(row),
      },
      {
        key: "disable-card",
        label: "Disable",
        type: "secondary",
        icon: "slash-circle",
        visible: (row) => Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedCardIds.has(String(row?.card_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openToggleCardDialog(row),
      },
      {
        key: "enable-card",
        label: "Enable",
        type: "secondary",
        icon: "check-circle",
        visible: (row) => !Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedCardIds.has(String(row?.card_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openToggleCardDialog(row),
      },
      {
        key: "deactivate-card",
        label: "Deactivate",
        type: "danger",
        icon: "trash",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedCardIds.has(String(row?.card_id ?? ""));
          return isSaving || isMutatingAction || isPendingDeactivation;
        },
        onClick: (row) => openDeactivateCardDialog(row),
      },
    ],
    [
      isMutatingAction,
      isSaving,
      openDeactivateCardDialog,
      openEditCardDialog,
      openToggleCardDialog,
      pendingDeactivatedCardIds,
    ],
  );

  const dialogTitle =
    dialog.kind === "add-group"
      ? "Add Card Group"
      : dialog.kind === "edit-group"
        ? "Edit Card Group"
        : dialog.kind === "toggle-group"
          ? `${dialog?.nextIsActive ? "Enable" : "Disable"} Card Group`
          : dialog.kind === "deactivate-group"
            ? "Deactivate Card Group"
            : dialog.kind === "add-card"
              ? "Add Card"
              : dialog.kind === "edit-card"
                ? "Edit Card"
                : dialog.kind === "toggle-card"
                  ? `${dialog?.nextIsActive ? "Enable" : "Disable"} Card`
                  : dialog.kind === "deactivate-card"
                    ? "Deactivate Card"
                    : "";

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1">Card Module Setup</h1>
          <p className="text-muted mb-0">Manage card groups and cards for each application.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
          <span className={`small ${hasPendingChanges ? "text-warning-emphasis fw-semibold" : "text-muted"}`}>
            {isMutatingAction || isSaving
              ? "Saving batch..."
              : hasPendingChanges
                ? `${pendingSummary.total} staged change(s)`
                : "No changes"}
          </span>
          {hasPendingChanges ? (
            <>
              {pendingSummary.groupAdded + pendingSummary.cardAdded > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-added">
                  +{pendingSummary.groupAdded + pendingSummary.cardAdded} Added
                </span>
              ) : null}
              {pendingSummary.groupEdited + pendingSummary.cardEdited > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-edited">
                  ~{pendingSummary.groupEdited + pendingSummary.cardEdited} Edited
                </span>
              ) : null}
              {pendingSummary.groupDeactivated + pendingSummary.cardDeactivated > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-deleted">
                  -{pendingSummary.groupDeactivated + pendingSummary.cardDeactivated} Deactivated
                </span>
              ) : null}
              {pendingSummary.rowOrderChanged > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-order">Reordered</span>
              ) : null}
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={isSaving}
            disabled={!hasPendingChanges || isSaving || isMutatingAction}
            onClick={handleSaveBatch}
          >
            Save Batch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasPendingChanges || isSaving || isMutatingAction}
            onClick={handleCancelBatch}
          >
            Cancel Batch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={isSaving || isMutatingAction || !selectedApp?.app_id}
            onClick={openAddGroupDialog}
          >
            Add Group
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={isSaving || isMutatingAction || !selectedGroup?.group_id || isSelectedGroupPendingDeactivation}
            onClick={openAddCardDialog}
          >
            Add Card
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label mb-1 fw-semibold small">Application</label>
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 340 }}
          value={String(selectedApp?.app_id ?? "")}
          onChange={handleApplicationChange}
          disabled={isSaving || isMutatingAction}
        >
          {safeApplications.length === 0 ? (
            <option value="">No applications available</option>
          ) : null}
          {safeApplications.map((app) => (
            <option key={app.app_id} value={String(app.app_id)}>
              {app.app_name || app.name || `App ${app.app_id}`}
            </option>
          ))}
        </select>
      </div>

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-5">
          <Card title="Card Groups" subtitle="Drag the grip icon in Actions to reorder groups.">
            <TableZ
              columns={groupColumns}
              data={decoratedGroups}
              rowIdKey="group_id"
              selectedRowId={selectedGroup?.group_id ?? null}
              onRowClick={handleGroupRowClick}
              actions={groupActions}
              draggable={!isSaving && !isMutatingAction}
              onReorder={handleGroupReorder}
              emptyMessage="No card groups found for this application."
            />
          </Card>
        </div>

        <div className="col-12 col-xl-7">
          <Card
            title={selectedGroup ? `Cards for: ${selectedGroup.group_name}` : "Cards"}
            subtitle={selectedGroup ? "Drag rows to reorder cards within the group" : "Click a card group row to view its cards."}
          >
            {selectedGroup ? (
              <TableZ
                columns={cardColumns}
                data={decoratedSelectedGroupCards}
                rowIdKey="card_id"
                actions={cardActions}
                emptyMessage="No cards assigned to this group."
                draggable={!isSaving && !isMutatingAction}
                onReorder={handleCardReorder}
              />
            ) : (
              <div className="notice-banner notice-banner-info mb-0">Click a card group row to view its cards.</div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        show={Boolean(dialog.kind)}
        onHide={closeDialog}
        title={dialogTitle}
        footer={
          dialog.kind === "add-group" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitAddGroup} loading={isMutatingAction}>
                Add Group
              </Button>
            </>
          ) : dialog.kind === "edit-group" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitEditGroup} loading={isMutatingAction}>
                Save
              </Button>
            </>
          ) : dialog.kind === "add-card" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitAddCard} loading={isMutatingAction}>
                Add Card
              </Button>
            </>
          ) : dialog.kind === "edit-card" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitEditCard} loading={isMutatingAction}>
                Save
              </Button>
            </>
          ) : dialog.kind === "toggle-group" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={submitToggleGroup} loading={isMutatingAction}>
                {dialog?.nextIsActive ? "Enable" : "Disable"}
              </Button>
            </>
          ) : dialog.kind === "toggle-card" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={submitToggleCard} loading={isMutatingAction}>
                {dialog?.nextIsActive ? "Enable" : "Disable"}
              </Button>
            </>
          ) : dialog.kind === "deactivate-group" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={submitDeactivateGroup} loading={isMutatingAction}>
                Deactivate Group
              </Button>
            </>
          ) : dialog.kind === "deactivate-card" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={submitDeactivateCard} loading={isMutatingAction}>
                Deactivate Card
              </Button>
            </>
          ) : null
        }
      >
        {dialog.kind === "add-group" ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label mb-1">Group Name</label>
              <Input
                value={groupDraft.name}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Enter group name"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                as="textarea"
                rows={3}
                value={groupDraft.desc}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, desc: event.target.value }))
                }
                placeholder="Enter group description"
              />
            </div>
            <div>
              <label className="form-label mb-1">Icon</label>
              <Input
                value={groupDraft.icon}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, icon: event.target.value }))
                }
                placeholder="e.g. bi-collection"
              />
            </div>
          </div>
        ) : null}

        {dialog.kind === "edit-group" ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label mb-1">Group Name</label>
              <Input
                value={groupDraft.name}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Enter group name"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                as="textarea"
                rows={3}
                value={groupDraft.desc}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, desc: event.target.value }))
                }
                placeholder="Enter group description"
              />
            </div>
            <div>
              <label className="form-label mb-1">Icon</label>
              <Input
                value={groupDraft.icon}
                onChange={(event) =>
                  setGroupDraft((previous) => ({ ...previous, icon: event.target.value }))
                }
                placeholder="e.g. bi-collection"
              />
            </div>
          </div>
        ) : null}

        {dialog.kind === "add-card" ? (
          <div className="d-flex flex-column gap-3">
            <div className="small text-muted">
              Creating card for <strong>{dialog?.target?.group_name || "selected group"}</strong>
            </div>
            <div>
              <label className="form-label mb-1">Card Name</label>
              <Input
                value={cardDraft.name}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Enter card name"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                as="textarea"
                rows={3}
                value={cardDraft.desc}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, desc: event.target.value }))
                }
                placeholder="Enter card description"
              />
            </div>
            <div>
              <label className="form-label mb-1">Route Path</label>
              <Input
                value={cardDraft.route_path}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, route_path: event.target.value }))
                }
                placeholder="e.g. /my-module"
              />
            </div>
            <div>
              <label className="form-label mb-1">Icon</label>
              <Input
                value={cardDraft.icon}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, icon: event.target.value }))
                }
                placeholder="e.g. bi-grid-3x3-gap"
              />
            </div>
          </div>
        ) : null}

        {dialog.kind === "edit-card" ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label mb-1">Card Name</label>
              <Input
                value={cardDraft.name}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Enter card name"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                as="textarea"
                rows={3}
                value={cardDraft.desc}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, desc: event.target.value }))
                }
                placeholder="Enter card description"
              />
            </div>
            <div>
              <label className="form-label mb-1">Route Path</label>
              <Input
                value={cardDraft.route_path}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, route_path: event.target.value }))
                }
                placeholder="e.g. /my-module"
              />
            </div>
            <div>
              <label className="form-label mb-1">Icon</label>
              <Input
                value={cardDraft.icon}
                onChange={(event) =>
                  setCardDraft((previous) => ({ ...previous, icon: event.target.value }))
                }
                placeholder="e.g. bi-grid-3x3-gap"
              />
            </div>
          </div>
        ) : null}

        {dialog.kind === "toggle-group" ? (
          <p className="mb-0">
            {dialog?.nextIsActive ? "Enable" : "Disable"} card group{" "}
            <strong>{dialog?.target?.group_name || ""}</strong>?
          </p>
        ) : null}

        {dialog.kind === "toggle-card" ? (
          <p className="mb-0">
            {dialog?.nextIsActive ? "Enable" : "Disable"} card{" "}
            <strong>{dialog?.target?.card_name || ""}</strong>?
          </p>
        ) : null}

        {dialog.kind === "deactivate-group" ? (
          <p className="mb-0 text-danger">
            Deactivate card group <strong>{dialog?.target?.group_name || ""}</strong> and all associated cards?
          </p>
        ) : null}

        {dialog.kind === "deactivate-card" ? (
          <p className="mb-0 text-danger">
            Deactivate card <strong>{dialog?.target?.card_name || ""}</strong>?
          </p>
        ) : null}
      </Modal>
    </main>
  );
}
