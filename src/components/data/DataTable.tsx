"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { ExportButton, type ExportConfig } from "@/components/data/ExportButton";
import { useI18n } from "@/i18n/provider";
import { LIMIT_OPTIONS } from "@/lib/query";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Omit to render `row[key]`. */
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  /** Hidden below md — use for secondary columns so mobile stays readable. */
  hideOnMobile?: boolean;
}

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  /** Stable row key — never use the array index. */
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  filters?: FilterDef[];
  /** Enables the date-range control, filtering on this field server-side. */
  dateField?: { key: string; label: string };
  exportConfig?: ExportConfig;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarExtra?: React.ReactNode;
  loading?: boolean;
}

/**
 * URL-driven table. Every control writes to the query string, which the server
 * component reads — so search/filter/sort/page state survives refresh, is
 * shareable as a link, and the Excel export inherits it for free.
 */
export function DataTable<T>({
  rows,
  columns,
  total,
  page,
  limit,
  pages,
  rowKey,
  onRowClick,
  filters = [],
  dateField,
  exportConfig,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  toolbarExtra,
  loading,
}: DataTableProps<T>) {
  const { t, dir } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const firstRender = useRef(true);

  const setParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (resetPage && !("page" in updates)) next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce search so typing doesn't fire a query per keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if ((params.get("search") ?? "") !== searchInput) {
        setParams({ search: searchInput || null });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, params, setParams]);

  // Keep the input in sync when the URL changes from elsewhere (back button).
  useEffect(() => {
    const urlSearch = params.get("search") ?? "";
    setSearchInput((current) => (current === urlSearch ? current : urlSearch));
  }, [params]);

  const sort = params.get("sort");
  const sortDir = params.get("dir") === "asc" ? "asc" : "desc";

  const toggleSort = (key: string) => {
    if (sort === key) {
      setParams({ sort: key, dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      setParams({ sort: key, dir: "asc" });
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const f of filters) if (params.get(`f_${f.key}`)) count++;
    if (params.get("dateFrom") || params.get("dateTo")) count++;
    return count;
  }, [filters, params]);

  const clearFilters = () => {
    const updates: Record<string, string | null> = { dateFrom: null, dateTo: null, dateField: null };
    for (const f of filters) updates[`f_${f.key}`] = null;
    setParams(updates);
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder ?? t("common.searchPlaceholder")}
            aria-label={t("common.search")}
            className="h-10 w-full rounded-lg bg-surface ps-9 pe-9 text-sm text-fg ring-1 ring-inset ring-border transition-shadow placeholder:text-fg-subtle focus:ring-2 focus:ring-ring focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label={t("common.clearFilters")}
              className="absolute inset-y-0 end-2 my-auto flex size-6 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {toolbarExtra}
          {(filters.length > 0 || dateField) && (
            <Button
              variant={activeFilterCount > 0 ? "primary" : "secondary"}
              onClick={() => setShowFilters((s) => !s)}
              icon={<SlidersHorizontal className="size-4" />}
              aria-expanded={showFilters}
            >
              {t("common.filter")}
              {activeFilterCount > 0 && (
                <span className="ms-1 rounded-full bg-white/20 px-1.5 text-xs tabular">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          {exportConfig && <ExportButton config={exportConfig} total={total} filters={filters} dateField={dateField} />}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (filters.length > 0 || dateField) && (
        <div className="animate-[slide-up_0.2s_ease-out] rounded-xl bg-surface p-4 ring-1 ring-border">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label htmlFor={`filter-${f.key}`} className="block text-xs font-medium text-fg-muted">
                  {f.label}
                </label>
                <select
                  id={`filter-${f.key}`}
                  value={params.get(`f_${f.key}`) ?? ""}
                  onChange={(e) => setParams({ [`f_${f.key}`]: e.target.value || null })}
                  className="h-9 w-full cursor-pointer rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">{t("common.all")}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {dateField && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="filter-date-from" className="block text-xs font-medium text-fg-muted">
                    {t("common.dateFrom")} — {dateField.label}
                  </label>
                  <input
                    id="filter-date-from"
                    type="date"
                    value={params.get("dateFrom") ?? ""}
                    onChange={(e) =>
                      setParams({ dateFrom: e.target.value || null, dateField: dateField.key })
                    }
                    className="h-9 w-full rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="filter-date-to" className="block text-xs font-medium text-fg-muted">
                    {t("common.dateTo")} — {dateField.label}
                  </label>
                  <input
                    id="filter-date-to"
                    type="date"
                    value={params.get("dateTo") ?? ""}
                    onChange={(e) =>
                      setParams({ dateTo: e.target.value || null, dateField: dateField.key })
                    }
                    className="h-9 w-full rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="size-3.5" />}>
                {t("common.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-border shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-subtle">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-semibold whitespace-nowrap text-fg-muted",
                      col.align === "center" && "text-center",
                      col.align === "end" ? "text-end" : "text-start",
                      col.hideOnMobile && "hidden md:table-cell",
                      col.className,
                    )}
                    aria-sort={
                      sort === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined
                    }
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-fg"
                      >
                        {col.header}
                        {sort === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5 text-primary" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3.5 text-primary" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn("transition-opacity", loading && "pointer-events-none opacity-50")}>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      icon={<Inbox className="size-5" />}
                      title={emptyTitle ?? t("common.noResults")}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-surface-hover",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-fg",
                          col.align === "center" && "text-center",
                          col.align === "end" ? "text-end" : "text-start",
                          col.hideOnMobile && "hidden md:table-cell",
                          col.className,
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-border bg-bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-fg-muted tabular">
                {from}–{to} {t("common.of")} {total} {t("common.results")}
              </p>
              <select
                value={limit}
                onChange={(e) => setParams({ limit: e.target.value })}
                aria-label={t("common.rowsPerPage")}
                className="h-7 cursor-pointer rounded-md bg-surface px-1.5 text-xs ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParams({ page: String(page - 1) }, false)}
                aria-label={t("common.previous")}
              >
                <PrevIcon className="size-4" aria-hidden />
              </Button>
              <span className="px-3 text-xs text-fg-muted tabular">
                {t("common.page")} {page} {t("common.of")} {pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setParams({ page: String(page + 1) }, false)}
                aria-label={t("common.next")}
              >
                <NextIcon className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
