"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { roleLabel } from "@/lib/roleOptions";
import { formatDate, initials } from "@/lib/utils";
import type { RoleKey } from "@/lib/rbac";
import type { ListResult } from "@/lib/query";
import { UserFormModal } from "./UserFormModal";

export interface UserRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleKey;
  isActive: boolean;
  lastLoginAt: string | null;
  employee?: { _id: string; nameAr: string; employeeNumber?: string } | null;
  directManager?: { firstName: string; lastName: string } | null;
}

export function UsersClient({
  initial,
  roles,
  labels,
}: {
  initial: ListResult<UserRow>;
  roles: { value: string; label: string }[];
  labels: { title: string; add: string };
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: UserRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const remove = async (row: UserRow) => {
    const confirmed = await confirm({
      title: t("common.deleteConfirmTitle"),
      body: `${row.firstName} ${row.lastName} — ${row.email}`,
      tone: "danger",
      confirmLabel: t("common.delete"),
    });
    if (!confirmed) return;

    const res = await fetch(`/api/admin/users/${row._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("admin.userDeleted"));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(
        t("common.somethingWentWrong"),
        data.error === "CANNOT_DELETE_SELF"
          ? locale === "ar"
            ? "لا يمكنك حذف حسابك الخاص."
            : "You cannot delete your own account."
          : undefined,
      );
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase">
            {initials(`${row.firstName} ${row.lastName}`)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">
              {row.firstName} {row.lastName}
            </p>
            <p className="truncate text-xs text-fg-muted" dir="ltr">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("admin.role"),
      sortable: true,
      cell: (row) => (
        <Badge tone="info">
          <ShieldCheck className="size-3" aria-hidden />
          {roleLabel(row.role, locale)}
        </Badge>
      ),
    },
    {
      key: "employee",
      header: t("admin.linkEmployee"),
      hideOnMobile: true,
      cell: (row) =>
        row.employee ? (
          <span className="text-sm text-fg">
            {row.employee.nameAr}
            {row.employee.employeeNumber && (
              <span className="text-fg-subtle"> · {row.employee.employeeNumber}</span>
            )}
          </span>
        ) : (
          <span className="text-sm text-fg-subtle">{t("admin.noEmployeeLink")}</span>
        ),
    },
    {
      key: "lastLoginAt",
      header: t("admin.lastLogin"),
      sortable: true,
      hideOnMobile: true,
      cell: (row) =>
        row.lastLoginAt ? (
          <span className="text-sm text-fg-muted tabular">{formatDate(row.lastLoginAt)}</span>
        ) : (
          <span className="text-sm text-fg-subtle">{t("admin.never")}</span>
        ),
    },
    {
      key: "status",
      header: t("common.status"),
      align: "center",
      cell: (row) => (
        <Badge tone={row.isActive ? "success" : "neutral"} dot>
          {row.isActive ? t("admin.active") : t("admin.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      align: "end",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(row)}
            aria-label={t("common.delete")}
            className="text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={labels.title}
        description={`${initial.total} ${t("common.results")}`}
        action={
          <Button onClick={openCreate} icon={<Plus className="size-4" />}>
            {labels.add}
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
        filters={[
          { key: "role", label: t("admin.role"), options: roles },
          {
            key: "status",
            label: t("common.status"),
            options: [
              { value: "active", label: t("admin.active") },
              { value: "inactive", label: t("admin.inactive") },
            ],
          },
        ]}
        exportConfig={{ endpoint: "/api/admin/users/export", filename: "users" }}
      />

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        roles={roles}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
