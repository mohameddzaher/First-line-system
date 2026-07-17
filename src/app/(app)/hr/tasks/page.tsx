import type { Metadata } from "next";
import { Task } from "@/models/Task";
import { loadList } from "@/lib/loadList";
import { taskSpec } from "@/app/api/hr/tasks/route";
import { getT } from "@/i18n/server";
import { employeeOptions, userOptions } from "@/lib/pickerOptions";
import { TasksClient, type TaskRow } from "../_tasks/TasksClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  // Scope the list to tasks (not complaints) via a baseFilter.
  const { result, locale } = await loadList(
    Task,
    "hr.tasks:read",
    { ...taskSpec, baseFilter: { kind: "task" } },
    sp,
  );
  const [t, employees, users] = await Promise.all([getT(), employeeOptions(), userOptions()]);
  return (
    <TasksClient
      initial={result as unknown as ListResult<TaskRow>}
      locale={locale}
      title={t("hr.tasks")}
      kind="task"
      employees={employees}
      users={users}
    />
  );
}
