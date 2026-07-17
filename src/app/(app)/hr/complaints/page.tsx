import type { Metadata } from "next";
import { Task } from "@/models/Task";
import { loadList } from "@/lib/loadList";
import { taskSpec } from "@/app/api/hr/tasks/route";
import { getT } from "@/i18n/server";
import { employeeOptions, userOptions } from "@/lib/pickerOptions";
import { TasksClient, type TaskRow } from "../_tasks/TasksClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Complaints" };
export const dynamic = "force-dynamic";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(
    Task,
    "hr.complaints:read",
    { ...taskSpec, baseFilter: { kind: "complaint" } },
    sp,
  );
  const [t, employees, users] = await Promise.all([getT(), employeeOptions(), userOptions()]);
  return (
    <TasksClient
      initial={result as unknown as ListResult<TaskRow>}
      locale={locale}
      title={t("hr.complaints")}
      kind="complaint"
      employees={employees}
      users={users}
    />
  );
}
