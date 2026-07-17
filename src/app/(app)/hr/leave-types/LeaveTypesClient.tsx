"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { LeaveTypeRow } from "./page";

export function LeaveTypesClient({
  initial,
  locale,
  title,
}: {
  initial: ListResult<LeaveTypeRow>;
  locale: Locale;
  title: string;
}) {
  const { t } = useI18n();
  const yes = locale === "ar" ? "نعم" : "Yes";
  const no = locale === "ar" ? "لا" : "No";

  const columns: Column<LeaveTypeRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-fg">{locale === "ar" ? r.nameAr : r.nameEn}</p>
          <p className="text-xs text-fg-muted">{locale === "ar" ? r.nameEn : r.nameAr}</p>
        </div>
      ),
    },
    { key: "code", header: locale === "ar" ? "الرمز" : "Code", cell: (r) => <span className="font-mono text-xs text-fg-muted">{r.code}</span> },
    { key: "paid", header: locale === "ar" ? "مدفوعة" : "Paid", align: "center", cell: (r) => <Badge tone={r.paid ? "success" : "neutral"}>{r.paid ? yes : no}</Badge> },
    {
      key: "affectsBalance",
      header: locale === "ar" ? "تؤثر على الرصيد" : "Affects Balance",
      align: "center",
      cell: (r) => <Badge tone={r.affectsBalance ? "info" : "neutral"}>{r.affectsBalance ? yes : no}</Badge>,
    },
    { key: "isActive", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.isActive ? "success" : "neutral"} dot>{r.isActive ? (locale === "ar" ? "نشط" : "Active") : locale === "ar" ? "معطّل" : "Inactive"}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "nameAr", label: locale === "ar" ? "الاسم بالعربية" : "Arabic Name", type: "text", required: true },
    { key: "nameEn", label: locale === "ar" ? "الاسم بالإنجليزية" : "English Name", type: "text", required: true, dir: "ltr" },
    { key: "code", label: locale === "ar" ? "الرمز" : "Code", type: "text", required: true, dir: "ltr" },
    { key: "paid", label: locale === "ar" ? "مدفوعة الأجر" : "Paid", type: "checkbox" },
    { key: "affectsBalance", label: locale === "ar" ? "تؤثر على رصيد الإجازات" : "Affects leave balance", type: "checkbox" },
    { key: "isActive", label: locale === "ar" ? "نشط" : "Active", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/leave-types"
      exportFilename="leave-types"
      addLabel={locale === "ar" ? "إضافة نوع" : "Add Type"}
      labelOf={(r) => (locale === "ar" ? r.nameAr : r.nameEn)}
      filters={[
        { key: "paid", label: locale === "ar" ? "مدفوعة" : "Paid", options: [{ value: "true", label: yes }, { value: "false", label: no }] },
      ]}
    />
  );
}
