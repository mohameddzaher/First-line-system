"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";

export interface EmployeeFormData {
  _id?: string;
  nameAr?: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  status?: string;
  employeeNumber?: string;
  idType?: string;
  idNumber?: string;
  nationality?: string;
  dateOfBirth?: string | null;
  passportNumber?: string;
  absherNumber?: string;
  professionOnIqama?: string;
  jobTitle?: string;
  department?: string | null;
  project?: string | null;
  workLocation?: string;
  hireDate?: string | null;
  actualWorkStartDate?: string | null;
  sponsorshipType?: string;
  isDriver?: boolean;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  iban?: string;
  bank?: string;
  penaltyClause?: number;
  crNumber?: string;
  insuranceCompany?: string;
  socialInsuranceStatus?: string;
  fileStatus?: string;
}

const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export function EmployeeFormModal({
  open,
  onClose,
  editing,
  departmentOptions,
  projectOptions,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing?: EmployeeFormData | null;
  departmentOptions: { value: string; label: string }[];
  projectOptions: { value: string; label: string }[];
  onSaved: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState<EmployeeFormData>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      editing
        ? {
            ...editing,
            dateOfBirth: toDateInput(editing.dateOfBirth),
            hireDate: toDateInput(editing.hireDate),
            actualWorkStartDate: toDateInput(editing.actualWorkStartDate),
          }
        : { status: "active", idType: "iqama", sponsorshipType: "company" },
    );
  }, [open, editing]);

  const set = (key: keyof EmployeeFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.nameAr?.trim()) next.nameAr = t("common.required");
    if (!form.idNumber?.trim()) next.idNumber = t("common.required");
    if (!form.nationality?.trim()) next.nationality = t("common.required");
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = editing?._id
        ? await fetch(`/api/hr/employees/${editing._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/hr/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });

      if (res.ok) {
        const saved = await res.json();
        toast.success(
          editing ? (locale === "ar" ? "تم تحديث الموظف" : "Employee updated") : locale === "ar" ? "تمت إضافة الموظف" : "Employee added",
        );
        onSaved(saved._id ?? editing?._id ?? "");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.error === "DUPLICATE") {
        setErrors({ idNumber: locale === "ar" ? "رقم الهوية مسجّل بالفعل" : "ID number already exists" });
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } catch {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  };

  const nationalityCommon =
    locale === "ar"
      ? ["السعودية", "مصر", "باكستان", "بنجلاديش", "الهند", "اليمن", "السودان"]
      : ["السعودية", "مصر", "باكستان", "بنجلاديش", "الهند", "اليمن", "السودان"];

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={editing ? (locale === "ar" ? "تعديل موظف" : "Edit Employee") : t("hr.addEmployee")}
      size="xl"
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
      <div className="space-y-6">
        <Section title={locale === "ar" ? "البيانات الأساسية" : "Basic Information"}>
          <Input label={locale === "ar" ? "الاسم بالعربية" : "Arabic Name"} value={form.nameAr ?? ""} onChange={(e) => set("nameAr", e.target.value)} error={errors.nameAr} required />
          <Input label={locale === "ar" ? "الاسم بالإنجليزية" : "English Name"} value={form.nameEn ?? ""} onChange={(e) => set("nameEn", e.target.value)} dir="ltr" />
          <Input label={t("hr.employeeNumber")} value={form.employeeNumber ?? ""} onChange={(e) => set("employeeNumber", e.target.value)} />
          <Input type="email" label={t("auth.email")} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} dir="ltr" />
          <Input label={t("common.phone")} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
          <Select label={t("common.status")} value={form.status ?? "active"} onChange={(e) => set("status", e.target.value)} options={[
            { value: "active", label: locale === "ar" ? "على رأس العمل" : "Active" },
            { value: "on_leave", label: locale === "ar" ? "في إجازة" : "On Leave" },
            { value: "suspended", label: locale === "ar" ? "موقوف" : "Suspended" },
            { value: "terminated", label: locale === "ar" ? "منتهية خدمته" : "Terminated" },
          ]} />
        </Section>

        <Section title={locale === "ar" ? "الهوية" : "Identity"}>
          <Select label={locale === "ar" ? "نوع الهوية" : "ID Type"} value={form.idType ?? "iqama"} onChange={(e) => set("idType", e.target.value)} options={[
            { value: "iqama", label: locale === "ar" ? "إقامة" : "Iqama" },
            { value: "national_id", label: locale === "ar" ? "هوية وطنية" : "National ID" },
          ]} />
          <Input label={t("hr.iqamaOrId")} value={form.idNumber ?? ""} onChange={(e) => set("idNumber", e.target.value)} error={errors.idNumber} dir="ltr" required />
          <Select label={t("hr.nationality")} value={form.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} error={errors.nationality} placeholder={locale === "ar" ? "اختر الجنسية" : "Select nationality"} options={nationalityCommon.map((n) => ({ value: n, label: n }))} />
          <Input type="date" label={locale === "ar" ? "تاريخ الميلاد" : "Date of Birth"} value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
          <Input label={locale === "ar" ? "رقم الجواز" : "Passport Number"} value={form.passportNumber ?? ""} onChange={(e) => set("passportNumber", e.target.value)} dir="ltr" />
          <Input label={locale === "ar" ? "رقم أبشر" : "Absher Number"} value={form.absherNumber ?? ""} onChange={(e) => set("absherNumber", e.target.value)} dir="ltr" />
          <Input label={locale === "ar" ? "المهنة في الإقامة" : "Profession (Iqama)"} value={form.professionOnIqama ?? ""} onChange={(e) => set("professionOnIqama", e.target.value)} />
        </Section>

        <Section title={locale === "ar" ? "بيانات التوظيف" : "Employment"}>
          <Input label={t("hr.jobTitle")} value={form.jobTitle ?? ""} onChange={(e) => set("jobTitle", e.target.value)} />
          <Select label={t("hr.department")} value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} placeholder={t("common.none")} options={departmentOptions} />
          <Select label={t("hr.project")} value={form.project ?? ""} onChange={(e) => set("project", e.target.value)} placeholder={t("common.none")} options={projectOptions} />
          <Input label={locale === "ar" ? "موقع العمل" : "Work Location"} value={form.workLocation ?? ""} onChange={(e) => set("workLocation", e.target.value)} />
          <Input type="date" label={t("hr.hireDate")} value={form.hireDate ?? ""} onChange={(e) => set("hireDate", e.target.value)} />
          <Input type="date" label={locale === "ar" ? "بدء العمل الفعلي" : "Actual Work Start"} value={form.actualWorkStartDate ?? ""} onChange={(e) => set("actualWorkStartDate", e.target.value)} />
          <Select label={locale === "ar" ? "نوع الكفالة" : "Sponsorship"} value={form.sponsorshipType ?? "company"} onChange={(e) => set("sponsorshipType", e.target.value)} options={[
            { value: "company", label: locale === "ar" ? "على كفالة الشركة" : "Company" },
            { value: "freelancer", label: locale === "ar" ? "عمل حر" : "Freelancer" },
            { value: "external", label: locale === "ar" ? "خارجي" : "External" },
          ]} />
          <div className="flex items-end pb-2">
            <Checkbox label={locale === "ar" ? "مندوب توصيل / سائق" : "Driver / Rider"} checked={form.isDriver ?? false} onChange={(e) => set("isDriver", e.target.checked)} />
          </div>
        </Section>

        <Section title={locale === "ar" ? "الرواتب (بالريال)" : "Payroll (SAR)"}>
          <Input type="number" label={locale === "ar" ? "الراتب الأساسي" : "Basic Salary"} value={form.basicSalary ?? ""} onChange={(e) => set("basicSalary", e.target.value)} dir="ltr" />
          <Input type="number" label={locale === "ar" ? "بدل السكن" : "Housing Allowance"} value={form.housingAllowance ?? ""} onChange={(e) => set("housingAllowance", e.target.value)} dir="ltr" />
          <Input type="number" label={locale === "ar" ? "بدل المواصلات" : "Transport Allowance"} value={form.transportAllowance ?? ""} onChange={(e) => set("transportAllowance", e.target.value)} dir="ltr" />
          <Input type="number" label={locale === "ar" ? "شرط جزائي" : "Penalty Clause"} value={form.penaltyClause ?? ""} onChange={(e) => set("penaltyClause", e.target.value)} dir="ltr" />
          <Input label={locale === "ar" ? "الآيبان" : "IBAN"} value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} dir="ltr" />
          <Input label={locale === "ar" ? "البنك" : "Bank"} value={form.bank ?? ""} onChange={(e) => set("bank", e.target.value)} />
        </Section>

        <Section title={locale === "ar" ? "الامتثال والتأمين" : "Compliance & Insurance"}>
          <Input label={locale === "ar" ? "رقم السجل التجاري" : "CR Number"} value={form.crNumber ?? ""} onChange={(e) => set("crNumber", e.target.value)} dir="ltr" />
          <Input label={locale === "ar" ? "شركة التأمين" : "Insurance Company"} value={form.insuranceCompany ?? ""} onChange={(e) => set("insuranceCompany", e.target.value)} />
          <Input label={locale === "ar" ? "التأمينات الاجتماعية" : "Social Insurance"} value={form.socialInsuranceStatus ?? ""} onChange={(e) => set("socialInsuranceStatus", e.target.value)} />
          <Input label={locale === "ar" ? "حالة الملف" : "File Status"} value={form.fileStatus ?? ""} onChange={(e) => set("fileStatus", e.target.value)} />
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
