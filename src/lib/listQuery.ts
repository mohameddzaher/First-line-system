import "server-only";
import type mongoose from "mongoose";

// Mongoose 9's QueryFilter is strict enough that hand-built conditions
// (e.g. { role: someString }) don't type-check against enum fields. Filters here
// are constructed dynamically and validated at the model layer, so we use a
// loose shape and cast once at the query call.
type FilterQuery<T> = Record<string, unknown> & { $and?: Record<string, unknown>[]; $or?: Record<string, unknown>[] };
type Model<T> = mongoose.Model<T>;
import { escapeRegex } from "@/lib/utils";
import type { ListQuery, ListResult } from "@/lib/query";

/**
 * Search across a referenced collection. A plain regex on a dotted path like
 * "employee.nameAr" matches nothing because the ref isn't joined at query time —
 * so instead we regex the referenced collection, collect matching _ids, and match
 * the local ObjectId field against them. This is what makes "search by employee
 * name" work on leaves/contracts/requests/deals/etc.
 */
export interface RefSearch {
  /** Local ObjectId field on this collection, e.g. "employee". */
  localField: string;
  /** Lazily-resolved referenced model (function to avoid circular imports). */
  model: () => Model<unknown>;
  /** Fields on the referenced doc to regex-match, e.g. ["nameAr","nameEn"]. */
  fields: string[];
}

export interface ListSpec<T> {
  /** Own-document fields the free-text search scans with a regex. */
  searchFields: string[];
  /** Cross-reference search targets (search by related record's fields). */
  refSearch?: RefSearch[];
  /** Filter key -> how to translate it into a Mongo condition. */
  filterMap?: Record<string, (value: string) => FilterQuery<T> | null>;
  /** Whitelist of sortable fields — never trust `sort` from the client. */
  sortable: string[];
  defaultSort?: string;
  /** Base conditions always applied (e.g. scoping to the caller's own records). */
  baseFilter?: FilterQuery<T>;
  populate?: string | string[] | mongoose.PopulateOptions | mongoose.PopulateOptions[];
}

/** Resolves ref-search fields into `{ localField: { $in: matchedIds } }` OR-branches. */
async function resolveRefSearchOr<T>(
  query: ListQuery,
  spec: ListSpec<T>,
): Promise<FilterQuery<T>[]> {
  if (!query.search || !spec.refSearch?.length) return [];
  const rx = new RegExp(escapeRegex(query.search), "i");

  const branches = await Promise.all(
    spec.refSearch.map(async (ref) => {
      const ids = await ref
        .model()
        .find({ $or: ref.fields.map((f) => ({ [f]: rx })) } as never)
        .distinct("_id");
      if (!ids.length) return null;
      return { [ref.localField]: { $in: ids } } as FilterQuery<T>;
    }),
  );
  return branches.filter(Boolean) as FilterQuery<T>[];
}

/**
 * Turns a ListQuery into a Mongo filter. Search is an OR of case-insensitive
 * regex matches across `searchFields`, so typing any value visible in the table
 * finds the row.
 */
export function buildFilter<T>(
  query: ListQuery,
  spec: ListSpec<T>,
  refSearchOr: FilterQuery<T>[] = [],
): FilterQuery<T> {
  const and: FilterQuery<T>[] = [];

  if (spec.baseFilter && Object.keys(spec.baseFilter).length) {
    and.push(spec.baseFilter);
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), "i");
    const or: FilterQuery<T>[] = [
      ...spec.searchFields.map((field) => ({ [field]: rx }) as FilterQuery<T>),
      ...refSearchOr,
    ];
    and.push({ $or: or } as FilterQuery<T>);
  }

  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (!value || value === "all") continue;
    const mapper = spec.filterMap?.[key];
    const condition = mapper ? mapper(value) : ({ [key]: value } as FilterQuery<T>);
    if (condition) and.push(condition);
  }

  if ((query.dateFrom || query.dateTo) && query.dateField) {
    const range: Record<string, Date> = {};
    if (query.dateFrom) {
      const from = new Date(query.dateFrom);
      from.setHours(0, 0, 0, 0);
      range.$gte = from;
    }
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
    and.push({ [query.dateField]: range } as FilterQuery<T>);
  }

  return and.length ? ({ $and: and } as FilterQuery<T>) : {};
}

export function buildSort<T>(query: ListQuery, spec: ListSpec<T>): Record<string, 1 | -1> {
  const field =
    query.sort && spec.sortable.includes(query.sort) ? query.sort : (spec.defaultSort ?? "createdAt");
  return { [field]: query.dir === "asc" ? 1 : -1 };
}

/**
 * Runs the list query. Count and page are fetched in parallel — on a 300k-row
 * collection the sequential version doubles the response time.
 */
export async function runListQuery<T>(
  model: Model<T>,
  query: ListQuery,
  spec: ListSpec<T>,
): Promise<ListResult<Record<string, unknown>>> {
  const refOr = await resolveRefSearchOr(query, spec);
  const filter = buildFilter(query, spec, refOr) as mongoose.QueryFilter<T>;
  const sort = buildSort(query, spec);
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;

  let q = model
    .find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  if (spec.populate) q = q.populate(spec.populate as string);

  const [rows, total] = await Promise.all([
    q.lean().exec(),
    model.countDocuments(filter).exec(),
  ]);

  return {
    rows: rows as Record<string, unknown>[],
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Same filter/sort as the table, no pagination — used by the Excel export. */
export async function runExportQuery<T>(
  model: Model<T>,
  query: ListQuery,
  spec: ListSpec<T>,
  cap = 50_000,
): Promise<Record<string, unknown>[]> {
  const refOr = await resolveRefSearchOr(query, spec);
  const filter = buildFilter(query, spec, refOr) as mongoose.QueryFilter<T>;
  const sort = buildSort(query, spec);

  let q = model.find(filter).sort(sort).limit(cap);
  if (spec.populate) q = q.populate(spec.populate as string);

  return (await q.lean().exec()) as Record<string, unknown>[];
}
