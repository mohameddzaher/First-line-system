import { itemRoute } from "@/lib/crudFactory";
import { Attendance } from "@/models/Attendance";
import { CreateAttendanceSchema, UpdateAttendanceSchema } from "@/lib/validators";
import { attendanceSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Attendance,
  resource: "hr.attendance",
  listSpec: attendanceSpec,
  createSchema: CreateAttendanceSchema,
  updateSchema: UpdateAttendanceSchema,
  label: (d) => `attendance ${d.status ?? ""}`,
});
