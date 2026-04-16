"use client";

import { useEffect, useRef } from "react";

export default function TableContextMenu({ open = false, position = { x: 0, y: 0 }, onCustomize, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeIfOutside = (event) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const closeOnScroll = () => {
      onClose?.();
    };

    window.addEventListener("mousedown", closeIfOutside);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      window.removeEventListener("mousedown", closeIfOutside);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const menuWidth = 208;
  const menuHeight = 56;
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;

  const rawX = Math.max(8, Number(position?.x) || 0);
  const rawY = Math.max(8, Number(position?.y) || 0);

  const x = Math.max(8, Math.min(rawX, Math.max(8, viewportWidth - menuWidth - 8)));
  const y = Math.max(8, Math.min(rawY, Math.max(8, viewportHeight - menuHeight - 8)));

  return (
    <div
      ref={menuRef}
      className="psb-ui-table-context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      aria-label="Table context menu"
    >
      <button
        type="button"
        className="psb-ui-table-context-menu-item"
        onClick={() => {
          onCustomize?.();
          onClose?.();
        }}
      >
        Customize Table
      </button>
    </div>
  );
}
