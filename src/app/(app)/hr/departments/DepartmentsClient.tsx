"use client";

import Link from "next/link";
import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { DepartmentRow } from "./page";

export function DepartmentsClient({
  initial,
  locale,
  title,
  counts,
}: {
  initial: ListResult<DepartmentRow>;
  locale: Locale;
  title: string;
  counts: Record<string, { staff: number; vehicles: number }>;
}) {
  const { t } = useI18n();
  const ar = locale === "ar";

  const columns: Column<DepartmentRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-fg">{ar ? r.nameAr : (r.nameEn ?? r.nameAr)}</p>
          {r.nameEn && r.nameAr ? (
            <p className="text-xs text-fg-muted">{ar ? r.nameEn : r.nameAr}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "code",
      header: ar ? "الرمز" : "Code",
      cell: (r) => <span className="font-mono text-xs text-fg-muted">{r.code || "—"}</span>,
    },
    {
      key: "staff",
      header: ar ? "عدد الموظفين" : "Headcount",
      align: "center",
      // Drills through to the employee list already filtered to this department.
      cell: (r) => (
        <Link
          href={`/hr/employees?f_department=${r._id}`}
          className="font-medium text-primary hover:underline"
        >
          {counts[r._id]?.staff ?? 0}
        </Link>
      ),
    },
    {
      key: "vehicles",
      header: ar ? "المركبات" : "Vehicles",
      align: "center",
      cell: (r) => (
        <Link
          href={`/fleet/vehicles?f_department=${r._id}`}
          className="font-medium text-primary hover:underline"
        >
          {counts[r._id]?.vehicles ?? 0}
        </Link>
      ),
    },
    {
      key: "isActive",
      header: t("common.status"),
      align: "center",
      cell: (r) => (
        <Badge tone={r.isActive ? "success" : "neutral"} dot>
          {r.isActive ? (ar ? "نشطة" : "Active") : ar ? "معطّلة" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const fields: FieldDef[] = [
    { key: "nameAr", label: ar ? "الاسم بالعربية" : "Arabic Name", type: "text", required: true },
    { key: "nameEn", label: ar ? "الاسم بالإنجليزية" : "English Name", type: "text", dir: "ltr" },
    { key: "code", label: ar ? "الرمز" : "Code", type: "text", dir: "ltr" },
    { key: "isActive", label: ar ? "نشطة" : "Active", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/departments"
      exportFilename="departments"
      addLabel={ar ? "إضافة إدارة" : "Add Department"}
      labelOf={(r) => (ar ? r.nameAr : (r.nameEn ?? r.nameAr))}
      filters={[
        {
          key: "isActive",
          label: t("common.status"),
          options: [
            { value: "true", label: ar ? "نشطة" : "Active" },
            { value: "false", label: ar ? "معطّلة" : "Inactive" },
          ],
        },
      ]}
    />
  );
}
