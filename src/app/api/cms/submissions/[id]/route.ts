import { guard, ok, readBody } from "@/lib/api";
import { Submission } from "@/models/Submission";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]),
});

export const PATCH = guard({ permission: "cms.submissions:update" }, async ({ request, params, user }) => {
  const body = await readBody(request, UpdateSchema);
  const doc = await Submission.findByIdAndUpdate(params.id, { $set: { status: body.status } }, { new: true }).lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  await writeAudit({ actor: user, action: "update", resource: "cms.submissions", resourceId: params.id, resourceLabel: doc.email ?? doc.name ?? "" });
  return ok(doc);
});

export const DELETE = guard({ permission: "cms.submissions:delete" }, async ({ params, user }) => {
  const doc = await Submission.findByIdAndDelete(params.id).lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  await writeAudit({ actor: user, action: "delete", resource: "cms.submissions", resourceId: params.id, resourceLabel: doc.email ?? doc.name ?? "" });
  return ok({ ok: true });
});
