import type { ListSpec } from "@/lib/listQuery";
import type { IEmployee } from "@/models/Employee";

export const employeeListSpec: ListSpec<IEmployee> = {
  searchFields: [
    "nameAr",
    "nameEn",
    "idNumber",
    "employeeNumber",
    "email",
    "phone",
    "passportNumber",
    "jobTitle",
  ],
  filterMap: {
    status: (v) => ({ status: v }),
    nationality: (v) => ({ nationality: v }),
    department: (v) => ({ department: v }),
    project: (v) => ({ project: v }),
    sponsorship: (v) => ({ sponsorshipType: v }),
    isSaudi: (v) => ({ isSaudi: v === "true" }),
    isDriver: (v) => ({ isDriver: v === "true" }),
  },
  sortable: ["nameAr", "employeeNumber", "hireDate", "status", "nationality", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "department", select: "nameAr nameEn" },
    { path: "project", select: "nameAr nameEn" },
  ],
};

export function employeeLabel(doc: Record<string, unknown>): string {
  const number = doc.employeeNumber ? ` (#${doc.employeeNumber})` : "";
  return `${doc.nameAr ?? ""}${number}`;
}

/** Derives isSaudi from nationality and drops empty department/project ids. */
export function normalizeEmployee(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  if (typeof out.nationality === "string") {
    const n = out.nationality.trim();
    if (n === "السعودية" || n === "السعوديه" || n.toLowerCase() === "saudi") {
      out.isSaudi = true;
    }
  }
  if (out.department === "") out.department = null;
  if (out.project === "") out.project = null;
  return out;
}
