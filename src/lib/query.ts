/**
 * Shared contract between every list page, its API route, and the Excel export.
 * One definition means search/filter/sort/paginate behave identically everywhere
 * and an export always reflects exactly what the table is showing.
 */

export interface ListQuery {
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  limit?: number;
  /** Inclusive date-range bounds applied to `dateField`. */
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  /** Arbitrary column filters: { status: "active", department: "<id>" } */
  filters?: Record<string, string>;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const DEFAULT_LIMIT = 25;
export const LIMIT_OPTIONS = [10, 25, 50, 100] as const;
const MAX_LIMIT = 1000;

/** Parses a URLSearchParams into a validated ListQuery. */
export function parseListQuery(params: URLSearchParams): Required<
  Pick<ListQuery, "page" | "limit">
> &
  ListQuery {
  const filters: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("f_") && value) filters[key.slice(2)] = value;
  }

  const page = Math.max(1, Number(params.get("page")) || 1);
  const rawLimit = Number(params.get("limit")) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));

  return {
    search: params.get("search")?.trim() || undefined,
    sort: params.get("sort") || undefined,
    dir: params.get("dir") === "asc" ? "asc" : "desc",
    page,
    limit,
    dateFrom: params.get("dateFrom") || undefined,
    dateTo: params.get("dateTo") || undefined,
    dateField: params.get("dateField") || undefined,
    filters: Object.keys(filters).length ? filters : undefined,
  };
}

/** Serialises a ListQuery back into a query string (for links and exports). */
export function toSearchParams(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.dir) params.set("dir", query.dir);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.dateField) params.set("dateField", query.dateField);
  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (value) params.set(`f_${key}`, value);
  }
  return params;
}
