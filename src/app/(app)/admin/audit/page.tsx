import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { AuditLog, AUDIT_ACTIONS } from "@/models/AuditLog";
import { RESOURCES } from "@/lib/rbac";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { AuditClient, type AuditRow } from "./AuditClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("admin.audit:read");
  await connectDB();

  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const result = await runListQuery(AuditLog, query, {
    searchFields: ["actorName", "actorEmail", "resourceLabel", "resource", "ip"],
    filterMap: {
      action: (v) => ({ action: v }),
      resource: (v) => ({ resource: v }),
    },
    sortable: ["createdAt", "action", "resource", "actorName"],
    defaultSort: "createdAt",
  });

  return (
    <AuditClient
      initial={serialize(result) as unknown as ListResult<AuditRow>}
      locale={locale}
      title={t("admin.audit")}
      actionOptions={AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))}
      resourceOptions={[...RESOURCES].map((r) => ({ value: r, label: r }))}
    />
  );
}
