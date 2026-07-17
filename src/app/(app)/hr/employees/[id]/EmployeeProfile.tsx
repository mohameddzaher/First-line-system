"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, UserCog, FileText, CalendarDays, Package, Truck, ScrollText, Inbox, History, Link2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { useI18n } from "@/i18n/provider";
import { statusInfo } from "@/lib/statusMeta";
import { formatDate, formatDateTime, formatCurrency, daysUntil, initials } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";
import { EmployeeFormModal, type EmployeeFormData } from "../EmployeeFormModal";

type Ref = { nameAr?: string; nameEn?: string } | null;

// The profile receives populated department/project objects; the form wants their
// ids. Omit the form's scalar versions and re-add the populated shapes.
interface Employee extends Omit<EmployeeFormData, "department" | "project"> {
  _id: string;
  nameAr: string;
  documents?: { type: string; number?: string; expiryDate?: string | null; issueDate?: string | null }[];
  department?: Ref;
  project?: Ref;
  totalSalary?: number;
}

export function EmployeeProfile({
  locale,
  employee,
  contracts,
  leaves,
  custody,
  requests,
  history,
  linkedUser,
  balance,
}: {
  locale: Locale;
  employee: Employee;
  contracts: Record<string, unknown>[];
  leaves: Record<string, unknown>[];
  custody: Record<string, unknown>[];
  requests: Record<string, unknown>[];
  history: Record<string, unknown>[];
  linkedUser: { firstName: string; lastName: string; email: string } | null;
  balance: { annualEntitlement: number; accruedToDate: number; taken: number; available: number };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [refOptions, setRefOptions] = useState<{
    departments: { value: string; label: string }[];
    projects: { value: string; label: string }[];
  }>({ departments: [], projects: [] });

  // Load department/project options lazily the first time the edit dialog opens.
  const openEdit = async () => {
    if (refOptions.departments.length === 0) {
      try {
        const res = await fetch("/api/hr/ref-options");
        if (res.ok) setRefOptions(await res.json());
      } catch {
        /* the modal still works with free-typed values */
      }
    }
    setEditOpen(true);
  };

  const info = statusInfo("employee", employee.status ?? "active");
  const vehicles = custody.filter((c) => c.type === "vehicle" || c.type === "motorcycle");

  const tabs = [
    { id: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: UserCog },
    { id: "files", label: locale === "ar" ? "المستندات" : "Files", icon: FileText, count: employee.documents?.length },
    { id: "leaves", label: t("hr.leaves"), icon: CalendarDays, count: leaves.length },
    { id: "custody", label: t("hr.custody"), icon: Package, count: custody.length },
    { id: "vehicles", label: locale === "ar" ? "المركبات" : "Vehicles", icon: Truck, count: vehicles.length },
    { id: "contracts", label: t("hr.contracts"), icon: ScrollText, count: contracts.length },
    { id: "requests", label: t("hr.requests"), icon: Inbox, count: requests.length },
    { id: "history", label: locale === "ar" ? "السجل" : "History", icon: History, count: history.length },
  ];

  return (
    <>
      <PageHeader
        title=""
        backHref="/hr/employees"
        backLabel={t("common.back")}
      />

      {/* Identity header */}
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials(employee.nameAr)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-fg">{employee.nameAr}</h1>
                <Badge tone={info.tone} dot>
                  {locale === "ar" ? info.ar : info.en}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                {[employee.jobTitle, employee.department?.nameAr, employee.employeeNumber && `#${employee.employeeNumber}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {linkedUser && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
                  <Link2 className="size-3.5" aria-hidden />
                  {locale === "ar" ? "حساب مرتبط:" : "Linked login:"} {linkedUser.firstName} {linkedUser.lastName}
                </p>
              )}
            </div>
          </div>
          <Button onClick={openEdit} icon={<Pencil className="size-4" />} variant="secondary">
            {t("common.edit")}
          </Button>
        </CardBody>
      </Card>

      {/* Leave balance */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard label={locale === "ar" ? "الاستحقاق السنوي" : "Annual Entitlement"} value={`${balance.annualEntitlement} ${locale === "ar" ? "يوم" : "d"}`} />
        <BalanceCard label={locale === "ar" ? "المُستحق حتى الآن" : "Accrued to date"} value={`${balance.accruedToDate} ${locale === "ar" ? "يوم" : "d"}`} />
        <BalanceCard label={locale === "ar" ? "المستهلك" : "Taken"} value={`${balance.taken} ${locale === "ar" ? "يوم" : "d"}`} />
        <BalanceCard label={locale === "ar" ? "المتاح" : "Available"} value={`${balance.available} ${locale === "ar" ? "يوم" : "d"}`} accent />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === tb.id
                  ? "border-primary text-primary"
                  : "border-transparent text-fg-muted hover:text-fg"
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
        {tab === "overview" && <Overview employee={employee} locale={locale} />}
        {tab === "files" && <Files employee={employee} locale={locale} />}
        {tab === "leaves" && <LeavesTab leaves={leaves} locale={locale} t={t} />}
        {tab === "custody" && <CustodyTab items={custody} locale={locale} t={t} />}
        {tab === "vehicles" && <CustodyTab items={vehicles} locale={locale} t={t} vehiclesOnly />}
        {tab === "contracts" && <ContractsTab contracts={contracts} locale={locale} t={t} />}
        {tab === "requests" && <RequestsTab requests={requests} locale={locale} t={t} />}
        {tab === "history" && <HistoryTab history={history} locale={locale} />}
      </div>

      <EmployeeFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={{
          ...employee,
          department: (employee.department as { _id?: string } | null)?._id ?? null,
          project: (employee.project as { _id?: string } | null)?._id ?? null,
        }}
        departmentOptions={refOptions.departments}
        projectOptions={refOptions.projects}
        onSaved={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function BalanceCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "ring-primary/30" : undefined}>
      <CardBody>
        <p className="text-xs text-fg-muted">{label}</p>
        <p className={`mt-1 text-2xl font-bold tabular ${accent ? "text-primary" : "text-fg"}`}>{value}</p>
      </CardBody>
    </Card>
  );
}

function Overview({ employee, locale }: { employee: Employee; locale: Locale }) {
  const rows: [string, string | undefined | null][] = [
    [locale === "ar" ? "الجنسية" : "Nationality", employee.nationality],
    [locale === "ar" ? "تاريخ الميلاد" : "Date of Birth", employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "—"],
    [locale === "ar" ? "نوع الهوية" : "ID Type", employee.idType],
    [locale === "ar" ? "رقم الهوية / الإقامة" : "Iqama / ID", employee.idNumber],
    [locale === "ar" ? "رقم الجواز" : "Passport", employee.passportNumber],
    [locale === "ar" ? "رقم أبشر" : "Absher Number", employee.absherNumber],
    [locale === "ar" ? "المهنة في الإقامة" : "Profession (Iqama)", employee.professionOnIqama],
    [locale === "ar" ? "تاريخ التعيين" : "Hire Date", employee.hireDate ? formatDate(employee.hireDate) : "—"],
    [locale === "ar" ? "بدء العمل الفعلي" : "Actual Work Start", employee.actualWorkStartDate ? formatDate(employee.actualWorkStartDate) : "—"],
    [locale === "ar" ? "موقع العمل" : "Work Location", employee.workLocation],
    [locale === "ar" ? "المشروع" : "Project", employee.project?.nameAr],
    [locale === "ar" ? "البريد الإلكتروني" : "Email", employee.email],
    [locale === "ar" ? "الآيبان" : "IBAN", employee.iban],
    [locale === "ar" ? "البنك" : "Bank", employee.bank],
    [locale === "ar" ? "الراتب الإجمالي" : "Total Salary", employee.totalSalary ? formatCurrency(employee.totalSalary, locale) : "—"],
    [locale === "ar" ? "الشرط الجزائي" : "Penalty Clause", employee.penaltyClause ? formatCurrency(employee.penaltyClause, locale) : "—"],
    [locale === "ar" ? "رقم السجل التجاري" : "CR Number", employee.crNumber],
    [locale === "ar" ? "شركة التأمين" : "Insurance Company", employee.insuranceCompany],
    [locale === "ar" ? "التأمينات الاجتماعية" : "Social Insurance", employee.socialInsuranceStatus],
    [locale === "ar" ? "حالة الملف" : "File Status", employee.fileStatus],
  ];

  return (
    <Card>
      <CardBody>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-fg-subtle">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-fg" dir="auto">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}

function Files({ employee, locale }: { employee: Employee; locale: Locale }) {
  const docs = employee.documents ?? [];
  if (docs.length === 0) {
    return (
      <Card>
        <EmptyState icon={<FileText className="size-5" />} title={locale === "ar" ? "لا توجد مستندات" : "No documents"} />
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc, i) => {
        const days = daysUntil(doc.expiryDate);
        const tone = days === null ? "neutral" : days < 0 ? "danger" : days <= 60 ? "warning" : "success";
        const statusText =
          days === null
            ? "—"
            : days < 0
              ? locale === "ar" ? "منتهٍ" : "Expired"
              : `${days} ${locale === "ar" ? "يوم" : "days"}`;
        return (
          <Card key={i}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-fg capitalize">{doc.type.replace("_", " ")}</p>
                  {doc.number && <p className="mt-0.5 text-xs text-fg-muted" dir="ltr">{doc.number}</p>}
                </div>
                <Badge tone={tone}>{statusText}</Badge>
              </div>
              <p className="mt-3 text-xs text-fg-subtle">
                {locale === "ar" ? "تاريخ الانتهاء:" : "Expiry:"} {doc.expiryDate ? formatDate(doc.expiryDate) : "—"}
              </p>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function TableCard({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Inbox className="size-5" />} title={empty} />
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-xs text-fg-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-start font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-fg">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LeavesTab({ leaves, locale, t }: { leaves: Record<string, unknown>[]; locale: Locale; t: (k: never) => string }) {
  return (
    <TableCard
      headers={[t("common.type" as never), t("common.from" as never), t("common.to" as never), locale === "ar" ? "الأيام" : "Days", t("common.status" as never)]}
      empty={locale === "ar" ? "لا توجد إجازات" : "No leaves"}
      rows={leaves.map((l) => {
        const info = statusInfo("leave", l.status as string);
        const lt = l.leaveType as Ref;
        return [
          lt ? (locale === "ar" ? lt.nameAr : lt.nameEn ?? lt.nameAr) : "—",
          formatDate(l.startDate as string),
          formatDate(l.endDate as string),
          <span key="d" className="tabular">{l.days as number}</span>,
          <Badge key="s" tone={info.tone}>{locale === "ar" ? info.ar : info.en}</Badge>,
        ];
      })}
    />
  );
}

function CustodyTab({ items, locale, t, vehiclesOnly }: { items: Record<string, unknown>[]; locale: Locale; t: (k: never) => string; vehiclesOnly?: boolean }) {
  return (
    <TableCard
      headers={[t("common.name" as never), t("common.type" as never), locale === "ar" ? "الرقم التسلسلي" : "Serial", locale === "ar" ? "تاريخ التسليم" : "Assigned", t("common.status" as never)]}
      empty={vehiclesOnly ? (locale === "ar" ? "لا توجد مركبات" : "No vehicles") : (locale === "ar" ? "لا توجد عهد" : "No custody items")}
      rows={items.map((c) => {
        const info = statusInfo("custody", c.status as string);
        return [
          c.name as string,
          <span key="t" className="capitalize">{String(c.type).replace("_", " ")}</span>,
          <span key="sr" dir="ltr">{(c.serial as string) || "—"}</span>,
          c.assignedDate ? formatDate(c.assignedDate as string) : "—",
          <Badge key="s" tone={info.tone}>{locale === "ar" ? info.ar : info.en}</Badge>,
        ];
      })}
    />
  );
}

function ContractsTab({ contracts, locale, t }: { contracts: Record<string, unknown>[]; locale: Locale; t: (k: never) => string }) {
  return (
    <TableCard
      headers={[t("common.type" as never), t("common.from" as never), t("common.to" as never), locale === "ar" ? "أيام الإجازة" : "Annual Leave", t("common.status" as never)]}
      empty={locale === "ar" ? "لا توجد عقود" : "No contracts"}
      rows={contracts.map((c) => {
        const info = statusInfo("contract", c.status as string);
        return [
          <span key="t" className="capitalize">{String(c.type)}</span>,
          formatDate(c.startDate as string),
          c.endDate ? formatDate(c.endDate as string) : "—",
          <span key="d" className="tabular">{c.annualLeaveDays as number} {locale === "ar" ? "يوم" : "d"}</span>,
          <Badge key="s" tone={info.tone}>{locale === "ar" ? info.ar : info.en}</Badge>,
        ];
      })}
    />
  );
}

function RequestsTab({ requests, locale, t }: { requests: Record<string, unknown>[]; locale: Locale; t: (k: never) => string }) {
  return (
    <TableCard
      headers={[locale === "ar" ? "الموضوع" : "Subject", locale === "ar" ? "الفئة" : "Category", t("common.status" as never), t("common.date" as never)]}
      empty={locale === "ar" ? "لا توجد طلبات" : "No requests"}
      rows={requests.map((r) => {
        const info = statusInfo("request", r.status as string);
        return [
          r.subject as string,
          <span key="c" className="capitalize">{String(r.category).replace(/_/g, " ")}</span>,
          <Badge key="s" tone={info.tone}>{locale === "ar" ? info.ar : info.en}</Badge>,
          formatDate(r.createdAt as string),
        ];
      })}
    />
  );
}

function HistoryTab({ history, locale }: { history: Record<string, unknown>[]; locale: Locale }) {
  if (history.length === 0) {
    return (
      <Card>
        <EmptyState icon={<History className="size-5" />} title={locale === "ar" ? "لا يوجد سجل" : "No history"} />
      </Card>
    );
  }
  return (
    <Card>
      <CardBody>
        <ol className="relative space-y-4 border-s border-border ps-6">
          {history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -start-[27px] top-1 size-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{h.action as string}</Badge>
                <span className="text-sm text-fg">{h.actorName as string}</span>
                <span className="text-xs text-fg-subtle tabular">{formatDateTime(h.createdAt as string)}</span>
              </div>
              {Array.isArray(h.changes) && (h.changes as unknown[]).length > 0 && (
                <p className="mt-1 text-xs text-fg-muted">
                  {(h.changes as { field: string }[]).map((c) => c.field).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
