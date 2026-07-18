import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission, requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { StockMovement } from "@/models/StockMovement";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { PurchaseOrderDetail } from "./PurchaseOrderDetail";

export const metadata: Metadata = { title: "Purchase Order" };
export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("procurement.orders:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const po = await PurchaseOrder.findById(id)
    .populate("supplier", "name nameAr phone email")
    .populate("warehouse", "nameAr nameEn")
    .populate("approvedBy", "firstName lastName")
    .populate("lines.inventoryItem", "name sku unit")
    .lean();
  if (!po) notFound();

  const [locale, user, movements, history] = await Promise.all([
    getLocale(),
    requireUser(),
    // Receiving a PO writes stock movements — showing them here proves the
    // warehouse actually took the goods in.
    StockMovement.find({ reference: (po as { orderNumber: string }).orderNumber })
      .populate("item", "name sku")
      .sort({ createdAt: -1 })
      .lean(),
    AuditLog.find({ resource: "procurement.orders", resourceId: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  return (
    <PurchaseOrderDetail
      locale={locale}
      po={serialize(po) as never}
      movements={serialize(movements) as never}
      history={serialize(history) as never}
      canUpdate={can(user.permissions, "procurement.orders:update")}
    />
  );
}
