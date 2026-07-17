import { guard, ok } from "@/lib/api";
import { Department } from "@/models/Department";
import { Project } from "@/models/Project";
import { getLocale } from "@/i18n/server";

export const runtime = "nodejs";

/** Department + project options for pickers. Any signed-in HR user may read. */
export const GET = guard({ permission: "hr.employees:read" }, async () => {
  const locale = await getLocale();
  const [departments, projects] = await Promise.all([
    Department.find({ isActive: true }).select("nameAr nameEn").sort({ nameAr: 1 }).lean(),
    Project.find({ isActive: true }).select("nameAr nameEn").sort({ nameAr: 1 }).lean(),
  ]);

  return ok({
    departments: departments.map((d) => ({
      value: String(d._id),
      label: locale === "ar" ? d.nameAr : d.nameEn ?? d.nameAr,
    })),
    projects: projects.map((p) => ({
      value: String(p._id),
      label: locale === "ar" ? p.nameAr : p.nameEn ?? p.nameAr,
    })),
  });
});
