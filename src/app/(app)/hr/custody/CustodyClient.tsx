"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { statusInfo, statusOptions } from "@/lib/statusMeta";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { CustodyRow } from "./page";

const TYPES = [
  ["laptop", "لابتوب", "Laptop"],
  ["phone", "هاتف", "Phone"],
  ["vehicle", "سيارة", "Vehicle"],
  ["motorcycle", "دراجة آلية", "Motorcycle"],
  ["sim_card", "شريحة اتصال", "SIM Card"],
  ["uniform", "زي", "Uniform"],
  ["tools", "عدة", "Tools"],
  ["access_card", "بطاقة دخول", "Access Card"],
  ["other", "أخرى", "Other"],
] as const;

export function CustodyClient({
  initial,
  locale,
  title,
  employees,
}: {
  initial: ListResult<CustodyRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const typeLabel = (v: string) => {
    const found = TYPES.find((tp) => tp[0] === v);
    return found ? (locale === "ar" ? found[1] : found[2]) : v;
  };

  const columns: Column<CustodyRow>[] = [
    {
      key: "employee",
      header: locale === "ar" ? "الموظف" : "Employee",
      cell: (r) =>
        r.employee ? (
          <span className="text-sm font-medium text-fg">{r.employee.nameAr}</span>
        ) : (
          <span className="text-sm text-fg-subtle">{locale === "ar" ? "في المستودع" : "In stock"}</span>
        ),
    },
    { key: "name", header: locale === "ar" ? "الصنف" : "Item", sortable: true, cell: (r) => <span className="font-medium text-fg">{r.name}{r.brand ? <span className="text-fg-subtle"> · {r.brand}</span> : null}</span> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{typeLabel(r.type)}</span> },
    { key: "serial", header: locale === "ar" ? "الرقم التسلسلي" : "Serial", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted" dir="ltr">{r.serial || "—"}</span> },
    { key: "assignedDate", header: locale === "ar" ? "تاريخ التسليم" : "Assigned", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.assignedDate ? formatDate(r.assignedDate) : "—"}</span> },
    {
      key: "status",
      header: t("common.status"),
      align: "center",
      cell: (r) => {
        const info = statusInfo("custody", r.status);
        return <Badge tone={info.tone} dot>{locale === "ar" ? info.ar : info.en}</Badge>;
      },
    },
  ];

  const fields: FieldDef[] = [
    { key: "name", label: locale === "ar" ? "اسم الصنف" : "Item Name", type: "text", required: true },
    { key: "type", label: t("common.type"), type: "select", options: TYPES.map((tp) => ({ value: tp[0], label: locale === "ar" ? tp[1] : tp[2] })) },
    { key: "brand", label: locale === "ar" ? "الماركة" : "Brand", type: "text" },
    { key: "serial", label: locale === "ar" ? "الرقم التسلسلي" : "Serial", type: "text", dir: "ltr" },
    { key: "condition", label: locale === "ar" ? "الحالة الفنية" : "Condition", type: "select", options: [
      { value: "new", label: locale === "ar" ? "جديد" : "New" },
      { value: "good", label: locale === "ar" ? "جيد" : "Good" },
      { value: "fair", label: locale === "ar" ? "مقبول" : "Fair" },
      { value: "poor", label: locale === "ar" ? "ضعيف" : "Poor" },
    ] },
    { key: "employee", label: locale === "ar" ? "تسليم إلى موظف" : "Assign to Employee", type: "select", options: employees, placeholder: locale === "ar" ? "المستودع (بدون موظف)" : "Warehouse (unassigned)" },
    { key: "estimatedValue", label: locale === "ar" ? "القيمة التقديرية" : "Estimated Value", type: "number", dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/custody"
      exportFilename="custody"
      addLabel={locale === "ar" ? "إضافة عهدة" : "Add Custody"}
      labelOf={(r) => r.name}
      filters={[
        { key: "type", label: t("common.type"), options: TYPES.map((tp) => ({ value: tp[0], label: locale === "ar" ? tp[1] : tp[2] })) },
        { key: "status", label: t("common.status"), options: statusOptions("custody", locale) },
      ]}
    />
  );
}
