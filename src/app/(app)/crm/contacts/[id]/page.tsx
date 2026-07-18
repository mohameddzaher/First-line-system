import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { Deal } from "@/models/Deal";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { ContactDetail } from "./ContactDetail";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("crm.contacts:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const contact = await Contact.findById(id).populate("company", "name nameAr city").lean();
  if (!contact) notFound();

  const [locale, deals, history] = await Promise.all([
    getLocale(),
    Deal.find({ contact: id }).sort({ createdAt: -1 }).lean(),
    AuditLog.find({ resource: "crm.contacts", resourceId: id }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  return (
    <ContactDetail
      locale={locale}
      contact={serialize(contact) as never}
      deals={serialize(deals) as never}
      history={serialize(history) as never}
    />
  );
}
