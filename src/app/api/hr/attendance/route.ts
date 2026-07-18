import { collectionRoute } from "@/lib/crudFactory";
import { Attendance } from "@/models/Attendance";
import { Employee } from "@/models/Employee";
import { CreateAttendanceSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IAttendance } from "@/models/Attendance";

export const runtime = "nodejs";

export const attendanceSpec: ListSpec<IAttendance> = {
  searchFields: ["notes"],
  refSearch: [{ localField: "employee", model: () => Employee, fields: ["nameAr", "nameEn", "idNumber", "employeeNumber"] }],
  filterMap: {
    status: (v) => ({ status: v }),
    employee: (v) => ({ employee: v }),
  },
  sortable: ["date", "status", "createdAt"],
  defaultSort: "date",
  populate: [{ path: "employee", select: "nameAr employeeNumber" }],
};

export const { GET, POST } = collectionRoute({
  model: Attendance,
  resource: "hr.attendance",
  listSpec: attendanceSpec,
  createSchema: CreateAttendanceSchema,
  updateSchema: CreateAttendanceSchema,
  label: (d) => `attendance ${d.status ?? ""}`,
});
