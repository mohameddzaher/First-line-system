import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { Deal } from "@/models/Deal";
import { Contact } from "@/models/Contact";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { CompanyDetail } from "./CompanyDetail";

export const metadata: Metadata = { title: "Company" };
export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("crm.companies:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const company = await Company.findById(id).populate("owner", "firstName lastName").lean();
  if (!company) notFound();

  const [locale, deals, contacts, pos, history] = await Promise.all([
    getLocale(),
    Deal.find({ company: id }).sort({ createdAt: -1 }).lean(),
    Contact.find({ company: id }).sort({ name: 1 }).lean(),
    PurchaseOrder.find({ supplier: id }).sort({ orderDate: -1 }).limit(20).lean(),
    AuditLog.find({ resource: "crm.companies", resourceId: id }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  return (
    <CompanyDetail
      locale={locale}
      company={serialize(company) as never}
      deals={serialize(deals) as never}
      contacts={serialize(contacts) as never}
      pos={serialize(pos) as never}
      history={serialize(history) as never}
    />
  );
}
