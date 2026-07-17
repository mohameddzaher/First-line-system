"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, History, Car, ShieldCheck, AlertTriangle, Wrench } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { statusInfo } from "@/lib/statusMeta";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

type EmpRef = { _id?: string; nameAr: string; employeeNumber?: string } | null;

interface Vehicle {
  _id: string;
  plateNumber: string;
  plateLatin?: string;
  type: string;
  make?: string;
  makeModel?: string;
  year?: number;
  color?: string;
  status: string;
  city?: string;
  chassisNumber?: string;
  ownership?: string;
  purchasePrice?: number;
  serviceTier?: string;
  conditionNote?: string;
  department?: { nameAr: string } | null;
  project?: { nameAr: string } | null;
  currentAuthorization?: { employee?: EmpRef; startDate?: string; authorizationType?: string } | null;
  authorizations: { _id?: string; employee?: EmpRef; startDate: string; endDate?: string | null; authorizationType: string; note?: string }[];
}

export function VehicleProfile({
  locale,
  vehicle,
  accidents,
  maintenance,
  history,
  employees,
}: {
  locale: Locale;
  vehicle: Vehicle;
  accidents: Record<string, unknown>[];
  maintenance: Record<string, unknown>[];
  history: Record<string, unknown>[];
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("overview");
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ employee: "", authorizationType: "تفويض قيادة", note: "" });

  const info = statusInfo("vehicle", vehicle.status);
  const current = vehicle.currentAuthorization;
  const isTransfer = Boolean(current?.employee);

  const authorize = async () => {
    if (!form.employee) {
      toast.error(t("common.required"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/fleet/vehicles/${vehicle._id}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم التفويض بنجاح" : "Authorized successfully");
        setAuthOpen(false);
        setForm({ employee: "", authorizationType: "تفويض قيادة", note: "" });
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    const ok = await confirm({
      title: locale === "ar" ? "إلغاء التفويض" : "Revoke authorization",
      body: `${vehicle.plateNumber} · ${current?.employee?.nameAr ?? ""}`,
      tone: "warning",
    });
    if (!ok) return;
    const res = await fetch(`/api/fleet/vehicles/${vehicle._id}/revoke`, { method: "POST" });
    if (res.ok) {
      toast.success(locale === "ar" ? "تم إلغاء التفويض" : "Authorization revoked");
      router.refresh();
    } else {
      toast.error(t("common.somethingWentWrong"));
    }
  };

  const typeLabel =
    vehicle.type === "car" ? (locale === "ar" ? "سيارة" : "Car") : vehicle.type === "motorcycle" ? (locale === "ar" ? "دراجة آلية" : "Motorcycle") : locale === "ar" ? "شاحنة ثقيلة" : "Heavy Truck";

  const tabs = [
    { id: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: Car },
    { id: "authorizations", label: locale === "ar" ? "التفويضات" : "Authorizations", icon: ShieldCheck, count: vehicle.authorizations.length },
    { id: "maintenance", label: locale === "ar" ? "الصيانة" : "Maintenance", icon: Wrench, count: maintenance.length },
    { id: "accidents", label: locale === "ar" ? "الحوادث" : "Accidents", icon: AlertTriangle, count: accidents.length },
    { id: "history", label: locale === "ar" ? "السجل" : "History", icon: History, count: history.length },
  ];

  return (
    <>
      <PageHeader title="" backHref="/fleet/vehicles" backLabel={t("common.back")} />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-fg" dir="ltr">{vehicle.plateNumber}</h1>
              <Badge tone={info.tone} dot>{locale === "ar" ? info.ar : info.en}</Badge>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              {[typeLabel, vehicle.department?.nameAr, vehicle.project?.nameAr].filter(Boolean).join(" · ")}
            </p>
            {current?.employee && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
                <UserCheck className="size-3.5" aria-hidden />
                {locale === "ar" ? "مُفوَّضة إلى:" : "Authorized to:"} {current.employee.nameAr}
                {current.startDate && ` · ${locale === "ar" ? "منذ" : "since"} ${formatDate(current.startDate)}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAuthOpen(true)} icon={<UserCheck className="size-4" />}>
              {isTransfer ? (locale === "ar" ? "نقل التفويض" : "Transfer") : locale === "ar" ? "تفويض" : "Authorize"}
            </Button>
            {current?.employee && (
              <Button variant="outline" onClick={revoke} icon={<UserX className="size-4" />}>
                {locale === "ar" ? "إلغاء" : "Revoke"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === tb.id ? "border-primary text-primary" : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {tb.label}
              {tb.count !== undefined && tb.count > 0 && (
                <span className="rounded-full bg-bg-subtle px-1.5 text-xs tabular text-fg-muted">{tb.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="animate-[fade-in_0.2s_ease-out]">
        {tab === "overview" && (
          <Card>
            <CardBody>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={locale === "ar" ? "رقم اللوحة" : "Plate Number"} value={vehicle.plateNumber} />
                <Detail label={locale === "ar" ? "اللوحة (لاتيني)" : "Plate (Latin)"} value={vehicle.plateLatin || "—"} />
                <Detail label={t("common.type")} value={typeLabel} />
                <Detail label={locale === "ar" ? "الماركة والطراز" : "Make/Model"} value={[vehicle.make, vehicle.makeModel].filter(Boolean).join(" ") || "—"} />
                <Detail label={locale === "ar" ? "سنة الصنع" : "Year"} value={vehicle.year ? String(vehicle.year) : "—"} />
                <Detail label={locale === "ar" ? "اللون" : "Color"} value={vehicle.color || "—"} />
                <Detail label={locale === "ar" ? "المدينة" : "City"} value={vehicle.city || "—"} />
                <Detail label={locale === "ar" ? "فئة الخدمة" : "Service Tier"} value={vehicle.serviceTier === "express" ? (locale === "ar" ? "الأسرع" : "Express") : (locale === "ar" ? "عادي" : "Standard")} />
                <Detail label={locale === "ar" ? "رقم الهيكل" : "Chassis"} value={vehicle.chassisNumber || "—"} />
                <Detail label={locale === "ar" ? "حالة الملكية" : "Ownership"} value={vehicle.ownership || "—"} />
                <Detail label={locale === "ar" ? "مبلغ الشراء" : "Purchase Price"} value={vehicle.purchasePrice ? formatCurrency(vehicle.purchasePrice, locale) : "—"} />
                <Detail label={t("hr.department")} value={vehicle.department?.nameAr || "—"} />
                <Detail label={locale === "ar" ? "المشروع" : "Project"} value={vehicle.project?.nameAr || "—"} />
                <Detail label={locale === "ar" ? "عدد الحوادث" : "Accidents"} value={String(accidents.length)} />
                {vehicle.conditionNote ? <Detail label={locale === "ar" ? "ملاحظة الحالة" : "Condition"} value={vehicle.conditionNote} /> : null}
              </dl>
            </CardBody>
          </Card>
        )}

        {tab === "authorizations" && (
          <Card>
            {vehicle.authorizations.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="size-5" />} title={locale === "ar" ? "لا توجد تفويضات" : "No authorizations"} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-subtle text-xs text-fg-muted">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الموظف" : "Employee"}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "النوع" : "Type"}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "من" : "From"}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "إلى" : "To"}</th>
                      <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...vehicle.authorizations].reverse().map((a, i) => (
                      <tr key={a._id ?? i} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-fg">{a.employee?.nameAr ?? "—"}</td>
                        <td className="px-4 py-3 text-fg-muted">{a.authorizationType}</td>
                        <td className="px-4 py-3 tabular">{formatDate(a.startDate)}</td>
                        <td className="px-4 py-3 tabular">{a.endDate ? formatDate(a.endDate) : "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {a.endDate ? <Badge tone="neutral">{locale === "ar" ? "منتهٍ" : "Ended"}</Badge> : <Badge tone="success" dot>{locale === "ar" ? "ساري" : "Active"}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === "maintenance" && (
          <Card>
            {maintenance.length === 0 ? (
              <EmptyState icon={<Wrench className="size-5" />} title={locale === "ar" ? "لا يوجد سجل صيانة" : "No maintenance records"} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-subtle text-xs text-fg-muted">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t("common.date")}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "النوع" : "Type"}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الورشة" : "Workshop"}</th>
                      <th className="px-4 py-3 text-end font-medium">{locale === "ar" ? "التكلفة" : "Cost"}</th>
                      <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr key={String(m._id)} className="border-t border-border">
                        <td className="px-4 py-3 tabular">{formatDate(m.date as string)}</td>
                        <td className="px-4 py-3 text-fg-muted capitalize">{String(m.type).replace("_", " ")}</td>
                        <td className="px-4 py-3 text-fg">{(m.workshop as string) || "—"}</td>
                        <td className="px-4 py-3 text-end tabular">{m.cost ? formatCurrency(m.cost as number, locale) : "—"}</td>
                        <td className="px-4 py-3 text-center capitalize">{String(m.status).replace("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === "accidents" && (
          <Card>
            {accidents.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="size-5" />} title={locale === "ar" ? "لا توجد حوادث" : "No accidents"} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-subtle text-xs text-fg-muted">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t("common.date")}</th>
                      <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الوصف" : "Description"}</th>
                      <th className="px-4 py-3 text-center font-medium">{locale === "ar" ? "الجسامة" : "Severity"}</th>
                      <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accidents.map((a) => (
                      <tr key={String(a._id)} className="border-t border-border">
                        <td className="px-4 py-3 tabular">{formatDate(a.date as string)}</td>
                        <td className="px-4 py-3 text-fg">{(a.description as string) || "—"}</td>
                        <td className="px-4 py-3 text-center capitalize">{String(a.severity)}</td>
                        <td className="px-4 py-3 text-center capitalize">{String(a.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === "history" && (
          <Card>
            <CardBody>
              {history.length === 0 ? (
                <EmptyState icon={<History className="size-5" />} title={locale === "ar" ? "لا يوجد سجل" : "No history"} />
              ) : (
                <ol className="relative space-y-4 border-s border-border ps-6">
                  {history.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -start-[27px] top-1 size-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{h.action as string}</Badge>
                        <span className="text-sm text-fg">{h.actorName as string}</span>
                        <span className="text-xs text-fg-subtle tabular">{formatDateTime(h.createdAt as string)}</span>
                      </div>
                      {h.resourceLabel ? <p className="mt-1 text-xs text-fg-muted">{h.resourceLabel as string}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        open={authOpen}
        onClose={() => !busy && setAuthOpen(false)}
        title={isTransfer ? (locale === "ar" ? "نقل التفويض" : "Transfer Authorization") : locale === "ar" ? "تفويض المركبة" : "Authorize Vehicle"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAuthOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
            <Button onClick={authorize} loading={busy}>{locale === "ar" ? "تفويض" : "Authorize"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Combobox label={locale === "ar" ? "الموظف" : "Employee"} value={form.employee} onChange={(v) => setForm({ ...form, employee: v })} options={employees} placeholder={locale === "ar" ? "اختر الموظف" : "Select employee"} required />
          <Input label={locale === "ar" ? "نوع التفويض" : "Authorization Type"} value={form.authorizationType} onChange={(e) => setForm({ ...form, authorizationType: e.target.value })} />
          <Textarea label={t("common.notes")} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-fg" dir="auto">{value}</dd>
    </div>
  );
}
