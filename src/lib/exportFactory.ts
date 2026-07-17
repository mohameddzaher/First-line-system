import "server-only";
import { NextResponse } from "next/server";
import type { Model } from "mongoose";
import { guard } from "@/lib/api";
import { runExportQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { buildExcel, excelHeaders, type ExcelColumn } from "@/lib/excel";
import { isLocale, type Locale } from "@/i18n/dictionaries";
import { writeAudit } from "@/lib/audit";

interface ExportConfig<T> {
  model: Model<T>;
  resource: string;
  listSpec: ListSpec<T>;
  columns: (locale: Locale) => ExcelColumn[];
  sheetName: string;
  titleAr: string;
  titleEn: string;
  filenameAr: string;
  filenameEn: string;
}

/** Generates a GET handler that streams a filtered .xlsx for any resource. */
export function exportRoute<T>(config: ExportConfig<T>) {
  return guard({ permission: `${config.resource}:export` }, async ({ request, user }) => {
    const url = new URL(request.url);
    const query = parseListQuery(url.searchParams);
    const localeParam = url.searchParams.get("locale");
    const locale: Locale = isLocale(localeParam ?? undefined) ? (localeParam as Locale) : "ar";

    const rows = await runExportQuery(config.model, query, config.listSpec);

    const buffer = await buildExcel(rows, config.columns(locale), {
      locale,
      sheetName: config.sheetName,
      title: locale === "ar" ? config.titleAr : config.titleEn,
      generatedBy: user.fullName,
    });

    await writeAudit({
      actor: user,
      action: "export",
      resource: config.resource,
      meta: { count: rows.length },
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: excelHeaders(locale === "ar" ? config.filenameAr : config.filenameEn),
    });
  });
}
