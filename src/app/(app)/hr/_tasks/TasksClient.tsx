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

export interface TaskRow {
  _id: string;
  kind: "task" | "complaint";
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: { firstName: string; lastName: string } | null;
}

const PRIORITIES = [
  ["low", "منخفضة", "Low", "neutral"],
  ["medium", "متوسطة", "Medium", "info"],
  ["high", "عالية", "High", "warning"],
  ["urgent", "عاجلة", "Urgent", "danger"],
] as const;

/** Shared by "My Tasks" and "Complaints" — `kind` fixes which rows and defaults apply. */
export function TasksClient({
  initial,
  locale,
  title,
  kind,
  employees,
  users,
}: {
  initial: ListResult<TaskRow>;
  locale: Locale;
  title: string;
  kind: "task" | "complaint";
  employees: { value: string; label: string }[];
  users: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const prioLabel = (v: string) => {
    const f = PRIORITIES.find((x) => x[0] === v);
    return f ? { label: locale === "ar" ? f[1] : f[2], tone: f[3] } : { label: v, tone: "neutral" as const };
  };

  const columns: Column<TaskRow>[] = [
    { key: "title", header: locale === "ar" ? "العنوان" : "Title", sortable: true, cell: (r) => <span className="font-medium text-fg">{r.title}</span> },
    { key: "priority", header: locale === "ar" ? "الأولوية" : "Priority", align: "center", cell: (r) => { const p = prioLabel(r.priority); return <Badge tone={p.tone as never}>{p.label}</Badge>; } },
    { key: "assignedTo", header: locale === "ar" ? "المكلّف" : "Assigned", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : "—"}</span> },
    { key: "dueDate", header: locale === "ar" ? "الاستحقاق" : "Due", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.dueDate ? formatDate(r.dueDate) : "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const i = statusInfo("task", r.status); return <Badge tone={i.tone} dot>{locale === "ar" ? i.ar : i.en}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "title", label: locale === "ar" ? "العنوان" : "Title", type: "text", required: true, span: 2 },
    { key: "description", label: locale === "ar" ? "الوصف" : "Description", type: "textarea", span: 2 },
    { key: "priority", label: locale === "ar" ? "الأولوية" : "Priority", type: "select", options: PRIORITIES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: statusOptions("task", locale) },
    { key: "dueDate", label: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date", type: "date" },
    { key: "assignedTo", label: locale === "ar" ? "المكلّف" : "Assigned To", type: "select", options: users },
    { key: "relatedEmployee", label: locale === "ar" ? "الموظف المعني" : "Related Employee", type: "select", options: employees, span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/tasks"
      exportFilename={kind === "task" ? "tasks" : "complaints"}
      addLabel={t("common.add")}
      labelOf={(r) => r.title}
      transformPayload={(d) => ({ ...d, kind })}
      filters={[
        { key: "status", label: t("common.status"), options: statusOptions("task", locale) },
        { key: "priority", label: locale === "ar" ? "الأولوية" : "Priority", options: PRIORITIES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
    />
  );
}
