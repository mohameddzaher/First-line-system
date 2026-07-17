"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import type { FilterDef } from "@/components/data/DataTable";

export interface ExportConfig {
  /** API route that streams the .xlsx, e.g. "/api/hr/employees/export". */
  endpoint: string;
  filename: string;
}

/**
 * Export opens a dialog first: the user picks whether to export exactly what the
 * table is showing (current search + filters) or the full unfiltered set, and can
 * narrow the type/date range right there before downloading.
 */
export function ExportButton({
  config,
  total,
  filters = [],
  dateField,
}: {
  config: ExportConfig;
  total: number;
  filters?: FilterDef[];
  dateField?: { key: string; label: string };
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const params = useSearchParams();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"current" | "all">("current");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const openDialog = () => {
    setScope("current");
    setOverrides({});
    setDateFrom(params.get("dateFrom") ?? "");
    setDateTo(params.get("dateTo") ?? "");
    setOpen(true);
  };

  const runExport = async () => {
    setBusy(true);
    try {
      const query = new URLSearchParams();

      if (scope === "current") {
        // Mirror the table exactly, minus pagination.
        for (const [key, value] of params.entries()) {
          if (key === "page" || key === "limit") continue;
          query.set(key, value);
        }
      }

      // Dialog overrides win over whatever the table had.
      for (const [key, value] of Object.entries(overrides)) {
        if (value) query.set(`f_${key}`, value);
        else query.delete(`f_${key}`);
      }
      if (dateField) {
        if (dateFrom) query.set("dateFrom", dateFrom);
        else query.delete("dateFrom");
        if (dateTo) query.set("dateTo", dateTo);
        else query.delete("dateTo");
        if (dateFrom || dateTo) query.set("dateField", dateField.key);
      }
      query.set("locale", locale);

      const res = await fetch(`${config.endpoint}?${query.toString()}`);
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${config.filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setOpen(false);
      toast.success(
        locale === "ar" ? "تم تصدير الملف بنجاح" : "Export complete",
        locale === "ar" ? "تم تنزيل ملف Excel." : "Your Excel file has been downloaded.",
      );
    } catch (err) {
      toast.error(
        locale === "ar" ? "تعذّر تصدير الملف" : "Export failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={openDialog} icon={<FileSpreadsheet className="size-4" />}>
        <span className="hidden sm:inline">{t("common.export")}</span>
      </Button>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={t("common.export")}
        description={t("common.exportOptions")}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={runExport} loading={busy} icon={<Download className="size-4" />}>
              {t("common.export")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-fg">
              {locale === "ar" ? "نطاق البيانات" : "Data scope"}
            </legend>
            {(
              [
                {
                  value: "current",
                  title: locale === "ar" ? "البيانات المعروضة حالياً" : "Currently displayed data",
                  desc:
                    locale === "ar"
                      ? `مع البحث وعوامل التصفية المطبّقة (${total} سجل)`
                      : `With current search and filters (${total} records)`,
                },
                {
                  value: "all",
                  title: locale === "ar" ? "جميع البيانات" : "All data",
                  desc:
                    locale === "ar"
                      ? "تجاهل البحث وعوامل التصفية الحالية"
                      : "Ignore the current search and filters",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors ${
                  scope === option.value
                    ? "bg-primary/5 ring-primary"
                    : "ring-border hover:bg-surface-hover"
                }`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  value={option.value}
                  checked={scope === option.value}
                  onChange={() => setScope(option.value)}
                  className="mt-0.5 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{option.desc}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {(filters.length > 0 || dateField) && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-fg">
                {locale === "ar" ? "تصفية إضافية للتصدير" : "Additional export filters"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {filters.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label htmlFor={`export-${f.key}`} className="block text-xs font-medium text-fg-muted">
                      {f.label}
                    </label>
                    <select
                      id={`export-${f.key}`}
                      value={overrides[f.key] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      className="h-9 w-full cursor-pointer rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                    >
                      <option value="">{t("common.all")}</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {dateField && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="export-from" className="block text-xs font-medium text-fg-muted">
                        {t("common.dateFrom")}
                      </label>
                      <input
                        id="export-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 w-full rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="export-to" className="block text-xs font-medium text-fg-muted">
                        {t("common.dateTo")}
                      </label>
                      <input
                        id="export-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9 w-full rounded-lg bg-surface px-2.5 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
