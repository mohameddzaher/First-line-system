"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check, X, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { debounce } from "@/lib/utils";
import type { UserRow } from "./UsersClient";

interface EmployeeHit {
  _id: string;
  nameAr: string;
  nameEn?: string;
  employeeNumber?: string;
  idNumber: string;
  jobTitle?: string;
}

export function UserFormModal({
  open,
  onClose,
  editing,
  roles,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: UserRow | null;
  roles: { value: string; label: string }[];
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [isActive, setIsActive] = useState(true);
  const [linkedEmployee, setLinkedEmployee] = useState<EmployeeHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form whenever the dialog opens for a different target.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setPassword("");
    if (editing) {
      setFirstName(editing.firstName);
      setLastName(editing.lastName);
      setEmail(editing.email);
      setRole(editing.role);
      setIsActive(editing.isActive);
      setLinkedEmployee(
        editing.employee
          ? {
              _id: editing.employee._id,
              nameAr: editing.employee.nameAr,
              employeeNumber: editing.employee.employeeNumber,
              idNumber: "",
            }
          : null,
      );
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("employee");
      setIsActive(true);
      setLinkedEmployee(null);
    }
  }, [open, editing]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t("common.required");
    if (!lastName.trim()) next.lastName = t("common.required");
    if (!email.trim()) next.email = t("common.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("auth.invalidCredentials");
    if (!editing && password.length < 8) next.password = locale === "ar" ? "٨ أحرف على الأقل" : "At least 8 characters";
    if (editing && password && password.length < 8)
      next.password = locale === "ar" ? "٨ أحرف على الأقل" : "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      role,
      isActive,
      employee: linkedEmployee?._id ?? null,
      ...(password ? { password } : {}),
    };

    try {
      const res = editing
        ? await fetch(`/api/admin/users/${editing._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        toast.success(editing ? t("admin.userUpdated") : t("admin.userCreated"));
        onSaved();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data.error === "EMPLOYEE_ALREADY_LINKED") {
        setErrors({ employee: t("admin.employeeLinked") });
      } else if (data.error === "DUPLICATE") {
        setErrors({ email: locale === "ar" ? "هذا البريد مستخدم بالفعل" : "Email already in use" });
      } else if (data.error === "VALIDATION") {
        toast.error(t("common.somethingWentWrong"));
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
      title={editing ? t("admin.editUser") : t("admin.addUser")}
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
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("admin.firstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            required
          />
          <Input
            label={t("admin.lastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            required
          />
        </div>

        <Input
          type="email"
          label={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          dir="ltr"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="password"
            label={t("admin.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={editing ? t("admin.passwordKeep") : undefined}
            autoComplete="new-password"
            required={!editing}
          />
          <Select
            label={t("admin.role")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roles}
          />
        </div>

        <EmployeePicker
          value={linkedEmployee}
          onChange={setLinkedEmployee}
          keepId={editing?.employee?._id}
          error={errors.employee}
        />

        <Checkbox label={t("admin.active")} checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </div>
    </Modal>
  );
}

function EmployeePicker({
  value,
  onChange,
  keepId,
  error,
}: {
  value: EmployeeHit | null;
  onChange: (hit: EmployeeHit | null) => void;
  keepId?: string;
  error?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef(
    debounce(async (q: string, keep: string | undefined) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (keep) params.set("keep", keep);
        const res = await fetch(`/api/admin/users/employee-search?${params}`);
        const data = await res.json();
        setResults(data.employees ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
  );

  useEffect(() => {
    if (focused) searchRef.current(query, keepId);
  }, [query, focused, keepId]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-fg">{t("admin.linkEmployee")}</label>

      {value ? (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2.5 ring-1 ring-primary/20">
          <div className="flex items-center gap-2.5">
            <Link2 className="size-4 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-medium text-fg">{value.nameAr}</p>
              {value.employeeNumber && (
                <p className="text-xs text-fg-muted">#{value.employeeNumber}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-danger"
            aria-label={t("common.delete")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder={t("admin.searchEmployee")}
            className="h-10 w-full rounded-lg bg-surface ps-9 pe-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
          />

          {focused && (query || results.length > 0) && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-surface-raised py-1 shadow-overlay ring-1 ring-border">
              {loading ? (
                <p className="px-3 py-2 text-sm text-fg-muted">{t("common.loading")}</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-fg-subtle">{t("common.noResults")}</p>
              ) : (
                results.map((hit) => (
                  <button
                    key={hit._id}
                    type="button"
                    onClick={() => {
                      onChange(hit);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start transition-colors hover:bg-surface-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">{hit.nameAr}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {hit.employeeNumber ? `#${hit.employeeNumber} · ` : ""}
                        {hit.idNumber} {hit.jobTitle ? `· ${hit.jobTitle}` : ""}
                      </span>
                    </span>
                    <Check className="size-4 shrink-0 text-transparent" aria-hidden />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
