import "server-only";
import type { Model } from "mongoose";

const MONTHS_AR = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Counts documents per month over the last `months`, bucketed by `dateField`.
 * Returns a dense series (zero-filled) ending with the current month, so trend
 * charts always render a full axis even on sparse data.
 */
export async function monthlySeries(
  model: Model<unknown>,
  dateField: string,
  months: number,
  locale: "ar" | "en",
  match: Record<string, unknown> = {},
): Promise<SeriesPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await model.aggregate([
    { $match: { ...match, [dateField]: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: `$${dateField}` }, m: { $month: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const r of rows) map.set(`${r._id.y}-${r._id.m}`, r.count);

  const names = locale === "ar" ? MONTHS_AR : MONTHS_EN;
  const out: SeriesPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push({ label: names[d.getMonth()], value: map.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0 });
  }
  return out;
}

/** Same as monthlySeries but sums a numeric field instead of counting. */
export async function monthlySumSeries(
  model: Model<unknown>,
  dateField: string,
  sumField: string,
  months: number,
  locale: "ar" | "en",
  match: Record<string, unknown> = {},
): Promise<SeriesPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await model.aggregate([
    { $match: { ...match, [dateField]: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: `$${dateField}` }, m: { $month: `$${dateField}` } },
        total: { $sum: `$${sumField}` },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const r of rows) map.set(`${r._id.y}-${r._id.m}`, r.total);

  const names = locale === "ar" ? MONTHS_AR : MONTHS_EN;
  const out: SeriesPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push({ label: names[d.getMonth()], value: Math.round(map.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0) });
  }
  return out;
}
