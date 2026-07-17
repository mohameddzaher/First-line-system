import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { User } from "@/models/User";
import { runExportQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { buildExcel, excelHeaders, type ExcelColumn } from "@/lib/excel";
import { isLocale, type Locale } from "@/i18n/dictionaries";
import { roleLabel } from "@/lib/roleOptions";
import { writeAudit } from "@/lib/audit";
import type { RoleKey } from "@/lib/rbac";

export const runtime = "nodejs";

export const GET = guard({ permission: "admin.users:export" }, async ({ request, user }) => {
  const url = new URL(request.url);
  const query = parseListQuery(url.searchParams);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = isLocale(localeParam ?? undefined) ? (localeParam as Locale) : "ar";

  const rows = await runExportQuery(User, query, {
    searchFields: ["firstName", "lastName", "email"],
    filterMap: {
      role: (v) => ({ role: v }),
      status: (v) => ({ isActive: v === "active" }),
    },
    sortable: ["firstName", "email", "role", "createdAt", "lastLoginAt"],
    defaultSort: "createdAt",
    populate: [{ path: "employee", select: "nameAr employeeNumber" }] as unknown as string,
  });

  const columns: ExcelColumn[] = [
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 28, value: (r) => `${r.firstName} ${r.lastName}` },
    { key: "email", headerAr: "البريد الإلكتروني", headerEn: "Email", width: 30 },
    { key: "role", headerAr: "الدور", headerEn: "Role", width: 22, value: (r) => roleLabel(r.role as RoleKey, locale) },
    {
      key: "employee",
      headerAr: "الموظف المرتبط",
      headerEn: "Linked Employee",
      width: 26,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "isActive", headerAr: "الحالة", headerEn: "Status", width: 12, value: (r) => (r.isActive ? "Active" : "Disabled") },
    { key: "lastLoginAt", headerAr: "آخر دخول", headerEn: "Last Login", width: 18, format: "date" },
    { key: "createdAt", headerAr: "تاريخ الإنشاء", headerEn: "Created", width: 18, format: "date" },
  ];

  const buffer = await buildExcel(rows, columns, {
    locale,
    sheetName: "Users",
    title: locale === "ar" ? "المستخدمون" : "Users",
    generatedBy: user.fullName,
  });

  await writeAudit({
    actor: user,
    action: "export",
    resource: "admin.users",
    meta: { count: rows.length },
  });

  return new NextResponse(buffer as unknown as BodyInit, { headers: excelHeaders(locale === "ar" ? "المستخدمون" : "users") });
});
