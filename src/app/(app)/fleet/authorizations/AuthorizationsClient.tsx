"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface AuthRow {
  _id: string;
  plateNumber: string;
  type: string;
  department?: { nameAr: string } | null;
  currentAuthorization?: {
    employee?: { nameAr: string; employeeNumber?: string } | null;
    startDate?: string;
    authorizationType?: string;
  } | null;
}

const TYPE_LABEL: Record<string, [string, string]> = {
  car: ["سيارة", "Car"],
  motorcycle: ["دراجة آلية", "Motorcycle"],
  heavy_truck: ["شاحنة ثقيلة", "Heavy Truck"],
};

export function AuthorizationsClient({
  initial,
  locale,
  title,
}: {
  initial: ListResult<AuthRow>;
  locale: Locale;
  title: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const columns: Column<AuthRow>[] = [
    { key: "plateNumber", header: locale === "ar" ? "رقم اللوحة" : "Plate", sortable: true, cell: (r) => <span className="font-mono font-medium text-fg" dir="ltr">{r.plateNumber}</span> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{TYPE_LABEL[r.type]?.[locale === "ar" ? 0 : 1] ?? r.type}</span> },
    { key: "employee", header: locale === "ar" ? "مُفوَّضة إلى" : "Authorized To", cell: (r) => <span className="text-sm font-medium text-fg">{r.currentAuthorization?.employee?.nameAr ?? "—"}</span> },
    { key: "authType", header: locale === "ar" ? "نوع التفويض" : "Authorization Type", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.currentAuthorization?.authorizationType ?? "—"}</span> },
    { key: "since", header: locale === "ar" ? "منذ" : "Since", sortable: true, cell: (r) => <span className="tabular text-sm">{r.currentAuthorization?.startDate ? formatDate(r.currentAuthorization.startDate) : "—"}</span> },
    { key: "department", header: t("hr.department"), hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.department?.nameAr ?? "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: () => <Badge tone="success" dot>{locale === "ar" ? "ساري" : "Active"}</Badge> },
  ];

  return (
    <>
      <PageHeader title={title} description={`${initial.total} ${locale === "ar" ? "تفويض ساري" : "active authorizations"}`} />
      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={(r) => router.push(`/fleet/vehicles/${r._id}`)}
        dateField={{ key: "currentAuthorization.startDate", label: locale === "ar" ? "تاريخ التفويض" : "Authorization Date" }}
        exportConfig={{ endpoint: "/api/fleet/vehicles/export", filename: "authorizations" }}
      />
    </>
  );
}
