"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface AttendanceRow {
  _id: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  hours?: number;
  employee?: { nameAr: string; employeeNumber?: string } | null;
}

const STATUS: Record<string, [string, string, BadgeTone]> = {
  present: ["حاضر", "Present", "success"],
  absent: ["غائب", "Absent", "danger"],
  leave: ["إجازة", "Leave", "info"],
  late: ["متأخر", "Late", "warning"],
  holiday: ["عطلة", "Holiday", "neutral"],
};

export function AttendanceClient({
  initial,
  locale,
  title,
  employees,
}: {
  initial: ListResult<AttendanceRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const ar = locale === "ar";

  const columns: Column<AttendanceRow>[] = [
    { key: "date", header: t("common.date"), sortable: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.date)}</span> },
    { key: "employee", header: ar ? "الموظف" : "Employee", cell: (r) => <span className="font-medium text-fg">{r.employee?.nameAr ?? "—"}</span> },
    { key: "checkIn", header: ar ? "الحضور" : "Check In", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted" dir="ltr">{r.checkIn || "—"}</span> },
    { key: "checkOut", header: ar ? "الانصراف" : "Check Out", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted" dir="ltr">{r.checkOut || "—"}</span> },
    { key: "hours", header: ar ? "الساعات" : "Hours", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.hours ?? "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = STATUS[r.status]; return <Badge tone={m?.[2] ?? "neutral"} dot>{m ? (ar ? m[0] : m[1]) : r.status}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "employee", label: ar ? "الموظف" : "Employee", type: "select", required: true, options: employees, span: 2 },
    { key: "date", label: t("common.date"), type: "date", required: true },
    { key: "status", label: t("common.status"), type: "select", options: Object.entries(STATUS).map(([v, l]) => ({ value: v, label: ar ? l[0] : l[1] })) },
    { key: "checkIn", label: ar ? "وقت الحضور" : "Check In", type: "text", dir: "ltr" },
    { key: "checkOut", label: ar ? "وقت الانصراف" : "Check Out", type: "text", dir: "ltr" },
    { key: "hours", label: ar ? "عدد الساعات" : "Hours", type: "number", dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/attendance"
      exportFilename="attendance"
      addLabel={ar ? "تسجيل حضور" : "Log Attendance"}
      labelOf={(r) => r.employee?.nameAr ?? formatDate(r.date)}
      filters={[{ key: "status", label: t("common.status"), options: Object.entries(STATUS).map(([v, l]) => ({ value: v, label: ar ? l[0] : l[1] })) }]}
      dateField={{ key: "date", label: t("common.date") }}
    />
  );
}
