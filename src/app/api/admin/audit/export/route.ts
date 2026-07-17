import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { AuditLog } from "@/models/AuditLog";
import { runExportQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { buildExcel, excelHeaders, type ExcelColumn } from "@/lib/excel";
import { isLocale, type Locale } from "@/i18n/dictionaries";

export const runtime = "nodejs";

export const GET = guard({ permission: "admin.audit:export" }, async ({ request, user }) => {
  const url = new URL(request.url);
  const query = parseListQuery(url.searchParams);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = isLocale(localeParam ?? undefined) ? (localeParam as Locale) : "ar";

  const rows = await runExportQuery(AuditLog, query, {
    searchFields: ["actorName", "actorEmail", "resourceLabel", "resource", "ip"],
    filterMap: {
      action: (v) => ({ action: v }),
      resource: (v) => ({ resource: v }),
    },
    sortable: ["createdAt", "action", "resource", "actorName"],
    defaultSort: "createdAt",
  });

  const columns: ExcelColumn[] = [
    { key: "createdAt", headerAr: "التوقيت", headerEn: "When", width: 20, format: "datetime" },
    { key: "actorName", headerAr: "المستخدم", headerEn: "User", width: 22 },
    { key: "actorEmail", headerAr: "البريد", headerEn: "Email", width: 26 },
    { key: "action", headerAr: "الإجراء", headerEn: "Action", width: 14 },
    { key: "resource", headerAr: "القسم", headerEn: "Section", width: 20 },
    { key: "resourceLabel", headerAr: "السجل", headerEn: "Record", width: 30 },
    { key: "ip", headerAr: "IP", headerEn: "IP", width: 16 },
    {
      key: "changes",
      headerAr: "التغييرات",
      headerEn: "Changes",
      width: 40,
      value: (r) =>
        (r.changes as { field: string; from: unknown; to: unknown }[] | undefined)
          ?.map((c) => `${c.field}: ${fmt(c.from)} → ${fmt(c.to)}`)
          .join("; ") ?? "",
    },
  ];

  const buffer = await buildExcel(rows, columns, {
    locale,
    sheetName: "Audit Log",
    title: locale === "ar" ? "سجل العمليات" : "Audit Log",
    generatedBy: user.fullName,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: excelHeaders(locale === "ar" ? "سجل-العمليات" : "audit-log"),
  });
});

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "∅";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
