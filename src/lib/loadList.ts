import "server-only";
import type { Model } from "mongoose";
import { requirePermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { runListQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery, type ListResult } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { getLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Standard list-page loader: enforces the read permission, parses the query
 * string, runs the list, and returns a serialized result plus the locale.
 * Every simple list page uses this so pagination/search/filter behave the same.
 */
export async function loadList<T>(
  model: Model<T>,
  permission: string,
  spec: ListSpec<T>,
  searchParams: Record<string, string>,
): Promise<{ result: ListResult<Record<string, unknown>>; locale: Locale }> {
  await requirePermission(permission);
  await connectDB();
  const [locale] = await Promise.all([getLocale()]);
  const query = parseListQuery(new URLSearchParams(searchParams));
  const result = await runListQuery(model, query, spec);
  return { result: serialize(result), locale };
}
