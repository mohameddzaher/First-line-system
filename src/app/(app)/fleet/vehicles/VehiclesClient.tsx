"use client";

import { useRouter } from "next/navigation";
import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { statusInfo, statusOptions } from "@/lib/statusMeta";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface VehicleRow {
  _id: string;
  plateNumber: string;
  plateLatin?: string;
  type: string;
  make?: string;
  makeModel?: string;
  status: string;
  city?: string;
  serviceTier?: string;
  department?: { nameAr: string; nameEn?: string } | null;
  currentAuthorization?: { employee?: { nameAr: string } | null } | null;
}

const TYPES = [
  ["car", "سيارة", "Car"],
  ["motorcycle", "دراجة آلية", "Motorcycle"],
  ["heavy_truck", "شاحنة ثقيلة", "Heavy Truck"],
] as const;

export function VehiclesClient({
  initial,
  locale,
  title,
  employees,
  departments,
  cities = [],
}: {
  initial: ListResult<VehicleRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  cities?: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const typeLabel = (v: string) => {
    const f = TYPES.find((x) => x[0] === v);
    return f ? (locale === "ar" ? f[1] : f[2]) : v;
  };

  const columns: Column<VehicleRow>[] = [
    { key: "plateNumber", header: locale === "ar" ? "رقم اللوحة" : "Plate Number", sortable: true, cell: (r) => <div><span className="font-mono font-medium text-fg" dir="ltr">{r.plateNumber}</span>{r.plateLatin ? <span className="block font-mono text-xs text-fg-subtle" dir="ltr">{r.plateLatin}</span> : null}</div> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{typeLabel(r.type)}{r.serviceTier === "express" ? <span className="ms-1 rounded bg-accent-soft px-1 text-[10px] text-accent">{locale === "ar" ? "الأسرع" : "Express"}</span> : null}</span> },
    { key: "makeModel", header: locale === "ar" ? "الطراز" : "Make/Model", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{[r.make, r.makeModel].filter(Boolean).join(" ") || "—"}</span> },
    { key: "city", header: locale === "ar" ? "المدينة" : "City", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.city || "—"}</span> },
    { key: "authorizedTo", header: locale === "ar" ? "مُفوَّضة إلى" : "Authorized To", cell: (r) => <span className="text-sm text-fg">{r.currentAuthorization?.employee?.nameAr ?? <span className="text-fg-subtle">—</span>}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const i = statusInfo("vehicle", r.status); return <Badge tone={i.tone} dot>{locale === "ar" ? i.ar : i.en}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "plateNumber", label: locale === "ar" ? "رقم اللوحة (عربي)" : "Plate Number (AR)", type: "text", required: true, dir: "rtl" },
    { key: "plateLatin", label: locale === "ar" ? "رقم اللوحة (لاتيني)" : "Plate Number (Latin)", type: "text", dir: "ltr" },
    { key: "type", label: t("common.type"), type: "select", required: true, options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: statusOptions("vehicle", locale) },
    { key: "make", label: locale === "ar" ? "الماركة" : "Make", type: "text" },
    { key: "makeModel", label: locale === "ar" ? "الطراز" : "Model", type: "text" },
    { key: "year", label: locale === "ar" ? "سنة الصنع" : "Year", type: "number", dir: "ltr" },
    { key: "color", label: locale === "ar" ? "اللون" : "Color", type: "text" },
    { key: "city", label: locale === "ar" ? "المدينة" : "City", type: "text" },
    { key: "serviceTier", label: locale === "ar" ? "فئة الخدمة" : "Service Tier", type: "select", options: [{ value: "standard", label: locale === "ar" ? "عادي" : "Standard" }, { value: "express", label: locale === "ar" ? "الأسرع" : "Express" }] },
    { key: "chassisNumber", label: locale === "ar" ? "رقم الهيكل" : "Chassis Number", type: "text", dir: "ltr" },
    { key: "ownership", label: locale === "ar" ? "حالة الملكية" : "Ownership", type: "text" },
    { key: "purchasePrice", label: locale === "ar" ? "مبلغ الشراء" : "Purchase Price", type: "number", dir: "ltr" },
    { key: "department", label: t("hr.department"), type: "select", options: departments, placeholder: t("common.none") },
    { key: "registrationExpiry", label: locale === "ar" ? "انتهاء الاستمارة" : "Registration Expiry", type: "date" },
    { key: "insuranceExpiry", label: locale === "ar" ? "انتهاء التأمين" : "Insurance Expiry", type: "date" },
    { key: "conditionNote", label: locale === "ar" ? "ملاحظة الحالة" : "Condition Note", type: "text", span: 2 },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/fleet/vehicles"
      exportFilename="vehicles"
      addLabel={locale === "ar" ? "إضافة مركبة" : "Add Vehicle"}
      labelOf={(r) => r.plateNumber}
      rowHref={(r) => `/fleet/vehicles/${r._id}`}
      canDelete
      filters={[
        { key: "type", label: t("common.type"), options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        { key: "status", label: t("common.status"), options: statusOptions("vehicle", locale) },
        { key: "city", label: locale === "ar" ? "المدينة" : "City", options: cities },
        { key: "serviceTier", label: locale === "ar" ? "فئة الخدمة" : "Service Tier", options: [{ value: "standard", label: locale === "ar" ? "عادي" : "Standard" }, { value: "express", label: locale === "ar" ? "الأسرع" : "Express" }] },
        { key: "department", label: t("hr.department"), options: departments },
      ]}
    />
  );
}
