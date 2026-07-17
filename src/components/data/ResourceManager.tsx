"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ResourceForm, type FieldDef } from "@/components/data/ResourceForm";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";

export interface ResourceManagerProps<T extends { _id: string }> {
  title: string;
  subtitle?: string;
  initial: ListResult<T>;
  columns: Column<T>[];
  /** Fields for the create/edit dialog. Omit to disable create/edit. */
  formFields?: FieldDef[];
  endpoint: string;
  exportFilename: string;
  filters?: FilterDef[];
  dateField?: { key: string; label: string };
  searchPlaceholder?: string;
  addLabel?: string;
  createTitle?: string;
  editTitle?: string;
  /** Set false to hide the row edit/delete actions (read-only lists). */
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  rowHref?: (row: T) => string;
  labelOf?: (row: T) => string;
  transformPayload?: (data: Record<string, unknown>) => Record<string, unknown>;
  toolbarExtra?: React.ReactNode;
}

/**
 * The generic list-manager used by most module pages: header + DataTable +
 * schema-driven create/edit dialog + delete confirmation, all wired to one REST
 * endpoint. Anything with per-row custom UI passes its own `columns`.
 */
export function ResourceManager<T extends { _id: string }>({
  title,
  subtitle,
  initial,
  columns,
  formFields,
  endpoint,
  exportFilename,
  filters,
  dateField,
  searchPlaceholder,
  addLabel,
  createTitle,
  editTitle,
  canEdit = true,
  canDelete = true,
  canCreate = true,
  rowHref,
  labelOf,
  transformPayload,
  toolbarExtra,
}: ResourceManagerProps<T>) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setFormOpen(true);
  };

  const remove = async (row: T) => {
    const confirmed = await confirm({
      title: t("common.deleteConfirmTitle"),
      body: labelOf?.(row) ?? t("common.deleteConfirmBody"),
      tone: "danger",
      confirmLabel: t("common.delete"),
    });
    if (!confirmed) return;
    const res = await fetch(`${endpoint}/${row._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("common.deletedOk"));
      router.refresh();
    } else {
      toast.error(t("common.somethingWentWrong"));
    }
  };

  const showActions = (canEdit && formFields) || canDelete;
  const allColumns: Column<T>[] = showActions
    ? [
        ...columns,
        {
          key: "__actions",
          header: t("common.actions"),
          align: "end",
          cell: (row) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {canEdit && formFields && (
                <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
                  <Pencil className="size-4" aria-hidden />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(row)}
                  aria-label={t("common.delete")}
                  className="text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          ),
        },
      ]
    : columns;

  return (
    <>
      <PageHeader
        title={title}
        description={subtitle ?? `${initial.total} ${t("common.results")}`}
        action={
          canCreate && formFields ? (
            <Button onClick={openCreate} icon={<Plus className="size-4" />}>
              {addLabel ?? t("common.add")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        rows={initial.rows}
        columns={allColumns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={rowHref ? (r) => router.push(rowHref(r)) : undefined}
        filters={filters}
        dateField={dateField}
        searchPlaceholder={searchPlaceholder}
        exportConfig={{ endpoint: `${endpoint}/export`, filename: exportFilename }}
        toolbarExtra={toolbarExtra}
      />

      {formFields && (
        <ResourceForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          fields={formFields}
          endpoint={endpoint}
          editing={editing as unknown as Record<string, unknown> | null}
          titleCreate={createTitle ?? addLabel ?? t("common.add")}
          titleEdit={editTitle ?? t("common.edit")}
          transform={transformPayload}
          onSaved={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
