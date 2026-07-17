import { guard, ok } from "@/lib/api";
import { Submission } from "@/models/Submission";
import { runListQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import type { ISubmission } from "@/models/Submission";

export const runtime = "nodejs";

export const submissionSpec: ListSpec<ISubmission> = {
  searchFields: ["name", "email", "subject", "message", "phone"],
  filterMap: {
    type: (v) => ({ type: v }),
    status: (v) => ({ status: v }),
  },
  sortable: ["createdAt", "type", "status"],
  defaultSort: "createdAt",
};

export const GET = guard({ permission: "cms.submissions:read" }, async ({ request }) => {
  const query = parseListQuery(new URL(request.url).searchParams);
  const result = await runListQuery(Submission, query, submissionSpec);
  return ok(result);
});
