import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission, requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Employee } from "@/models/Employee";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { OrderDetail } from "./OrderDetail";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ops.orders:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const order = await Order.findById(id)
    .populate("project", "nameAr nameEn")
    .populate("driver", "nameAr nameEn employeeNumber phone")
    .populate("timeline.by", "firstName lastName")
    .lean();
  if (!order) notFound();

  const [locale, user, drivers, history] = await Promise.all([
    getLocale(),
    requireUser(),
    // Only active riders can take an order, so don't offer anyone else.
    Employee.find({ isDriver: true, status: "active" })
      .select("nameAr nameEn employeeNumber")
      .sort({ nameAr: 1 })
      .lean(),
    AuditLog.find({ resource: "ops.orders", resourceId: id }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  return (
    <OrderDetail
      locale={locale}
      order={serialize(order) as never}
      drivers={serialize(drivers) as never}
      history={serialize(history) as never}
      canUpdate={can(user.permissions, "ops.orders:update")}
    />
  );
}
