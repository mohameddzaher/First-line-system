import { guard, ok } from "@/lib/api";
import { SiteSetting } from "@/models/SiteSetting";
import { getSiteSettings } from "@/lib/siteContent";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const GET = guard({ permission: "cms.pages:read" }, async () => {
  const settings = await getSiteSettings();
  return ok(settings);
});

/**
 * Saves the entire site settings document. Accepts any subset of fields, so the
 * CMS editor can PATCH one tab at a time. Arrays (stats/services/faqs/…) replace
 * wholesale.
 */
export const PATCH = guard({ permission: "cms.pages:update" }, async ({ request, user }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  delete body._id;
  delete body.key;
  delete body.createdAt;
  delete body.updatedAt;

  const updated = await SiteSetting.findOneAndUpdate(
    { key: "main" },
    { $set: { ...body, updatedBy: user.id } },
    { upsert: true, new: true },
  ).lean();

  await writeAudit({
    actor: user,
    action: "update",
    resource: "cms.pages",
    resourceId: "site-settings",
    resourceLabel: "Website content",
    changes: Object.keys(body).map((field) => ({ field, from: null, to: "updated" })),
  });

  return ok(updated);
});
