"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Searchable single-select. Drop-in replacement for a native <select> anywhere
 * the option list is long (employees, vehicles, companies…). The panel renders in
 * a portal positioned against the trigger, so it never clips inside a modal's
 * scroll container.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  label,
  error,
  required,
  clearable = true,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  const { t } = useI18n();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = query
    ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    : options;

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => position();
    const onResize = () => position();
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onDown);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onDown);
      clearTimeout(focusTimer);
    };
  }, [open, position]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-fg">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-surface px-3 text-sm ring-1 ring-inset transition-shadow",
          "focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-subtle",
          error ? "ring-danger" : "ring-border",
        )}
      >
        <span className={cn("truncate", selected ? "text-fg" : "text-fg-subtle")}>
          {selected ? selected.label : placeholder ?? t("common.none")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-fg-subtle hover:text-danger"
              aria-label={t("common.clearFilters")}
            >
              <X className="size-3.5" aria-hidden />
            </span>
          )}
          <ChevronsUpDown className="size-4 text-fg-subtle" aria-hidden />
        </span>
      </button>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 80 }}
            className="animate-[scale-in_0.1s_ease-out] overflow-hidden rounded-lg bg-surface-raised shadow-overlay ring-1 ring-border"
          >
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-fg-subtle" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t("common.search")}
                  className="h-9 w-full rounded-md bg-surface ps-8 pe-2 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-fg-subtle">{t("common.noResults")}</li>
              ) : (
                filtered.map((o, i) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      // The panel is a listbox, so its choices must be options —
                      // otherwise assistive tech announces an empty list.
                      role="option"
                      aria-selected={o.value === value}
                      onClick={() => choose(o.value)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors",
                        i === active ? "bg-surface-hover" : "",
                        o.value === value ? "font-medium text-primary" : "text-fg",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{o.label}</span>
                        {o.hint && <span className="block truncate text-xs text-fg-subtle">{o.hint}</span>}
                      </span>
                      {o.value === value && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
