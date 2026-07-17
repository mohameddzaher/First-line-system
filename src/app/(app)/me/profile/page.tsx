import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Contract } from "@/models/Contract";
import { Custody } from "@/models/Custody";
import { computeLeaveBalance } from "@/lib/leaveBalance";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/StatCard";
import { UserX, Package } from "lucide-react";
import { statusInfo } from "@/lib/statusMeta";
import { formatDate, formatCurrency, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const user = await requireUser();
  await connectDB();
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  if (!user.employeeId) {
    return (
      <>
        <PageHeader title={t("self.myProfile")} />
        <Card>
          <EmptyState
            icon={<UserX className="size-5" />}
            title={locale === "ar" ? "لا يوجد ملف موظف مرتبط" : "No linked employee profile"}
            description={
              locale === "ar"
                ? "حسابك غير مرتبط بملف موظف. يُرجى مراجعة الموارد البشرية."
                : "Your account is not linked to an employee profile. Please contact HR."
            }
          />
        </Card>
      </>
    );
  }

  const [employee, contract, custody, balance] = await Promise.all([
    Employee.findById(user.employeeId).populate("department", "nameAr nameEn").populate("project", "nameAr nameEn").lean(),
    Contract.findOne({ employee: user.employeeId, status: "active" }).sort({ startDate: -1 }).lean(),
    Custody.find({ employee: user.employeeId, status: "assigned" }).lean(),
    computeLeaveBalance(user.employeeId),
  ]);

  if (!employee) {
    return (
      <>
        <PageHeader title={t("self.myProfile")} />
        <Card><EmptyState icon={<UserX className="size-5" />} title={t("common.noData")} /></Card>
      </>
    );
  }

  const emp = serialize(employee) as unknown as Record<string, unknown>;
  const activeContract = contract ? (serialize(contract) as unknown as Record<string, unknown>) : null;
  const custodyItems = serialize(custody) as unknown as Record<string, unknown>[];
  const info = statusInfo("employee", emp.status as string);
  const dept = emp.department as { nameAr?: string } | null;

  const details: [string, string][] = [
    [locale === "ar" ? "الرقم الوظيفي" : "Employee #", (emp.employeeNumber as string) || "—"],
    [locale === "ar" ? "المسمى الوظيفي" : "Job Title", (emp.jobTitle as string) || "—"],
    [t("hr.department"), dept?.nameAr || "—"],
    [locale === "ar" ? "رقم الهوية / الإقامة" : "Iqama / ID", (emp.idNumber as string) || "—"],
    [locale === "ar" ? "الجنسية" : "Nationality", (emp.nationality as string) || "—"],
    [locale === "ar" ? "تاريخ التعيين" : "Hire Date", emp.hireDate ? formatDate(emp.hireDate as string) : "—"],
    [locale === "ar" ? "البريد الإلكتروني" : "Email", (emp.email as string) || "—"],
    [locale === "ar" ? "الآيبان" : "IBAN", (emp.iban as string) || "—"],
  ];

  return (
    <>
      <PageHeader title={t("self.myProfile")} />

      <Card className="mb-6">
        <CardBody className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {initials(emp.nameAr as string)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-fg">{emp.nameAr as string}</h2>
              <Badge tone={info.tone} dot>{locale === "ar" ? info.ar : info.en}</Badge>
            </div>
            <p className="mt-1 text-sm text-fg-muted">{[emp.jobTitle, dept?.nameAr].filter(Boolean).join(" · ")}</p>
          </div>
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={locale === "ar" ? "الاستحقاق السنوي" : "Annual Entitlement"} value={`${balance.annualEntitlement} ${locale === "ar" ? "يوم" : "d"}`} />
        <StatCard label={locale === "ar" ? "المُستحق حتى الآن" : "Accrued"} value={`${balance.accruedToDate} ${locale === "ar" ? "يوم" : "d"}`} />
        <StatCard label={locale === "ar" ? "المستهلك" : "Taken"} value={`${balance.taken} ${locale === "ar" ? "يوم" : "d"}`} />
        <StatCard label={locale === "ar" ? "المتاح" : "Available"} value={`${balance.available} ${locale === "ar" ? "يوم" : "d"}`} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={locale === "ar" ? "البيانات الشخصية" : "Personal Details"} />
          <CardBody>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-fg-subtle">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-fg" dir="auto">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6">
          {activeContract && (
            <Card>
              <CardHeader title={t("hr.contracts")} />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  <Detail label={locale === "ar" ? "البداية" : "Start"} value={formatDate(activeContract.startDate as string)} />
                  <Detail label={locale === "ar" ? "النهاية" : "End"} value={activeContract.endDate ? formatDate(activeContract.endDate as string) : "—"} />
                  <Detail label={locale === "ar" ? "الإجازة السنوية" : "Annual Leave"} value={`${activeContract.annualLeaveDays} ${locale === "ar" ? "يوم" : "d"}`} />
                  <Detail label={locale === "ar" ? "الراتب الأساسي" : "Basic Salary"} value={activeContract.basicSalary ? formatCurrency(activeContract.basicSalary as number, locale) : "—"} />
                </dl>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title={locale === "ar" ? "العهد المسلّمة لي" : "My Custody"} />
            {custodyItems.length === 0 ? (
              <EmptyState icon={<Package className="size-5" />} title={locale === "ar" ? "لا توجد عهد" : "No custody items"} />
            ) : (
              <div className="divide-y divide-border">
                {custodyItems.map((c) => (
                  <div key={String(c._id)} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">{c.name as string}</p>
                      {c.serial ? <p className="text-xs text-fg-muted" dir="ltr">{c.serial as string}</p> : null}
                    </div>
                    <Badge tone="info">{c.assignedDate ? formatDate(c.assignedDate as string) : "—"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
