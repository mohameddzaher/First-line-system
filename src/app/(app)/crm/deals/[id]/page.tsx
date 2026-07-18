import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission, requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Deal } from "@/models/Deal";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { DealDetail } from "./DealDetail";

export const metadata: Metadata = { title: "Deal" };
export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("crm.deals:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const deal = await Deal.findById(id)
    .populate("company", "name nameAr city phone email")
    .populate("contact", "name title email phone")
    .populate("owner", "firstName lastName email")
    .lean();
  if (!deal) notFound();

  const [locale, user, history] = await Promise.all([
    getLocale(),
    requireUser(),
    // Stage moves are recorded as audit entries, so this doubles as the deal's
    // stage history — there is no separate timeline on the model.
    AuditLog.find({ resource: "crm.deals", resourceId: id }).sort({ createdAt: -1 }).limit(40).lean(),
  ]);

  return (
    <DealDetail
      locale={locale}
      deal={serialize(deal) as never}
      history={serialize(history) as never}
      canUpdate={can(user.permissions, "crm.deals:update")}
    />
  );
}
