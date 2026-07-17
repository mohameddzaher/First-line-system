"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { statusInfo } from "@/lib/statusMeta";
import { initials } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import { EmployeeFormModal } from "./EmployeeFormModal";

export interface EmployeeRow {
  _id: string;
  nameAr: string;
  nameEn?: string;
  email?: string;
  employeeNumber?: string;
  jobTitle?: string;
  idNumber: string;
  nationality: string;
  status: string;
  department?: { nameAr: string; nameEn?: string } | null;
  project?: { nameAr: string; nameEn?: string } | null;
}

export function EmployeesClient({
  initial,
  title,
  statusFilterOptions,
  departmentOptions,
  projectOptions,
  nationalityOptions,
}: {
  initial: ListResult<EmployeeRow>;
  title: string;
  statusFilterOptions: { value: string; label: string }[];
  departmentOptions: { value: string; label: string }[];
  projectOptions: { value: string; label: string }[];
  nationalityOptions: { value: string; label: string }[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<EmployeeRow>[] = [
    {
      key: "nameAr",
      header: t("common.name"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(row.nameAr)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{row.nameAr}</p>
            {row.email && (
              <p className="truncate text-xs text-fg-muted" dir="ltr">
                {row.email}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "employeeNumber",
      header: t("hr.employeeNumber"),
      sortable: true,
      hideOnMobile: true,
      cell: (row) => <span className="tabular text-sm text-fg-muted">{row.employeeNumber || "—"}</span>,
    },
    {
      key: "jobTitle",
      header: t("hr.jobTitle"),
      hideOnMobile: true,
      cell: (row) => <span className="text-sm text-fg">{row.jobTitle || "—"}</span>,
    },
    {
      key: "idNumber",
      header: t("hr.iqamaOrId"),
      hideOnMobile: true,
      cell: (row) => <span className="tabular text-sm text-fg-muted">{row.idNumber}</span>,
    },
    {
      key: "nationality",
      header: t("hr.nationality"),
      sortable: true,
      hideOnMobile: true,
      cell: (row) => <span className="text-sm text-fg">{row.nationality}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      sortable: true,
      align: "center",
      cell: (row) => {
        const info = statusInfo("employee", row.status);
        return (
          <Badge tone={info.tone} dot>
            {locale === "ar" ? info.ar : info.en}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={`${initial.total} ${t("common.results")}`}
        action={
          <Button onClick={() => setFormOpen(true)} icon={<Plus className="size-4" />}>
            {t("hr.addEmployee")}
          </Button>
        }
      />

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={(r) => router.push(`/hr/employees/${r._id}`)}
        filters={[
          { key: "status", label: t("common.status"), options: statusFilterOptions },
          { key: "nationality", label: t("hr.nationality"), options: nationalityOptions },
          { key: "department", label: t("hr.department"), options: departmentOptions },
          { key: "project", label: t("hr.project"), options: projectOptions },
        ]}
        dateField={{ key: "hireDate", label: t("hr.hireDate") }}
        exportConfig={{ endpoint: "/api/hr/employees/export", filename: "employees" }}
      />

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        departmentOptions={departmentOptions}
        projectOptions={projectOptions}
        onSaved={(id) => {
          setFormOpen(false);
          router.push(`/hr/employees/${id}`);
        }}
      />
    </>
  );
}
