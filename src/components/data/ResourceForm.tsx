"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  dir?: "ltr" | "rtl";
  /** 1 or 2 columns in the responsive grid. */
  span?: 1 | 2;
  hint?: string;
}

const toDateInput = (v: unknown) =>
  v ? new Date(v as string).toISOString().slice(0, 10) : "";

/** Schema-driven create/edit dialog shared by every resource manager. */
export function ResourceForm({
  open,
  onClose,
  fields,
  endpoint,
  editing,
  titleCreate,
  titleEdit,
  onSaved,
  transform,
}: {
  open: boolean;
  onClose: () => void;
  fields: FieldDef[];
  endpoint: string;
  editing: Record<string, unknown> | null;
  titleCreate: string;
  titleEdit: string;
  onSaved: () => void;
  /** Last-chance mutation of the payload before POST/PATCH. */
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      const seed: Record<string, unknown> = { ...editing };
      for (const f of fields) {
        if (f.type === "date") seed[f.key] = toDateInput(editing[f.key]);
        // A populated ref comes back as an object; the select needs its id.
        if (f.type === "select" && editing[f.key] && typeof editing[f.key] === "object") {
          seed[f.key] = (editing[f.key] as { _id?: string })._id ?? "";
        }
      }
      setForm(seed);
    } else {
      const seed: Record<string, unknown> = {};
      for (const f of fields) if (f.type === "checkbox") seed[f.key] = false;
      setForm(seed);
    }
  }, [open, editing, fields]);

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !String(form[f.key] ?? "").trim()) next[f.key] = t("common.required");
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    let payload = { ...form };
    if (transform) payload = transform(payload);

    setBusy(true);
    try {
      const id = editing?._id as string | undefined;
      const res = await fetch(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(id ? t("common.updatedOk") : t("common.createdOk"));
        onSaved();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.error === "DUPLICATE") {
        toast.error(t("common.duplicateError"));
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } catch {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={editing ? titleEdit : titleCreate}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={busy}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const cls = f.span === 2 ? "sm:col-span-2" : "";
          const value = form[f.key];

          if (f.type === "checkbox") {
            return (
              <div key={f.key} className={`flex items-end pb-2 ${cls}`}>
                <Checkbox
                  label={f.label}
                  checked={Boolean(value)}
                  onChange={(e) => set(f.key, e.target.checked)}
                />
              </div>
            );
          }
          if (f.type === "select") {
            const opts = f.options ?? [];
            // Short lists stay as a native select; long ones get a searchable
            // combobox so you don't scroll through hundreds of employees/vehicles.
            return (
              <div key={f.key} className={cls}>
                {opts.length > 8 ? (
                  <Combobox
                    label={f.label}
                    value={(value as string) ?? ""}
                    onChange={(v) => set(f.key, v)}
                    options={opts}
                    placeholder={f.placeholder ?? t("common.none")}
                    error={errors[f.key]}
                    required={f.required}
                  />
                ) : (
                  <Select
                    label={f.label}
                    value={(value as string) ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    options={opts}
                    placeholder={f.placeholder ?? t("common.none")}
                    error={errors[f.key]}
                    required={f.required}
                  />
                )}
              </div>
            );
          }
          if (f.type === "textarea") {
            return (
              <div key={f.key} className={cls}>
                <Textarea
                  label={f.label}
                  value={(value as string) ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  error={errors[f.key]}
                  required={f.required}
                />
              </div>
            );
          }
          return (
            <div key={f.key} className={cls}>
              <Input
                type={f.type}
                label={f.label}
                value={(value as string | number) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                error={errors[f.key]}
                dir={f.dir}
                required={f.required}
                hint={f.hint}
              />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
