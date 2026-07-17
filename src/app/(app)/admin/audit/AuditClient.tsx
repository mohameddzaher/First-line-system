"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface AuditRow {
  _id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceLabel?: string;
  changes: { field: string; from: unknown; to: unknown }[];
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_TONE: Record<string, BadgeTone> = {
  create: "success",
  update: "info",
  delete: "danger",
  login: "neutral",
  login_failed: "warning",
  logout: "neutral",
  approve: "success",
  reject: "danger",
  export: "accent",
  transfer: "info",
  revoke: "warning",
  assign: "info",
  return: "neutral",
};

export function AuditClient({
  initial,
  locale,
  title,
  actionOptions,
  resourceOptions,
}: {
  initial: ListResult<AuditRow>;
  locale: Locale;
  title: string;
  actionOptions: { value: string; label: string }[];
  resourceOptions: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const columns: Column<AuditRow>[] = [
    {
      key: "createdAt",
      header: t("admin.auditWhen"),
      sortable: true,
      cell: (row) => <span className="tabular text-sm text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "actorName",
      header: t("admin.auditActor"),
      sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.actorName}</p>
          {row.actorEmail && <p className="truncate text-xs text-fg-muted" dir="ltr">{row.actorEmail}</p>}
        </div>
      ),
    },
    {
      key: "action",
      header: t("admin.auditAction"),
      sortable: true,
      cell: (row) => <Badge tone={ACTION_TONE[row.action] ?? "neutral"}>{row.action}</Badge>,
    },
    {
      key: "resource",
      header: t("admin.auditResource"),
      sortable: true,
      hideOnMobile: true,
      cell: (row) => <span className="font-mono text-xs text-fg-muted">{row.resource}</span>,
    },
    {
      key: "resourceLabel",
      header: t("admin.auditTarget"),
      hideOnMobile: true,
      cell: (row) => <span className="text-sm text-fg">{row.resourceLabel || "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={() => setDetail(row)} aria-label={t("common.details")}>
          <Eye className="size-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={title} description={`${initial.total} ${t("common.results")}`} />

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={(r) => setDetail(r)}
        dateField={{ key: "createdAt", label: t("admin.auditWhen") }}
        filters={[
          { key: "action", label: t("admin.auditAction"), options: actionOptions },
          { key: "resource", label: t("admin.auditResource"), options: resourceOptions },
        ]}
        exportConfig={{ endpoint: "/api/admin/audit/export", filename: "audit-log" }}
      />

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={t("admin.auditChanges")} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("admin.auditWhen")} value={formatDateTime(detail.createdAt)} />
              <Field label={t("admin.auditAction")} value={detail.action} />
              <Field label={t("admin.auditActor")} value={`${detail.actorName} (${detail.actorEmail})`} />
              <Field label={t("admin.auditResource")} value={detail.resource} />
              <Field label={t("admin.auditTarget")} value={detail.resourceLabel || "—"} />
              <Field label="IP" value={detail.ip || "—"} />
            </div>

            {detail.changes.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-fg">{t("admin.auditChanges")}</p>
                <div className="overflow-hidden rounded-lg ring-1 ring-border">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-subtle text-xs text-fg-muted">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">{t("common.name")}</th>
                        <th className="px-3 py-2 text-start font-medium">{locale === "ar" ? "قبل" : "Before"}</th>
                        <th className="px-3 py-2 text-start font-medium">{locale === "ar" ? "بعد" : "After"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.changes.map((c, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-fg">{c.field}</td>
                          <td className="px-3 py-2 text-fg-muted">{renderValue(c.from)}</td>
                          <td className="px-3 py-2 text-fg">{renderValue(c.to)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detail.userAgent && (
              <Field label="User Agent" value={detail.userAgent} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-sm break-words text-fg">{value}</p>
    </div>
  );
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
