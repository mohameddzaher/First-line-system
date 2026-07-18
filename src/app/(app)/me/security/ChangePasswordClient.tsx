"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import { roleLabel } from "@/lib/roleOptions";
import type { Locale } from "@/i18n/dictionaries";
import type { RoleKey } from "@/lib/rbac";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordClient({
  title,
  locale,
  account,
}: {
  title: string;
  locale: Locale;
  account: { email: string; role: RoleKey; lastLoginAt: string | null };
}) {
  const { t } = useI18n();
  const toast = useToast();
  const ar = locale === "ar";
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  // Mirrors the server rules so the user isn't told "no" only after a round trip.
  const tooShort = form.newPassword.length > 0 && form.newPassword.length < 8;
  const mismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;
  const sameAsOld = form.newPassword.length > 0 && form.newPassword === form.currentPassword;
  const ready =
    form.currentPassword && form.newPassword && form.confirmPassword && !tooShort && !mismatch && !sameAsOld;

  const ERRORS: Record<string, string> = {
    WRONG_CURRENT_PASSWORD: ar ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect",
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setForm(EMPTY);
        toast.success(
          ar
            ? "تم تغيير كلمة المرور. تم إنهاء الجلسات الأخرى."
            : "Password changed. Your other sessions have been signed out.",
        );
      } else {
        toast.error(ERRORS[data.error] ?? t("common.somethingWentWrong"));
      }
    } catch {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={title} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={ar ? "تغيير كلمة المرور" : "Change password"}
            description={
              ar
                ? "يجب ألا تقل كلمة المرور عن 8 أحرف. سيؤدي التغيير إلى إنهاء جلساتك على الأجهزة الأخرى."
                : "Minimum 8 characters. Changing it signs you out on every other device."
            }
          />
          <CardBody>
            <form onSubmit={submit} className="grid max-w-md gap-4">
              <Input
                type="password"
                autoComplete="current-password"
                label={ar ? "كلمة المرور الحالية" : "Current password"}
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
              <Input
                type="password"
                autoComplete="new-password"
                label={ar ? "كلمة المرور الجديدة" : "New password"}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                error={
                  tooShort
                    ? ar
                      ? "8 أحرف على الأقل"
                      : "At least 8 characters"
                    : sameAsOld
                      ? ar
                        ? "يجب أن تختلف عن كلمة المرور الحالية"
                        : "Must differ from your current password"
                      : undefined
                }
              />
              <Input
                type="password"
                autoComplete="new-password"
                label={ar ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                error={mismatch ? (ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match") : undefined}
              />
              <div>
                <Button type="submit" disabled={!ready} loading={busy}>
                  {ar ? "حفظ كلمة المرور" : "Save password"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={ar ? "حسابك" : "Your account"} />
          <CardBody>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted">{ar ? "البريد الإلكتروني" : "Email"}</dt>
                <dd className="font-medium">{account.email}</dd>
              </div>
              <div>
                <dt className="text-muted">{ar ? "الدور" : "Role"}</dt>
                <dd className="font-medium">{roleLabel(account.role, locale)}</dd>
              </div>
              <div>
                <dt className="text-muted">{ar ? "آخر تسجيل دخول" : "Last sign-in"}</dt>
                <dd className="font-medium">
                  {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
